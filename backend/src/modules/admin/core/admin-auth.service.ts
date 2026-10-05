import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { ADMIN_USERS_REPOSITORY, type AdminUsersRepository } from './repositories/admin-users.repository';
import type { AdminLoginResult, AdminPrincipal, AdminProfile, AdminTokenPayload, ChangeAdminPasswordResult } from './types/admin-principal.type';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import { toAdminProfile } from './admin-profile.mapper';

const ADMIN_TOKEN_SCOPE = 'admin';
const ADMIN_ACCESS_TOKEN_EXPIRES_IN = '30m';
const ADMIN_REFRESH_TOKEN_EXPIRES_IN = '12h';
const INVALID_CREDENTIALS_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.';
/** 같은 이메일로 이 횟수만큼 연속 실패하면 잠근다 */
export const ADMIN_LOGIN_MAX_FAILURES = 10;
/** 실패 횟수를 세는 구간이자 잠금 시간 */
export const ADMIN_LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;
/** 계정이 없을 때도 같은 시간만큼 bcrypt 비교를 하기 위한 평문. 실제 비밀번호로 쓰이지 않는다. */
const TIMING_DUMMY_PASSWORD = 'admin-login-timing-dummy';

/** 만료된 시도 기록을 한꺼번에 지우는 최소 간격 */
const LOGIN_ATTEMPT_SWEEP_INTERVAL_MS = 60 * 1000;

type LoginAttemptRecord = {
  count: number;
  firstAttemptedAt: number;
};

/**
 * 로그인 비교용 이메일 정규화. 생성할 때와 같은 규칙을 써야 대소문자만 다른 중복 계정이 생기지 않는다.
 */
export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AdminAuthService {
  private readonly jwtSecret: string;
  private readonly bcryptSaltRounds: number;
  private readonly timingDummyHash: string;
  /**
   * 이메일별로 성공 없이 이어진 로그인 시도 기록. 서버 인스턴스 메모리라 재시작하면 초기화되고 인스턴스끼리 공유하지 않는다.
   * 현재 백엔드는 단일 인스턴스라 무차별 대입을 늦추는 용도로 충분하다.
   */
  private readonly loginAttempts = new Map<string, LoginAttemptRecord>();
  private lastLoginAttemptSweptAt = 0;

  constructor(
    @Inject(ADMIN_USERS_REPOSITORY)
    private readonly adminUsersRepository: AdminUsersRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // 유저 JWT와 시크릿을 나눠야 유저 토큰 위조·유출이 어드민 권한으로 번지지 않는다
    this.jwtSecret = this.configService.getOrThrow<string>('ADMIN_JWT_SECRET');
    if (!this.jwtSecret) throw new Error('ADMIN_JWT_SECRET must not be empty');
    if (this.jwtSecret === this.configService.get<string>('JWT_SECRET')) {
      throw new Error('ADMIN_JWT_SECRET must differ from JWT_SECRET');
    }

    this.bcryptSaltRounds = parseInt(this.configService.getOrThrow<string>('BCRYPT_SALT_ROUNDS'), 10);
    if (isNaN(this.bcryptSaltRounds) || this.bcryptSaltRounds < 4 || this.bcryptSaltRounds > 15) {
      throw new Error('BCRYPT_SALT_ROUNDS must be a number between 4 and 15');
    }

    this.timingDummyHash = bcrypt.hashSync(TIMING_DUMMY_PASSWORD, this.bcryptSaltRounds);
  }

  /**
   * 이메일·비밀번호로 어드민을 인증하고 토큰 쌍을 발급한다.
   * 계정 존재 여부가 드러나지 않도록 실패 사유는 하나의 메시지로 통일하고, 계정이 없어도 같은 비용의
   * bcrypt 비교를 해 응답 시간 차이도 없앤다. 같은 이메일로 연속 실패하면 일정 시간 잠근다.
   *
   * @param {string} email - 로그인 이메일
   * @param {string} password - 평문 비밀번호
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminLoginResult>} 토큰 쌍과 어드민 정보
   */
  async login(email: string, password: string, tx?: Prisma.TransactionClient): Promise<AdminLoginResult> {
    const normalizedEmail = normalizeAdminEmail(email);
    // 비밀번호 비교(await) 전에 시도를 먼저 세야 동시에 보낸 요청도 한도에 걸린다
    this.reserveLoginAttempt(normalizedEmail);

    const run = async (client: Prisma.TransactionClient): Promise<AdminLoginResult> => {
      const admin = await this.adminUsersRepository.findByEmail(normalizedEmail, client);
      const isPasswordValid = await bcrypt.compare(password, admin?.passwordHash ?? this.timingDummyHash);
      if (admin === null || !admin.isActive || !isPasswordValid) {
        throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
      }

      this.loginAttempts.delete(normalizedEmail);

      const loggedInAdmin = await this.adminUsersRepository.update(admin.id, { lastLoginAt: new Date() }, client);
      await this.auditLogsService.record({ adminUserId: admin.id, action: 'ADMIN_LOGIN', targetType: 'ADMIN', targetId: admin.id }, client);

      return {
        accessToken: this.signToken(admin.id, 'access'),
        refreshToken: this.signToken(admin.id, 'refresh'),
        admin: toAdminProfile(loggedInAdmin),
      };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 어드민 전용 시크릿으로 토큰을 서명한다.
   *
   * @param {string} adminId - 어드민 ID
   * @param {'access' | 'refresh'} type - 토큰 종류
   * @returns {string} 서명된 JWT
   */
  signToken(adminId: string, type: AdminTokenPayload['type']): string {
    const payload: AdminTokenPayload = { sub: adminId, type, scope: ADMIN_TOKEN_SCOPE };
    const expiresIn = type === 'access' ? ADMIN_ACCESS_TOKEN_EXPIRES_IN : ADMIN_REFRESH_TOKEN_EXPIRES_IN;
    return this.jwtService.sign(payload, { secret: this.jwtSecret, expiresIn });
  }

  /**
   * 어드민 토큰의 서명·만료·종류를 검증한다.
   * scope까지 확인해 시크릿이 같아지는 사고가 나도 유저 토큰이 통과하지 못하게 한다.
   *
   * @param {string} token - Bearer 토큰 값
   * @param {'access' | 'refresh'} expectedType - 기대하는 토큰 종류
   * @returns {AdminTokenPayload} 검증된 payload
   */
  verifyToken(token: string, expectedType: AdminTokenPayload['type']): AdminTokenPayload {
    let payload: Partial<AdminTokenPayload>;
    try {
      payload = this.jwtService.verify<AdminTokenPayload>(token, { secret: this.jwtSecret });
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('만료된 토큰입니다.');
      }
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    if (payload.scope !== ADMIN_TOKEN_SCOPE || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    if (payload.type !== expectedType) {
      const expectedLabel = expectedType === 'access' ? '액세스' : '리프레시';
      throw new UnauthorizedException(`${expectedLabel} 토큰이 아닙니다.`);
    }

    return { sub: payload.sub, type: payload.type, scope: ADMIN_TOKEN_SCOPE, iat: payload.iat };
  }

  /**
   * 토큰 주체가 지금도 활성 어드민인지 확인한다. 비활성화 즉시 기존 토큰을 끊기 위해 매 요청 조회한다.
   * 비밀번호를 바꾸기 전에 발급된 토큰도 거부해, 유출된 토큰을 비밀번호 변경·초기화로 끊을 수 있게 한다.
   *
   * @param {string} adminId - 토큰 sub
   * @param {number | undefined} tokenIssuedAt - 토큰 발급 시각(초, JWT iat)
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminPrincipal | null>} 활성 어드민 또는 null
   */
  async getActivePrincipal(adminId: string, tokenIssuedAt: number | undefined, tx?: Prisma.TransactionClient): Promise<AdminPrincipal | null> {
    const admin = await this.adminUsersRepository.findById(adminId, tx);
    if (admin === null || !admin.isActive) {
      return null;
    }
    if (admin.passwordChangedAt !== null) {
      // JWT iat는 초 단위라, 변경 직후 같은 초에 새로 발급한 토큰은 통과하도록 초 단위로 내려 비교한다
      const passwordChangedAtSeconds = Math.floor(admin.passwordChangedAt.getTime() / 1000);
      const isIssuedBeforePasswordChange = tokenIssuedAt === undefined || tokenIssuedAt < passwordChangedAtSeconds;
      if (isIssuedBeforePasswordChange) {
        return null;
      }
    }
    return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
  }

  /**
   * 로그인한 어드민 자신의 정보를 조회한다.
   *
   * @param {string} adminId - 인증된 어드민 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminProfile>} 어드민 정보
   */
  async getMyProfile(adminId: string, tx?: Prisma.TransactionClient): Promise<AdminProfile> {
    const admin = await this.adminUsersRepository.findById(adminId, tx);
    if (admin === null) {
      throw new NotFoundException('어드민 계정을 찾을 수 없습니다.');
    }
    return toAdminProfile(admin);
  }

  /**
   * 현재 비밀번호를 확인한 뒤 본인 비밀번호를 바꾼다.
   * 바꾸는 순간 기존 토큰이 모두 끊기므로 지금 세션이 이어지도록 새 토큰 쌍을 발급한다.
   *
   * @param {string} adminId - 인증된 어드민 ID
   * @param {string} currentPassword - 현재 비밀번호
   * @param {string} newPassword - 새 비밀번호
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ChangeAdminPasswordResult>} 어드민 ID와 새 토큰 쌍
   */
  async changeMyPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ChangeAdminPasswordResult> {
    const run = async (client: Prisma.TransactionClient): Promise<ChangeAdminPasswordResult> => {
      const admin = await this.adminUsersRepository.findById(adminId, client);
      if (admin === null) {
        throw new NotFoundException('어드민 계정을 찾을 수 없습니다.');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isPasswordValid) {
        throw new BadRequestException('현재 비밀번호가 일치하지 않습니다.');
      }
      if (currentPassword === newPassword) {
        throw new BadRequestException('새 비밀번호가 현재 비밀번호와 같습니다.');
      }

      const passwordHash = await this.hashPassword(newPassword);
      await this.adminUsersRepository.update(adminId, { passwordHash, passwordChangedAt: new Date() }, client);
      await this.auditLogsService.record({ adminUserId: adminId, action: 'ADMIN_PASSWORD_CHANGE', targetType: 'ADMIN', targetId: adminId }, client);

      return { adminId, accessToken: this.signToken(adminId, 'access'), refreshToken: this.signToken(adminId, 'refresh') };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 어드민 비밀번호를 해시한다. 계정 생성·초기화에서도 같은 salt rounds를 쓰도록 여기로 모은다.
   *
   * @param {string} password - 평문 비밀번호
   * @returns {Promise<string>} bcrypt 해시
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptSaltRounds);
  }

  /**
   * 로그인 시도를 이메일별로 하나 센다. 성공하면 기록을 지우므로 남은 횟수는 곧 연속 실패(또는 진행 중인 시도) 수다.
   * 잠금 구간 안에서 한도에 닿은 이메일이면 시도 자체를 막는다. 첫 시도부터 잠금 구간이 시작된다.
   *
   * @param {string} email - 정규화된 이메일
   */
  private reserveLoginAttempt(email: string): void {
    const now = Date.now();
    this.sweepExpiredLoginAttempts(now);

    const attempt = this.loginAttempts.get(email);
    if (attempt === undefined || now - attempt.firstAttemptedAt >= ADMIN_LOGIN_LOCK_WINDOW_MS) {
      this.loginAttempts.set(email, { count: 1, firstAttemptedAt: now });
      return;
    }
    if (attempt.count >= ADMIN_LOGIN_MAX_FAILURES) {
      throw new HttpException('로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.', HttpStatus.TOO_MANY_REQUESTS);
    }
    attempt.count += 1;
  }

  /**
   * 잠금 구간이 지난 기록을 지운다. 매번 다른 이메일로 시도해도 기록이 끝없이 쌓이지 않게 하려는 것이고,
   * 전체 순회 비용을 줄이려고 일정 간격마다만 돈다.
   *
   * @param {number} now - 현재 시각(ms)
   */
  private sweepExpiredLoginAttempts(now: number): void {
    if (now - this.lastLoginAttemptSweptAt < LOGIN_ATTEMPT_SWEEP_INTERVAL_MS) {
      return;
    }
    this.lastLoginAttemptSweptAt = now;

    for (const [email, attempt] of this.loginAttempts) {
      if (now - attempt.firstAttemptedAt >= ADMIN_LOGIN_LOCK_WINDOW_MS) {
        this.loginAttempts.delete(email);
      }
    }
  }
}
