/** H1 of a page: its own `h1`, else the keyword with a capital first letter, else the title. */
export const pageH1 = (t: { title: string; keyword?: string; h1?: string }) =>
  t.h1 ?? (t.keyword ? t.keyword.charAt(0).toLocaleUpperCase() + t.keyword.slice(1) : t.title)
