/**
 * 고르는 칩(필터·태그)의 표면(프로토타입).
 *
 * 같은 선택/비선택 클래스 쌍이 일정 필터 바, 필터 시트, 태그 선택 시트, 세그먼트 토글에
 * 복사돼 있었다. 화면마다 손보면 한 곳씩 빠지므로 재질을 칩 자체에 싣는다.
 * 크기·여백은 쓰는 쪽이 정한다.
 */
export const chipSurfaceClass = {
  // 색 규칙: 보이는 것만 바꾸는 선택(필터)은 흰 면, 저장될 값을 고르는 선택(입력)은 노란 면.
  // 노란색은 "만들거나 저장하는 중"에만 써서 필터와 만들기 버튼이 같은 색으로 경쟁하지 않게 한다.
  selected: 'glass-surface glass-pressable bg-grey-50 text-gradient-top',
  selectedInput:
    'glass-border-primary glass-pressable bg-primary text-gradient-top',
  unselected: 'glass-surface glass-pressable bg-grey-500/24 text-grey-100',
} as const;
