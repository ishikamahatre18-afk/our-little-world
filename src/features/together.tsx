import { useMemo, useState } from 'react';
import { ArrowRight, Check, Dices, Heart, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { messageOf, rpcOk } from '@/lib/db';
import { dayNumber, formatDay } from '@/lib/couple-time';
import { CATEGORY_LABELS, IDEAS, type BucketCategory, type Idea } from '@/lib/ideas';
import { useBucket, useCouple, useRefresh, useToday, type BucketRow } from './data';
import { MemoryComposer } from './memories';
import { Notice, Segmented } from './ui';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as BucketCategory[];

function AddRow() {
  const { relId } = useCouple();
  const refresh = useRefresh();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BucketCategory>('date');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!relId) return;
    setBusy(true);
    setError('');
    try {
      await rpcOk('add_bucket_item', { p_title: title, p_category: category });
      setTitle('');
      await refresh('bucket');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="bucket-add"
      onSubmit={event => {
        event.preventDefault();
        void submit();
      }}
    >
      <input aria-label="Something we want to do" placeholder="Something we want to do together…" maxLength={100} value={title} onChange={event => setTitle(event.target.value)} />
      <select aria-label="Category" value={category} onChange={event => setCategory(event.target.value as BucketCategory)}>
        {CATEGORIES.map(key => (
          <option key={key} value={key}>
            {CATEGORY_LABELS[key]}
          </option>
        ))}
      </select>
      <Button type="submit" variant="romantic" disabled={busy || title.trim().length === 0}>
        <Plus size={16} /> Add
      </Button>
      {error ? <Notice>{error}</Notice> : null}
    </form>
  );
}

function BucketItem({ item, onMemory }: { item: BucketRow; onMemory: (item: BucketRow) => void }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (name: string, args: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      await rpcOk(name, args);
      await refresh('bucket');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className={`bucket-item${item.done ? ' is-done' : ''}`}>
      <button type="button" className="bucket-check" disabled={busy} aria-label={item.done ? 'Mark as not done' : 'Mark as done'} onClick={() => run('set_bucket_done', { p_id: item.id, p_done: !item.done })}>
        {item.done ? <Check size={15} /> : null}
      </button>
      <div>
        <strong>{item.title}</strong>
        <span className="small-label">
          {CATEGORY_LABELS[item.category] ?? 'Other'}
          {item.done && item.done_on ? ` · done ${formatDay(item.done_on)}` : ''}
        </span>
        {item.done ? (
          <Button variant="link" onClick={() => onMemory(item)}>
            Save as a memory <ArrowRight size={14} />
          </Button>
        ) : null}
        {error ? <span className="form-notice">{error}</span> : null}
      </div>
      <Button variant="ghost" size="icon" disabled={busy} aria-label="Remove from our list" onClick={() => run('delete_bucket_item', { p_id: item.id })}>
        <Trash2 size={15} />
      </Button>
    </li>
  );
}

function ListTab() {
  const { relId } = useCouple();
  const bucket = useBucket(relId);
  const [memoryFor, setMemoryFor] = useState<BucketRow>();
  const items = bucket.data ?? [];
  const todo = items.filter(item => !item.done);
  const done = items.filter(item => item.done);
  return (
    <div className="bucket">
      <AddRow />
      {bucket.isPending ? <p className="preview-notice">Opening your list…</p> : null}
      {bucket.error ? <Notice>We couldn’t load your list. Please try again in a moment.</Notice> : null}
      {bucket.isSuccess && items.length === 0 ? (
        <div className="empty-state">
          <Heart size={25} strokeWidth={1} />
          <h3>Your list starts here.</h3>
          <p>Add one thing you both want to do, or take an idea from the Ideas tab.</p>
        </div>
      ) : null}
      {todo.length > 0 ? (
        <>
          <div className="section-heading">
            <h2>Still to do</h2>
            <span className="small-label">{todo.length}</span>
          </div>
          <ul className="bucket-list">
            {todo.map(item => (
              <BucketItem key={item.id} item={item} onMemory={setMemoryFor} />
            ))}
          </ul>
        </>
      ) : null}
      {done.length > 0 ? (
        <>
          <div className="section-heading">
            <h2>Done together</h2>
            <span className="small-label">{done.length}</span>
          </div>
          <ul className="bucket-list">
            {done.map(item => (
              <BucketItem key={item.id} item={item} onMemory={setMemoryFor} />
            ))}
          </ul>
        </>
      ) : null}
      {memoryFor ? <MemoryComposer initialTitle={memoryFor.title} onClose={() => setMemoryFor(undefined)} /> : null}
    </div>
  );
}

function IdeaCard({ idea, label, saved, onSave, busy }: { idea: Idea; label: string; saved: boolean; onSave: () => void; busy: boolean }) {
  return (
    <section className="activity-item">
      <span className="icon-tile">
        <Heart size={22} strokeWidth={1.3} />
      </span>
      <div>
        <span className="small-label">{label}</span>
        <h2>{idea.title}</h2>
        <p>{idea.detail}</p>
        <Button variant="link" disabled={saved || busy} onClick={onSave}>
          {saved ? 'On our list' : 'Add to our list'} {saved ? <Check size={14} /> : <Plus size={14} />}
        </Button>
      </div>
    </section>
  );
}

function IdeasTab() {
  const { relId } = useCouple();
  const today = useToday();
  const bucket = useBucket(relId);
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [spin, setSpin] = useState<number>();
  const onList = useMemo(() => new Set((bucket.data ?? []).map(item => item.title.trim().toLowerCase())), [bucket.data]);
  const todayIndex = ((dayNumber(today) % IDEAS.length) + IDEAS.length) % IDEAS.length;
  const featured = IDEAS[spin ?? todayIndex] as Idea;

  const add = async (idea: Idea) => {
    setBusy(true);
    setError('');
    try {
      await rpcOk('add_bucket_item', { p_title: idea.title, p_category: idea.category });
      await refresh('bucket');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  const surprise = () => {
    const open = IDEAS.map((idea, index) => ({ idea, index })).filter(({ idea, index }) => index !== (spin ?? todayIndex) && !onList.has(idea.title.toLowerCase()));
    const pool = open.length > 0 ? open : IDEAS.map((idea, index) => ({ idea, index }));
    const choice = pool[Math.floor(Math.random() * pool.length)];
    if (choice) setSpin(choice.index);
  };

  return (
    <div className="ideas">
      <IdeaCard idea={featured} label={spin === undefined ? 'IDEA OF THE DAY' : 'A SURPRISE FOR US'} saved={onList.has(featured.title.toLowerCase())} busy={busy} onSave={() => add(featured)} />
      <Button variant="soft" size="roomy" onClick={surprise}>
        <Dices size={16} /> Surprise us
      </Button>
      {error ? <Notice>{error}</Notice> : null}
      <div className="section-heading">
        <h2>More little ways</h2>
        <Heart size={16} />
      </div>
      <div className="activity-list">
        {IDEAS.filter(idea => idea.title !== featured.title).map(idea => (
          <IdeaCard key={idea.title} idea={idea} label={CATEGORY_LABELS[idea.category].toUpperCase()} saved={onList.has(idea.title.toLowerCase())} busy={busy} onSave={() => add(idea)} />
        ))}
      </div>
    </div>
  );
}

export function TogetherPanel() {
  const [tab, setTab] = useState<'list' | 'ideas'>('list');
  return (
    <div className="together-panel">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'list', label: 'Our list' },
          { value: 'ideas', label: 'Ideas' },
        ]}
      />
      {tab === 'list' ? <ListTab /> : <IdeasTab />}
    </div>
  );
}
