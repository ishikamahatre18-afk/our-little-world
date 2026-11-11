import { createFileRoute } from '@tanstack/react-router';
import { ChatScreen, pageHead } from '@/components/between-us';

export const Route = createFileRoute('/chat')({
  head: () => pageHead('Between Us — Chat', 'A private chat, just for the two of you, in Between Us.'),
  component: () => <ChatScreen/>,
});
