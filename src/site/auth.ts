// Site-owned auth hooks. Leave `password` undefined to use Better Auth's own hasher (scrypt).
// A site that moves existing users in (e.g. ShotFrames' salt:hash PBKDF2 format) sets `password` to its
// own { hash, verify }; src/core/auth/server.ts passes it to Better Auth as emailAndPassword.password.
// Keep it cheap: Workers Free allows 10 ms CPU per request (PBKDF2 at ~12k iterations fits, 100k does not).

export type PasswordHasher = {
  hash: (password: string) => Promise<string>
  verify: (input: { hash: string; password: string }) => Promise<boolean>
}

export const password: PasswordHasher | undefined = undefined
