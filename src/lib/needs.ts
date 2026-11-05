// Need Cards: a five-second way to say what you need today.
export type NeedKind = 'hug' | 'listen' | 'space' | 'laugh' | 'help' | 'words' | 'together' | 'treat' | 'patience' | 'talk';

export type NeedInfo = {
  kind: NeedKind;
  label: string;
  /** Said by the person who picked it, e.g. "Today I need…" */
  need: string;
  /** Suggestion shown to their partner. */
  respond: string;
};

export const NEEDS: NeedInfo[] = [
  { kind: 'hug', label: 'A hug', need: 'a long, quiet hug', respond: 'Give them a long, quiet hug. No words needed.' },
  { kind: 'listen', label: 'To be heard', need: 'someone to listen', respond: 'Ask about their day and just listen. No fixing unless they ask.' },
  { kind: 'space', label: 'A little space', need: 'a little space', respond: 'Give them room, kindly. Tell them you’re here when they’re ready.' },
  { kind: 'laugh', label: 'A good laugh', need: 'a good laugh', respond: 'Share something silly: a meme, a memory, an old inside joke.' },
  { kind: 'help', label: 'A helping hand', need: 'a helping hand', respond: 'Take one thing off their plate today without being asked.' },
  { kind: 'words', label: 'Kind words', need: 'some kind words', respond: 'Tell them something you love and admire about them, specifically.' },
  { kind: 'together', label: 'Time together', need: 'time together', respond: 'Put the phones away and spend a little time with them tonight.' },
  { kind: 'treat', label: 'A little treat', need: 'a little treat', respond: 'Surprise them with a favourite snack, tea or sweet.' },
  { kind: 'patience', label: 'Some patience', need: 'a bit of patience', respond: 'Go gently today. Soft voice, no rush, no pushing.' },
  { kind: 'talk', label: 'To talk it out', need: 'to talk something through', respond: 'Make time to talk, and let them lead the conversation.' },
];

export const NEED_BY_KIND: Record<NeedKind, NeedInfo> = Object.fromEntries(NEEDS.map(info => [info.kind, info])) as Record<NeedKind, NeedInfo>;

export function needInfo(kind: string): NeedInfo {
  return NEED_BY_KIND[kind as NeedKind] ?? (NEEDS[0] as NeedInfo);
}

// Repair: a gentle, guided way back to each other after a fight.
export const REPAIR_STEPS = [
  { key: 'felt', title: 'How did you feel?', hint: 'Start with “I felt…” Keep it about your feeling, not their faults.', placeholder: 'I felt…' },
  { key: 'need', title: 'What do you need?', hint: 'One clear, kind request. Something your partner can actually do.', placeholder: 'What would help me is…' },
  { key: 'sorry', title: 'What are you sorry for?', hint: 'Own your part, even a small one. This step is optional but powerful.', placeholder: 'I’m sorry that I…' },
] as const;

export const RECONNECT_IDEAS: string[] = [
  'Read each other’s words slowly. Say “thank you for telling me” before anything else.',
  'Start with the first thing you agree on, however small.',
  'Hold hands or sit close while you talk it through.',
  'Take a short walk together, side by side.',
  'Make tea or share a snack. A little care softens a lot.',
  'Say what you’ll each try differently next time.',
];

export const MOODS = [
  { value: 1, label: 'Tough' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Glowing' },
] as const;
