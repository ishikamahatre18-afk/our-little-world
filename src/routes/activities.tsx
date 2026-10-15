import { createFileRoute } from '@tanstack/react-router';
import { ActivitiesScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/activities')({
  head: () => pageHead('Between Us — Closer together', 'Closer together. A little place for love, connection, and your story together in Between Us.'),
  component: () => <ActivitiesScreen/>,
});
