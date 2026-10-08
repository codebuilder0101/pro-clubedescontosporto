import "server-only";
import { hash, verify } from "@node-rs/argon2";

// @node-rs/argon2 defaults to argon2id with m=19 MiB, t=2, p=1 (the OWASP
// baseline), so no options are passed: the parameters live in the PHC string.

export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    // Malformed hash: treat as a failed login rather than a server error.
    return false;
  }
}

// Hash of a random string, verified when the email doesn't exist so a failed
// login takes the same time whether or not the account exists.
let dummyHash: Promise<string> | undefined;
export async function verifyDummyPassword(password: string): Promise<void> {
  dummyHash ??= hash(crypto.randomUUID());
  await verifyPassword(await dummyHash, password);
}
