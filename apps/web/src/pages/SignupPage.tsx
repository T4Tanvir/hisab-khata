import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { signupSchema, type SignupInput } from '@hisab/shared';
import { signUp } from '@/features/auth/auth-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
    <div>
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', color: 'var(--ink)' }}>
        নতুন অ্যাকাউন্ট খুলুন
      </h2>

      {serverError && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--neg)',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <Input
            label="আপনার পুরো নাম"
            type="text"
            placeholder="তানভীর আহমেদ"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Input
            label="ইমেইল"
            type="email"
            placeholder="apnar@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <Input
            label="পাসওয়ার্ড"
            type="password"
            placeholder="কমপক্ষে ৬ অক্ষর"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          অ্যাকাউন্ট খুলুন
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
        আগে থেকেই অ্যাকাউন্ট আছে?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          লগইন করুন
        </Link>
      </div>
    </div>
  );
};

