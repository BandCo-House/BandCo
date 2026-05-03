import { cn } from '@/shared/lib/utils';

interface SocialLoginSectionProps {
  className?: string;
  buttonGapClassName?: string;
}

const googleLogo = new URL('../../assets/images/Google.svg', import.meta.url)
  .href;
const naverLogo = new URL('../../assets/images/Naver.svg', import.meta.url)
  .href;
const kakaoLogo = new URL('../../assets/images/Kakaotalk.svg', import.meta.url)
  .href;

const socialLoginButtons = [
  {
    label: 'Google',
    src: googleLogo,
    className: 'bg-white',
  },
  {
    label: 'Naver',
    src: naverLogo,
    className: 'bg-[#03A94D]',
  },
  {
    label: 'Kakao',
    src: kakaoLogo,
    className: 'bg-[#FAE100]',
  },
] as const;

/**
 * SNS 계정으로 빠르게 로그인하는 공통 액션 영역을 렌더링한다.
 */
export const SocialLoginSection = ({
  className,
  buttonGapClassName = 'gap-5',
}: SocialLoginSectionProps) => {
  return (
    <section className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-4 typo-xs-m text-grey-200">
        <span className="h-px flex-1 bg-overlay-40" />
        <p className="shrink-0">SNS 계정으로 빠르게 로그인할 수 있어요</p>
        <span className="h-px flex-1 bg-overlay-40" />
      </div>

      <div
        className={cn(
          'mt-8 flex items-center justify-center',
          buttonGapClassName,
        )}
      >
        {socialLoginButtons.map(
          ({ label, src, className: buttonClassName }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 hover:-translate-y-0.5',
                buttonClassName,
              )}
            >
              <img src={src} alt="" className="h-6 w-6" />
            </button>
          ),
        )}
      </div>
    </section>
  );
};
