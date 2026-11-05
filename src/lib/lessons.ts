// The Little Lesson library. Both partners get the same short lesson on the same day.
// 12 themes, one week each, then it starts again. General guidance, not therapy.
export type Lesson = { theme: string; title: string; text: string; action: string };

const make = (theme: string) => (title: string, text: string, action: string): Lesson => ({ theme, title, text, action });

const listening = make('Listening');
const appreciation = make('Appreciation');
const disagreements = make('Disagreements');
const knowing = make('Knowing each other');
const closeness = make('Closeness');
const support = make('Stress & support');
const trust = make('Trust & honesty');
const time = make('Time together');
const dreams = make('Dreams & growth');
const rituals = make('Little rituals');
const repair = make('Forgiveness & repair');
const us = make('Gratitude & us');

export const LESSONS: Lesson[] = [
  // Week 1: Listening
  listening('Listen to understand, not to answer', 'Most of us listen while quietly preparing our reply. Today, try the opposite: let your partner’s last sentence land before you speak. Often they don’t need a fix. They need to feel that someone truly followed them from start to finish.', 'Tonight, hear one full story without interrupting, then say back what you heard.'),
  listening('Ask, don’t assume', 'We guess our partner’s moods all day, and we are wrong more often than we think. One honest “what’s going on in your head?” can replace ten wrong guesses and the little hurts that follow them.', 'Ask “what’s on your mind?” once today, and wait for the whole answer.'),
  listening('Advice, or just company?', 'When someone shares a problem, we rush to solve it. But sometimes they only want company in the feeling. Asking “do you want advice, or should I just listen?” saves many arguments before they start.', 'Next time they vent, ask: advice, or just listening?'),
  listening('Put the phone face-down', 'A phone on the table quietly says “something better might come along.” Full attention is the most generous gift in a relationship, and it costs nothing. Even ten undivided minutes can feel like a holiday.', 'Have one conversation today with both phones out of sight.'),
  listening('Say it back', 'Repeating what you heard in your own words, like “so you felt left out when I made plans,” shows you were listening and clears up misunderstandings early. It feels awkward the first time, and natural soon after.', 'Reflect back one thing they say today before you respond.'),
  listening('Hear the feeling under the words', '“You’re always late” is rarely about time. It is often “I want to feel important to you.” When a complaint comes, try listening for the feeling underneath it. That is where the real conversation lives.', 'When a complaint comes up, guess the feeling under it and ask if you’re right.'),
  listening('Silence is allowed', 'Not every pause needs filling. Comfortable quiet together is a sign of safety, and slow thinking often leads to the most honest answers. You don’t always have to perform for each other.', 'Sit together for five quiet minutes tonight with no talking, just company.'),

  // Week 2: Appreciation
  appreciation('Notice the ordinary', 'Grand gestures are rare, but daily care is constant: the chai made without asking, the bill paid, the bag carried. Relationships grow warm when those small things are noticed instead of expected.', 'Thank your partner for something small they do every single day.'),
  appreciation('Say the praise out loud', 'Thinking “they’re wonderful” helps no one until it is said. Be specific. Not just “you’re great” but “I loved how patient you were with my mother today.” Specific praise is believed, and remembered.', 'Give one specific compliment today and say exactly what you noticed.'),
  appreciation('Praise them to others', 'Hearing you speak well of them to a friend or family member, especially when they are close enough to hear, builds a quiet pride in the relationship that private words alone cannot.', 'Say something you admire about them to someone else while they’re near.'),
  appreciation('Three good things', 'Relationships are kept warm by many small good moments, far more than by the bad ones that stand out. A habit of naming what went well each week keeps your attention on what is working.', 'Send your partner three things you loved about this week.'),
  appreciation('Love who they are, not only what they do', 'Thanking someone for chores is good. Telling them what you love about their character is better. “You’re so kind” or “you make me brave” lands deeper than “thanks for the dishes.”', 'Tell them one quality you love in them, not a task they did.'),
  appreciation('Honour the effort', 'When your partner tries something for you and it doesn’t go perfectly, notice the trying. Effort that is appreciated gets repeated. Effort that is criticised quietly stops.', 'Appreciate an attempt today, even an imperfect one.'),
  appreciation('Thank them with your eyes', 'A thank you said while looking at someone carries more than a thank you said over your shoulder. It tells them they are seen, not just useful. It takes five seconds.', 'Say thank you today while looking them in the eyes.'),

  // Week 3: Disagreements
  disagreements('Start soft', 'How a conversation begins usually decides how it ends. “I feel worried when plans change late” lands very differently from “you never think of me.” A gentle start invites a partner in rather than into a fight.', 'Rephrase one complaint today as “I feel… when… I would like…”'),
  disagreements('The problem is the enemy', 'In a disagreement it is easy to treat your partner as the opponent. Try to sit on the same side of the table and look at the problem together. “We have a problem” changes everything about the next ten minutes.', 'In your next disagreement, say “we have a problem,” not “you are the problem.”'),
  disagreements('Pause, then return', 'When voices rise, our bodies flood with stress and nobody thinks clearly. A short pause of about twenty minutes helps, as long as you promise to come back. A break without a return feels like being abandoned.', 'Agree on a pause phrase together, and a promise to come back.'),
  disagreements('You can both be right', 'Two people can live through the same moment and feel two different things, and both can be true. You don’t have to agree on the facts to respect the feeling.', 'Say “I can see why you felt that way” in your next disagreement.'),
  disagreements('Retire “always” and “never”', '“You always” and “you never” turn one moment into a verdict on a whole person. They make your partner defend their character instead of hearing your point. Be specific about the moment instead.', 'Catch yourself once today before saying “always” or “never.”'),
  disagreements('One topic at a time', 'Bringing up old arguments in a new one is like opening every window in a storm. Stay with one issue, and agree to come back to the others another day.', 'In your next disagreement, keep to one topic and park the rest.'),
  disagreements('It’s not about winning', 'If one of you “wins” an argument, the relationship has usually lost something. The goal of a disagreement is understanding, and an outcome you can both live with.', 'Ask “what would work for both of us?” the next time you disagree.'),

  // Week 4: Knowing each other
  knowing('Keep your love map updated', 'Do you know their closest friend’s latest worry, or what they are quietly hoping for this year? Couples who know each other’s inner world handle stress better, because they are never really facing it as strangers.', 'Ask three things you don’t know: a current worry, a hope, a small joy.'),
  knowing('People change, so keep asking', 'You are not the person you were a year ago, and neither are they. Assuming you already know everything about each other quietly stops the curiosity that made you fall in love.', 'Ask: “What’s something you’ve changed your mind about lately?”'),
  knowing('Learn their stress signals', 'Some people go quiet when stressed, some get sharp, some get busy. Learning your partner’s signals lets you respond with care instead of taking it personally.', 'Notice how they act when stressed, and ask what helps them most.'),
  knowing('Know their comfort', 'Everyone has a small thing that makes a bad day easier: a certain food, a song, a walk, being left alone for an hour. Knowing it means you can help without having to be asked.', 'Ask: “What makes a bad day better for you?” Then remember the answer.'),
  knowing('Where they come from', 'The way your partner handles money, conflict or affection was shaped long before you met. Understanding their family habits turns “why are they like this?” into “oh, that makes sense.”', 'Ask about one habit from their family that shaped them.'),
  knowing('Their quiet fears', 'Most of us carry a worry we rarely say aloud. Being the person it is safe to tell is one of the deepest things a partner can be, and it starts with gently asking.', 'Ask: “Is there something you worry about but rarely say?”'),
  knowing('How do you feel most loved?', 'Some feel loved through words, some through time, touch, help or small gifts. You may be speaking a language your partner isn’t hearing. Asking removes the guesswork.', 'Share how you each feel most loved, and try one of theirs today.'),

  // Week 5: Closeness
  closeness('The slow hug', 'A hug that lasts a few more seconds than usual lets the body relax and the day melt off. It is the quickest way to say “you’re safe with me” without a single word.', 'Hug for a slow count of six when you meet today.'),
  closeness('Turn toward small moments', 'When your partner points out a bird, sighs, or sends a silly reel, they are reaching for you in a small way. Turning toward those moments, again and again, is what keeps closeness alive.', 'Respond warmly to every small thing they share today.'),
  closeness('Touch without a reason', 'A hand on the shoulder or a squeeze of the hand as you pass, with no agenda behind it, says “I’m here and I’m glad you are.” Affection doesn’t always need to lead anywhere.', 'Offer a gentle touch today for no reason at all.'),
  closeness('Make hellos and goodbyes count', 'The first and last minutes of any parting shape how connected you feel. A real hello and a warm goodbye, with eyes and a word, take thirty seconds and carry the whole day.', 'Make every hello and goodbye warm today: eyes, a word, a hug.'),
  closeness('Say “I love you” a new way', 'Even the sweetest words fade into habit. A note in a bag, a voice message, or one specific sentence about why, brings the meaning back.', 'Say “I love you” in a way you haven’t before.'),
  closeness('Share a small joy', 'Laughter is closeness in its lightest form. Sharing something that made you smile, even a tiny thing, reminds you both that you’re each other’s favourite audience.', 'Share something that made you laugh today and laugh about it together.'),
  closeness('Cuddle with no agenda', 'Sitting close for no reason, with no screen and no plan, lets your bodies and minds slow down together. Affection that asks for nothing is the most reassuring kind.', 'Sit close for ten minutes with nothing to do.'),

  // Week 6: Stress & support
  support('Their stress isn’t about you', 'On a hard day your partner may be short with you, and it’s easy to take it personally. A kind “is it a rough day?” turns a snap into a moment of care.', 'When they’re short-tempered, ask “is it a hard day?” before reacting.'),
  support('Be on the same team', 'When something is hard, the question isn’t “whose fault is it?” but “how do we get through this together?” Feeling like a team makes any problem lighter.', 'Pick one worry and say, “let’s handle this together.”'),
  support('Ask how to help', 'We tend to support others the way we want to be supported, which may not be what they need. Asking directly is a gift: “What would help most right now?”', 'Ask: “What would help most right now?” and do exactly that.'),
  support('Protect their rest', 'Tired people are not at their kindest, and that’s true for both of you. Taking one small job off their plate says “I see how much you carry.”', 'Take one chore off their plate today without being asked.'),
  support('Share your high and low', 'A ten-minute daily check-in, one good thing and one hard thing from your day, keeps you part of each other’s real life and stops small stresses from becoming secrets.', 'Tonight, each share one high and one low from your day.'),
  support('Don’t compete with their pain', 'When someone shares a hard moment, the urge to say “I had it worse today” is strong and almost always unhelpful. Let their moment be theirs for now.', 'Listen to a hard moment without matching it with your own.'),
  support('Be their soft landing', 'Home should feel like the place where the world’s noise goes quiet. A calm voice, a warm drink and an easy welcome can do more than any advice.', 'Make tonight gentle for them: a soft voice, something warm, no hurry.'),

  // Week 7: Trust & honesty
  trust('Trust is built in small moments', 'Trust isn’t made by grand promises. It grows from small ones kept: calling when you said you would, being where you said you’d be. Every kept promise is a deposit.', 'Keep one small promise exactly as you made it today.'),
  trust('Say the hard thing kindly', 'Holding back an honest feeling to “keep the peace” often builds distance instead. Saying it gently, early and without blame is kinder than silence that grows.', 'Share one thing you’ve been holding back, gently and without blame.'),
  trust('No small secrets', 'Little things kept quiet, like a purchase, a message or a mistake, start to feel like walls even when nothing serious is hidden. Telling the small truth keeps trust easy.', 'Tell them something small you were tempted to keep to yourself.'),
  trust('Be reliable', 'Being predictable in the best way, doing what you said when you said it, is one of the most romantic things you can offer. It tells your partner they can rest.', 'Do what you said you would do, exactly when you said.'),
  trust('Reassure, don’t interrogate', 'Insecurity makes us want proof. But constant checking pushes people away. Offering reassurance before it’s asked, and asking for it kindly, builds safety for both.', 'Offer a reassuring word today before they have to ask for it.'),
  trust('Admit when you’re wrong', 'Saying “you were right about that” costs a little pride and gives back a great deal of trust. A partner who can be wrong is a partner who is safe to be honest with.', 'Say “you were right” about something today, if it’s true.'),
  trust('Share your insecurities', 'Telling your partner where you feel unsure, and what helps, trades guessing for understanding. It isn’t weakness. It is giving them the key to supporting you.', 'Share one insecurity and one thing that helps when you feel it.'),

  // Week 8: Time together
  time('Quality beats quantity', 'Hours in the same room on separate screens aren’t the same as twenty minutes of real attention. Small, undivided pockets of time keep couples closer than long, distracted ones.', 'Give twenty minutes of fully undivided time today.'),
  time('Put a date in the calendar', 'Plans that aren’t scheduled tend to disappear. A regular time that is just for the two of you, even a coffee, tells your relationship it matters as much as work does.', 'Pick a day this week and put your date in both calendars.'),
  time('Try something new together', 'Novelty brings back the excitement of early love. It doesn’t have to be big: a new street, a new dish, a new game. Shared firsts make shared memories.', 'Do one small new thing together this week.'),
  time('Teach each other something', 'Showing your partner something you love, a song, a skill, a favourite place, lets them see you light up and lets you see them being curious about you.', 'Show your partner something you love and explain why.'),
  time('Make one meal sacred', 'Eating together without screens gives you a daily meeting point. It doesn’t need to be fancy, just regular and phone-free.', 'Eat one meal together today with screens away.'),
  time('Walk and talk', 'Conversations side by side, on a walk or a drive, often feel easier than face to face. Moving together helps hard topics come out gently.', 'Take a fifteen-minute walk together and just talk.'),
  time('Guard your time together', 'Work, family and phones will always ask for more. Deciding in advance what is protected, such as an evening or a weekend morning, keeps the relationship from getting the leftovers.', 'Protect one hour tonight from work and screens.'),

  // Week 9: Dreams & growth
  dreams('Ask about their dreams', 'People rarely get asked about what they hope for. Asking, and really listening, shows you care about who they are becoming, not just who they are today.', 'Ask: “What do you want your life to look like in five years?”'),
  dreams('Be their biggest supporter', 'A partner who says “I believe you can” at the right moment can change what someone tries. Encouragement is one of the cheapest and strongest gifts in a relationship.', 'Tell them “I believe in you” about one specific goal.'),
  dreams('Grow together, not apart', 'Two people who stay curious about each other’s changes grow closer. Two who stop sharing what they’re learning slowly become roommates.', 'Share one thing you’re learning or thinking about lately.'),
  dreams('Support their own space', 'Being close doesn’t mean doing everything together. Cheering on their friends, hobbies and solo time shows you trust the relationship to be strong enough.', 'Encourage something they do that is just for them.'),
  dreams('Plan something together', 'Having a shared goal, a trip, a home, a habit, gives you something to work towards and look forward to. Couples with a shared future feel like teammates.', 'Write down one thing you want to achieve together this year.'),
  dreams('Celebrate small wins', 'We save celebration for big things and miss the many small ones. A finished task, a hard conversation, a brave step: all deserve a “well done.”', 'Celebrate one small win of theirs today, out loud.'),
  dreams('Respect their pace', 'You and your partner may move at different speeds on big decisions. Pushing makes people dig in. Asking “what pace feels right?” keeps you together on the journey.', 'Ask what pace feels comfortable on something you’re deciding together.'),

  // Week 10: Little rituals
  rituals('A morning moment', 'A tiny ritual to start the day, a shared tea, a hug, a message, tells you both you’re not facing the day alone. It’s the consistency, not the size, that matters.', 'Start tomorrow with one small thing you do together.'),
  rituals('A goodnight ritual', 'Ending the day with a kind word, however short, leaves you both feeling connected even after a hard day. It’s hard to stay distant when every night ends warmly.', 'End tonight with one kind sentence for each other.'),
  rituals('The weekly check-in', 'A short weekly chat about “how are we doing, and what would you like more of?” catches small issues early, before they become big ones.', 'Ask: “How are we doing, and what would you like more of?”'),
  rituals('Mark the small dates', 'You don’t need to wait for the big anniversary. Marking a monthly date or a special day in a tiny way keeps your story feeling alive.', 'Plan a tiny way to mark something you’ve both been proud of.'),
  rituals('A ritual for hard days', 'Agree together on what you’ll do on a bad day: a certain snack, a walk, a movie. Having it ready means no one has to figure it out while hurting.', 'Decide together what your “hard day” comfort ritual will be.'),
  rituals('Bring back the inside joke', 'Private jokes are the shorthand of a relationship. Remembering one brings back the early days and the feeling of being on the same wavelength.', 'Bring back an old inside joke and laugh about how it started.'),
  rituals('Start a tiny tradition', 'A Sunday breakfast, a yearly trip, a song you play on the first of the month. Traditions turn ordinary time into “our” time.', 'Choose one small tradition you’d like to start together.'),

  // Week 11: Forgiveness & repair
  repair('Make a repair attempt', 'In the middle of tension, a small gesture, a gentle joke, a touch, “can we try again?”, can break the spell. What matters is trying, and accepting the attempt when it comes.', 'If tension comes up, try one small repair gesture, or accept one.'),
  repair('Apologise fully', 'A real apology names what you did, acknowledges how it felt, and says what you’ll do differently. “Sorry you’re upset” isn’t one. “I’m sorry I interrupted you, I know it felt dismissive” is.', 'If you owe an apology, make it specific, with what you’ll do differently.'),
  repair('Accept an apology kindly', 'When your partner apologises, a long lecture in reply undoes the courage it took. “Thank you for saying that” opens the door to being close again.', 'When an apology comes, accept it simply and warmly.'),
  repair('Stop keeping score', 'Keeping a mental tally of who did what, who owes what, turns a partnership into a ledger. Letting small things go leaves room for generosity to grow.', 'Let go of one small grudge today, without announcing it.'),
  repair('Own your part', 'Rarely is a tension entirely one person’s doing. Naming your own part, even a small one, changes the whole feel of a conversation. It invites them to do the same.', 'Name one thing you contributed to a recent tension.'),
  repair('Don’t carry shame', 'Feeling bad about a mistake is useful; feeling like a bad person isn’t. Telling your partner what you’re working on, without drowning in guilt, invites support rather than distance.', 'Tell your partner one thing you’re working on, without shame.'),
  repair('Reconnect after conflict', 'After a disagreement, small warm moments matter a lot: a cup of tea, a hand held, a shared show. They tell your hearts that the closeness is still there.', 'After your next disagreement, do one warm thing together.'),

  // Week 12: Gratitude & us
  us('Retell your story', 'Remembering how you met and what you noticed first reminds you what drew you together. Couples who tell their story fondly tend to feel closer to each other.', 'Retell how you met, and each share what you first noticed.'),
  us('How you’ve grown together', 'Looking back at what was hard a year ago and how you handled it reveals strengths you may have forgotten you have. Growth is easy to miss from the inside.', 'Name one way you’ve each grown since you got together.'),
  us('Write a thank-you note', 'A few written lines of thanks can be kept, reread and cherished long after the moment. It costs you five minutes and means a great deal.', 'Write three lines of thanks and give them to your partner.'),
  us('I’d choose you again', 'Telling someone “I’d choose you all over again” and saying why is one of the most powerful sentences in a relationship. Make it specific and true.', 'Tell them one specific reason you’d choose them again.'),
  us('Name your strengths as a couple', 'Most of us notice what we need to fix. Naming what you’re good at together, how you laugh, how you handle crises, builds confidence for harder days.', 'Name three things you do well as a team.'),
  us('Look forward together', 'Having something you both look forward to, big or small, gives a relationship its forward energy. It reminds you both that the best parts are still coming.', 'Say one thing you’re looking forward to doing together.'),
  us('We are on the same side', 'Through every disagreement, long day and busy week, you are meant to be on the same side. Remembering that is the heart of every lesson you’ve read here.', 'Tell them, in your own words, “we’re a team.”'),
];

/** Day numbers are the same for both partners, so they always get the same lesson. */
export function lessonForDay(dayNo: number): Lesson {
  const total = LESSONS.length;
  const index = ((dayNo % total) + total) % total;
  return LESSONS[index] as Lesson;
}

export function lessonDayNumber(dayNo: number): number {
  const total = LESSONS.length;
  return (((dayNo % total) + total) % total) + 1;
}

export const LESSON_COUNT = LESSONS.length;
