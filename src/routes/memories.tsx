import { createFileRoute } from '@tanstack/react-router';
import { MemoriesScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/memories')({
  head: () => pageHead('Between Us — Our memories', 'Our memories. A little place for love, connection, and your story together in Between Us.'),
  component: () => <MemoriesScreen/>,
});
