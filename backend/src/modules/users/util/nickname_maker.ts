export function generateRandomNickname() {
  const adjectives = ['춤추는', '졸린', '화난', '행복한', '배고픈', '신나는', '수상한', '빠른', '느긋한', '용감한'];

  const nouns = ['감자', '고양이', '펭귄', '기타리스트', '드러머', '베이시스트', '보컬', '문어', '토끼', '락스타'];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 10000);

  return `${adjective}${noun}${number}`;
}
