import { useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowRight, Camera, Flower2, Heart, Home, Sparkles, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import hearts from '@/assets/together-hearts.jpg';
import { useAccount, useWorld, type Profile } from '@/components/account-context';
import { db, messageOf, rpcOk } from '@/lib/db';
import { PULSE_TEXT, useBadges, useCouple, usePulses, useRefresh } from './data';

export function Avatar({ profile, partner = false }: { profile?: Profile | undefined; partner?: boolean }) {
  return (
    <span className={`avatar ${partner ? 'avatar-partner' : 'avatar-you'}`}>
      {profile?.photoUrl ? <img src={profile.photoUrl} alt={profile.name} /> : profile?.name?.slice(0, 1) || <UserRound size={23} />}
    </span>
  );
}

export function AccountPrompt() {
  return (
    <div className="empty-state">
      <Heart size={25} />
      <h3>Your story starts with you.</h3>
      <p>Log in to save your profile and invite your partner.</p>
      <Button variant="romantic" size="roomy" asChild>
        <Link to="/login">
          Log in <ArrowRight size={16} />
        </Link>
      </Button>
      <Link to="/signup" className="preview-link">
        Create an account
      </Link>
    </div>
  );
}

export function WorldStatus({ world }: { world: ReturnType<typeof useWorld> }) {
  if (world.accountLoading || (world.isPending && world.user)) return <p className="preview-notice">Opening your little world…</p>;
  if (world.error) {
    return (
      <div className="form-notice" role="alert">
        We couldn’t load your details.{' '}
        <Button variant="link" onClick={() => world.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  return null;
}

export function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">
        <Heart size={19} strokeWidth={1.5} />
      </span>
      <span>
        between us<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="romantic-modal" role="dialog" aria-modal="true" aria-label={title} onClick={event => event.stopPropagation()}>
        <div className="modal-heading">
          <h2>{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <Flower2 size={30} strokeWidth={1} className="heading-flower" />
    </div>
  );
}

const navigation = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/our-space', label: 'Our Space', icon: Heart },
  { to: '/activities', label: 'Together', icon: Sparkles },
  { to: '/memories', label: 'Memories', icon: Camera },
  { to: '/profile', label: 'Profile', icon: UserRound },
] as const;

/** A gentle banner when your partner has sent you a "thinking of you". */
export function PulseBanner() {
  const { relId, userId, partner } = useCouple();
  const pulses = usePulses(relId);
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unseen = (pulses.data ?? []).filter(pulse => pulse.sender_id !== userId && !pulse.seen_at);
  const latest = unseen[0];
  if (!relId || !latest) return null;
  const text = PULSE_TEXT[latest.kind] ?? PULSE_TEXT.heart;
  const name = partner?.name || 'Your person';

  const run = async (sendBack: boolean) => {
    setBusy(true);
    setError('');
    try {
      if (sendBack) await rpcOk('send_pulse', { p_kind: 'heart' });
      const { error: seenError } = await db.rpc('mark_pulses_seen');
      if (seenError) throw new Error(seenError.message);
      await refresh('pulses');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pulse-banner" role="status">
      <span className="pulse-banner-heart">
        <Heart size={16} fill="currentColor" />
      </span>
      <div className="pulse-banner-text">
        <strong>
          {name} {text.received}
        </strong>
        <span>{error || (unseen.length > 1 ? `and ${unseen.length - 1} more little ${unseen.length === 2 ? 'moment' : 'moments'}` : 'a little love, just for you')}</span>
      </div>
      <Button variant="soft" size="sm" disabled={busy} onClick={() => run(true)}>
        Send back
      </Button>
      <Button variant="ghost" size="icon" disabled={busy} onClick={() => run(false)} aria-label="Dismiss">
        <X size={16} />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAccount();
  const pathname = useRouterState({ select: state => state.location.pathname });
  const badges = useBadges();
  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand />
        <div className="header-right">
          <span className="demo-label">{user ? 'Your little world' : 'Welcome, love'}</span>
          <Button variant="ghost" size="icon" asChild aria-label="Your profile">
            <Link to="/profile">
              <UserRound size={18} />
            </Link>
          </Button>
        </div>
      </header>
      <aside className="desktop-navigation">
        <span className="eyebrow">OUR LITTLE WORLD</span>
        {navigation.map(({ to, label, icon: Icon }) => (
          <Button asChild variant="nav" key={to} className={pathname === to ? 'is-active' : ''}>
            <Link to={to}>
              <Icon size={19} />
              {label}
              {badges[to] ? <span className="side-badge">{badges[to]}</span> : null}
            </Link>
          </Button>
        ))}
        <div className="sidebar-note">
          <img src={hearts} alt="Intertwined hearts" width={1024} height={1024} loading="lazy" />
          <p>Better, together.</p>
          <span>Always a little closer.</span>
        </div>
      </aside>
      <main className="app-content">
        <PulseBanner />
        {children}
      </main>
      <nav className="bottom-navigation dock" aria-label="Main navigation">
        {navigation.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          const badge = badges[to];
          return (
            <Link key={to} to={to} className={`dock-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
              <span className="dock-icon">
                <Icon size={20} strokeWidth={active ? 1.9 : 1.5} />
                {badge ? <span className="dock-badge">{badge > 9 ? '9+' : badge}</span> : null}
              </span>
              <span className="dock-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
