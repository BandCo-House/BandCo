import { normalizeOptionalString, parseOptionalBoolean, parseOptionalPositiveInteger } from '../../../common/query';

export interface GetBandSpacesQueryParams {
  query?: string;
  onlyMine?: string;
  inProgressOnly?: string;
  page?: string;
  size?: string;
  sort?: string;
}

export interface GetBandSpacesQuery {
  query?: string;
  onlyMine?: boolean;
  inProgressOnly?: boolean;
  page: number;
  size: number;
  sort?: string;
}

/**
 * 문자열 쿼리를 서비스에서 다루기 쉬운 형태로 변환한다.
 *
 * @param params 컨트롤러에서 전달받은 원본 쿼리 문자열
 * @returns 필터링과 페이지네이션에 바로 사용할 수 있는 쿼리 객체
 */
export function parseGetBandSpacesQuery(params: GetBandSpacesQueryParams): GetBandSpacesQuery {
  const parsedPage = parseOptionalPositiveInteger(params.page, 'page', 1);
  const parsedSize = parseOptionalPositiveInteger(params.size, 'size', 20);
  const parsedOnlyMine = parseOptionalBoolean(params.onlyMine, 'onlyMine');
  const parsedInProgressOnly = parseOptionalBoolean(params.inProgressOnly, 'inProgressOnly');

  return {
    query: normalizeOptionalString(params.query),
    onlyMine: parsedOnlyMine,
    inProgressOnly: parsedInProgressOnly,
    page: parsedPage,
    size: parsedSize,
    sort: normalizeOptionalString(params.sort),
  };
}
