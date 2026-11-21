/**
 * LIKE 패턴 메타문자(`\`, `%`, `_`)를 이스케이프해 글자 그대로 비교되게 한다.
 * Prisma는 PostgreSQL에서 `contains`와 `mode: 'insensitive'`인 `equals`를 이스케이프 없는 (I)LIKE로 보내므로,
 * 사용자 입력을 그대로 넘기면 `%`·`_`가 와일드카드로 동작한다. PostgreSQL LIKE의 기본 이스케이프 문자는 `\`다.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, match => `\\${match}`);
}
