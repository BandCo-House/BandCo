-- 운영 마스터 데이터: 장르 40종, 세션(스킬 타입) 28종
--
-- 1) 컬럼 조정
--    genres.name 이 VARCHAR(20) 이라 '프로그레시브 록 (Progressive Rock)'(27자) 같은
--    항목이 들어가지 않는다. 실제 데이터 최대 길이에 맞춰 VARCHAR(40)으로 넓힌다.
--    skill_types.name 은 VARCHAR(40), 최대 5자라 그대로 둔다.
--    두 테이블 모두 name 중복을 막는 UNIQUE 인덱스를 추가한다 — 이 마이그레이션의
--    INSERT 도 이 인덱스를 충돌 기준으로 쓰기 때문에 재실행해도 행이 늘지 않는다.
--    표시 순서는 지금까지 이름 오름차순뿐이라 합주 편성 순서를 만들 수 없었다.
--    sort_order 를 추가해 "보컬 → 기타 → 베이스 → 드럼" 순서를 데이터로 고정한다.
--
-- 2) 데이터 투입
--    id 는 이름 기반 UUIDv5(고정값)라 dev/운영이 같은 ID를 갖는다.
--    이름이 이미 있으면 sort_order 만 맞추고 id 는 건드리지 않는다 — 참조 중인 FK 보호.

ALTER TABLE "genres" ALTER COLUMN "name" SET DATA TYPE VARCHAR(40);

ALTER TABLE "genres" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "skill_types" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");
CREATE UNIQUE INDEX "skill_types_name_key" ON "skill_types"("name");

INSERT INTO "genres" ("id", "name", "sort_order") VALUES
  ('370ce3f7-0e72-5ab0-a3c4-72e4887ac75a', '록 (Rock)', 10),
  ('622e1173-3d2f-53e8-af2f-774a779f2f5e', '팝 록 (Pop Rock)', 20),
  ('b9e6d523-0506-5bd8-ba36-4f8bba2217c1', '하드 록 (Hard Rock)', 30),
  ('b8449236-96cd-5ccf-808a-da108328cd8f', '얼터너티브 록 (Alternative Rock)', 40),
  ('c69d9c1f-7a48-5d80-8f57-569c749aa9a8', '인디 록 (Indie Rock)', 50),
  ('78af8658-0fd9-5485-9bbc-bd2173819a9d', '프로그레시브 록 (Progressive Rock)', 60),
  ('72bf6107-2df1-5adf-bee3-0429128d367f', '포스트 록 (Post Rock)', 70),
  ('42c8e79d-318b-5def-954e-1eb85530ebf4', '개러지 록 (Garage Rock)', 80),
  ('a7c3bf5d-ed62-5a0e-8ec4-f3e391276418', '사이키델릭 록 (Psychedelic Rock)', 90),
  ('c078daf4-fbb5-5102-8146-6f5ac411b3f0', '블루스 록 (Blues Rock)', 100),
  ('2e9bdb22-17ea-5966-827e-5781fb81cd7d', '포크 록 (Folk Rock)', 110),
  ('8868f1ce-6a47-58d0-a81f-d633af0cf3e8', '그런지 (Grunge)', 120),
  ('8d4cfd0f-7198-5f19-98ce-9e91fc59e5e7', '슈게이즈 (Shoegaze)', 130),
  ('e6ba0515-3635-57c7-a293-ab5cbdf177b4', '펑크 (Punk)', 140),
  ('0c7f9b68-cdfb-59d5-b68a-218e15718a44', '포스트 펑크 (Post Punk)', 150),
  ('013ad7f5-fc01-5b83-b98f-40ed96e53652', '이모 (Emo)', 160),
  ('bce775a1-b856-53d6-a867-5f1f22e0372d', '메탈 (Metal)', 170),
  ('df0b6b86-ca24-5b27-9f73-8bb1ea8e83d8', '헤비 메탈 (Heavy Metal)', 180),
  ('c718dd0f-093d-50cd-b4a0-77133b7d64c6', '메탈코어 (Metalcore)', 190),
  ('1e5e3124-d45b-576e-acbb-c92db1da6776', '팝 (Pop)', 200),
  ('7af8e24b-0f38-58af-8c7d-2853956b7d7e', '신스팝 (Synth Pop)', 210),
  ('64b33df1-cd0d-5ee9-9509-b79e564e8a84', '시티팝 (City Pop)', 220),
  ('857dd7c2-f278-5a6b-90f0-c6d9ede8f01e', '드림 팝 (Dream Pop)', 230),
  ('8dde9943-e19d-5c4e-92a7-1ad7dc89b7f8', '일렉트로닉 (Electronic)', 240),
  ('7817463d-831c-5e9f-8e88-26b5bdda76c2', '재즈 (Jazz)', 250),
  ('ac3d3ca8-b8fc-5466-9c94-4a9a156f4126', '블루스 (Blues)', 260),
  ('d32f85cd-0475-573e-a310-f7968b750a84', '훵크 (Funk)', 270),
  ('a3892283-f5d0-5f5c-a6f8-5a13ce2ec9b9', '소울 (Soul)', 280),
  ('ea92ee19-2d22-59fb-b98a-a6d95b5644d6', 'R&B', 290),
  ('324c697a-8e0a-59c0-90f7-fd33c3967d9e', '힙합 (Hip Hop)', 300),
  ('37360301-22ff-58a0-aae5-72b0b16d4952', '레게 (Reggae)', 310),
  ('bf2da7d1-42d9-5df4-8659-9464a2216cfd', '어쿠스틱 (Acoustic)', 320),
  ('bc2ddae0-59d9-57f8-beb2-a9bceec8304b', '포크 (Folk)', 330),
  ('13a72fcc-9c01-51ae-a534-4f6ec452c4e3', '발라드 (Ballad)', 340),
  ('3f4cec0b-e317-539c-83cb-6ec2d4bcf99a', '컨트리 (Country)', 350),
  ('7a4ea637-fadf-518c-bb88-3ae7c72b2c70', 'CCM', 360),
  ('f3b897fd-b100-5bb0-ae56-c35f6a1b0ea5', 'J-Rock', 370),
  ('63253688-23f5-590e-8c1a-f1b3d6cbb177', 'J-Pop', 380),
  ('cf19b1aa-959d-5189-8379-f8cc83154e62', 'K-Pop', 390),
  ('88db44ee-0d61-559b-baa0-713cead1545e', '애니송 (Anime Song)', 400)
ON CONFLICT ("name") DO UPDATE SET "sort_order" = EXCLUDED."sort_order";

INSERT INTO "skill_types" ("id", "name", "sort_order") VALUES
  ('97c8888a-7251-5d67-ba79-2103813bbecb', '보컬', 10),
  ('b1c55a6c-9aa7-5528-b0d1-1f5b7449020e', '코러스', 20),
  ('958e5d24-0593-53ce-a1ca-a640cfb89807', '랩', 30),
  ('7ee5f627-ca3d-5bd7-99cb-3832f5141a11', '일렉기타', 40),
  ('ff752a8f-0cd8-5d6c-b97b-f8b1a2c2bde5', '통기타', 50),
  ('781e0d5d-c548-5c87-bffa-9f506964b6bb', '클래식기타', 60),
  ('b8208b16-fd27-534e-8810-ca4685fedfb6', '베이스', 70),
  ('e188d8b4-f3e9-5e8d-a5cb-c596c1aa92d5', '더블베이스', 80),
  ('fa5ecce0-0349-5841-8352-06fed8edbebb', '드럼', 90),
  ('4b9a68d8-e379-5060-a9d9-509fa29f881d', '퍼커션', 100),
  ('71a427d2-5337-503f-8139-45bc17ba0e3e', '카혼', 110),
  ('a7d19934-af70-5541-b211-b859da792bd1', '키보드', 120),
  ('6d36e814-9cc1-5e50-9857-c4fa90f68b04', '피아노', 130),
  ('241e5729-fc74-5f12-9e2f-1ce784bb281b', '신디사이저', 140),
  ('a8054329-f29c-54d4-86ce-32dd5d8f08a8', '오르간', 150),
  ('3fba8757-080e-514b-8f8b-416eecd35696', '색소폰', 160),
  ('f3d8ed50-fc75-533d-817f-42e3b364c8fa', '트럼펫', 170),
  ('c6163d86-ed31-5a4a-9acd-62c8e65ccc0e', '트롬본', 180),
  ('dd4d1f81-455f-573c-8472-29c43fa2e53d', '플루트', 190),
  ('5c1c48e2-c906-5401-96e0-09ba73251b30', '클라리넷', 200),
  ('922270b0-0ff5-5d8e-92b1-93161a60ae2c', '하모니카', 210),
  ('f5119e42-da8b-58f5-a2a9-c4c6df5ded5f', '바이올린', 220),
  ('e1769d81-0355-5257-ab08-e33afd05a4e4', '비올라', 230),
  ('35c1db9d-f5ba-5219-8e3b-16664635e80e', '첼로', 240),
  ('acf3d66a-117b-5dbe-b168-3d7e845067ae', '우쿨렐레', 250),
  ('53e5a880-d6ef-532f-ac9d-18fc43f4b7b5', '만돌린', 260),
  ('b847a3df-9279-5f0b-9d2e-bdb292e63fa3', '밴조', 270),
  ('0bc05861-6299-5b3b-9988-142bf9deb043', '아코디언', 280)
ON CONFLICT ("name") DO UPDATE SET "sort_order" = EXCLUDED."sort_order";
