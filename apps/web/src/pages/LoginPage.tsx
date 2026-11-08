import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@hisab/shared';
import { signIn } from '@/features/auth/auth-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

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
        setServerError(error.message || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়');
        return;
      }

      navigate('/');
    } catch (err: any) {
      setServerError(err?.message || 'লগইন করতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold font-display text-foreground">
          লগইন করুন
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          আপনার অ্যাকাউন্টে প্রবেশ করুন
        </p>
      </div>

      {serverError && (
        <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="ইমেইল"
          type="email"
          placeholder="apnar@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="পাসওয়ার্ড"
          type="password"
          placeholder="••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="default"
          isLoading={isSubmitting}
          className="w-full h-11 text-base font-semibold mt-2"
        >
          লগইন করুন
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground pt-2">
        অ্যাকাউন্ট নেই?{' '}
        <Link
          to="/signup"
          className="text-primary font-semibold hover:underline underline-offset-4"
        >
          নতুন অ্যাকাউন্ট খুলুন
        </Link>
      </div>
    </div>
  );
};
