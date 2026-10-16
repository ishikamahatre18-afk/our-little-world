// Mirrors the backend rules: 8 characters from an alphabet without look-alikes (I, O, 0, 1).
export const INVITE_CODE_LENGTH = 8;
export const INVITE_CODE_PATTERN = '[A-HJ-NP-Z2-9]{8}';

export function normalizeInviteCode(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, INVITE_CODE_LENGTH);
}

export function isValidInviteCode(value: string): boolean {
  return new RegExp(`^${INVITE_CODE_PATTERN}$`).test(value);
}