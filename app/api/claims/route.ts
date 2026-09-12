import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.toLowerCase();
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const claims = await prisma.contentIndex.findMany({
    where: { ownerAddress: address },
    orderBy: { timestamp: "desc" },
  });

  return NextResponse.json({
    claims: claims.map((c) => ({
      ...c,
      timestamp: c.timestamp.toISOString(),
      ensName: `${c.subname.split(".")[1] ?? "creator"}.contentproof.eth`,
    })),
  });
}
