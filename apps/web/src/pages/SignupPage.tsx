import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { signupSchema, type SignupInput } from '@hisab/shared';
import { signUp } from '@/features/auth/auth-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { localizeFieldError } from '@/lib/form-errors';
import { localizeAuthError } from '@/lib/auth-errors';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setServerError(null);
    try {
      const { error } = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (error) {
        setServerError(localizeAuthError(error, t, t.auth.signupError));
        return;
      }

      // আগের সেশনের কোনো ক্যাশড ডেটা যেন না থাকে
      queryClient.clear();
      navigate('/');
    } catch (err: any) {
      setServerError(t.auth.signupError);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold font-display text-foreground">
          {t.auth.signupTitle}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t.auth.signupSubtitle}
        </p>
      </div>

      {serverError && (
        <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t.auth.nameLabel}
          type="text"
          placeholder={t.auth.namePlaceholder}
          error={localizeFieldError(errors.name, t.auth.nameMin, language)}
          {...register('name')}
        />

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
          placeholder={t.auth.passwordPlaceholder}
          error={localizeFieldError(errors.password, t.auth.passwordMin, language)}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="default"
          isLoading={isSubmitting}
          className="w-full h-11 text-base font-semibold mt-2"
        >
          {t.auth.signupButton}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground pt-2">
        {t.auth.haveAccount}{' '}
        <Link
          to="/login"
          className="text-primary font-semibold hover:underline underline-offset-4"
        >
          {t.auth.loginLink}
        </Link>
      </div>
    </div>
  );
};
