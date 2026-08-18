/**
 * Centralized Admin Auth Manager Module
 * PORTAL:AutoForm - SMKN 1 Jetis Mojokerto
 */

export const AUTHORIZED_ADMIN_EMAILS = [
  "iskakfatoni@gmail.com"
];

export function isAuthorizedAdminEmail(email) {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === clean);
}
