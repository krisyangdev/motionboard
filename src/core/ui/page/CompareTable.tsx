import { coreMessages } from '@/core/messages'
import type { Locale } from '@/core/i18n'

/** The comparison table: one row per decision factor, a column per product and the "choose based on" column. A real `<table>` in the server HTML. */
export function CompareTable({ products, rows, locale }: { products: readonly [string, string]; rows: readonly { factor: string; a: string; b: string; chooseIf: string }[]; locale: Locale }) {
  const l = coreMessages[locale].page
  const th = 'px-3 py-2 text-left font-medium'
  const td = 'px-3 py-2 align-top'
  return (
    <div className="mt-8 overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead className="bg-muted">
          <tr>
            <th className={th} scope="col">
              {l.factor}
            </th>
            <th className={th} scope="col">
              {products[0]}
            </th>
            <th className={th} scope="col">
              {products[1]}
            </th>
            <th className={th} scope="col">
              {l.chooseIf}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr className="border-t" key={r.factor}>
              <th className={`${td} text-left font-medium`} scope="row">
                {r.factor}
              </th>
              <td className={td}>{r.a}</td>
              <td className={td}>{r.b}</td>
              <td className={`${td} text-muted-foreground`}>{r.chooseIf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
