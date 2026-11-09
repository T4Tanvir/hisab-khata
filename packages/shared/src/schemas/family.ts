import { z } from 'zod';

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(2, 'পরিবারের নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(50),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

export const inviteFamilyMemberSchema = z.object({
  email: z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
});

export type InviteFamilyMemberInput = z.infer<typeof inviteFamilyMemberSchema>;

export const joinHouseholdSchema = z.object({
  code: z.string().trim().min(6, 'আমন্ত্রণ কোড কমপক্ষে ৬ অক্ষরের হতে হবে').max(16),
});

export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;
