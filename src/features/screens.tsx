import { useEffect, useState } from 'react';
import { DailyPanel } from './daily';
import { useCouple, useRepairs } from './data';
import { GrowthPanel } from './growth';
import { JarPanel } from './jar';
import { JournalPanel } from './journal';
import { LettersPanel } from './letters';
import { MemoriesPanel } from './memories';
import { RepairPanel } from './repair';
import { TogetherPanel } from './together';
import { CoupleGate, Segmented } from './ui';

function useRepairWaiting(): number {
  const { relId, userId } = useCouple();
  const repairs = useRepairs(relId);
  const open = (repairs.data?.repairs ?? []).find(repair => repair.status === 'open');
  if (!open) return 0;
  return (repairs.data?.entries ?? []).some(entry => entry.repair_id === open.id && entry.user_id === userId) ? 0 : 1;
}

export function SpaceScreen() {
  const [tab, setTab] = useState<'letters' | 'daily' | 'repair' | 'jar'>('letters');
  const repairWaiting = useRepairWaiting();
  useEffect(() => {
    if (window.location.hash === '#daily') setTab('daily');
    if (window.location.hash === '#repair') setTab('repair');
    if (window.location.hash === '#jar') setTab('jar');
  }, []);
  return (
    <CoupleGate eyebrow="JUST YOU & ME" title="Our space." subtitle="A place for everything we feel.">
      {() => (
        <>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'letters', label: 'Letters' },
              { value: 'daily', label: 'Daily' },
              { value: 'repair', label: 'Repair', badge: repairWaiting },
              { value: 'jar', label: 'Jar' },
            ]}
          />
          {tab === 'letters' ? <LettersPanel /> : tab === 'daily' ? <DailyPanel /> : tab === 'repair' ? <RepairPanel /> : <JarPanel />}
        </>
      )}
    </CoupleGate>
  );
}

export function ActivitiesScreen() {
  return (
    <CoupleGate eyebrow="MAKE TIME FOR US" title="Closer, together." subtitle="Little ways to turn a day into a memory.">
      {() => <TogetherPanel />}
    </CoupleGate>
  );
}

export function MemoriesScreen() {
  const [tab, setTab] = useState<'memories' | 'journey' | 'growth'>('memories');
  useEffect(() => {
    if (window.location.hash === '#journey') setTab('journey');
    if (window.location.hash === '#growth') setTab('growth');
  }, []);
  return (
    <CoupleGate eyebrow="THE MOMENTS THAT MATTER" title="Our memories." subtitle="Because the little things are the big things.">
      {() => (
        <>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'memories', label: 'Memories' },
              { value: 'journey', label: 'Journey' },
              { value: 'growth', label: 'Growth' },
            ]}
          />
          {tab === 'memories' ? <MemoriesPanel /> : tab === 'journey' ? <JournalPanel /> : <GrowthPanel />}
        </>
      )}
    </CoupleGate>
  );
}

export { HomeScreen } from './home';
