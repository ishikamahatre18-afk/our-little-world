import { createFileRoute } from '@tanstack/react-router';
import { HomeScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/home')({
  head: () => pageHead('Between Us — Our little world', 'Our little world. A little place for love, connection, and your story together in Between Us.'),
  component: () => <HomeScreen/>,
});
