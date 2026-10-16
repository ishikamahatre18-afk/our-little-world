import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { INVITE_CODE_LENGTH, INVITE_CODE_PATTERN, isValidInviteCode, normalizeInviteCode } from '@/lib/invite-code';
import { ConnectPartner } from '@/components/between-us';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn().mockResolvedValue({ data: 'ok', error: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
vi.mock('@/integrations/lovable', () => ({ lovable: {} }));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => createElement('a', null, children),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/components/account-context', () => ({
  useWorld: () => ({ user: { id: 'test-user' }, accountLoading: false, isPending: false,
    data: { profile: { name: 'Test', anniversary: '2025-01-01' }, invitations: [] }, refetch: vi.fn() }),
}));

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
    form.remove();
  });
  it('submits a normalized 8-character code from the real join form', async () => {
    render(createElement(QueryClientProvider, { client: new QueryClient() }, createElement(ConnectPartner)));
    fireEvent.click(screen.getByRole('button', { name: 'Join with a code' }));
    const input = screen.getByRole('textbox', { name: 'Your partner’s invitation code' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: ' k7mp-q3xa ' } });
    expect(input.value).toBe('K7MPQ3XA');
    expect(input.minLength).toBe(8);
    expect(input.maxLength).toBe(8);
    expect(input.checkValidity()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Request to join' }));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith('join_partner_invitation', { p_code: 'K7MPQ3XA' }));
    await screen.findByText('Request sent. You are not connected until your partner approves.');
  });
});