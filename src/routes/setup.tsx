import { createFileRoute } from '@tanstack/react-router';
import { ProfileSetup, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/setup')({
  head: () => pageHead('Between Us — Your profile', 'Your profile. A little place for love, connection, and your story together in Between Us.'),
  component: () => <ProfileSetup/>,
});
