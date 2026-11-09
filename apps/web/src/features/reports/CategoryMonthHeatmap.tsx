import React from 'react';
import type { ReportCategory, ReportMonth } from '@hisab/shared';
import { useLanguage } from '@/hooks/useLanguage';
import { Money } from '@/components/Money';
import { CategoryChip } from '@/components/CategoryChip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryMonthHeatmapProps {
  months: string[];
  monthly: ReportMonth[];
  categories: ReportCategory[];
  currentMonth: string;
}

// Sequential encoding: one hue, lightness/opacity steps with magnitude
const HUE = 'var(--c1)';
const MIN_ALPHA = 0.08;
const MAX_ALPHA = 0.55; // keeps the (text-token) value readable on top

export const CategoryMonthHeatmap: React.FC<CategoryMonthHeatmapProps> = ({
  months,
  monthly,
  categories,
  currentMonth,
}) => {
  const { t, formatMonthStr } = useLanguage();

  const max = categories.reduce((acc, c) => {
    for (const v of c.byMonth) {
      const n = Number(v);
      if (n > acc) acc = n;
    }
    return acc;
  }, 0);

  const alphaFor = (value: string) => {
    const n = Number(value);
    if (n <= 0 || max <= 0) return 0;
    return MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * Math.sqrt(n / max);
  };

  const shortMonth = (m: string) => formatMonthStr(m).split(' ')[0];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold font-display">{t.reports.heatTitle}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{t.reports.heatSubtitle}</p>
        </div>
        {/* Scale legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" aria-hidden="true">
          <span>{t.reports.heatLess}</span>
          {[0.1, 0.25, 0.4, 0.55].map((a) => (
            <span key={a} className="h-3 w-5 rounded-sm border border-border/50" style={{ background: HUE, opacity: a + 0.15 }} />
          ))}
          <span>{t.reports.heatMore}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-max border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="sticky left-0 z-10 bg-card text-left font-medium py-2 pr-3">{t.reports.colCategory}</th>
                {months.map((m) => (
                  <th key={m} scope="col" className="font-medium py-2 px-1.5 text-right whitespace-nowrap" title={formatMonthStr(m)}>
                    {shortMonth(m)}
                    {m === currentMonth && <span className="text-[10px]">*</span>}
                  </th>
                ))}
                <th className="font-semibold py-2 pl-3 text-right text-foreground">{t.reports.heatTotal}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.categoryId}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-card text-left font-medium text-foreground py-1 pr-3 whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-2">
                      <CategoryChip label={c.shortLabel || c.name.slice(0, 1)} color={c.color || 1} size="sm" />
                      <span className="max-w-[9rem] truncate">{c.name}</span>
                    </span>
                  </th>
                  {c.byMonth.map((v, i) => {
                    const alpha = alphaFor(v);
                    return (
                      <td key={months[i]} className="p-0.5">
                        <div
                          className="relative rounded-md px-2 py-2 text-right tabular-nums text-foreground"
                          title={`${c.name} · ${formatMonthStr(months[i])}`}
                        >
                          <span
                            className="absolute inset-0 rounded-md"
                            style={{ background: HUE, opacity: alpha }}
                            aria-hidden="true"
                          />
                          <span className="relative">
                            {Number(v) > 0 ? <Money amount={v} /> : <span className="text-muted-foreground">—</span>}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-1 pl-3 text-right font-semibold text-foreground tabular-nums whitespace-nowrap">
                    <Money amount={c.total} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-foreground">
                <th scope="row" className="sticky left-0 z-10 bg-card text-left font-semibold pt-2 pr-3 border-t border-border/60">
                  {t.reports.heatTotal}
                </th>
                {monthly.map((m) => (
                  <td key={m.month} className="pt-2 px-2 text-right font-semibold tabular-nums whitespace-nowrap border-t border-border/60">
                    <Money amount={m.expense} />
                  </td>
                ))}
                <td className="pt-2 pl-3 text-right font-bold tabular-nums whitespace-nowrap border-t border-border/60">
                  <Money amount={monthly.reduce((acc, m) => acc + BigInt(m.expense), 0n).toString()} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
