import { createFileRoute } from '@tanstack/react-router';
import { SpaceScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/our-space')({
  head: () => pageHead('Between Us — Our space', 'Our space. A little place for love, connection, and your story together in Between Us.'),
  component: () => <SpaceScreen/>,
});
