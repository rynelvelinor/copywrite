import { NextResponse } from "next/server";
import { signRequest } from "@worldcoin/idkit/signing";
import {
  WORLD_ACTION,
  getWorldAppId,
  getWorldRpId,
} from "@/lib/worldid/config";

export async function POST() {
  const appId = getWorldAppId();
  const rpId = getWorldRpId();
  const signingKey = process.env.WORLD_RP_SIGNING_KEY;

  if (!appId) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_WORLD_APP_ID is not configured" },
      { status: 503 },
    );
  }

  if (!rpId || !signingKey) {
    return NextResponse.json(
      {
        error:
          "World RP credentials missing. Set NEXT_PUBLIC_WORLD_RP_ID and WORLD_RP_SIGNING_KEY from the Developer Portal.",
        appId,
        action: WORLD_ACTION,
      },
      { status: 503 },
    );
  }

  try {
    const rpSig = signRequest({
      signingKeyHex: signingKey,
      action: WORLD_ACTION,
    });

    return NextResponse.json({
      appId,
      action: WORLD_ACTION,
      rp_context: {
        rp_id: rpId,
        nonce: rpSig.nonce,
        created_at: rpSig.createdAt,
        expires_at: rpSig.expiresAt,
        signature: rpSig.sig,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign World ID request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
