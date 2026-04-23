import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MembersService } from 'src/modules/members/members.service';
import { MembersModule } from 'src/modules/members/members.module';

@Module({
  imports: [JwtModule.register({}), MembersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
