import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { useFinancialInsights } from './hooks';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Flame,
  Award,
  Bell,
  CheckCircle2,
  PieChart as PieIcon,
  ChevronRight,
} from 'lucide-react';
import { localizeDefaultNamesInText } from '@/lib/default-names';
import { toBengaliDigits } from '@hisab/shared';
import { Link } from 'react-router-dom';

interface InsightsCardProps {
  month: string;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({ month }) => {
  const { language, t } = useLanguage();
  const { data: insights, isLoading } = useFinancialInsights(month);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'alert':
        return 'border-destructive/30 bg-destructive/5 text-destructive';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400';
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400';
      default:
        return 'border-primary/20 bg-primary/5 text-primary';
    }
  };

  const getInsightIcon = (type: string, severity: string) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="h-4 w-4 shrink-0 text-destructive" />;
      case 'burn_rate':
        return <Flame className="h-4 w-4 shrink-0 text-amber-500" />;
      case 'savings_milestone':
        return <Award className="h-4 w-4 shrink-0 text-emerald-500" />;
      case 'bill_reminder':
        return <Bell className="h-4 w-4 shrink-0 text-blue-500" />;
      case 'top_expense':
        return <PieIcon className="h-4 w-4 shrink-0 text-violet-500" />;
      default:
        return severity === 'alert' ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        ) : (
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        );
    }
  };

  const getBadgeText = (type: string) => {
    switch (type) {
      case 'spike':
        return t.insights.spikeBadge;
      case 'burn_rate':
        return t.insights.burnBadge;
      case 'savings_milestone':
        return t.insights.savingsBadge;
      case 'bill_reminder':
        return t.insights.billBadge;
      case 'top_expense':
        return t.insights.topBadge;
      default:
        return 'Insight';
    }
  };

  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
                {t.insights.title}
                <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 uppercase bg-background">
                  AI
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{t.insights.subtitle}</p>
            </div>
          </div>
          <Link
            to="/reports"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
          >
            {t.dashboard.seeAll}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-2.5">
        {isLoading ? (
          <div className="space-y-2 py-2">
            <div className="h-12 bg-muted/60 animate-pulse rounded-lg" />
            <div className="h-12 bg-muted/40 animate-pulse rounded-lg" />
          </div>
        ) : !insights || insights.length === 0 ? (
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">{t.insights.empty}</p>
          </div>
        ) : (
          insights.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 transition-colors ${getSeverityStyle(
                item.severity
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getInsightIcon(item.type, item.severity)}</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">
                      {language === 'bn' ? item.titleBn : localizeDefaultNamesInText(item.titleEn)}
                    </span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                      {getBadgeText(item.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {language === 'bn' ? item.descriptionBn : localizeDefaultNamesInText(item.descriptionEn)}
                  </p>
                </div>
              </div>

              {item.metric && (
                <div className="self-end sm:self-center shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-background/80 shadow-xs border text-foreground">
                    {language === 'en' ? item.metricEn ?? item.metric : toBengaliDigits(item.metric)}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
