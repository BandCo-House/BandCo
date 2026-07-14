import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface FieldLabelProps {
  children: ReactNode;
  required?: boolean;
  /** 'lg'(18px) | 'base'(16px). 기본 base. */
  size?: 'lg' | 'base';
  htmlFor?: string;
  className?: string;
}

/** 입력 필드 라벨(+ 필수 표시 dot). 라벨만 단독으로 필요할 때 사용. */
export const FieldLabel = ({
  children,
  required,
  size = 'base',
  htmlFor,
  className,
}: FieldLabelProps) => {
  const Tag = htmlFor ? 'label' : 'span';
  return (
    <Tag
      htmlFor={htmlFor}
      className={cn(
        'flex items-center gap-1 text-grey-50',
        size === 'lg' ? 'typo-lg-sb' : 'typo-base-sb',
        className,
      )}
    >
      {children}
      {required && (
        <span
          aria-hidden="true"
          className="size-1 rounded-full bg-destructive"
        />
      )}
    </Tag>
  );
};

interface FieldProps {
  /** 필드 제목. */
  label: ReactNode;
  required?: boolean;
  labelSize?: 'lg' | 'base';
  /** 지정 시 라벨을 <label htmlFor>로 렌더링해 하위 입력과 연결한다. */
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

/**
 * 라벨(제목) + 입력/선택 구조를 표준 간격으로 묶는 공용 필드.
 * 로그인·합주공간·장소·일정 등 모든 폼에서 제목↔입력 간격을 동일하게 유지한다.
 */
export const Field = ({
  label,
  required,
  labelSize,
  htmlFor,
  className,
  children,
}: FieldProps) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <FieldLabel htmlFor={htmlFor} required={required} size={labelSize}>
      {label}
    </FieldLabel>
    {children}
  </div>
);
