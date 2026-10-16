import { describe, expect, it } from 'vitest';
import { INVITE_CODE_LENGTH, INVITE_CODE_PATTERN, isValidInviteCode, normalizeInviteCode } from '@/lib/invite-code';

describe('invitation code entry', () => {
  it('normalizes pasted codes to 8 uppercase characters', () => {
    expect(normalizeInviteCode(' k7mp-q3xa ')).toBe('K7MPQ3XA');
    expect(normalizeInviteCode('k7mp q3xa extra')).toHaveLength(INVITE_CODE_LENGTH);
  });
  it('accepts a valid 8-character code and rejects others', () => {
    expect(isValidInviteCode('K7MPQ3XA')).toBe(true);
    expect(isValidInviteCode('K7MPQ3X')).toBe(false);
    expect(isValidInviteCode('K7MPQ3X0')).toBe(false);
  });
  it('lets the browser submit a valid 8-character code', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.required = true; input.minLength = INVITE_CODE_LENGTH; input.maxLength = INVITE_CODE_LENGTH; input.pattern = INVITE_CODE_PATTERN;
    form.append(input); document.body.append(form);
    input.value = normalizeInviteCode('k7mp-q3xa');
    expect(input.checkValidity()).toBe(true);
    expect(form.checkValidity()).toBe(true);
  });
});