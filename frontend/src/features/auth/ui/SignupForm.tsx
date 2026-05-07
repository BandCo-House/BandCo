import React, { useState } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import CheckIcon from '@/assets/icons/check.svg?react';
import { checkEmailDuplicate } from '../api/auth.service';
import { signupSchema, type SignupReq } from '../model/auth.schema';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
import { SocialLoginSection } from '@/shared/ui/social-login-section';
import type { ReactNode } from 'react';

interface SignupFormProps {
  onSubmit: (data: SignupReq) => void;
  isLoading?: boolean;
}

interface SignupInputProps {
  id: string;
  type?: 'email' | 'password' | 'text';
  value: string;
  label: string;
  placeholder: string;
  errorMessage?: string;
  helperText?: string;
  action?: ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

type TermsState = {
  all: boolean;
  service: boolean;
  privacy: boolean;
};

type EmailDuplicateStatus = 'idle' | 'checking' | 'available' | 'duplicated';
type SignupFormErrors = Partial<
  Record<keyof SignupReq | 'requiredTerms', string>
>;

interface TermsCheckboxRowProps {
  id: keyof TermsState;
  checked: boolean;
  children: ReactNode;
  showMore?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

interface PasswordConfirmActionProps {
  isPasswordConfirmed: boolean;
}

interface EmailDuplicateResultProps {
  status: EmailDuplicateStatus;
}

/**
 * 회원가입 화면의 둥근 입력 필드를 렌더링한다.
 */
const SignupInput = ({
  id,
  type = 'text',
  value,
  label,
  placeholder,
  errorMessage,
  helperText,
  action,
  onChange,
}: SignupInputProps) => {
  return (
    <div className="flex flex-col gap-4">
      <label htmlFor={id} className="typo-lg-b text-foreground">
        {label} <span className="text-destructive">*</span>
      </label>
      <div className="flex items-end gap-3">
        <Input
          id={id}
          type={type}
          variant="underline"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={!!errorMessage}
          className="min-h-12 text-foreground placeholder:text-muted"
        />
        {action}
      </div>
      {helperText ? (
        <p className="typo-xs-m text-grey-200">{helperText}</p>
      ) : null}
      {errorMessage ? (
        <p className="typo-xs-m text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
};

/**
 * 회원가입 필수 약관 체크 행을 렌더링한다.
 */
const TermsCheckboxRow = ({
  id,
  checked,
  children,
  showMore = false,
  onCheckedChange,
}: TermsCheckboxRowProps) => {
  return (
    <label htmlFor={id} className="flex items-center gap-3 py-2 text-grey-200">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="min-w-0 flex-1 typo-sm-m">{children}</span>
      {showMore ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 px-1 typo-sm-m"
        >
          더보기
          <ArrowRightIcon aria-hidden="true" className="size-5" />
        </button>
      ) : null}
    </label>
  );
};

/**
 * 이메일 중복확인 결과를 입력 필드 우측 상태 표시로 렌더링한다.
 */
const EmailDuplicateResult = ({ status }: EmailDuplicateResultProps) => {
  const isVisible = status === 'available' || status === 'duplicated';
  const isDuplicated = status === 'duplicated';

  return (
    <div
      className={cn(
        'mb-1 grid h-14 shrink-0 transition-[width,opacity,transform] duration-300 ease-out',
        isVisible
          ? isDuplicated
            ? 'w-20 translate-x-0 opacity-100'
            : 'w-14 translate-x-0 opacity-100'
          : 'w-0 translate-x-2 opacity-0',
      )}
    >
      <div
        aria-hidden={!isVisible}
        aria-label={
          isVisible
            ? isDuplicated
              ? '중복 이메일'
              : '사용 가능한 이메일'
            : undefined
        }
        className={cn(
          'flex h-14 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 ease-out',
          isVisible ? 'scale-100' : 'pointer-events-none scale-90',
          isDuplicated
            ? 'border border-key-muted px-6 typo-base-m text-grey-200'
            : 'w-14 bg-key-muted text-key-foreground',
        )}
      >
        {isDuplicated ? (
          '중복'
        ) : (
          <CheckIcon aria-hidden="true" className="size-5" />
        )}
      </div>
    </div>
  );
};

/**
 * 비밀번호 확인 입력값의 일치 여부를 상태 표시로 렌더링한다.
 */
const PasswordConfirmAction = ({
  isPasswordConfirmed,
}: PasswordConfirmActionProps) => {
  if (!isPasswordConfirmed) {
    return (
      <div className="mb-1 flex h-14 shrink-0 items-center rounded-full border border-key-muted px-6 typo-base-m text-grey-200">
        불일치
      </div>
    );
  }

  return (
    <div
      aria-label="비밀번호 일치"
      className="mb-1 flex size-14 shrink-0 items-center justify-center rounded-full bg-key-muted text-key-foreground"
    >
      <CheckIcon aria-hidden="true" className="size-5" />
    </div>
  );
};

/**
 * 이름, 이메일, 비밀번호를 입력받아 회원가입 요청을 제출하는 폼을 렌더링한다.
 */
export const SignupForm = ({
  onSubmit,
  isLoading = false,
}: SignupFormProps) => {
  const [formData, setFormData] = useState<SignupReq>({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [emailDuplicateStatus, setEmailDuplicateStatus] =
    useState<EmailDuplicateStatus>('idle');
  const [terms, setTerms] = useState<TermsState>({
    all: false,
    service: false,
    privacy: false,
  });

  const hasPasswordConfirmInput = passwordConfirm.length > 0;
  const isPasswordConfirmed =
    hasPasswordConfirmInput && formData.password === passwordConfirm;
  const isRequiredTermsChecked = terms.service && terms.privacy;
  const isFormValid =
    signupSchema.safeParse(formData).success &&
    isPasswordConfirmed &&
    isRequiredTermsChecked &&
    emailDuplicateStatus !== 'duplicated';

  /**
   * 입력 필드의 id를 기준으로 회원가입 폼 상태를 갱신한다.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const id = e.target.id as keyof SignupReq;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (id === 'email') {
      setEmailDuplicateStatus('idle');
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  /**
   * 현재 입력된 이메일이 이미 사용 중인지 확인한다.
   */
  const handleEmailDuplicateCheck = async () => {
    const emailResult = signupSchema.shape.email.safeParse(formData.email);

    if (!emailResult.success) {
      setErrors((prev) => ({
        ...prev,
        email: emailResult.error.issues[0]?.message ?? '이메일을 확인해주세요.',
      }));
      return;
    }

    setEmailDuplicateStatus('checking');

    try {
      const result = await checkEmailDuplicate(formData.email);

      setEmailDuplicateStatus(result.duplicated ? 'duplicated' : 'available');
      setErrors((prev) => ({
        ...prev,
        email: result.duplicated ? '이미 사용 중인 이메일입니다.' : undefined,
      }));
    } catch (error) {
      console.error('이메일 중복 확인에 실패했습니다.', error);
      setEmailDuplicateStatus('idle');
      setErrors((prev) => ({
        ...prev,
        email: '이메일 확인 중 오류가 발생했습니다. 다시 시도해주세요.',
      }));
    }
  };

  /**
   * 약관 체크 상태를 개별 또는 전체 선택 기준으로 갱신한다.
   */
  const handleTermsChange = (id: keyof TermsState, checked: boolean) => {
    if (id === 'all') {
      setTerms({
        all: checked,
        service: checked,
        privacy: checked,
      });
      return;
    }

    setTerms((prev) => {
      const next = {
        ...prev,
        [id]: checked,
      };

      return {
        ...next,
        all: next.service && next.privacy,
      };
    });
  };

  /**
   * 회원가입 폼을 검증하고 유효한 경우 제출 콜백을 호출한다.
   */
  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse(formData);
    const nextErrors: SignupFormErrors = {};

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof SignupReq;
        nextErrors[path] = issue.message;
      });
    }

    if (!isPasswordConfirmed) {
      nextErrors.password =
        nextErrors.password ?? '비밀번호가 일치하지 않습니다.';
    }

    if (emailDuplicateStatus === 'duplicated') {
      nextErrors.email = '이미 사용 중인 이메일입니다.';
    }

    if (!isRequiredTermsChecked) {
      nextErrors.requiredTerms = '필수 이용약관에 동의해주세요.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="flex min-h-full w-full flex-col pb-8 text-muted">
      <form onSubmit={handleSubmit} className="flex flex-col gap-10" noValidate>
        <SignupInput
          id="name"
          value={formData.name}
          label="이름"
          onChange={handleChange}
          placeholder="이름을 입력하세요."
          errorMessage={errors.name}
        />
        <SignupInput
          id="email"
          type="email"
          value={formData.email}
          label="이메일"
          onChange={handleChange}
          placeholder="이메일을 입력하세요."
          errorMessage={errors.email}
          action={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={emailDuplicateStatus === 'checking'}
                onClick={handleEmailDuplicateCheck}
                className="mb-1 h-14 shrink-0 rounded-full border-key-muted px-6 typo-base-m text-grey-200"
              >
                {emailDuplicateStatus === 'checking' ? '확인 중' : '중복 확인'}
              </Button>
              <EmailDuplicateResult status={emailDuplicateStatus} />
            </>
          }
        />
        <SignupInput
          id="password"
          type="password"
          value={formData.password}
          label="비밀번호"
          onChange={handleChange}
          placeholder="비밀번호를 입력하세요."
          helperText="영문, 숫자, 특수문자(!@#$%^&*())만 사용할 수 있습니다."
          errorMessage={errors.password}
        />
        <SignupInput
          id="passwordConfirm"
          type="password"
          value={passwordConfirm}
          label="비밀번호 확인"
          onChange={(event) => setPasswordConfirm(event.target.value)}
          placeholder="비밀번호를 다시 입력하세요."
          action={
            hasPasswordConfirmInput ? (
              <PasswordConfirmAction
                isPasswordConfirmed={isPasswordConfirmed}
              />
            ) : null
          }
        />

        <section className="flex flex-col gap-4" aria-labelledby="terms-title">
          <h2 id="terms-title" className="typo-lg-b text-foreground">
            약관 <span className="text-destructive">*</span>
          </h2>
          <div className="flex flex-col gap-3 pl-4">
            <TermsCheckboxRow
              id="all"
              checked={terms.all}
              onCheckedChange={(checked) => handleTermsChange('all', checked)}
            >
              전체 이용약관에 동의합니다.
            </TermsCheckboxRow>
            <TermsCheckboxRow
              id="service"
              checked={terms.service}
              showMore
              onCheckedChange={(checked) =>
                handleTermsChange('service', checked)
              }
            >
              이용약관 동의(필수)
            </TermsCheckboxRow>
            <TermsCheckboxRow
              id="privacy"
              checked={terms.privacy}
              showMore
              onCheckedChange={(checked) =>
                handleTermsChange('privacy', checked)
              }
            >
              개인정보 수집 및 이용 동의(필수)
            </TermsCheckboxRow>
          </div>
          {errors.requiredTerms ? (
            <p className="typo-xs-m text-destructive">{errors.requiredTerms}</p>
          ) : null}
        </section>

        <Button
          type="submit"
          variant="key"
          size="lg"
          disabled={isLoading || !isFormValid}
          className="mt-4 w-full"
        >
          {isLoading ? '처리 중...' : '가입하기'}
        </Button>
      </form>

      <SocialLoginSection className="mt-20" buttonGapClassName="gap-7" />
    </div>
  );
};
