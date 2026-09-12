import { prisma } from "@/lib/db";
import {
  DUPLICATE_THRESHOLD,
  hammingDistanceHex,
} from "@/lib/hashing/perceptual";

export type MatchResult =
  | { match: false }
  | {
      match: true;
      distance: number;
      claim: {
        id: string;
        subname: string;
        contentHash: string;
        ownerAddress: string;
        timestamp: Date;
        originUrl: string;
        license: string;
        revoked: boolean;
      };
    };

export async function findNearestClaim(
  contentHash: string,
  opts?: { includeRevoked?: boolean },
): Promise<MatchResult> {
  const rows = await prisma.contentIndex.findMany({
    where: opts?.includeRevoked ? undefined : { revoked: false },
    orderBy: { timestamp: "asc" },
    take: 500,
  });

  let best: MatchResult = { match: false };
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const row of rows) {
    try {
      const distance = hammingDistanceHex(contentHash, row.contentHash);
      if (distance <= DUPLICATE_THRESHOLD && distance < bestDistance) {
        bestDistance = distance;
        best = {
          match: true,
          distance,
          claim: row,
        };
      }
    } catch {
      // skip malformed hashes
    }
  }

  return best;
}
