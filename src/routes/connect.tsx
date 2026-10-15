import { createFileRoute } from '@tanstack/react-router';
import { ConnectPartner, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/connect')({
  head: () => pageHead('Between Us — Connect with your partner', 'Connect with your partner. A little place for love, connection, and your story together in Between Us.'),
  component: () => <ConnectPartner/>,
});
