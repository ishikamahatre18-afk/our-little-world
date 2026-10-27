export type BucketCategory = 'date' | 'trip' | 'food' | 'adventure' | 'home' | 'other';

export const CATEGORY_LABELS: Record<BucketCategory, string> = {
  date: 'Date night',
  trip: 'Trip',
  food: 'Food',
  adventure: 'Adventure',
  home: 'At home',
  other: 'Other',
};

export type Idea = { title: string; detail: string; category: BucketCategory };

export const IDEAS: Idea[] = [
  { title: 'Watch a sunrise together', detail: 'Set an early alarm, carry a flask of chai and say nothing until the sky changes colour.', category: 'adventure' },
  { title: 'Cook a dish from a city neither of us has visited', detail: 'Pick a recipe, split the steps, and plate it like a restaurant.', category: 'food' },
  { title: 'Write each other a letter and swap them', detail: 'Ten minutes, one page, no phones. Read yours out loud.', category: 'home' },
  { title: 'Take a slow evening walk with no destination', detail: 'Turn at every second corner and see where you end up.', category: 'date' },
  { title: 'Build a playlist of "our songs"', detail: 'Each add five tracks and tell the story behind every one.', category: 'home' },
  { title: 'Plan a weekend getaway', detail: 'A small town, a good view, a long breakfast.', category: 'trip' },
  { title: 'Stargazing night', detail: 'Blanket, hot drinks, and a star map app. Make a wish each.', category: 'date' },
  { title: 'Try a new cuisine together', detail: 'Order something neither of you can pronounce.', category: 'food' },
  { title: 'Have a no-phone dinner', detail: 'Phones in another room. Ask each other three new questions.', category: 'date' },
  { title: 'Visit a market and cook with whatever we find', detail: 'Choose three ingredients each and surprise the other.', category: 'food' },
  { title: 'Recreate our first date', detail: 'Same place if possible, same outfits if brave.', category: 'date' },
  { title: 'Plant something together', detail: 'A tulsi, a rose, a tiny herb pot. Watch it grow with the relationship.', category: 'home' },
  { title: 'Take a road trip with a surprise stop', detail: 'One of you chooses the destination, the other chooses the playlist.', category: 'trip' },
  { title: 'Dance in the living room', detail: 'Lights low, one song each, no judging.', category: 'home' },
  { title: 'Learn something new together', detail: 'Pottery, salsa, a language, a card trick. Be beginners together.', category: 'adventure' },
  { title: 'Make a photo album of our year', detail: 'Pick one picture from every month and write a line under each.', category: 'home' },
  { title: 'Picnic somewhere with a view', detail: 'Pack comfort food, a blanket and a book to read aloud.', category: 'date' },
  { title: 'Do a "yes day"', detail: 'One of you says yes to every reasonable idea for a day.', category: 'adventure' },
  { title: 'Visit a place from one another\'s childhood', detail: 'The school, the street, the sweet shop. Tell the stories.', category: 'trip' },
  { title: 'Cook breakfast in bed', detail: 'Make it simple, make it slow, make it a surprise.', category: 'food' },
  { title: 'Watch the rain together', detail: 'Window seat, hot pakoras, music from your favourite year.', category: 'home' },
  { title: 'Take a short trek', detail: 'A trail with a view and a reward at the top.', category: 'adventure' },
  { title: 'Write our five-year dream list', detail: 'Each write ten dreams, then compare and combine.', category: 'home' },
  { title: 'Try a couples workout or yoga class', detail: 'Laugh at each other, then high-five.', category: 'adventure' },
  { title: 'Make a time capsule', detail: 'Notes, photos and tickets in a box, to open on your next anniversary.', category: 'home' },
  { title: 'Find the best chai or coffee in the city', detail: 'Visit three places, rate them together and crown a winner.', category: 'food' },
  { title: 'Movie marathon night', detail: 'Pick one film each and one for the coin toss.', category: 'date' },
  { title: 'Volunteer together for a morning', detail: 'Do something kind side by side.', category: 'adventure' },
];

export const LOVE_NOTES: string[] = [
  'In a crowded world, my heart still walks straight to you.',
  'Home is wherever you are sitting next to me.',
  'Some people are worth every extra mile, and you are one of them.',
  'I love the quiet way you make everything feel easier.',
  'You are my favourite hello and my hardest goodbye.',
  'Together is my favourite place to be.',
  'Loving you is the best thing I do every day.',
  'With you, ordinary days turn into stories I want to keep.',
  'You make my world softer and my days brighter.',
  'I would choose you in every version of every day.',
  'My heart is calm when I think of you.',
  'You are the little miracle in my everyday.',
  'Thank you for being my safe place.',
  'Every little thing about us is my favourite thing.',
  'I love us, exactly as we are and everything we are becoming.',
  'You are the best chapter in my story.',
  'I am proud of who we are together.',
  'Being loved by you feels like sunlight on my shoulders.',
  'No distance can make my heart forget you.',
  'We are a team, a home and a promise.',
];

export const OPEN_WHEN_PROMPTS = [
  'you miss me',
  "you're having a rough day",
  "you can't sleep",
  'you doubt yourself',
  'we have had a fight',
  'you need a reason to smile',
  'you are celebrating',
  "it's our anniversary",
];
