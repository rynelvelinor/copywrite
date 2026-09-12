export const contentProofClaimsAbi = [
  {
    type: "function",
    name: "registerCreator",
    stateMutability: "nonpayable",
    inputs: [{ name: "label", type: "string" }],
    outputs: [],
  },
  {
    type: "function",
    name: "registerContent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "contentHash", type: "bytes32" },
      { name: "originUrl", type: "string" },
      { name: "license", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeContent",
    stateMutability: "nonpayable",
    inputs: [{ name: "contentHash", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "creatorLabelOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "ensNameOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "isVerifiedHuman",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "setVerifiedHuman",
    stateMutability: "nonpayable",
    inputs: [
      { name: "account", type: "address" },
      { name: "verified", type: "bool" },
    ],
    outputs: [],
  },
] as const;

export function getClaimsAddress(): `0x${string}` | undefined {
  const addr = process.env.NEXT_PUBLIC_CONTENTPROOF_CLAIMS_ADDRESS;
  if (!addr || !addr.startsWith("0x")) return undefined;
  return addr as `0x${string}`;
}

/** Pack a hex perceptual hash into bytes32 for the contract. */
export function hashToBytes32(contentHash: string): `0x${string}` {
  const hex = contentHash.replace(/^0x/, "").toLowerCase().padEnd(64, "0").slice(0, 64);
  return `0x${hex}`;
}
