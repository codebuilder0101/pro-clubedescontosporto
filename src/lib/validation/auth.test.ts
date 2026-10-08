import { describe, expect, it } from "vitest";
import { fieldErrors, resetPasswordSchema, signInSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  it("normalises email and trims the name", () => {
    const r = signUpSchema.parse({ name: "  Rita  ", email: " Rita@Example.PT ", password: "longenough", terms: "on" });
    expect(r).toMatchObject({ name: "Rita", email: "rita@example.pt" });
  });

  it("returns one error code per invalid field", () => {
    const r = signUpSchema.safeParse({ name: "R", email: "nope", password: "short" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(fieldErrors(r.error)).toEqual({
        name: "nameRequired",
        email: "emailInvalid",
        password: "passwordTooShort",
        terms: "termsRequired",
      });
    }
  });

  it("rejects overlong passwords", () => {
    expect(signUpSchema.safeParse({ name: "Rita", email: "r@x.pt", password: "x".repeat(129), terms: "on" }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("requires a password but doesn't enforce new-password rules", () => {
    expect(signInSchema.safeParse({ email: "r@x.pt", password: "abc" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "r@x.pt", password: "" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("only accepts tokens in the generated format", () => {
    const token = "A".repeat(43);
    expect(resetPasswordSchema.safeParse({ token, password: "newpassword" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "newpassword" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: `${"A".repeat(42)}/`, password: "newpassword" }).success).toBe(false);
  });
});
