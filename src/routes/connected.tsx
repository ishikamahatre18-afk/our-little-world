import { createFileRoute } from '@tanstack/react-router';
import { Connected, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/connected')({
  head: () => pageHead('Between Us — Two hearts, one world', 'Two hearts, one world. A little place for love, connection, and your story together in Between Us.'),
  component: () => <Connected/>,
});
