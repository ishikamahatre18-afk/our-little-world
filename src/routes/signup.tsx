import { createFileRoute } from '@tanstack/react-router';
import { AuthScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/signup')({
  head: () => pageHead('Between Us — Create your little world', 'Create your little world. A little place for love, connection, and your story together in Between Us.'),
  component: () => <AuthScreen mode="signup"/>,
});
