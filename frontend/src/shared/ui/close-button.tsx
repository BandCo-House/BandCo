import { XIcon } from 'lucide-react';

const closeButtonBase =
  'flex items-center justify-center rounded-full text-grey-100 transition-colors hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:text-primary';

/**
 * 헤더 흐름 안에 놓는 닫기(X). 모달 기본값.
 *
 * absolute로 띄우지 않는 이유: 모달마다 콘텐츠 패딩이 다른데(20·24·32) 고정 오프셋은
 * 그때마다 어긋난다. 실제로 화면마다 top-5 오버라이드를 붙이거나 아예 따로 구현해
 * 피해 다니고 있었다. 흐름에 두면 패딩이 얼마든 콘텐츠 그리드에 자동으로 맞는다.
 *
 * -m-2 p-2: 시각 크기는 아이콘 그대로 두고 터치 영역만 사방 8px 넓힌다.
 * 넓힌 만큼 음수 마진으로 되돌려 정렬은 유지된다.
 */
export const closeButtonClass = `${closeButtonBase} -m-2 shrink-0 p-2`;

/**
 * 헤더가 없거나 제목이 가운데 정렬이라 흐름에 넣을 수 없는 시트용 부유형 닫기(X).
 * 이걸 쓰면 오프셋이 그 표면의 패딩과 맞는지 사용처가 책임진다.
 */
export const closeButtonFloatingClass = `${closeButtonBase} absolute top-6 right-6 z-50 size-10`;

/** 닫기 버튼 내부(아이콘 + 스크린리더 이름). */
export const CloseButtonContent = () => (
  <>
    <XIcon aria-hidden="true" className="size-8" />
    <span className="sr-only">닫기</span>
  </>
);
