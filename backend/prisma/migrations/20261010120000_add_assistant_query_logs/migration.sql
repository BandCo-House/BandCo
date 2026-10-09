-- 자연어 조회 결과와 의심 신호를 남긴다.
-- 지금은 실행 성공(exec_ok)만 알 수 있고 질문 충족(answered)은 판정이 붙기 전까지 NULL이다.
-- 도메인 테이블과 수명이 달라 밴드·사용자에 외래키를 걸지 않는다. 보관 기간은 90일이다.

-- CreateEnum
CREATE TYPE "AssistantQueryBucket" AS ENUM ('OK', 'EMPTY_RESULT', 'TRUNCATED', 'POLICY_VIOLATION', 'UNSUPPORTED', 'CLARIFICATION', 'REPHRASE', 'INFRA');

-- CreateTable
CREATE TABLE "assistant_query_logs" (
    "id" UUID NOT NULL,
    "band_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID,
    "turn_index" INTEGER,
    "preset_id" VARCHAR(64),
    "question" VARCHAR(200),
    "intent" VARCHAR(120),
    "generated_sql" TEXT,
    "result_mode" VARCHAR(16),
    "exec_ok" BOOLEAN NOT NULL,
    "answered" BOOLEAN,
    "bucket" "AssistantQueryBucket" NOT NULL,
    "signals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "row_count" INTEGER NOT NULL,
    "has_more" BOOLEAN NOT NULL,
    "validation_failures" INTEGER NOT NULL,
    "policy_violations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latency_ms" INTEGER NOT NULL,
    "used_llm" BOOLEAN NOT NULL,
    "model_name" VARCHAR(64),
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "promoted_to_corpus" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_query_logs_band_id_created_at_idx" ON "assistant_query_logs"("band_id", "created_at");

-- 같은 대화의 턴을 순서대로 읽어 재질문을 찾는 질의가 이 인덱스를 쓴다.
CREATE INDEX "assistant_query_logs_session_id_turn_index_idx" ON "assistant_query_logs"("session_id", "turn_index");

CREATE INDEX "assistant_query_logs_bucket_created_at_idx" ON "assistant_query_logs"("bucket", "created_at");
