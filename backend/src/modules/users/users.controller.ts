import { Controller, Get, Query } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { GetUsersQueryDto } from './dto/get-users-query.dto';
import type { GetUsersResult } from './types/user-list.type';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(@Query() query: GetUsersQueryDto): Promise<ApiSuccessResponse<GetUsersResult>> {
    const result = await this.usersService.getUsers(query);
    return createSuccessResponse('유저 목록 조회 성공', result);
  }
}
