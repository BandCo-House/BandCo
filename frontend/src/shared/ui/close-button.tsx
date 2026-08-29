import { XIcon } from 'lucide-react';

/**
 * 모달·시트 공용 닫기(X) 버튼 스타일.
 * 색은 표면에 따라 사용처에서 덮어쓴다(어두운 모달 기본값 = grey-100).
 */
export const closeButtonClass =
  'absolute top-6 right-6 z-50 flex size-10 items-center justify-center rounded-full text-grey-100 transition-colors hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:text-primary';

/** 닫기 버튼 내부(아이콘 + 스크린리더 이름). */
export const CloseButtonContent = () => (
  <>
    <XIcon aria-hidden="true" className="size-8" />
    <span className="sr-only">닫기</span>
  </>
);
