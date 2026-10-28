/** Set once someone has accepted consent on this device, so "/" can send them to /home. */
export const RETURNING_COOKIE = "haven_returning";

export function syncReturningCookie(returning: boolean) {
  if (typeof document === "undefined") return;
  const has = document.cookie.split("; ").some((c) => c.startsWith(`${RETURNING_COOKIE}=`));
  if (returning && !has) document.cookie = `${RETURNING_COOKIE}=1; Max-Age=31536000; Path=/; SameSite=Lax`;
  if (!returning && has) document.cookie = `${RETURNING_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}
