/**
 * provider 중립 JSON Schema 부분집합.
 * Gemini의 responseSchema와 OpenAI의 json_schema가 공통으로 이해하는 키만 남겼다.
 * provider별로 필요한 변환(additionalProperties 추가/제거 등)은 각 provider 구현이 담당한다.
 */
export interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';
  description?: string;
  enum?: string[];
  nullable?: boolean;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  minimum?: number;
  maximum?: number;
}
