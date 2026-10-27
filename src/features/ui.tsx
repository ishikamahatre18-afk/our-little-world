import { useEffect, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCouple } from './data';
import { AccountPrompt, AppShell, PageHeading, WorldStatus } from './shell';

/** A bottom sheet that slides up on phones and sits centred on larger screens. */
export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={event => event.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="modal-heading">
          <h2>{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}

export type SegmentedOption<T extends string> = { value: T; label: string; badge?: number };

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (value: T) => void; options: SegmentedOption<T>[] }) {
  return (
    <div className="tabs-pill" role="tablist">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={option.value === value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.badge ? <span className="tab-badge">{option.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="form-notice" role="status">
      {children}
    </p>
  );
}

export function NeedPartner() {
  return (
    <div className="empty-state">
      <Heart size={25} />
      <h3>Better with two.</h3>
      <p>
        This part of your world opens once you and your partner are connected.
      </p>
      <Button variant="romantic" size="roomy" asChild>
        <Link to="/connect">
          Connect with your partner <ArrowRight size={16} />
        </Link>
      </Button>
    </div>
  );
}

/** Shows the page title, handles "not logged in" and "no partner yet", then renders the screen. */
export function CoupleGate({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: (couple: ReturnType<typeof useCouple>) => ReactNode;
}) {
  const couple = useCouple();
  const { world, user, relationship } = couple;
  const ready = !!user && !world.isPending && !world.error;
  return (
    <AppShell>
      <PageHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <WorldStatus world={world} />
      {!world.accountLoading && !user ? <AccountPrompt /> : null}
      {ready && !relationship ? <NeedPartner /> : null}
      {ready && relationship ? children(couple) : null}
    </AppShell>
  );
}
