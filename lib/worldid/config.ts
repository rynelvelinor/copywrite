export const WORLD_ACTION = "register-creator";

export function getWorldAppId(): `app_${string}` | null {
  const id = process.env.NEXT_PUBLIC_WORLD_APP_ID;
  if (!id || !id.startsWith("app_")) return null;
  return id as `app_${string}`;
}

export function getWorldRpId(): `rp_${string}` | null {
  const id = process.env.NEXT_PUBLIC_WORLD_RP_ID ?? process.env.WORLD_RP_ID;
  if (!id || !id.startsWith("rp_")) return null;
  return id as `rp_${string}`;
}

export function getWorldEnvironment(): "production" | "staging" {
  return process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT === "staging"
    ? "staging"
    : "production";
}
