import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findNearestClaim } from "@/lib/detection/match";
import { readVerificationCookie } from "@/lib/worldid/gate";

export const runtime = "nodejs";

type RegisterBody = {
  address: string;
  creatorLabel: string;
  contentHash: string;
  originUrl: string;
  license: string;
  txHash?: string;
};

function sanitizeLabel(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const address = body.address?.toLowerCase();
    const creatorLabel = sanitizeLabel(body.creatorLabel || "");
    const contentHash = body.contentHash?.toLowerCase();
    const originUrl = body.originUrl?.trim() || "";
    const license = body.license?.trim() || "All rights reserved";

    if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Valid address required" }, { status: 400 });
    }
    if (!creatorLabel) {
      return NextResponse.json({ error: "creatorLabel required" }, { status: 400 });
    }
    if (!contentHash || contentHash.length < 8) {
      return NextResponse.json({ error: "contentHash required" }, { status: 400 });
    }

    const gate = readVerificationCookie(request.headers.get("cookie"), address);
    if (!gate) {
      return NextResponse.json(
        { error: "World ID Selfie Check required before registration" },
        { status: 403 },
      );
    }

    const duplicate = await findNearestClaim(contentHash);
    if (duplicate.match) {
      return NextResponse.json(
        {
          error: "Duplicate or near-duplicate content already claimed",
          match: duplicate,
        },
        { status: 409 },
      );
    }

    const short = contentHash.slice(0, 16);
    const subname = `post-${short}.${creatorLabel}.contentproof.eth`;

    const row = await prisma.contentIndex.upsert({
      where: { subname },
      create: {
        subname,
        contentHash,
        ownerAddress: address,
        timestamp: new Date(),
        originUrl,
        license,
        revoked: false,
      },
      update: {
        contentHash,
        ownerAddress: address,
        timestamp: new Date(),
        originUrl,
        license,
        revoked: false,
      },
    });

    return NextResponse.json({
      success: true,
      claim: {
        ...row,
        timestamp: row.timestamp.toISOString(),
        ensName: `${creatorLabel}.contentproof.eth`,
        txHash: body.txHash ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Register failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
