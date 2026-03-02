// Module-level impersonation state shared between api.ts and ImpersonationContext.
// Avoids circular dependencies by keeping state in a plain module.

let impersonatedCompanyId: string | null = null;

export function getImpersonatedCompanyId(): string | null {
  return impersonatedCompanyId;
}

export function setImpersonatedCompanyId(id: string | null): void {
  impersonatedCompanyId = id;
}
