import { ApiProperty } from '@nestjs/swagger';

export interface CreatedBand {
  id: string;
  name: string;
  description: string;
  visibility: boolean;
  inviteCode: string;
  bmId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBandResult {
  band: CreatedBand;
}

export class CreatedBandDto implements CreatedBand {
  @ApiProperty({
    description: '생성된 밴드 ID',
    example: 'a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1',
  })
  id!: string;

  @ApiProperty({
    description: '밴드 이름',
    example: '합주하자',
  })
  name!: string;

  @ApiProperty({
    description: '밴드 설명',
    example: '주 1회 합주하는 밴드입니다.',
  })
  description!: string;

  @ApiProperty({
    description: '밴드 공개 여부',
    example: true,
  })
  visibility!: boolean;

  @ApiProperty({
    description: '임시 방식으로 생성한 초대 코드',
    example: '7KQ2M9',
  })
  inviteCode!: string;

  @ApiProperty({
    description: '현재는 인증이 없어 데모 사용자를 넣는 임시 BM 사용자 ID',
    example: 'b6d0f0b1-7c7d-4e23-9c7b-0c0d9f6a2a21',
  })
  bmId!: string;

  @ApiProperty({
    description: '밴드 생성 시각',
    example: '2026-03-03T18:20:10.123+09:00',
  })
  createdAt!: string;

  @ApiProperty({
    description: '밴드 수정 시각',
    example: '2026-03-03T18:20:10.123+09:00',
  })
  updatedAt!: string;
}

export class CreateBandResultDto implements CreateBandResult {
  @ApiProperty({
    description: '생성된 밴드 정보',
    type: CreatedBandDto,
  })
  band!: CreatedBandDto;
}

export class CreateBandSuccessResponseDto {
  @ApiProperty({
    description: '응답 상태',
    example: 'success',
  })
  status!: 'success';

  @ApiProperty({
    description: '성공 응답에서는 null',
    nullable: true,
    example: null,
  })
  error!: null;

  @ApiProperty({
    description: '응답 메시지',
    example: '밴드 생성 성공',
  })
  message!: string;

  @ApiProperty({
    description: '응답 데이터',
    type: CreateBandResultDto,
  })
  data!: CreateBandResultDto;
}
