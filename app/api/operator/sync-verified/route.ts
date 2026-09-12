import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { contentProofClaimsAbi } from "@/lib/contracts/contentProofClaims";
import { readVerificationCookie } from "@/lib/worldid/gate";

export const runtime = "nodejs";

/**
 * After Selfie Check, optionally mark the wallet verified on ContentProofClaims
 * so on-chain registerCreator/registerContent succeed. Requires operator key.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as { address?: string };
  const address = body.address?.toLowerCase();
  if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Valid address required" }, { status: 400 });
  }

  const gate = readVerificationCookie(request.headers.get("cookie"), address);
  if (!gate) {
    return NextResponse.json({ error: "World ID cookie missing" }, { status: 403 });
  }

  const claimsAddress = process.env.NEXT_PUBLIC_CONTENTPROOF_CLAIMS_ADDRESS as
    | `0x${string}`
    | undefined;
  const pk = process.env.CONTENTPROOF_OPERATOR_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  const rpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

  if (!claimsAddress || !pk || !rpc) {
    return NextResponse.json({
      success: true,
      onchain: false,
      note: "Index-only mode (no claims address / operator key / RPC)",
    });
  }

  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as Hex,
  );
  const wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpc),
  });
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpc),
  });

  const hash = await wallet.writeContract({
    address: claimsAddress,
    abi: contentProofClaimsAbi,
    functionName: "setVerifiedHuman",
    args: [address as `0x${string}`, true],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  return NextResponse.json({ success: true, onchain: true, txHash: hash });
}
