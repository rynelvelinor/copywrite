import { NextResponse } from "next/server";
import { createVerificationCookie } from "@/lib/worldid/gate";
import { getWorldAppId, getWorldRpId } from "@/lib/worldid/config";

type VerifyBody = {
  address?: string;
  idkitResponse?: unknown;
  legacyProof?: Record<string, unknown>;
};

function getVerifyBaseUrl(): string {
  // Staging proofs (Simulator) must hit the staging Developer Portal.
  // Production World App proofs must hit production.
  const env = process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT;
  if (env === "staging") {
    return "https://staging-developer.worldcoin.org";
  }
  return "https://developer.world.org";
}

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

function proofEnvironment(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const env = (payload as { environment?: unknown }).environment;
  return typeof env === "string" ? env : null;
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
  const configuredEnv = process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT || "production";
  const proofEnv = proofEnvironment(body.idkitResponse);

  // Prefer rp_id on v4; fall back to app_id. Legacy v2 only if explicitly provided.
  let verifyUrl: string | null = null;
  let verifyPayload: unknown = null;

  if (body.idkitResponse && rpId) {
    verifyUrl = `${getVerifyBaseUrl()}/api/v4/verify/${rpId}`;
    verifyPayload = body.idkitResponse;
  } else if (body.legacyProof && appId) {
    const base =
      configuredEnv === "staging"
        ? "https://staging-developer.worldcoin.org"
        : "https://developer.worldcoin.org";
    verifyUrl = `${base}/api/v2/verify/${appId}`;
    verifyPayload = body.legacyProof;
  } else if (body.idkitResponse && appId) {
    verifyUrl = `${getVerifyBaseUrl()}/api/v4/verify/${appId}`;
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

  // Common footgun: production World App + staging IDKit env (or the reverse).
  if (proofEnv && proofEnv !== configuredEnv) {
    console.warn("[worldid/verify] environment mismatch", {
      configuredEnv,
      proofEnv,
      verifyUrl,
    });
  }

  console.info("[worldid/verify] forwarding proof", {
    verifyUrl,
    configuredEnv,
    proofEnv,
    action:
      body.idkitResponse &&
      typeof body.idkitResponse === "object" &&
      "action" in body.idkitResponse
        ? (body.idkitResponse as { action?: string }).action
        : undefined,
  });

  const worldRes = await fetch(verifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(verifyPayload),
  });

  const worldJson = (await worldRes.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!worldRes.ok || worldJson.success === false) {
    console.error("[worldid/verify] World API rejected proof", {
      status: worldRes.status,
      body: worldJson,
    });

    const detail =
      typeof worldJson.detail === "string"
        ? worldJson.detail
        : typeof worldJson.code === "string"
          ? worldJson.code
          : "World ID verification failed";

    return NextResponse.json(
      {
        error: detail,
        code: worldJson.code ?? null,
        details: worldJson,
        hint:
          configuredEnv === "staging"
            ? "You are in staging mode. Use the World ID Simulator (simulator.worldcoin.org), not the production World App. Or set NEXT_PUBLIC_WORLD_ENVIRONMENT=production and create a production action in the Developer Portal."
            : "You are in production mode. Use the real World App, ensure action `register-creator` exists in production, and that Selfie Check is enabled for your app.",
      },
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
