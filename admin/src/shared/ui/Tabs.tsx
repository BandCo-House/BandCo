import { cn } from '@/shared/lib/cn';

interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  tabs: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
}

export const Tabs = <T extends string>({
  tabs,
  value,
  onChange,
}: TabsProps<T>) => (
  <div role="tablist" className="flex gap-1 border-b border-slate-200">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        role="tab"
        aria-selected={tab.value === value}
        onClick={() => onChange(tab.value)}
        className={cn(
          '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          tab.value === value
            ? 'border-slate-900 text-slate-900'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
