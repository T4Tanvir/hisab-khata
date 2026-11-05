import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(100),
  email: z.string().email('সঠিক ইমেইল এড্রেস লিখুন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
});

export const loginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল এড্রেস লিখুন'),
  password: z.string().min(1, 'পাসওয়ার্ড লিখুন'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

