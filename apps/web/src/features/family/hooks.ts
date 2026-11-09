import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFamilyHousehold,
  createFamilyHousehold,
  inviteFamilyMember,
  joinFamilyHousehold,
  leaveFamilyHousehold,
} from './api';
import type {
  CreateHouseholdInput,
  InviteFamilyMemberInput,
  JoinHouseholdInput,
} from '@hisab/shared';

export const FAMILY_QUERY_KEY = ['family', 'household'] as const;

export function useFamilyHousehold() {
  return useQuery({
    queryKey: FAMILY_QUERY_KEY,
    queryFn: getFamilyHousehold,
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHouseholdInput) => createFamilyHousehold(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAMILY_QUERY_KEY });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteFamilyMemberInput) => inviteFamilyMember(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAMILY_QUERY_KEY });
    },
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: JoinHouseholdInput) => joinFamilyHousehold(input),
    onSuccess: () => {
      // Household membership changes which shared data is visible — refetch everything
      queryClient.invalidateQueries();
    },
  });
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveFamilyHousehold(),
    onSuccess: () => {
      // Household membership changes which shared data is visible — refetch everything
      queryClient.invalidateQueries();
    },
  });
}
