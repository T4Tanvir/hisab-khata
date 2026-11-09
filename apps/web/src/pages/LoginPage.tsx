import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { loginSchema, type LoginInput } from '@hisab/shared';
import { signIn } from '@/features/auth/auth-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { localizeFieldError } from '@/lib/form-errors';
import { localizeAuthError } from '@/lib/auth-errors';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const { error } = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setServerError(localizeAuthError(error, t, t.auth.loginError));
        return;
      }

      // আগের সেশনের কোনো ক্যাশড ডেটা যেন না থাকে
      queryClient.clear();
      navigate('/');
    } catch (err: any) {
      setServerError(t.auth.loginError);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold font-display text-foreground">
          {t.auth.loginTitle}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t.auth.loginSubtitle}
        </p>
      </div>

      {serverError && (
        <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t.auth.emailLabel}
          type="email"
          placeholder="apnar@email.com"
          error={localizeFieldError(errors.email, t.auth.emailInvalid, language)}
          {...register('email')}
        />

        <Input
          label={t.auth.passwordLabel}
          type="password"
          placeholder="••••••"
          error={localizeFieldError(errors.password, t.auth.passwordRequired, language)}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="default"
          isLoading={isSubmitting}
          className="w-full h-11 text-base font-semibold mt-2"
        >
          {t.auth.loginButton}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground pt-2">
        {t.auth.noAccount}{' '}
        <Link
          to="/signup"
          className="text-primary font-semibold hover:underline underline-offset-4"
        >
          {t.auth.openAccount}
        </Link>
      </div>
    </div>
  );
};
