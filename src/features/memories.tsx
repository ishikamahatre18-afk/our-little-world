import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Gem, Heart, ImagePlus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db, messageOf, rpcOk } from '@/lib/db';
import { allMilestones, formatDay, formatMonth } from '@/lib/couple-time';
import { compressImage } from '@/lib/image';
import { useCouple, useMemories, useRefresh, useToday, type MemoryRow } from './data';
import { Notice, Sheet } from './ui';

const MAX_PHOTOS = 3;

type Picked = { id: string; file: File; preview: string };

export function MemoryComposer({
  onClose,
  initialTitle = '',
  initialNote = '',
}: {
  onClose: () => void;
  initialTitle?: string;
  initialNote?: string;
}) {
  const { relId } = useCouple();
  const today = useToday();
  const refresh = useRefresh();
  const input = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [note, setNote] = useState(initialNote);
  const [date, setDate] = useState(today);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pickedRef = useRef<Picked[]>([]);

  useEffect(
    () => () => {
      for (const item of pickedRef.current) URL.revokeObjectURL(item.preview);
    },
    [],
  );

  const choose = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - pickedRef.current.length;
    const made: Picked[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, Math.max(0, room))
      .map(file => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));
    pickedRef.current = [...pickedRef.current, ...made];
    setPicked(pickedRef.current);
    if (input.current) input.current.value = '';
  };

  const drop = (id: string) => {
    const gone = pickedRef.current.find(item => item.id === id);
    if (gone) URL.revokeObjectURL(gone.preview);
    pickedRef.current = pickedRef.current.filter(item => item.id !== id);
    setPicked(pickedRef.current);
  };

  const save = async () => {
    if (!relId) return;
    setBusy(true);
    setError('');
    const uploaded: string[] = [];
    try {
      for (const item of picked) {
        const blob = await compressImage(item.file);
        const path = `${relId}/${crypto.randomUUID()}.jpg`;
        const { error: problem } = await db.storage.from('memory-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (problem) throw new Error('A photo could not be uploaded. Please check your connection and try again.');
        uploaded.push(path);
      }
      await rpcOk('add_memory', { p_title: title, p_note: note, p_date: date, p_photos: uploaded });
      await refresh('memories');
      onClose();
    } catch (problem) {
      setError(messageOf(problem));
      setBusy(false);
      if (uploaded.length > 0) {
        try {
          await db.storage.from('memory-photos').remove(uploaded);
        } catch {
          // the photos are private and tiny; a failed clean-up is not worth bothering anyone about
        }
      }
    }
  };

  return (
    <Sheet title="Keep this moment" onClose={onClose}>
      <input className="letter-title" aria-label="Memory title" placeholder="What happened?" maxLength={80} value={title} onChange={event => setTitle(event.target.value)} />
      <label className="seal-field">
        <span>When was it?</span>
        <input type="date" max={today} min="1990-01-01" value={date} onChange={event => setDate(event.target.value)} />
      </label>
      <textarea aria-label="Memory note" placeholder="Tell the little details you never want to forget…" rows={5} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} />

      <div className="photo-picker">
        {picked.map(item => (
          <div className="photo-thumb" key={item.id}>
            <img src={item.preview} alt="Chosen photo" />
            <button type="button" aria-label="Remove photo" onClick={() => drop(item.id)}>
              <X size={13} />
            </button>
          </div>
        ))}
        {picked.length < MAX_PHOTOS ? (
          <button type="button" className="photo-add" onClick={() => input.current?.click()}>
            <ImagePlus size={20} />
            <span>Add photo</span>
          </button>
        ) : null}
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={event => choose(event.target.files)} />
      </div>
      <p className="preview-notice">Up to {MAX_PHOTOS} photos. They’re shrunk on your phone first, so they upload fast and stay private to the two of you.</p>

      {error ? <Notice>{error}</Notice> : null}
      <Button variant="romantic" size="roomy" disabled={busy || title.trim().length === 0 || !date} onClick={save}>
        {busy ? 'Saving…' : 'Keep it forever'} <Heart size={16} />
      </Button>
    </Sheet>
  );
}

function MemoryCard({ memory, mine, authorName }: { memory: MemoryRow; mine: boolean; authorName: string }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState<string>();

  const remove = async () => {
    if (!window.confirm('Delete this memory for both of you?')) return;
    setBusy(true);
    setError('');
    try {
      await rpcOk('delete_memory', { p_id: memory.id });
      await refresh('memories');
      if (memory.photo_paths.length > 0) {
        try {
          await db.storage.from('memory-photos').remove(memory.photo_paths);
        } catch {
          // ignore: the memory itself is already gone
        }
      }
    } catch (problem) {
      setError(messageOf(problem));
      setBusy(false);
    }
  };

  return (
    <article className="memory-entry">
      <span className="small-label">
        {formatDay(memory.memory_date)} · {authorName.toUpperCase()}
      </span>
      <h3>{memory.title}</h3>
      {memory.photoUrls.length > 0 ? (
        <div className={`memory-photos count-${memory.photoUrls.length}`}>
          {memory.photoUrls.map(url => (
            <button type="button" key={url} onClick={() => setZoom(url)} aria-label="View photo">
              <img src={url} alt={memory.title} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
      {memory.note ? <p>{memory.note}</p> : null}
      {mine ? (
        <Button variant="ghost" size="sm" disabled={busy} onClick={remove}>
          <Trash2 size={14} /> Delete
        </Button>
      ) : null}
      {error ? <p className="form-notice">{error}</p> : null}
      {zoom ? (
        <div className="lightbox" onClick={() => setZoom(undefined)}>
          <img src={zoom} alt={memory.title} />
        </div>
      ) : null}
    </article>
  );
}

type TimelineItem =
  | { kind: 'memory'; date: string; memory: MemoryRow }
  | { kind: 'milestone'; date: string; label: string };

export function MemoriesPanel() {
  const { relId, userId, me, partner, relationship } = useCouple();
  const today = useToday();
  const memories = useMemories(relId);
  const [adding, setAdding] = useState(false);
  const anniversary = relationship?.anniversary;

  const items = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = (memories.data ?? []).map(memory => ({ kind: 'memory', date: memory.memory_date, memory }));
    if (anniversary) {
      for (const milestone of allMilestones(anniversary)) {
        if (milestone.date <= today) list.push({ kind: 'milestone', date: milestone.date, label: milestone.label });
      }
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [memories.data, anniversary, today]);

  const onThisDay = useMemo(() => {
    const monthDay = today.slice(5);
    return (memories.data ?? []).filter(memory => memory.memory_date.slice(5) === monthDay && memory.memory_date.slice(0, 4) < today.slice(0, 4));
  }, [memories.data, today]);

  const grouped = useMemo(() => {
    const groups: { month: string; items: TimelineItem[] }[] = [];
    for (const item of items) {
      const month = formatMonth(item.date);
      const last = groups[groups.length - 1];
      if (last && last.month === month) last.items.push(item);
      else groups.push({ month, items: [item] });
    }
    return groups;
  }, [items]);

  const count = memories.data?.length ?? 0;

  return (
    <div className="memories-panel">
      <section className="memories-hero">
        <div className="memory-illustration">
          <Camera size={44} strokeWidth={0.9} />
          <Heart size={18} className="memory-heart" />
        </div>
        <h2>
          {count === 0 ? (
            <>
              A thousand little moments.
              <br />
              One beautiful story.
            </>
          ) : (
            <>
              {count} {count === 1 ? 'moment' : 'moments'} kept.
              <br />
              Keep adding.
            </>
          )}
        </h2>
        <Button variant="romantic" size="roomy" onClick={() => setAdding(true)}>
          <ImagePlus size={17} /> {count === 0 ? 'Add our first memory' : 'Add a memory'}
        </Button>
      </section>

      {memories.isPending ? <p className="preview-notice">Opening your memory book…</p> : null}
      {memories.error ? <Notice>We couldn’t load your memories. Please try again in a moment.</Notice> : null}

      {onThisDay.length > 0 ? (
        <section className="on-this-day">
          <span className="eyebrow">ON THIS DAY</span>
          {onThisDay.map(memory => (
            <p key={memory.id}>
              <strong>{Number(today.slice(0, 4)) - Number(memory.memory_date.slice(0, 4))} year(s) ago:</strong> {memory.title}
            </p>
          ))}
        </section>
      ) : null}

      <div className="timeline">
        {grouped.map(group => (
          <section key={group.month}>
            <h2 className="timeline-month">{group.month}</h2>
            {group.items.map(item =>
              item.kind === 'memory' ? (
                <MemoryCard
                  key={item.memory.id}
                  memory={item.memory}
                  mine={item.memory.author_id === userId}
                  authorName={item.memory.author_id === userId ? me?.name || 'You' : partner?.name || 'Your partner'}
                />
              ) : (
                <div className="milestone-mark" key={`${item.date}-${item.label}`}>
                  <Gem size={15} />
                  <span>{item.label}</span>
                  <em>{formatDay(item.date)}</em>
                </div>
              ),
            )}
          </section>
        ))}
      </div>

      {adding ? <MemoryComposer onClose={() => setAdding(false)} /> : null}
    </div>
  );
}
