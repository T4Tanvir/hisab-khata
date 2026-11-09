import React, { useMemo } from 'react';
import type { ReportMonth } from '@hisab/shared';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
  type TooltipProps,
} from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { Money } from '@/components/Money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompactTaka } from '@/lib/format-compact';

interface SavingsBarChartProps {
  monthly: ReportMonth[];
  currentMonth: string;
}

// Diverging pair (validated for CVD on both surfaces): cool = saved, warm = deficit
const SAVED = 'var(--c1)';
const DEFICIT = 'var(--c2)';

interface Row extends ReportMonth {
  savingsTaka: number;
  tick: string;
  isRunning: boolean;
}

/** Bar with a 4px rounded data-end and a square end on the zero baseline. */
const DataEndBar: React.FC<any> = ({ x, y, width, height, fill, payload }) => {
  if (!height || !width) return null;
  const r = Math.min(4, Math.abs(height), width / 2);
  const negative = payload.savingsTaka < 0;
  const top = y;
  const bottom = y + height;
  const path = negative
    ? // rounded at the bottom (data end), flat at the top (baseline)
      `M${x},${top} H${x + width} V${bottom - r} Q${x + width},${bottom} ${x + width - r},${bottom} H${x + r} Q${x},${bottom} ${x},${bottom - r} Z`
    : `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${bottom} Z`;
  return <path d={path} fill={fill} />;
};

const ChartTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  const { t, formatMonthStr, formatNumber } = useLanguage();
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  const negative = BigInt(row.savings) < 0n;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md min-w-[180px] space-y-1">
      <p className="font-semibold text-foreground">
        {formatMonthStr(row.month)}
        {row.isRunning && <span className="ml-1 font-normal text-muted-foreground">({t.reports.runningMonth})</span>}
      </p>
      <div className="flex justify-between gap-4 text-muted-foreground">
        <span>{t.reports.seriesIncome}</span>
        <Money amount={row.income} className="text-foreground" />
      </div>
      <div className="flex justify-between gap-4 text-muted-foreground">
        <span>{t.reports.seriesExpense}</span>
        <Money amount={row.expense} className="text-foreground" />
      </div>
      <div className="flex justify-between gap-4 text-muted-foreground border-t border-border/60 pt-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: negative ? DEFICIT : SAVED }} />
          {negative ? t.reports.seriesDeficit : t.reports.seriesSaved}
        </span>
        <Money amount={row.savings} className="text-foreground font-semibold" />
      </div>
      {row.savingsRate !== null && (
        <div className="flex justify-between gap-4 text-muted-foreground">
          <span>{t.reports.tooltipRate}</span>
          <span className="text-foreground">{formatNumber(Math.round(row.savingsRate))}%</span>
        </div>
      )}
    </div>
  );
};

export const SavingsBarChart: React.FC<SavingsBarChartProps> = ({ monthly, currentMonth }) => {
  const { t, language, formatMonthStr } = useLanguage();

  const rows: Row[] = useMemo(
    () =>
      monthly.map((m, i) => {
        const [name, year] = formatMonthStr(m.month).split(' ');
        // Show the year only on January / the first bar so long periods stay readable
        const showYear = i === 0 || m.month.endsWith('-01');
        return {
          ...m,
          savingsTaka: Number(m.savings) / 100,
          tick: showYear && year ? `${name} '${year.slice(-2)}` : name,
          isRunning: m.month === currentMonth,
        };
      }),
    [monthly, currentMonth, formatMonthStr]
  );

  const hasDeficit = rows.some((r) => r.savingsTaka < 0);
  const last = rows[rows.length - 1];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold font-display">{t.reports.savingsChartTitle}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{t.reports.savingsChartSubtitle}</p>
        </div>
        {/* Legend: always present for the two polarities */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SAVED }} />
            {t.reports.seriesSaved}
          </span>
          <span className={`inline-flex items-center gap-1.5 ${hasDeficit ? '' : 'opacity-60'}`}>
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: DEFICIT }} />
            {t.reports.seriesDeficit}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 22, right: 8, left: 4, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.6} />
              <XAxis
                dataKey="tick"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis
                width={language === 'bn' ? 84 : 72}
                tickLine={false}
                axisLine={false}
                tickCount={5}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(v: number) => formatCompactTaka(Math.round(v * 100), language)}
              />
              <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.35} />
              <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} content={<ChartTooltip />} />
              <Bar dataKey="savingsTaka" maxBarSize={40} shape={<DataEndBar />} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.month} fill={r.savingsTaka < 0 ? DEFICIT : SAVED} fillOpacity={r.isRunning ? 0.55 : 1} />
                ))}
                {/* Selective direct label: only the latest month */}
                <LabelList
                  dataKey="savingsTaka"
                  content={(props: any) => {
                    if (props.index !== rows.length - 1 || !last) return null;
                    const value = formatCompactTaka(last.savings, language);
                    const y = last.savingsTaka < 0 ? props.y + props.height + 14 : props.y - 6;
                    return (
                      <text
                        x={props.x + props.width / 2}
                        y={y}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={600}
                        fill="hsl(var(--foreground))"
                      >
                        {value}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {last?.isRunning && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-sm mr-1.5 align-middle opacity-55" style={{ background: SAVED }} />
            {formatMonthStr(last.month)} — {t.reports.runningMonth}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
