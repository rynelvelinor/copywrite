import { NextResponse } from "next/server";
import {
  perceptualHashFromBuffer,
  perceptualHashFromUrl,
} from "@/lib/hashing/perceptual";
import { findNearestClaim } from "@/lib/detection/match";

export const runtime = "nodejs";

async function resolveHash(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    const url = form.get("url");
    const contentHash = form.get("contentHash");

    if (typeof contentHash === "string" && contentHash.length > 0) {
      return contentHash.toLowerCase();
    }
    if (file instanceof File) {
      return perceptualHashFromBuffer(Buffer.from(await file.arrayBuffer()));
    }
    if (typeof url === "string" && url.length > 0) {
      return perceptualHashFromUrl(url);
    }
    throw new Error("Provide file, url, or contentHash");
  }

  const body = (await request.json()) as {
    url?: string;
    imageBase64?: string;
    contentHash?: string;
  };
  if (body.contentHash) return body.contentHash.toLowerCase();
  if (body.url) return perceptualHashFromUrl(body.url);
  if (body.imageBase64) {
    const raw = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    return perceptualHashFromBuffer(Buffer.from(raw, "base64"));
  }
  throw new Error("Provide url, imageBase64, or contentHash");
}

export async function POST(request: Request) {
  try {
    const contentHash = await resolveHash(request);
    const result = await findNearestClaim(contentHash, { includeRevoked: true });

    if (!result.match) {
      return NextResponse.json({
        contentHash,
        match: false,
      });
    }

    const { claim, distance } = result;
    return NextResponse.json({
      contentHash,
      match: true,
      distance,
      active: !claim.revoked,
      claim: {
        subname: claim.subname,
        contentHash: claim.contentHash,
        ownerAddress: claim.ownerAddress,
        ensName: claim.subname.replace(/^post-[^.]+\./, ""),
        timestamp: claim.timestamp.toISOString(),
        originUrl: claim.originUrl,
        license: claim.license,
        revoked: claim.revoked,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check failed";
    const status = message.includes("DATABASE_URL") || message.includes("Can't reach")
      ? 503
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
