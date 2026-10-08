import "server-only";
import { headers } from "next/headers";

/**
 * Client IP for rate limiting. nginx sets X-Real-IP from the socket address
 * and the app only listens on localhost, so the header can't be spoofed by
 * a client talking to Node directly.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
