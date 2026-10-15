import { createFileRoute } from '@tanstack/react-router';
import { AuthScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/login')({
  head: () => pageHead('Between Us — Welcome back', 'Welcome back. A little place for love, connection, and your story together in Between Us.'),
  component: () => <AuthScreen mode="login"/>,
});
