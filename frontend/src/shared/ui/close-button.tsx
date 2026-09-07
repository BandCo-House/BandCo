import { XIcon } from 'lucide-react';

/**
 * 모달·시트 공용 닫기(X) 버튼 스타일.
 * 색은 표면에 따라 사용처에서 덮어쓴다(어두운 모달 기본값 = grey-100).
 *
 * 위치가 top-6이 아니라 top-5인 이유: 모달·시트 콘텐츠는 p-6(24px) 그리드 위에 있는데
 * 40px 터치 타깃 안에 32px 아이콘이 4px 안쪽으로 들어간다. 박스를 24에 두면 아이콘이
 * 28px에 놓여 제목선과 어긋난다. 박스를 20(=24-4)에 두어 아이콘을 24에 맞춘다.
 */
export const closeButtonClass =
  'absolute top-5 right-5 z-50 flex size-10 items-center justify-center rounded-full text-grey-100 transition-colors hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:text-primary';

/** 닫기 버튼 내부(아이콘 + 스크린리더 이름). */
export const CloseButtonContent = () => (
  <>
    <XIcon aria-hidden="true" className="size-8" />
    <span className="sr-only">닫기</span>
  </>
);
