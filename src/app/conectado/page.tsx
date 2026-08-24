import { ConnectedView } from "@/components/ConnectedView";
import { expireOverdueSessions, getActiveSessionById } from "@/lib/access";
import { getGuestSessionId } from "@/lib/device";
import { formatHours } from "@/lib/money";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConnectedPage() {
  await expireOverdueSessions();
  const cookieId = await getGuestSessionId();
  const session = cookieId ? await getActiveSessionById(cookieId) : null;

  if (!session) {
    redirect("/");
  }

  return (
    <ConnectedView
      sessionId={session.id}
      hoursLabel={formatHours(session.hours)}
      endsAt={session.endsAt.toISOString()}
    />
  );
}
