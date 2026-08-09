import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';

export interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string | null;
  onValueChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder: string;
  ariaLabel: string;
  id?: string;
  disabled?: boolean;
}

/**
 * 디자인의 캡슐형(rounded-full) 드롭다운 입력.
 * 값이 있으면 primary 테두리 + grey-50 텍스트, 없으면 grey-300 placeholder.
 */
export const SelectField = ({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  id,
  disabled,
}: SelectFieldProps) => (
  <Select value={value ?? undefined} onValueChange={onValueChange}>
    <SelectTrigger
      id={id}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'h-[54px] rounded-full bg-grey-500/24 px-5 py-4 typo-base-sb',
        value ? 'border-primary text-grey-50' : 'border-white/24 text-grey-300',
      )}
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
