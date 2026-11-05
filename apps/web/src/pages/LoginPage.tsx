import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@hisab/shared';
import { signIn } from '@/features/auth/auth-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
    <div>
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', color: 'var(--ink)' }}>
        লগইন করুন
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
            placeholder="••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          লগইন করুন
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
        অ্যাকাউন্ট নেই?{' '}
        <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          নতুন অ্যাকাউন্ট খুলুন
        </Link>
      </div>
    </div>
  );
};

