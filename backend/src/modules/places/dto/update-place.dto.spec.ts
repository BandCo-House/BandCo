import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdatePlaceBodyDto } from './update-place.dto';

async function validateBody(body: Record<string, unknown>): Promise<{ dto: UpdatePlaceBodyDto; errorProperties: string[] }> {
  const dto = plainToInstance(UpdatePlaceBodyDto, body);
  const errors = await validate(dto);

  return { dto, errorProperties: errors.map(error => error.property) };
}

describe('UpdatePlaceBodyDto', () => {
  it('선택 필드는 null을 지움으로 받는다', async () => {
    const { dto, errorProperties } = await validateBody({ address: null, detailAddress: null, imageUrl: null });

    expect(errorProperties).toEqual([]);
    expect(dto.address).toBeNull();
    expect(dto.detailAddress).toBeNull();
    expect(dto.imageUrl).toBeNull();
  });

  it('빈 문자열도 지움(null)으로 정리한다', async () => {
    const { dto, errorProperties } = await validateBody({ address: '  ', detailAddress: '' });

    expect(errorProperties).toEqual([]);
    expect(dto.address).toBeNull();
    expect(dto.detailAddress).toBeNull();
  });

  it('보내지 않은 필드는 undefined로 남아 기존 값을 유지한다', async () => {
    const { dto, errorProperties } = await validateBody({ name: '연습실' });

    expect(errorProperties).toEqual([]);
    expect(dto.address).toBeUndefined();
    expect(dto.imageUrl).toBeUndefined();
  });

  it('name은 null이나 빈 문자열로 지울 수 없다', async () => {
    expect((await validateBody({ name: null })).errorProperties).toEqual(['name']);
    expect((await validateBody({ name: '   ' })).errorProperties).toEqual(['name']);
  });

  it('범위를 벗어난 좌표를 거부한다', async () => {
    const { errorProperties } = await validateBody({ address: '서울', latitude: 91, longitude: 181 });

    expect(errorProperties).toEqual(['latitude', 'longitude']);
  });
});
