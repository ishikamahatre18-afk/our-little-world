import { useEffect, useState } from 'react';
import { DailyPanel } from './daily';
import { LettersPanel } from './letters';
import { MemoriesPanel } from './memories';
import { TogetherPanel } from './together';
import { CoupleGate, Segmented } from './ui';

export function SpaceScreen() {
  const [tab, setTab] = useState<'letters' | 'daily'>('letters');
  useEffect(() => {
    if (window.location.hash === '#daily') setTab('daily');
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
              { value: 'daily', label: 'Daily question' },
            ]}
          />
          {tab === 'letters' ? <LettersPanel /> : <DailyPanel />}
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
  return (
    <CoupleGate eyebrow="THE MOMENTS THAT MATTER" title="Our memories." subtitle="Because the little things are the big things.">
      {() => <MemoriesPanel />}
    </CoupleGate>
  );
}

export { HomeScreen } from './home';
