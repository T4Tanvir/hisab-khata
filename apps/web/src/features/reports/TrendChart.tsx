import React, { useMemo } from 'react';
import type { TrendItem } from './api';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface TrendChartProps {
  data: TrendItem[];
  isLoading?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, isLoading }) => {
  const { t, language, formatNumber, formatMonthStr } = useLanguage();
  const numberLocale = language === 'bn' ? 'en-IN' : 'en-US';

  // The server's monthLabel is Bengali; relabel from the YYYY-MM key in the current language
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        monthLabel: /^\d{4}-\d{2}$/.test(item.month) ? formatMonthStr(item.month) : item.monthLabel,
      })),
    [data, formatMonthStr]
  );

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold font-display">
            {t.reports.trendChartTitle}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.reports.trendChartSubtitle}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="h-72 flex items-center justify-center text-xs text-muted-foreground">
            {t.reports.chartLoading}
          </div>
        ) : data.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-xs text-muted-foreground">
            {t.reports.notEnoughData}
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A6E36" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0A6E36" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B32D2D" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#B32D2D" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  opacity={0.5}
                />
                <YAxis
                  tickFormatter={(val) => `৳${formatNumber(val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}`}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  opacity={0.5}
                  width={60}
                />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `৳ ${formatNumber(Number(val).toLocaleString(numberLocale))}`,
                    name === 'income'
                      ? t.reports.seriesIncome
                      : name === 'expense'
                      ? t.reports.seriesExpense
                      : t.reports.seriesSavings,
                  ]}
                  labelFormatter={(label) => `${t.reports.monthPrefix}: ${label}`}
                />
                <Legend
                  formatter={(value) =>
                    value === 'income'
                      ? t.reports.legendIncome
                      : value === 'expense'
                      ? t.reports.legendExpense
                      : value
                  }
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="income"
                  stroke="#0A6E36"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="expense"
                  stroke="#B32D2D"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
