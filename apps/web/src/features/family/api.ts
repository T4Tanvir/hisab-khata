import { api } from '@/lib/api-client';
import type {
  Household,
  HouseholdInvite,
  CreateHouseholdInput,
  InviteFamilyMemberInput,
  JoinHouseholdInput,
} from '@hisab/shared';

export async function getFamilyHousehold(): Promise<Household | null> {
  const res = await api.get<{ data: Household | null }>('/family');
  return res.data;
}

export async function createFamilyHousehold(input: CreateHouseholdInput): Promise<Household> {
  const res = await api.post<{ data: Household }>('/family', input);
  return res.data;
}

export async function inviteFamilyMember(input: InviteFamilyMemberInput): Promise<HouseholdInvite> {
  const res = await api.post<{ data: HouseholdInvite }>('/family/invite', input);
  return res.data;
}

export async function joinFamilyHousehold(input: JoinHouseholdInput): Promise<Household> {
  const res = await api.post<{ data: Household }>('/family/join', input);
  return res.data;
}

export async function leaveFamilyHousehold(): Promise<{ success: boolean }> {
  const res = await api.delete<{ data: { success: boolean } }>('/family/leave');
  return res.data;
}
