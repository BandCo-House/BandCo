import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '@/shared/api/config';
import { cn } from '@/shared/lib/utils';

interface SocialLoginSectionProps {
  className?: string;
  buttonGapClassName?: string;
  onProviderLogin?: (provider: SocialLoginProvider) => void;
  /** Google ID 토큰을 받았을 때 호출된다. 전달하면 Google 자리에 GIS 버튼이 렌더링된다. */
  onGoogleCredential?: (idToken: string) => void;
}

type SocialLoginProvider = 'google' | 'naver' | 'kakao';

const googleLogo = new URL('../../assets/images/Google.svg', import.meta.url)
  .href;
const naverLogo = new URL('../../assets/images/Naver.svg', import.meta.url)
  .href;
const kakaoLogo = new URL('../../assets/images/Kakaotalk.svg', import.meta.url)
  .href;

const socialLoginButtons = [
  {
    provider: 'google',
    label: 'Google',
    src: googleLogo,
    className: 'bg-white',
  },
  {
    provider: 'naver',
    label: 'Naver',
    src: naverLogo,
    className: 'bg-[#03A94D]',
  },
  {
    provider: 'kakao',
    label: 'Kakao',
    src: kakaoLogo,
    className: 'bg-[#FAE100]',
  },
] as const;

/**
 * ID 토큰 방식 로그인은 GIS(Google Identity Services)가 그려주는 버튼으로만 시작할 수 있어
 * Google 자리만 GIS 아이콘 버튼으로 대체한다. GIS 스크립트는 이 버튼이 있는 화면에서만 로드된다.
 */
const GoogleLoginButton = ({
  onCredential,
}: {
  onCredential: (idToken: string) => void;
}) => {
  return (
    <div
      className="flex h-14 w-14 items-center justify-center"
      data-testid="google-login"
    >
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <GoogleLogin
          type="icon"
          shape="circle"
          size="large"
          onSuccess={({ credential }) => {
            if (credential) onCredential(credential);
          }}
        />
      </GoogleOAuthProvider>
    </div>
  );
};

/**
 * SNS 계정으로 빠르게 로그인하는 공통 액션 영역을 렌더링한다.
 */
export const SocialLoginSection = ({
  className,
  buttonGapClassName = 'gap-5',
  onProviderLogin,
  onGoogleCredential,
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
          ({ provider, label, src, className: buttonClassName }) =>
            provider === 'google' && onGoogleCredential ? (
              <GoogleLoginButton
                key={label}
                onCredential={onGoogleCredential}
              />
            ) : (
              <button
                key={label}
                type="button"
                aria-label={label}
                disabled={!onProviderLogin}
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 hover:-translate-y-0.5',
                  !onProviderLogin && 'cursor-not-allowed hover:translate-y-0',
                  buttonClassName,
                )}
                onClick={() => onProviderLogin?.(provider)}
              >
                <img src={src} alt="" className="h-6 w-6" />
              </button>
            ),
        )}
      </div>
    </section>
  );
};
