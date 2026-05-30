/**
 * Notification service — the single emit point for in-app notifications. Writes
 * per-user Notification rows (shown in the bell panel) and optionally mirrors
 * them to email. Domains call the emit helpers; they never insert rows
 * directly.
 */
import { prisma, type PrismaTx } from "@workshop/db";
import type { NotificationType } from "@workshop/core";
import { sendEmail } from "./email.js";

interface EmitArgs {
  userIds: string[];
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  email?: boolean;
  tx?: PrismaTx;
}

export async function emitNotification(args: EmitArgs): Promise<void> {
  const db = args.tx ?? prisma;
  if (args.userIds.length === 0) return;

  await db.notification.createMany({
    data: args.userIds.map((userId) => ({
      userId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link,
    })),
  });

  if (args.email) {
    const users = await db.user.findMany({
      where: { id: { in: args.userIds }, email: { not: undefined } },
      select: { email: true },
    });
    await Promise.all(
      users
        .filter((u) => u.email)
        .map((u) => sendEmail({ to: u.email!, subject: args.title, text: args.body ?? args.title })),
    );
  }
}

/** Recipients for system/inventory alerts: all active admins + managers. */
export async function getAlertRecipientIds(tx?: PrismaTx): Promise<string[]> {
  const db = tx ?? prisma;
  const users = await db.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] }, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
