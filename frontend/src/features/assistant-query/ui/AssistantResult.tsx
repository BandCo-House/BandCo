import { useState, type ReactNode } from 'react';
import { EmptyState } from '@/shared/ui/empty-state';
import type {
  AssistantQueryResult,
  AssistantTableResult,
} from '@/entities/assistant/model/types';
import {
  formatDateTime,
  formatResultCell,
  isNumericValue,
} from '../lib/format';

const ATTENDANCE_LABEL: Record<string, string> = {
  PENDING: '미응답',
  ATTENDING: '참석',
  ABSENT: '불참',
};

/** 이름 칩으로 보여줄 수 있는 짧은 값의 최대 길이 */
const MAX_CHIP_TEXT_LENGTH = 14;
/** 홈 카드가 너무 길어지지 않게 처음에 보여줄 행 수. 나머지는 펼쳐서 본다. */
const PREVIEW_ROWS = 10;

interface AssistantResultProps {
  result: AssistantQueryResult;
}

/**
 * 결과 유형에 맞는 모양으로 행을 보여준다.
 * 요약과 결과가 같은 응답에서 나오므로 서로 어긋날 수 없다.
 */
export const AssistantResult = ({ result }: AssistantResultProps) => {
  if (result.entity === 'table') return <TableResult result={result} />;
  return <LegacyResult result={result} />;
};

const TableResult = ({ result }: { result: AssistantTableResult }) => {
  const [expanded, setExpanded] = useState(false);
  const { columns, rows } = result;
  const visibleRows = expanded ? rows : rows.slice(0, PREVIEW_ROWS);
  // 카드 안에 따로 스크롤 영역을 두면 모바일에서 스크롤이 갇혀, 처음 몇 건만 보이고 펼치게 한다.
  const withToggle = (list: ReactNode) => (
    <div className="flex flex-col gap-2">
      {list}
      {rows.length > PREVIEW_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="self-start typo-sm-r text-grey-300 underline underline-offset-4"
        >
          {expanded ? '접기' : `${rows.length}건 모두 보기`}
        </button>
      )}
    </div>
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        title="조건에 맞는 결과가 없어요."
        description="위 조건을 확인하고 기간이나 조건을 바꿔 다시 물어보세요."
        className="rounded-sm bg-surface-3 py-6"
      />
    );
  }

  const firstValue = rows[0][columns[0].key];
  const isSingleValue = rows.length === 1 && columns.length === 1;

  // 숫자 하나가 곧 답인 집계는 표 대신 큰 숫자로 보여준다. 설명은 위 헤드라인(결과 제목)이 맡는다.
  if (
    isSingleValue &&
    (result.resultMode === 'AGGREGATE' || isNumericValue(firstValue))
  ) {
    return (
      <p
        aria-label="조회 결과"
        className="typo-3xl-b text-grey-50 tabular-nums"
      >
        {formatResultCell(firstValue, columns[0].format)}
      </p>
    );
  }

  if (rows.length === 1) return <SingleRowCard result={result} />;

  if (columns.length === 1 && columns[0].format === 'plain') {
    const values = visibleRows.map((row) =>
      formatResultCell(row[columns[0].key], 'plain'),
    );
    if (values.every((value) => value.length <= MAX_CHIP_TEXT_LENGTH)) {
      return withToggle(
        <ul
          aria-label="조회 결과"
          className="grid grid-cols-3 gap-2 typo-sm-r text-grey-100"
        >
          {values.map((value, index) => (
            <li
              key={`${value}-${index}`}
              className="truncate rounded-xs bg-surface-3 px-2 py-2 text-center"
            >
              {value}
            </li>
          ))}
        </ul>,
      );
    }
  }

  return withToggle(<StackedList result={result} rows={visibleRows} />);
};

/** 한 건은 첫 열을 제목으로, 나머지 열을 이름·값 줄로 보여준다. */
const SingleRowCard = ({ result }: { result: AssistantTableResult }) => {
  const [primary, ...rest] = result.columns;
  const row = result.rows[0];
  return (
    <div
      aria-label="조회 결과"
      className="flex flex-col gap-3 rounded-sm bg-surface-3 p-4"
    >
      <p className="typo-lg-sb text-grey-50">
        {formatResultCell(row[primary.key], primary.format)}
      </p>
      {rest.length > 0 && (
        <dl className="flex flex-col gap-1.5 typo-sm-r">
          {rest.map((column) => (
            <div key={column.key} className="flex justify-between gap-4">
              <dt className="shrink-0 text-grey-300">{column.label}</dt>
              <dd className="min-w-0 truncate text-right text-grey-100">
                {formatResultCell(row[column.key], column.format)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

/** 여러 열은 휴대폰에서 가로 스크롤 표 대신 행마다 라벨을 붙인 세로 목록으로 보여준다. */
const StackedList = ({
  result,
  rows,
}: {
  result: AssistantTableResult;
  rows: AssistantTableResult['rows'];
}) => {
  const [primary, ...rest] = result.columns;
  const ranked = result.resultMode === 'TOP_N';
  return (
    // 행 사이 구분선 대신 한 장의 카드 안에 간격으로 나눈다.
    <ol
      aria-label="조회 결과"
      className="flex flex-col gap-1 rounded-sm bg-surface-3 px-4 py-2"
    >
      {rows.map((row, index) => (
        <li key={index} className="flex items-start gap-3 py-2">
          {ranked && (
            <span className="w-5 shrink-0 typo-sm-b text-primary tabular-nums">
              {index + 1}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate typo-sm-sb text-grey-50">
              {formatResultCell(row[primary.key], primary.format)}
            </span>
            {rest.length > 0 && (
              <span className="typo-xs-r text-grey-300">
                {rest
                  .map(
                    (column) =>
                      `${column.label} ${formatResultCell(row[column.key], column.format)}`,
                  )
                  .join(' · ')}
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

type LegacyResultValue = Exclude<AssistantQueryResult, { entity: 'table' }>;

/** 이전 서버가 보내던 entity별 결과. 새 서버는 table만 보낸다. */
const LegacyResult = ({ result }: { result: LegacyResultValue }) => {
  if (result.rows.length === 0) return null;

  const items: Array<{ key: string; name: string; value: string }> =
    result.entity === 'schedule'
      ? result.rows.map((row) => ({
          key: row.id,
          name: row.title,
          value: formatDateTime(row.startAt),
        }))
      : result.entity === 'attendance'
        ? result.rows.map((row) => ({
            key: `${row.scheduleId}-${row.bandMemberId}`,
            name: row.nickname,
            value: ATTENDANCE_LABEL[row.attendanceStatus ?? 'PENDING'],
          }))
        : result.entity === 'songPractice'
          ? result.rows.map((row) => ({
              key: row.songId,
              name: `${row.title} · ${row.artistName}`,
              value: `${row.practiceCount}회`,
            }))
          : result.rows.map((row) => ({
              key: row.bandMemberId,
              name: row.nickname,
              value: `${row.participationCount}회`,
            }));

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li
          key={item.key}
          className="flex items-center justify-between gap-3 typo-sm-r text-grey-200"
        >
          <span className="min-w-0 truncate">{item.name}</span>
          <span className="shrink-0 text-grey-300">{item.value}</span>
        </li>
      ))}
    </ul>
  );
};
