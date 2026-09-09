import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * typo-*는 font-size·weight·line-height를 한 번에 정하는 이 레포의 유틸이다.
 * tailwind-merge는 모르는 클래스라 충돌로 보지 않아, 기본값을 둔 컴포넌트에
 * 호출부가 다른 typo-*를 넘기면 둘 다 남는다. 그러면 CSS 정의 순서가 이겨
 * 호출부가 쓴 값이 조용히 무시된다(전부 기본값이 이기고 있었다).
 * 그룹으로 등록해 뒤에 온 것이 이기게 한다.
 */
// 제네릭에 새 그룹 ID를 알려야 classGroups에 등록할 수 있다.
const twMerge = extendTailwindMerge<'typo'>({
  extend: {
    classGroups: {
      typo: [
        {
          typo: [
            '3xl-b',
            'xl-sb',
            'lg-b',
            'lg-sb',
            'base-b',
            'base-sb',
            'base-r',
            'sm-b',
            'sm-sb',
            'sm-r',
            'xs-sb',
            'xs-r',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
