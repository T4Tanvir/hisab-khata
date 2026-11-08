import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import {
  useFamilyHousehold,
  useCreateHousehold,
  useInviteMember,
  useJoinHousehold,
  useLeaveHousehold,
} from './hooks';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Shield,
  UserCheck,
  DoorOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const FamilySharingCard: React.FC = () => {
  const { language } = useLanguage();
  const { data: household, isLoading } = useFamilyHousehold();
  const createHhMutation = useCreateHousehold();
  const inviteMutation = useInviteMember();
  const joinHhMutation = useJoinHousehold();
  const leaveHhMutation = useLeaveHousehold();

  // Create or Join tabs
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!familyName.trim()) return;
    try {
      await createHhMutation.mutateAsync({ name: familyName.trim() });
      setFamilyName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'পরিবার তৈরি করা সম্ভব হয়নি');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!inviteCode.trim()) return;
    try {
      await joinHhMutation.mutateAsync({ code: inviteCode.trim() });
      setInviteCode('');
    } catch (err: any) {
      setErrorMsg(err.message || 'আমন্ত্রণ কোড সঠিক নয়');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!inviteEmail.trim()) return;
    try {
      await inviteMutation.mutateAsync({ email: inviteEmail.trim() });
      setInviteEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'আমন্ত্রণ পাঠাতে সমস্যা হয়েছে');
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleLeave = async () => {
    const confirmText =
      language === 'bn'
        ? 'আপনি কি নিশ্চিত যে এই পারিবারিক গ্রুপ থেকে বের হতে চান?'
        : 'Are you sure you want to leave this family group?';
    if (confirm(confirmText)) {
      await leaveHhMutation.mutateAsync();
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="h-24 bg-muted/40 animate-pulse rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  // State 1: User has an active family
  if (household) {
    return (
      <Card className="border-border/70 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                  {household.name}
                  <Badge variant="outline" className="text-[10px] font-semibold py-0 px-2 bg-background">
                    {household.members.length} {language === 'bn' ? 'জন সদস্য' : 'members'}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'bn'
                    ? 'পরিবারের সব সদস্যের সাথে শেয়ারকৃত আর্থিক বাজেট'
                    : 'Shared family budget and financial ledger'}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLeave}
              className="text-xs text-destructive hover:bg-destructive/10 self-start sm:self-auto gap-1.5"
            >
              <DoorOpen className="h-3.5 w-3.5" />
              {language === 'bn' ? 'পরিবার ত্যাগ করুন' : 'Leave Family'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {language === 'bn' ? 'সদস্য তালিকা' : 'Family Members'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {household.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                    </div>
                  </div>

                  <Badge
                    variant={m.role === 'owner' ? 'default' : 'secondary'}
                    className="text-[10px] py-0 px-2 shrink-0 gap-1"
                  >
                    {m.role === 'owner' ? (
                      <>
                        <Shield className="h-3 w-3" />
                        {language === 'bn' ? 'প্রধান' : 'Owner'}
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3 w-3" />
                        {language === 'bn' ? 'সদস্য' : 'Member'}
                      </>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Active Invites & Invite Form */}
          <div className="pt-2 border-t border-border/50 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {language === 'bn' ? 'নতুন সদস্য যোগ করুন' : 'Invite Family Member'}
            </h4>

            {/* Invite Form */}
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder={
                  language === 'bn' ? 'সদস্যের ইমেইল দিন (যেমন: spouse@email.com)' : 'Enter email address...'
                }
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="text-xs h-9"
              />
              <Button type="submit" size="sm" className="gap-1.5 h-9 text-xs font-semibold shrink-0">
                <UserPlus className="h-3.5 w-3.5" />
                {language === 'bn' ? 'কোড তৈরি করুন' : 'Generate Code'}
              </Button>
            </form>

            {/* Pending Invites List */}
            {household.invites && household.invites.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">
                  {language === 'bn' ? 'অপেক্ষারত আমন্ত্রণ কোড:' : 'Pending Invite Codes:'}
                </p>
                <div className="space-y-1.5">
                  {household.invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{inv.invitedEmail}:</span>
                        <code className="font-mono font-bold text-primary tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                          {inv.code}
                        </code>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(inv.code)}
                        className="h-7 text-xs gap-1"
                      >
                        {copiedCode === inv.code ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>কপি</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 2: User doesn't belong to a household yet
  return (
    <Card className="border-border/70 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/20 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
              {language === 'bn' ? 'পারিবারিক শেয়ারিং' : 'Family Budget Sharing'}
              <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 bg-background">
                NEW
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'bn'
                ? 'পরিবারের সদস্যদের সাথে একসাথে যৌথ বাজেট ও খরচ পরিচালনা করুন'
                : 'Manage shared household budgets and expenses together'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-xl border">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === 'create'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {language === 'bn' ? 'নতুন পরিবার তৈরি করুন' : 'Create New Family'}
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === 'join'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {language === 'bn' ? 'আমন্ত্রণ কোড দিয়ে যোগ দিন' : 'Join with Code'}
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {language === 'bn' ? 'পরিবারের নাম' : 'Family / Household Name'}
              </label>
              <Input
                placeholder={language === 'bn' ? 'যেমন: আমাদের পরিবার, রহমান পরিবার...' : 'e.g. Our Family'}
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="text-xs h-10"
              />
            </div>
            <Button
              type="submit"
              disabled={createHhMutation.isPending}
              className="w-full gap-2 text-xs font-semibold h-10 shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              {language === 'bn' ? 'পরিবার তৈরি করুন' : 'Create Household'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {language === 'bn' ? '৬-অক্ষরের আমন্ত্রণ কোড' : '6-character Invite Code'}
              </label>
              <Input
                placeholder="যেমন: AB12CD"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-xs h-10 font-mono tracking-widest uppercase"
              />
            </div>
            <Button
              type="submit"
              disabled={joinHhMutation.isPending}
              className="w-full gap-2 text-xs font-semibold h-10 shadow-sm"
            >
              <UserCheck className="h-4 w-4" />
              {language === 'bn' ? 'পরিবারে যুক্ত হন' : 'Join Household'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
