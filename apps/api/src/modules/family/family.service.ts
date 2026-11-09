import { randomInt } from 'node:crypto';
import { and, asc, eq, gte, ne } from 'drizzle-orm';
import { db } from '../../db/client';
import { households, householdMembers, householdInvites, user } from '../../db/schema';
import { AppError } from '../../lib/errors';
import type { Household, HouseholdMember, HouseholdInvite } from '@hisab/shared';

/** Unambiguous characters (no 0/O, 1/I/L) so codes are easy to read aloud and type. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

function toInvite(i: typeof householdInvites.$inferSelect): HouseholdInvite {
  return {
    id: i.id,
    householdId: i.householdId,
    invitedEmail: i.invitedEmail,
    code: i.code,
    status: i.status as HouseholdInvite['status'],
    createdAt: i.createdAt.toISOString(),
  };
}

export class FamilyService {
  /**
   * Fetches the household the user belongs to, along with all fellow members.
   */
  async getUserHousehold(userId: string): Promise<Household | null> {
    const [membership] = await db
      .select({ householdId: householdMembers.householdId, role: householdMembers.role })
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1);

    if (!membership) return null;

    const [hh] = await db
      .select()
      .from(households)
      .where(eq(households.id, membership.householdId))
      .limit(1);

    if (!hh) return null;

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
      .where(eq(householdMembers.householdId, hh.id))
      .orderBy(asc(householdMembers.joinedAt));

    const members: HouseholdMember[] = membersData.map((m) => ({
      ...m,
      role: m.role as 'owner' | 'member',
      joinedAt: m.joinedAt.toISOString(),
    }));

    // Only the owner sees pending (non-expired) invite codes
    let invites: HouseholdInvite[] = [];
    if (membership.role === 'owner') {
      const invitesData = await db
        .select()
        .from(householdInvites)
        .where(
          and(
            eq(householdInvites.householdId, hh.id),
            eq(householdInvites.status, 'pending'),
            gte(householdInvites.createdAt, new Date(Date.now() - INVITE_TTL_MS))
          )
        );
      invites = invitesData.map(toInvite);
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
   * Creates a new family household and marks the creator as owner (atomically).
   */
  async createHousehold(userId: string, name: string): Promise<Household> {
    if (await this.getUserHousehold(userId)) {
      throw new AppError('আপনি ইতিমধ্যে একটি পরিবারের সদস্য', 409, 'ALREADY_MEMBER');
    }

    await db.transaction(async (tx) => {
      const [newHh] = await tx
        .insert(households)
        .values({ name: name.trim(), createdBy: userId })
        .returning({ id: households.id });

      // The unique index on household_members.user_id rejects a concurrent second household
      await tx.insert(householdMembers).values({ householdId: newHh.id, userId, role: 'owner' });
    }).catch((err) => {
      if (isUniqueViolation(err)) throw new AppError('আপনি ইতিমধ্যে একটি পরিবারের সদস্য', 409, 'ALREADY_MEMBER');
      throw err;
    });

    return (await this.getUserHousehold(userId))!;
  }

  /**
   * Owner invites a member by email. The code works only for that email and expires in 7 days.
   */
  async inviteMember(userId: string, rawEmail: string): Promise<HouseholdInvite> {
    const [membership] = await db
      .select({ householdId: householdMembers.householdId, role: householdMembers.role })
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1);

    if (!membership) throw new AppError('প্রথমে একটি পরিবার তৈরি করুন');
    if (membership.role !== 'owner') {
      throw new AppError('শুধু পরিবারের প্রধান (owner) সদস্য আমন্ত্রণ পাঠাতে পারেন', 403, 'NOT_OWNER');
    }

    const invitedEmail = rawEmail.toLowerCase().trim();

    // Already a member of this household?
    const [alreadyMember] = await db
      .select({ id: householdMembers.id })
      .from(householdMembers)
      .innerJoin(user, eq(householdMembers.userId, user.id))
      .where(and(eq(householdMembers.householdId, membership.householdId), eq(user.email, invitedEmail)))
      .limit(1);
    if (alreadyMember) throw new AppError('এই ইমেইলের ব্যক্তি ইতিমধ্যে পরিবারের সদস্য');

    // Replace any older pending invite for the same email
    await db
      .update(householdInvites)
      .set({ status: 'cancelled' })
      .where(
        and(
          eq(householdInvites.householdId, membership.householdId),
          eq(householdInvites.invitedEmail, invitedEmail),
          eq(householdInvites.status, 'pending')
        )
      );

    // Codes are random (crypto); retry on the rare collision with another pending code
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateInviteCode();
      const [clash] = await db
        .select({ id: householdInvites.id })
        .from(householdInvites)
        .where(and(eq(householdInvites.code, code), eq(householdInvites.status, 'pending')))
        .limit(1);
      if (clash) continue;

      const [invite] = await db
        .insert(householdInvites)
        .values({ householdId: membership.householdId, invitedEmail, code, status: 'pending' })
        .returning();
      return toInvite(invite);
    }

    throw new Error('Could not generate a unique invite code');
  }

  /**
   * Joins a household with an invite code. The code must be pending, not expired,
   * and addressed to the joining user's email. Claiming the invite and adding the
   * membership happen in one transaction, so a code can be used exactly once.
   */
  async joinHousehold(userId: string, userEmail: string, rawCode: string): Promise<Household> {
    if (await this.getUserHousehold(userId)) {
      throw new AppError('আপনি ইতিমধ্যে একটি পরিবারের সদস্য', 409, 'ALREADY_MEMBER');
    }

    const code = rawCode.trim().toUpperCase();
    const invalid = () => new AppError('আমন্ত্রণ কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে', 400, 'INVALID_INVITE');

    await db
      .transaction(async (tx) => {
        const [invite] = await tx
          .update(householdInvites)
          .set({ status: 'accepted' })
          .where(
            and(
              eq(householdInvites.code, code),
              eq(householdInvites.status, 'pending'),
              eq(householdInvites.invitedEmail, userEmail.toLowerCase().trim()),
              gte(householdInvites.createdAt, new Date(Date.now() - INVITE_TTL_MS))
            )
          )
          .returning();

        if (!invite) throw invalid();

        await tx.insert(householdMembers).values({
          householdId: invite.householdId,
          userId,
          role: 'member',
        });
      })
      .catch((err) => {
        if (isUniqueViolation(err)) throw new AppError('আপনি ইতিমধ্যে একটি পরিবারের সদস্য', 409, 'ALREADY_MEMBER');
        throw err;
      });

    return (await this.getUserHousehold(userId))!;
  }

  /**
   * Leaves the current household. If the owner leaves, the longest-standing member
   * becomes the owner; if nobody is left, the household (and its invites) is deleted.
   */
  async leaveHousehold(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [membership] = await tx
        .delete(householdMembers)
        .where(eq(householdMembers.userId, userId))
        .returning({ householdId: householdMembers.householdId, role: householdMembers.role });

      if (!membership) return;

      const [successor] = await tx
        .select({ id: householdMembers.id, userId: householdMembers.userId })
        .from(householdMembers)
        .where(and(eq(householdMembers.householdId, membership.householdId), ne(householdMembers.userId, userId)))
        .orderBy(asc(householdMembers.joinedAt))
        .limit(1);

      if (!successor) {
        await tx.delete(households).where(eq(households.id, membership.householdId));
        return;
      }

      if (membership.role === 'owner') {
        await tx.update(householdMembers).set({ role: 'owner' }).where(eq(householdMembers.id, successor.id));
        await tx
          .update(households)
          .set({ createdBy: successor.userId, updatedAt: new Date() })
          .where(eq(households.id, membership.householdId));
      }
    });
  }
}

function isUniqueViolation(err: unknown): boolean {
  // postgres.js puts the SQLSTATE on the error; newer drizzle versions wrap it in `cause`
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === '23505' || e?.cause?.code === '23505';
}

export const familyService = new FamilyService();
