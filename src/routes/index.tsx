import { createFileRoute } from '@tanstack/react-router';
import { Welcome, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/')({
  head: () => pageHead('Between Us — Our little world', 'Our Little World, Just You & Me. A private place for two hearts and all your moments together.'),
  component: Welcome,
});