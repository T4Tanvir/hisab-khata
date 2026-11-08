import React from 'react';
import type { TrendItem } from './api';
import { toBengaliDigits } from '@hisab/shared';
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
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold font-display">
            আয় বনাম খরচ ও সঞ্চয়ের ট্রেন্ড
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            গত ৬ মাসের আর্থিক ওঠানামার গ্রাফ
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="h-72 flex items-center justify-center text-xs text-muted-foreground">
            গ্রাফ লোড হচ্ছে...
          </div>
        ) : data.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-xs text-muted-foreground">
            পর্যাপ্ত ডেটা নেই
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  tickFormatter={(val) => `৳${toBengaliDigits(val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}`}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  opacity={0.5}
                  width={60}
                />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `৳ ${toBengaliDigits(Number(val).toLocaleString())}`,
                    name === 'income' ? 'আয়' : name === 'expense' ? 'খরচ' : 'সঞ্চয়',
                  ]}
                  labelFormatter={(label) => `মাস: ${label}`}
                />
                <Legend
                  formatter={(value) => (value === 'income' ? 'মোট আয়' : value === 'expense' ? 'মোট খরচ' : value)}
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
