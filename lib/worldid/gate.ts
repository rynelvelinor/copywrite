import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "cp_world_verified";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type GatePayload = {
  address: string;
  nullifier: string;
  exp: number;
};

function getSecret() {
  return (
    process.env.WORLD_APP_SECRET ||
    process.env.WORLD_RP_SIGNING_KEY ||
    "copywrite-dev-only-secret"
  );
}

function sign(body: string) {
  return createHmac("sha256", getSecret()).update(body).digest("base64url");
}

export function createVerificationCookie(address: string, nullifier: string) {
  const payload: GatePayload = {
    address: address.toLowerCase(),
    nullifier,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);
  return {
    name: COOKIE_NAME,
    value: `${body}.${signature}`,
    maxAge: MAX_AGE_SECONDS,
  };
}

export function readVerificationCookie(
  cookieHeader: string | null,
  expectedAddress?: string,
): GatePayload | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;

  const raw = match.slice(COOKIE_NAME.length + 1);
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as GatePayload;
    if (!payload.address || !payload.nullifier || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (
      expectedAddress &&
      payload.address !== expectedAddress.toLowerCase()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
