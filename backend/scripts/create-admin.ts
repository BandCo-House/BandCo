/**
 * 첫 SUPER_ADMIN 계정을 만드는 CLI. 어드민 회원가입 API는 없으므로 최초 1회는 이 스크립트로 만든다.
 * 이후 계정은 어드민 콘솔의 "어드민 계정" 화면에서 SUPER_ADMIN이 만든다.
 *
 * .env 파일을 읽지 않는다. .env.development가 운영 DB를 가리키고 있어, 대상 DB를 실행하는 사람이
 * 명령줄에서 직접 지정하게 해야 실수로 운영 DB에 계정이 생기지 않는다.
 *
 * 사용법:
 *   DATABASE_URL=postgresql://... ADMIN_EMAIL=me@bandco.kr ADMIN_NAME=홍길동 ADMIN_PASSWORD='...' \
 *     pnpm run admin:create -- --yes
 */
import * as bcrypt from 'bcrypt';

import { PrismaClient } from '../src/generated/prisma';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const DEFAULT_SALT_ROUNDS = 10;

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`환경 변수 ${name}이(가) 필요합니다.`);
  }
  return value;
}

async function main(): Promise<void> {
  const databaseUrl = readRequiredEnv('DATABASE_URL');
  const email = readRequiredEnv('ADMIN_EMAIL').toLowerCase();
  const name = readRequiredEnv('ADMIN_NAME');
  const password = readRequiredEnv('ADMIN_PASSWORD');
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? DEFAULT_SALT_ROUNDS);

  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD는 ${MIN_PASSWORD_LENGTH}~${MAX_PASSWORD_LENGTH}자여야 합니다.`);
  }

  const targetHost = new URL(databaseUrl).host;
  console.log(`대상 DB: ${targetHost}`);
  console.log(`생성할 계정: ${email} (${name}, SUPER_ADMIN)`);

  // 대상 DB를 눈으로 확인한 뒤에만 쓰도록 명시적인 확인 플래그를 요구한다
  if (!process.argv.includes('--yes')) {
    console.log('대상이 맞으면 같은 명령에 --yes를 붙여 다시 실행하세요.');
    return;
  }

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const existing = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new Error('이미 같은 이메일의 어드민 계정이 있습니다.');
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const admin = await prisma.adminUser.create({
      data: { email, name, passwordHash, role: 'SUPER_ADMIN' },
      select: { id: true, email: true },
    });
    console.log(`SUPER_ADMIN 생성 완료: ${admin.email} (${admin.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
