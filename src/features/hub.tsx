import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CoupleGate } from './ui';

export type HubTone = 'blush' | 'lavender' | 'rose' | 'cream';

export type HubItem = {
  key: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  tone: HubTone;
  badge?: number | undefined;
  /** Older links (like #journey) that should still open this page. */
  aliases?: string[];
  render: () => ReactNode;
};

function find(items: HubItem[]): HubItem | undefined {
  const raw = window.location.hash.replace('#', '');
  if (!raw) return undefined;
  return items.find(item => item.key === raw || item.aliases?.includes(raw));
}

/** Keeps "which page of this section is open" in the address (#letters, #diary…), so the phone's Back button works. */
function useHubView(items: HubItem[]) {
  const [key, setKey] = useState<string>();
  const latest = useRef(items);
  latest.current = items;
  const pushed = useRef(false);

  useEffect(() => {
    const sync = () => setKey(find(latest.current)?.key);
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const open = (next: string) => {
    pushed.current = true;
    window.scrollTo({ top: 0 });
    window.location.hash = next;
  };

  const close = () => {
    window.scrollTo({ top: 0 });
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
      setKey(undefined);
    }
  };

  return { view: items.find(item => item.key === key), open, close };
}

/** A calm menu of pages. Tap one and it opens on its own, with a back button. */
export function Hub({ eyebrow, title, subtitle, items }: { eyebrow: string; title: string; subtitle: string; items: HubItem[] }) {
  const { view, open, close } = useHubView(items);
  return (
    <CoupleGate eyebrow={eyebrow} title={title} subtitle={subtitle} showHeading={!view}>
      {() =>
        view ? (
          <section className="hub-view" key={view.key}>
            <div className="hub-bar">
              <button type="button" className="hub-back" onClick={close} aria-label={`Back to ${title}`}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className="eyebrow">{eyebrow}</span>
                <h2>{view.title}</h2>
              </div>
            </div>
            {view.render()}
          </section>
        ) : (
          <nav className="hub-list" aria-label={title}>
            {items.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.key} type="button" className={`hub-card tone-${item.tone}`} onClick={() => open(item.key)}>
                  <span className="hub-icon">
                    <Icon size={23} strokeWidth={1.4} />
                  </span>
                  <span className="hub-text">
                    <strong>{item.title}</strong>
                    <span>{item.blurb}</span>
                  </span>
                  {item.badge ? <span className="hub-badge">{item.badge}</span> : null}
                  <ChevronRight size={18} className="hub-chevron" />
                </button>
              );
            })}
          </nav>
        )
      }
    </CoupleGate>
  );
}
