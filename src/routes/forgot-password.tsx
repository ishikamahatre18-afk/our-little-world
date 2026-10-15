import { createFileRoute } from '@tanstack/react-router';
import { AuthScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/forgot-password')({
  head: () => pageHead('Between Us — Reset your password', 'Reset your password. A little place for love, connection, and your story together in Between Us.'),
  component: () => <AuthScreen mode="forgot"/>,
});
