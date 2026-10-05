/** 조건부 className을 공백으로 합친다. */
export const cn = (
  ...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(' ');
