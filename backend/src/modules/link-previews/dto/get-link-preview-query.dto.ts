import { Transform } from 'class-transformer';
import { IsUrl } from 'class-validator';

import { trimStringValue } from '../../../common/validation/transform.util';
import { urlValidationMessage } from '../../../common/validation-message/url-validation.message';

/**
 * 링크 미리보기 요청 URL을 검증한다.
 */
export class GetLinkPreviewQueryDto {
  @Transform(trimStringValue)
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
    },
    { message: urlValidationMessage },
  )
  url!: string;
}
