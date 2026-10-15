import { createFileRoute } from '@tanstack/react-router';
import { ProfileScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/profile')({
  head: () => pageHead('Between Us — Your little corner', 'Your little corner. A little place for love, connection, and your story together in Between Us.'),
  component: () => <ProfileScreen/>,
});
