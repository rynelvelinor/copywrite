import { NextResponse } from "next/server";
import { createVerificationCookie } from "@/lib/worldid/gate";
import { getWorldAppId, getWorldRpId } from "@/lib/worldid/config";

type VerifyBody = {
  address?: string;
  idkitResponse?: unknown;
  /** Legacy / sandbox proofs that still target app_id verify */
  legacyProof?: Record<string, unknown>;
};

function extractNullifier(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  if (typeof record.nullifier_hash === "string") return record.nullifier_hash;
  if (typeof record.nullifier === "string") return record.nullifier;

  const responses = record.responses;
  if (Array.isArray(responses)) {
    for (const item of responses) {
      if (item && typeof item === "object") {
        const r = item as Record<string, unknown>;
        if (typeof r.nullifier === "string") return r.nullifier;
        if (typeof r.nullifier_hash === "string") return r.nullifier_hash;
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const address = body.address?.toLowerCase();
  if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: "Valid wallet address is required" },
      { status: 400 },
    );
  }

  const rpId = getWorldRpId();
  const appId = getWorldAppId();

  let verifyUrl: string | null = null;
  let verifyPayload: unknown = null;

  if (body.idkitResponse && rpId) {
    verifyUrl = `https://developer.world.org/api/v4/verify/${rpId}`;
    verifyPayload = body.idkitResponse;
  } else if (body.legacyProof && appId) {
    verifyUrl = `https://developer.worldcoin.org/api/v2/verify/${appId}`;
    verifyPayload = body.legacyProof;
  } else if (body.idkitResponse && appId) {
    // Fallback: some portal setups still accept app_id on the v4 route
    verifyUrl = `https://developer.world.org/api/v4/verify/${appId}`;
    verifyPayload = body.idkitResponse;
  }

  if (!verifyUrl || !verifyPayload) {
    return NextResponse.json(
      {
        error:
          "Missing proof payload or World credentials (app id / rp id). Configure env vars from the Developer Portal.",
      },
      { status: 503 },
    );
  }

  const worldRes = await fetch(verifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(verifyPayload),
  });

  const worldJson = (await worldRes.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!worldRes.ok) {
    return NextResponse.json(
      {
        error: "World ID verification failed",
        details: worldJson,
      },
      { status: 400 },
    );
  }

  const success =
    worldJson.success === true ||
    worldJson.status === "success" ||
    worldRes.status === 200;

  if (!success && worldJson.success === false) {
    return NextResponse.json(
      { error: "World ID verification rejected", details: worldJson },
      { status: 400 },
    );
  }

  const nullifier =
    extractNullifier(body.idkitResponse) ||
    extractNullifier(body.legacyProof) ||
    extractNullifier(worldJson) ||
    `verified:${address}`;

  const cookie = createVerificationCookie(address, nullifier);
  const response = NextResponse.json({
    success: true,
    address,
    nullifier,
  });
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookie.maxAge,
  });
  return response;
}
