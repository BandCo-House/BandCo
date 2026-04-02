import { Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { useId } from 'react';

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
}

export const DateInput = ({ value, onChange, label }: DateInputProps) => {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm-m text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
        <Input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 rounded-2xl pl-10 focus:ring-ring/50"
        />
      </div>
    </div>
  );
};
