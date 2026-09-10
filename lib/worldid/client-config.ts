export const WORLD_ACTION = "register-creator";

export function getWorldEnvironment(): "production" | "staging" {
  return process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT === "staging"
    ? "staging"
    : "production";
}
