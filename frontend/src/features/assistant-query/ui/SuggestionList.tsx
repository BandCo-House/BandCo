import { cn } from '@/shared/lib/utils';
import { SuggestionChip } from './SuggestionChip';

interface SuggestionListProps {
  title: string;
  className?: string;
  items: Array<{ key: string; label: string; onSelect: () => void }>;
  emphasized?: boolean;
}

/** 눌러서 바로 물어볼 수 있는 질문 칩 묶음 */
export const SuggestionList = ({
  title,
  items,
  emphasized,
  className,
}: SuggestionListProps) => (
  <section className={cn('flex flex-col gap-2', className)}>
    <h3 className="typo-xs-r text-grey-300">{title}</h3>
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.key}>
          <SuggestionChip
            label={item.label}
            onSelect={item.onSelect}
            emphasized={emphasized}
          />
        </li>
      ))}
    </ul>
  </section>
);
