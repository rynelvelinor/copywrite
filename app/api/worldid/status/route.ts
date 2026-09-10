import { NextResponse } from "next/server";
import { readVerificationCookie } from "@/lib/worldid/gate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") ?? undefined;
  const cookieHeader = request.headers.get("cookie");
  const gate = readVerificationCookie(cookieHeader, address);

  return NextResponse.json({
    verified: Boolean(gate),
    address: gate?.address ?? null,
    nullifier: gate?.nullifier ?? null,
  });
}
