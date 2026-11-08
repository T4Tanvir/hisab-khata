import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { signupSchema, type SignupInput } from '@hisab/shared';
import { signUp } from '@/features/auth/auth-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

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
        setServerError(error.message || 'সাইনআপ করতে সমস্যা হয়েছে');
        return;
      }

      navigate('/');
    } catch (err: any) {
      setServerError(err?.message || 'সাইনআপ করতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold font-display text-foreground">
          নতুন অ্যাকাউন্ট খুলুন
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          আপনার তথ্য দিয়ে খাতা চালু করুন
        </p>
      </div>

      {serverError && (
        <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="আপনার পুরো নাম"
          type="text"
          placeholder="যেমন: তানভীর আহমেদ"
          error={errors.name?.message}
          {...register('name')}
        />

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
          placeholder="কমপক্ষে ৬ অক্ষর"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="default"
          isLoading={isSubmitting}
          className="w-full h-11 text-base font-semibold mt-2"
        >
          অ্যাকাউন্ট খুলুন
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground pt-2">
        আগে থেকেই অ্যাকাউন্ট আছে?{' '}
        <Link
          to="/login"
          className="text-primary font-semibold hover:underline underline-offset-4"
        >
          লগইন করুন
        </Link>
      </div>
    </div>
  );
};
