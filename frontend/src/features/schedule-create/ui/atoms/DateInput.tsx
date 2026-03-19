import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
}

export const DateInput = ({ value, onChange, label }: DateInputProps) => {
  const date = value ? new Date(value) : undefined;

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal h-12 rounded-xl border-gray-200',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            {date ? format(date, 'PPP', { locale: ko }) : <span>날짜 선택</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && onChange(format(date, 'yyyy-MM-dd'))}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
