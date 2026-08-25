import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionById } from "@/lib/access";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getActiveSessionById(id);
  if (!session) {
    return NextResponse.json({ status: "ENDED" });
  }
  return NextResponse.json({
    status: session.status,
    endsAt: session.endsAt,
  });
}
