// Centralized admin check — single source of truth for the admin email.
// Override via ADMIN_EMAIL env var if needed.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mathys.hosin@gmail.com";

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && email === ADMIN_EMAIL;
}
