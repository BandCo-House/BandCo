# 주간 달력 일정 연동 및 렌더링 구현 계획 (Weekly Calendar Schedule Integration)

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `WeeklyCalendar` 위젯에 서버로부터 가져온 실제 일정 데이터를 표시하고, 자정을 넘기거나 여러 날에 걸친 일정을 시간 슬롯에 맞춰 동적으로 렌더링합니다.

**Architecture:** FSD 구조를 따라 `entities/schedule`에서 데이터와 비즈니스 로직(Split)을 관리하고, `widgets/weekly-calendar`에서 줌 레벨에 대응하는 렌더링 로직을 구현합니다.

**Tech Stack:** React, TypeScript, TanStack Query, Axios, MSW, Tailwind CSS

---

## Chunk 1: Entities Layer - Types & API

### Task 1: Schedule 도메인 타입 정의
**Files:**
- Modify: `frontend/src/entities/schedule/model/types.ts`

- [ ] **Step 1: API 응답 및 도메인 인터페이스 작성**
```typescript
export type ScheduleType = 'PRACTICE' | 'MEETING';
export type ScheduleStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface ScheduleItem {
  scheduleId: string;
  spaceId: string;
  scheduleType: ScheduleType;
  title: string;
  startAt: string; // ISO 8601
  endAt: string;
  place: { name: string } | null;
  practice: { title: string; artistName: string; team: { name: string } } | null;
  meeting: { participantCount: number } | null;
  ui: { cardTitle: string; cardSubTitle: string; colorToken: string };
  status: ScheduleStatus;
}

export interface GetSchedulesResponse {
  items: ScheduleItem[];
}
```
- [ ] **Step 2: 커밋**
```bash
git add frontend/src/entities/schedule/model/types.ts
git commit -m "✨ feat: define schedule domain types"
```

### Task 2: API Fetcher 구현
**Files:**
- Create: `frontend/src/entities/schedule/api/index.ts`

- [ ] **Step 1: getSchedules 함수 작성**
```typescript
import { apiGet } from '@/shared/api/client';
import { GetSchedulesResponse } from '../model/types';

export const getSchedules = (spaceId: string, params: { from: string; to: string }) =>
  apiGet<GetSchedulesResponse>(`/spaces/${spaceId}/schedules`, { params });
```
- [ ] **Step 2: 커밋**
```bash
git add frontend/src/entities/schedule/api/index.ts
git commit -m "✨ feat: implement schedule api fetcher"
```

---

## Chunk 2: Core Business Logic - Schedule Splitting (TDD)

### Task 3: Midnight Split 로직 구현
**Files:**
- Create: `frontend/src/entities/schedule/lib/split-schedule.ts`
- Create: `frontend/src/entities/schedule/lib/split-schedule.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 (자정을 넘기는 일정)**
- [ ] **Step 2: splitSchedule 함수 구현 (자정 및 다중 날짜 절단 로직)**
- [ ] **Step 3: 테스트 통과 확인 및 커밋**
```bash
git add frontend/src/entities/schedule/lib/split-schedule*
git commit -m "✨ feat: implement midnight split logic with TDD"
```

---

## Chunk 3: Mocking & Query Hook

### Task 4: MSW 핸들러 업데이트
**Files:**
- Create/Modify: `frontend/src/mocks/schedule/handlers.ts`
- Modify: `frontend/src/mocks/handlers.ts`

- [ ] **Step 1: 모킹 핸들러 작성 (복합 일정 데이터 포함)**
- [ ] **Step 2: 메인 핸들러에 등록 및 커밋**

### Task 5: useSchedules 훅 구현
**Files:**
- Create: `frontend/src/entities/schedule/model/queries.ts`

- [ ] **Step 1: useSchedules 훅 작성 (select 옵션에서 splitSchedule 적용)**
- [ ] **Step 2: 커밋**

---

## Chunk 4: UI Integration - Weekly Calendar

### Task 6: ScheduleCard 컴포넌트 구현
**Files:**
- Create: `frontend/src/widgets/weekly-calendar/ui/ScheduleCard.tsx`
- Create: `frontend/src/widgets/weekly-calendar/model/use-schedule-layout.ts`

- [ ] **Step 1: 줌 레벨 기반 좌표 계산 훅 작성 (분 단위 정밀도 반영)**
    - `top = (startMinute / 60) * slotHeight`
    - `height = (durationMinutes / 60) * slotHeight`
- [ ] **Step 2: 일정 카드 컴포넌트 작성 (absolute position, dynamic top/height)**
- [ ] **Step 3: 커밋**

### Task 7: WeeklyTimeGrid 및 WeeklyCalendar 연동
**Files:**
- Modify: `frontend/src/widgets/weekly-calendar/ui/WeeklyCalendar.tsx`
- Modify: `frontend/src/widgets/weekly-calendar/ui/WeeklyTimeGrid.tsx`

- [ ] **Step 1: WeeklyCalendar에서 데이터 호출 및 bandId(URL 파라미터) 주입**
- [ ] **Step 2: WeeklyTimeGrid에서 일정 카드 렌더링**
- [ ] **Step 3: 최종 확인 및 커밋**
