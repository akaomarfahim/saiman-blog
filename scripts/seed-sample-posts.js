/**
 * Adds 5 sample blog posts so you can see the homepage hero grid
 * (1 big featured post + 3 smaller side posts + 1 more below) filled in.
 *
 * Run once from the project root:
 *   node scripts/seed-sample-posts.js
 *
 * Safe to run on a fresh install — it looks up your real admin account
 * ID from data/users.json so posts show the correct byline, and it
 * skips adding duplicates if you run it more than once.
 */
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const usersPath = path.join(DATA_DIR, 'users.json');
const postsPath = path.join(DATA_DIR, 'posts.json');

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
}

const users = readJSON(usersPath);
const admin = users.find((u) => u.role === 'admin');

if (!admin) {
  console.error('No admin account found in data/users.json.');
  console.error('Start the server once first (npm start) so it can seed your admin account, then run this script again.');
  process.exit(1);
}

const samplePosts = [
  {
    title: 'Five Mornings, Five Cities',
    excerpt: 'A short travel diary from a month spent chasing sunrise across five very different places.',
    content:
      'I started keeping a list a few years ago: every city, one sunrise, one honest sentence about how it felt to be there.\n' +
      'Lisbon smelled like the sea and old stone before the trams even started running.\n' +
      'Kyoto was silent except for a single bell somewhere past the temple gate.\n' +
      'The list is longer now, but the rule has stayed the same. One sentence. No photos allowed until after.\n' +
      'I think that rule is the whole point.',
  },
  {
    title: 'What I Learned From a Year of Cooking Badly',
    excerpt: "Twelve months, no recipes, and more kitchen disasters than I'd like to admit.",
    content:
      'I gave myself one rule at the start of the year: no recipes, just ingredients and instinct.\n' +
      'The first few weeks were rough. I over-salted more soup than I care to remember.\n' +
      'But somewhere around month four, something shifted. I stopped measuring and started tasting.\n' +
      "That's the whole lesson, really. Cooking badly on purpose taught me more than any cookbook did.",
  },
  {
    title: 'The Quiet Case for Slow Reading',
    excerpt: 'Why I stopped tracking how many books I read this year, and started paying attention instead.',
    content:
      'For a long time I measured my reading in numbers. Books per month, pages per night.\n' +
      "Then I read one novel over six weeks instead of six days, and something clicked.\n" +
      'I remembered whole passages instead of just plot points. I noticed the sentences, not just the story.\n' +
      "Slow reading isn't about doing less. It's about actually being there for what you're reading.",
  },
  {
    title: 'Notes on Building Something Small',
    excerpt: 'Thoughts on why the tiny side project mattered more than the big one ever did.',
    content:
      "The big project took a year and taught me almost nothing new.\n" +
      'The small one took a weekend and changed how I think about starting things.\n' +
      "There's a kind of clarity that only shows up when the stakes are low enough to actually experiment.\n" +
      "I'm trying to build more small things on purpose now, instead of waiting for the big idea.",
  },
  {
    title: 'A Letter to Myself, Five Years Ago',
    excerpt: "Some things I wish I'd known before I started, written as a letter instead of a list.",
    content:
      "You're going to worry about a lot of things that never happen, and miss a few that do.\n" +
      "That's fine. That's just how it goes.\n" +
      "You'll get better at this slowly, in a way you won't notice until you look back.\n" +
      "So look back more often. It helps more than you'd think.",
  },
];

const existingPosts = readJSON(postsPath);
const existingTitles = new Set(existingPosts.map((p) => p.title));

let added = 0;
const now = Date.now();

samplePosts.forEach((sample, i) => {
  if (existingTitles.has(sample.title)) return; // don't duplicate on re-run

  // Stagger timestamps so posts sort newest-first in a sensible order,
  // with the last sample post in the array ending up as the featured one.
  const createdAt = new Date(now - (samplePosts.length - i) * 3600 * 1000).toISOString();

  existingPosts.push({
    id: randomUUID(),
    title: sample.title,
    slug: slugify(sample.title),
    excerpt: sample.excerpt,
    content: sample.content,
    imageUrl: null,
    authorId: admin.id,
    createdAt,
    updatedAt: createdAt,
  });
  added += 1;
});

fs.writeFileSync(postsPath, JSON.stringify(existingPosts, null, 2));
console.log(`Added ${added} sample post(s). ${samplePosts.length - added} already existed and were skipped.`);
console.log('Start the server (npm start) and visit http://localhost:3000 to see them.');
