interface SuggestionListProps {
  title: string;
  items: Array<{ key: string; label: string; onSelect: () => void }>;
  emphasized?: boolean;
}

/** 눌러서 바로 물어볼 수 있는 질문 칩 묶음 */
export const SuggestionList = ({
  title,
  items,
  emphasized,
}: SuggestionListProps) => (
  <section className="flex flex-col gap-2 border-t border-grey-500 pt-3">
    <h3 className="typo-xs-r text-grey-300">{title}</h3>
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.key}>
          <button
            type="button"
            onClick={item.onSelect}
            className={
              emphasized
                ? 'rounded-full border border-primary px-3 py-1.5 typo-sm-r text-primary'
                : 'rounded-full border border-grey-500 px-3 py-1.5 typo-sm-r text-grey-100'
            }
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  </section>
);
