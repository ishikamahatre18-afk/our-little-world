import { BookHeart, BookOpen, Camera, Coffee, Flower2, HandHeart, HeartHandshake, Mail, Sparkles, TrendingUp } from 'lucide-react';
import { ChatPanel } from './chat';
import { DailyPanel } from './daily';
import { useAnswers, useCouple, useInbox, useRepairs, useToday } from './data';
import { GrowthPanel } from './growth';
import { Hub, type HubItem } from './hub';
import { JarPanel } from './jar';
import { JournalPanel } from './journal';
import { LessonPanel } from './lesson';
import { LettersPanel } from './letters';
import { MemoriesPanel } from './memories';
import { NeedsCard } from './needs';
import { RepairPanel } from './repair';
import { TogetherPanel } from './together';
import { CoupleGate } from './ui';

export function SpaceScreen() {
  const { relId, userId } = useCouple();
  const today = useToday();
  const inbox = useInbox(relId);
  const answers = useAnswers(relId);
  const repairs = useRepairs(relId);
  const waitingLetters = (inbox.data ?? []).filter(letter => !letter.sealed && !letter.opened_at).length;
  const unanswered = answers.isSuccess && !(answers.data ?? []).some(row => row.user_id === userId && row.question_day === today) ? 1 : 0;
  const open = (repairs.data?.repairs ?? []).find(repair => repair.status === 'open');
  const repairWaiting = open && !(repairs.data?.entries ?? []).some(entry => entry.repair_id === open.id && entry.user_id === userId) ? 1 : 0;

  const items: HubItem[] = [
    { key: 'letters', title: 'Letters', blurb: 'Words to open now, or later', icon: Mail, tone: 'blush', badge: waitingLetters, render: () => <LettersPanel /> },
    { key: 'daily', title: 'Daily question', blurb: 'One question, answered together', icon: Coffee, tone: 'lavender', badge: unanswered, render: () => <DailyPanel /> },
    { key: 'lesson', title: 'Little lesson', blurb: 'A minute to read, a moment to try', icon: BookHeart, tone: 'cream', render: () => <LessonPanel /> },
    { key: 'repair', title: 'Repair', blurb: 'Talk it through, gently', icon: HeartHandshake, tone: 'rose', badge: repairWaiting, render: () => <RepairPanel /> },
    { key: 'needs', title: 'Need cards', blurb: 'Tell each other what you need', icon: HandHeart, tone: 'blush', render: () => <NeedsCard /> },
    { key: 'jar', title: 'Appreciation jar', blurb: 'Little thank-yous, opened monthly', icon: Flower2, tone: 'lavender', render: () => <JarPanel /> },
    { key: 'together', title: 'Date ideas', blurb: 'Ways to turn a day into a memory', icon: Sparkles, tone: 'cream', aliases: ['activities'], render: () => <TogetherPanel /> },
  ];
  return <Hub eyebrow="JUST YOU & ME" title="Our space." subtitle="Everything we share, in one calm place." items={items} />;
}

export function ActivitiesScreen() {
  return (
    <CoupleGate eyebrow="MAKE TIME FOR US" title="Closer, together." subtitle="Little ways to turn a day into a memory.">
      {() => <TogetherPanel />}
    </CoupleGate>
  );
}

export function MemoriesScreen() {
  const items: HubItem[] = [
    { key: 'memories', title: 'Memories', blurb: 'Moments and photos, in order', icon: Camera, tone: 'blush', render: () => <MemoriesPanel /> },
    { key: 'diary', title: 'Our diary', blurb: 'Pages you write together', icon: BookOpen, tone: 'lavender', aliases: ['journey'], render: () => <JournalPanel /> },
    { key: 'growth', title: 'Growth', blurb: 'How far you’ve come', icon: TrendingUp, tone: 'cream', render: () => <GrowthPanel /> },
  ];
  return <Hub eyebrow="KEPT FOREVER" title="Our keepsakes." subtitle="Because the little things are the big things." items={items} />;
}

export function ChatScreen() {
  return (
    <CoupleGate eyebrow="JUST THE TWO OF YOU" title="Chat." subtitle="Talk freely, anytime." showHeading={false}>
      {() => <ChatPanel />}
    </CoupleGate>
  );
}

export { HomeScreen } from './home';
