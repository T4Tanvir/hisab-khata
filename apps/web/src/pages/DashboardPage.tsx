import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSession } from '@/features/auth/auth-client';
import { formatBengaliMonth, getDhakaMonth } from '@hisab/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { data: session } = useSession();
  const currentMonth = getDhakaMonth();

  const { data: health, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<{ status: string; service: string; time: string }>('/health'),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            স্বাগতম, {session?.user?.name || 'ব্যবহারকারী'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            ড্যাশবোর্ড
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatBengaliMonth(currentMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            {formatBengaliMonth(currentMonth)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* API Health Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Backend API সংযোগ</CardTitle>
            {isLoading ? (
              <Badge variant="secondary">চেক করা হচ্ছে...</Badge>
            ) : error ? (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> সংযোগ বিচ্ছিন্ন
              </Badge>
            ) : (
              <Badge variant="pos" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> API: {health?.status?.toUpperCase()}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hono সার্ভার (/api/health) প্রক্সি স্ট্যাটাস সক্রিয় রয়েছে।
            </p>
          </CardContent>
        </Card>

        {/* Quick Links Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">দ্রুত অ্যাকশন</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Link
              to="/accounts"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4"
            >
              অ্যাকাউন্ট ও ওয়ালেট দেখুন <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Tech Stack Banner */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="text-lg text-primary">
            হিসাবখাতা — Tailwind CSS ও shadcn/ui যুক্ত হয়েছে
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            সম্পূর্ণ UI এখন Tailwind CSS এবং shadcn/ui কম্পোনেন্ট আর্কিটেকচারে রূপান্তরিত। প্রতিটি ইনপুট, বাটন, কার্ড ও মডাল এখন নিখুঁত রেসপনসিভনেস ও ডার্ক/লাইট মোড সমর্থন করে।
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">Tailwind CSS v3</Badge>
            <Badge variant="secondary">shadcn/ui</Badge>
            <Badge variant="secondary">Radix UI</Badge>
            <Badge variant="secondary">React 18 + Vite</Badge>
            <Badge variant="secondary">Hono API</Badge>
            <Badge variant="secondary">Better Auth</Badge>
            <Badge variant="secondary">Drizzle ORM</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
