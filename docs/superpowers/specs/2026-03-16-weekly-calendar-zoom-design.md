# 주간 캘린더 확대/축소 기능 설계 (Weekly Calendar Zoom Design)

## 1. 개요 (Background)
현재 주간 캘린더(`WeeklyCalendar`)는 1시간 단위의 고정된 슬롯 높이를 가지고 있습니다. 합주실 예약이나 세밀한 일정 관리를 위해 사용자는 최소 5분 단위까지 시간을 확인하고 선택할 수 있어야 합니다. 이를 위해 마우스 휠(Ctrl + Scroll)을 이용한 직관적인 확대/축소 기능을 도입합니다.

## 2. 목표 (Goals)
- 10단계의 줌 레벨 제공 (최소 60분 ~ 최대 5분 단위).
- Ctrl + 마우스 휠을 통한 줌 조절 및 브라우저 기본 확대 방지.
- 확대 시 마우스 커서가 위치한 시간을 화면 중앙에 유지 (Cursor-anchored Zoom).
- 줌 레벨에 따라 좌측 시간 레이블 및 그리드 점선을 동적으로 변경.
- 확대된 상태에서 정밀한 시간(분 단위) 선택 가능.

## 3. 상세 설계 (Detailed Design)

### 3.1 줌 레벨 매핑 (Zoom Level Mapping)
1부터 10까지의 줌 레벨을 정의하고, 각 레벨에 따른 슬롯 높이와 표시 단위를 매핑합니다.

| 줌 레벨 | 1시간당 높이 (px) | 주 단위 (레이블) | 부 단위 (그리드) | 클릭 단위 |
| :--- | :--- | :--- | :--- | :--- |
| 1-3 (Low) | 64px - 128px | 60분 | (없음) | 60분 |
| 4-7 (Mid) | 128px - 384px | 60분, 30분 | 30분 (Dashed) | 15분 또는 30분 |
| 8-10 (High) | 384px - 768px | 60분, 30분, 15분 | 15분, 5분 (Dotted) | 5분 |

### 3.2 이벤트 처리 (Event Handling)
- **대상**: `WeeklyTimeGrid`의 스크롤 가능한 컨테이너 영역.
- **이벤트**: `wheel` (Passive: false 설정 필수).
- **조건**: `event.ctrlKey === true`.
- **동작**:
    1. `event.preventDefault()`로 브라우저 기본 확대 차단.
    2. `event.deltaY` 방향에 따라 `zoomLevel` (1~10) 상태 업데이트.
    3. `lodash/throttle`을 적용하여 초당 이벤트 처리 횟수 제한 (약 30fps 목표).

### 3.3 커서 중심 유지 로직 (Cursor-anchored Zooming)
줌 레벨 변경 시 마우스 커서 아래의 시간이 스크롤 위치에서 벗어나지 않도록 계산합니다.
1. 확대 전: 마우스 커서의 캘린더 내부 상대 좌표(%) 저장.
2. 확대 후: 변경된 전체 높이에 상대 좌표(%)를 곱해 새로운 `scrollTop` 계산 및 적용.

### 3.4 UI 및 스타일링 (UI & Styling)
- **CSS 변수**: 최상위 컨테이너에 `--slot-height` 변수를 할당하여 실시간 높이 변경 성능 최적화.
- **좌측 시간 축 (Time Axis)**: 줌 레벨에 따라 `15분`, `30분` 단위 레이블을 조건부 렌더링.
- **그리드 라인**: CSS `background-image` (linear-gradient) 또는 반복되는 `div` 구조를 사용하여 줌 레벨별 보조선 표시.

## 4. 데이터 흐름 (Data Flow)
1. `useCalendarZoom` 커스텀 훅에서 `zoomLevel` 상태 관리.
2. `wheel` 이벤트 발생 -> `zoomLevel` 변경 -> `slotHeight` 계산.
3. `WeeklyTimeGrid`가 `slotHeight`를 전달받아 레이아웃 업데이트.
4. `onSlotClick` 호출 시 클릭된 Y 좌표를 바탕으로 `Date` 객체에 분(Minute) 정보 추가.

## 5. 테스트 계획 (Testing Plan)
- **단위 테스트**: 줌 레벨에 따른 `slotHeight` 계산 로직 검증.
- **컴포넌트 테스트**: Ctrl + Wheel 이벤트 시 `zoomLevel` 상태 변화 확인.
- **E2E 테스트 (Playwright)**: 확대 후 특정 시간 슬롯 클릭 시 정확한 분(minute) 값이 반환되는지 확인.
- **접근성**: 키보드 사용자(+, - 키)를 위한 대체 확대/축소 수단 제공 여부 검토.
