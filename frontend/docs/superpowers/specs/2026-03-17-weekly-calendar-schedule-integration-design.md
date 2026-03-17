# 주간 달력 일정 연동 및 렌더링 설계서 (Weekly Calendar Schedule Integration)

- **Date:** 2026-03-17
- **Status:** In Review
- **Owner:** Gemini CLI

## 1. 개요 (Overview)
`WeeklyCalendar` 위젯에 서버로부터 가져온 실제 일정 데이터를 표시하고, 여러 날에 걸친 일정을 시간 슬롯에 맞춰 동적으로 렌더링합니다. FSD(Feature-Sliced Design) 구조를 준수하며, MSW를 통한 모킹 데이터를 연동합니다.

## 2. 요구사항 및 성공 기준 (Requirements & Success Criteria)
- **데이터 연동:** `GET /spaces/:spaceId/schedules` API를 통해 현재 주의 일정 목록을 가져와야 함.
- **다중 날짜 처리:** 자정을 넘거나 여러 날에 걸친 일정은 각 날짜별 시간 슬롯에 맞춰 "나누어" 표시되어야 함 (Midnight Split).
- **줌 대응:** 사용자가 캘린더를 줌인/줌아웃할 때 일정 카드의 높이와 위치가 실시간으로 조절되어야 함.
- **타입별 스타일링:** `PRACTICE`와 `MEETING` 타입에 따라 다른 배경색을 적용함.
- **인터페이스:** 일정 카드 클릭 시 상세보기 모달을 열기 위한 콜백(`onScheduleClick`)을 호출함 (현재는 로그 출력).

## 3. 아키텍처 및 FSD 구조 (Architecture & FSD)

### A. Entities Layer (`entities/schedule`)
- **`model/types.ts`**: `ScheduleItem`, `ScheduleType`, `ScheduleStatus`, `GetSchedulesResponse` 등 정의.
- **`api/index.ts`**: `getSchedules(spaceId, { from, to })` API fetcher.
- **`model/queries.ts`**: `useSchedules(spaceId, from, to)` TanStack Query 훅.
- **`lib/split-schedule.ts`**: 여러 날짜의 일정을 일별 조각(`SchedulePart`)으로 분리하는 비즈니스 로직.

### B. Widgets Layer (`widgets/weekly-calendar`)
- **`ui/WeeklyCalendar.tsx`**: `spaceId` 추출, 데이터 호출 주체 (Smart Component).
- **`ui/WeeklyTimeGrid.tsx`**: 전달받은 일정 조각들을 그리드에 배치.
- **`ui/ScheduleCard.tsx`**: 개별 일정 조각을 렌더링. `top` 및 `height`를 시간과 줌 레벨 기반으로 계산.
- **`model/use-schedule-layout.ts`**: 시간 데이터를 줌인/줌아웃에 최적화된 좌표값으로 변환하는 전용 훅.

### C. Mocks Layer (`mocks/schedule`)
- **`handlers.ts`**: 복합 일정(자정 절단, 다일 일정)을 포함한 모킹 핸들러.

## 4. 상세 설계 및 알고리즘 (Detailed Design)

### Midnight Split Logic
1. 일정의 `startAt`과 `endAt`이 다른 날짜인 경우, 자정을 기점으로 루프를 돌며 `SchedulePart` 배열을 생성.
2. 각 `SchedulePart`는 `date`, `startTime`, `endTime` 정보를 가짐.
3. 캘린더의 각 날짜 컬럼은 자신의 날짜에 해당하는 `SchedulePart`만 렌더링.

### Layout Calculation
- `slotHeight` (CSS 변수 `--slot-height` 사용): 줌 레벨에 따라 동적 변경.
- `top = (startTimeInMinutes / 60) * var(--slot-height)`
- `height = (durationInMinutes / 60) * var(--slot-height)`

## 5. 테스트 계획 (Testing Plan)
- **단위 테스트:** `split-schedule.ts` 로직이 자정 절단을 정확히 수행하는지 검증.
- **통합 테스트:** MSW 모킹 데이터를 통해 캘린더에 일정이 올바른 위치와 높이로 그려지는지 확인.
- **시각적 검증:** 줌 레벨 변경 시 일정 카드가 어긋나지 않고 함께 늘어나고 줄어드는지 확인.

## 6. 제약 사항 및 향후 계획 (Constraints & Future Work)
- **상세보기/수정:** 이번 단계에서는 카드 클릭 시 ID 로그 출력까지만 구현하며, 모달 UI는 다음 태스크에서 처리.
- **동시성 처리:** 같은 시간에 겹치는 일정(Overlap)은 이번 범위에서 제외하고 겹쳐서 표시함 (추후 레이아웃 최적화 예정).
