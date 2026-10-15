import { createFileRoute } from '@tanstack/react-router';
import { AuthScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/reset-password')({
  head: () => pageHead('Between Us — Choose a new password', 'Choose a new password. A little place for love, connection, and your story together in Between Us.'),
  component: () => <AuthScreen mode="reset"/>,
});
