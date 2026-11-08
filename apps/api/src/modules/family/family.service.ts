import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  households,
  householdMembers,
  householdInvites,
  user,
} from '../../db/schema';
import type { Household, HouseholdMember, HouseholdInvite } from '@hisab/shared';

export class FamilyService {
  /**
   * Fetches the household the user belongs to, along with all fellow members.
   */
  async getUserHousehold(userId: string): Promise<Household | null> {
    const membership = await db
      .select({
        householdId: householdMembers.householdId,
        role: householdMembers.role,
      })
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1);

    if (membership.length === 0) return null;

    const hhId = membership[0].householdId;

    const [hh] = await db
      .select()
      .from(households)
      .where(eq(households.id, hhId))
      .limit(1);

    if (!hh) return null;

    // Fetch members
    const membersData = await db
      .select({
        id: householdMembers.id,
        userId: householdMembers.userId,
        name: user.name,
        email: user.email,
        role: householdMembers.role,
        joinedAt: householdMembers.joinedAt,
      })
      .from(householdMembers)
      .innerJoin(user, eq(householdMembers.userId, user.id))
      .where(eq(householdMembers.householdId, hhId));

    const members: HouseholdMember[] = membersData.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      role: m.role as 'owner' | 'member',
      joinedAt: m.joinedAt.toISOString(),
    }));

    // Fetch pending invites if user is owner
    let invites: HouseholdInvite[] = [];
    if (membership[0].role === 'owner') {
      const invitesData = await db
        .select()
        .from(householdInvites)
        .where(
          and(
            eq(householdInvites.householdId, hhId),
            eq(householdInvites.status, 'pending')
          )
        );

      invites = invitesData.map((i) => ({
        id: i.id,
        householdId: i.householdId,
        invitedEmail: i.invitedEmail,
        code: i.code,
        status: i.status as 'pending' | 'accepted' | 'cancelled',
        createdAt: i.createdAt.toISOString(),
      }));
    }

    return {
      id: hh.id,
      name: hh.name,
      createdBy: hh.createdBy,
      createdAt: hh.createdAt.toISOString(),
      members,
      invites,
    };
  }

  /**
   * Creates a new family household and marks the creator as owner.
   */
  async createHousehold(userId: string, name: string): Promise<Household> {
    const existing = await this.getUserHousehold(userId);
    if (existing) {
      throw new Error('আপনি ইতিমধ্যে একটি পরিবারের সদস্য');
    }

    const [newHh] = await db
      .insert(households)
      .values({
        name: name.trim(),
        createdBy: userId,
      })
      .returning();

    await db.insert(householdMembers).values({
      householdId: newHh.id,
      userId,
      role: 'owner',
    });

    const full = await this.getUserHousehold(userId);
    return full!;
  }

  /**
   * Generates a 6-digit invite code to invite a spouse/family member.
   */
  async inviteMember(userId: string, invitedEmail: string): Promise<HouseholdInvite> {
    const hh = await this.getUserHousehold(userId);
    if (!hh) {
      throw new Error('প্রথমে একটি পরিবার তৈরি করুন');
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const [invite] = await db
      .insert(householdInvites)
      .values({
        householdId: hh.id,
        invitedEmail: invitedEmail.toLowerCase().trim(),
        code,
        status: 'pending',
      })
      .returning();

    return {
      id: invite.id,
      householdId: invite.householdId,
      invitedEmail: invite.invitedEmail,
      code: invite.code,
      status: invite.status as 'pending' | 'accepted' | 'cancelled',
      createdAt: invite.createdAt.toISOString(),
    };
  }

  /**
   * Joins a family household using an invite code.
   */
  async joinHousehold(userId: string, rawCode: string): Promise<Household> {
    const existing = await this.getUserHousehold(userId);
    if (existing) {
      throw new Error('আপনি ইতিমধ্যে একটি পরিবারের সদস্য');
    }

    const code = rawCode.trim().toUpperCase();
    const [invite] = await db
      .select()
      .from(householdInvites)
      .where(
        and(
          eq(householdInvites.code, code),
          eq(householdInvites.status, 'pending')
        )
      )
      .limit(1);

    if (!invite) {
      throw new Error('আমন্ত্রণ কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে');
    }

    // Add member
    await db.insert(householdMembers).values({
      householdId: invite.householdId,
      userId,
      role: 'member',
    });

    // Mark invite accepted
    await db
      .update(householdInvites)
      .set({ status: 'accepted' })
      .where(eq(householdInvites.id, invite.id));

    const full = await this.getUserHousehold(userId);
    return full!;
  }

  /**
   * Leaves the current household.
   */
  async leaveHousehold(userId: string): Promise<void> {
    await db
      .delete(householdMembers)
      .where(eq(householdMembers.userId, userId));
  }
}

export const familyService = new FamilyService();
