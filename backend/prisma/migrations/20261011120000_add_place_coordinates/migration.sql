-- 연습 장소의 주소를 선택값으로 바꾸고, 지도 검색으로 고른 위치의 좌표를 저장한다.
-- 이제 주소는 지도 검색으로 고른 값만 들어온다. 기존 행의 주소는 전부 손으로 적은 값(좌표 없음)이라
-- 지도와 이어지지 않으므로 비운다. 테스트용 데이터뿐이어서 다른 컬럼으로 옮기지 않는다.

-- AlterTable
ALTER TABLE "places" ALTER COLUMN "address" DROP NOT NULL;

ALTER TABLE "places" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "places" ADD COLUMN "longitude" DOUBLE PRECISION;

UPDATE "places" SET "address" = NULL;
