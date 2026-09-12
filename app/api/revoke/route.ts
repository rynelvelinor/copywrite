import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readVerificationCookie } from "@/lib/worldid/gate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      address?: string;
      contentHash?: string;
      subname?: string;
    };
    const address = body.address?.toLowerCase();
    if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Valid address required" }, { status: 400 });
    }

    const gate = readVerificationCookie(request.headers.get("cookie"), address);
    if (!gate) {
      return NextResponse.json(
        { error: "World ID verification required to revoke" },
        { status: 403 },
      );
    }

    const claim = body.subname
      ? await prisma.contentIndex.findUnique({ where: { subname: body.subname } })
      : body.contentHash
        ? await prisma.contentIndex.findFirst({
            where: { contentHash: body.contentHash.toLowerCase(), revoked: false },
          })
        : null;

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    if (claim.ownerAddress.toLowerCase() !== address) {
      return NextResponse.json({ error: "Only the claim owner can revoke" }, { status: 403 });
    }

    const updated = await prisma.contentIndex.update({
      where: { id: claim.id },
      data: { revoked: true },
    });

    return NextResponse.json({
      success: true,
      claim: {
        ...updated,
        timestamp: updated.timestamp.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Revoke failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
