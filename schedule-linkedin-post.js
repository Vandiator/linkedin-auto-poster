import 'dotenv/config';
import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { cloudinary } from './client.js';

const TOKEN = process.env.BUFFER_API_TOKEN;
const CHANNEL_ID = process.env.LINKEDIN_CHANNEL_ID;
const URL = 'https://api.buffer.com/graphql';

// ✏️ CHANGED: Slide filenames updated to match new carousel.js slide IDs
const SLIDES = [
  './output/slide-1-hook.png',
  './output/slide-2-ai-agents.png',
  './output/slide-3-gpt5-era.png',
  './output/slide-4-ai-coding.png',
  './output/slide-5-ai-design.png',
  './output/slide-6-cta.png',
];

// ✏️ CHANGED: Post text rewritten for tech/AI news topic
const POST_TEXT = `The tech landscape is shifting faster than most people realize.

Here's what's actually changing right now — and what it means for you:

🤖 AI Agents are no longer a demo.
They're replacing entire workflows. 68% of repetitive tasks can be automated today.

🧠 New AI models are rewriting the rules.
Multimodal reasoning. Real-time web access. On-device AI. The gap between "AI" and "human" is closing fast.

💻 AI is writing your code.
GitHub Copilot, Claude Code, Cursor AI — devs who use these are outperforming those who don't.

🎨 Design just got disrupted.
Prompt → Generate → Refine → Export. What used to take days now takes minutes.

🚀 What's coming next:
• Humanoid robots entering mass production
• AI browsers that navigate the web for you
• Spatial computing going mainstream
• Open Source AGI closer than you think

The question isn't whether this will affect your industry.
It's whether you'll be ready when it does.

Follow for weekly tech and AI updates that actually matter.

#AI #Tech #FutureOfWork #ArtificialIntelligence #Innovation`;

// ✏️ CHANGED: Document title, folder, and public ID updated for new topic
const DOC_TITLE = 'Latest Tech & AI Updates You Need To Know';
const PDF_FOLDER = 'carousel/tech-ai-news';
const PDF_PUBLIC_ID = 'carousel-tech-ai-news';

// ✏️ CHANGED: Replace this with your actual Cloudinary URL for slide-1-hook.png
// You can find it in your Cloudinary dashboard or from the carousel.js output above
const THUMBNAIL_URL = 'YOUR_CLOUDINARY_URL_FOR_SLIDE_1_HERE';

// ✏️ CHANGED: Set your desired post date and time (ISO format, your timezone)
// Example: '2026-05-19T09:00:00+05:30' = tomorrow at 9am India time
const DUE_AT = '2026-05-19T09:00:00+05:30';
// =================================

async function gql(query, variables = {}) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function buildPdf() {
  console.log(`Stitching ${SLIDES.length} slides into PDF...`);
  const pdf = await PDFDocument.create();
  for (const path of SLIDES) {
    const bytes = readFileSync(path);
    const img = await pdf.embedPng(bytes);
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const out = await pdf.save();
  mkdirSync('./output', { recursive: true });
  const localPath = `./output/${PDF_PUBLIC_ID}.pdf`;
  writeFileSync(localPath, out);
  console.log(`PDF written: ${(out.length / 1024).toFixed(0)} KB, ${SLIDES.length} pages`);
  return localPath;
}

async function uploadPdfAsRaw(localPath) {
  console.log('\nUploading PDF to Cloudinary (raw)...');
  const result = await cloudinary.uploader.upload(localPath, {
    resource_type: 'raw',
    folder: PDF_FOLDER,
    public_id: `${PDF_PUBLIC_ID}.pdf`,
    use_filename: false,
    overwrite: true,
    tags: ['carousel', 'linkedin', 'pdf'],
  });
  console.log(`PDF URL: ${result.secure_url}`);
  return result.secure_url;
}

async function verifyAccessible(url) {
  const res = await fetch(url, { method: 'HEAD' });
  if (!res.ok) {
    throw new Error(
      `PDF not publicly accessible (HTTP ${res.status}). ` +
      `Check Cloudinary security settings: ` +
      `https://console.cloudinary.com/settings/security → "Allow delivery of PDF and ZIP files"`
    );
  }
  console.log(`Verified: ${res.status} ${res.headers.get('content-type')}`);
}

async function schedulePost(pdfUrl) {
  console.log('\nScheduling via Buffer GraphQL...');
  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
        ... on PostActionSuccess { post { id status dueAt } }
        ... on NotFoundError { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError { message }
        ... on RestProxyError { message link code }
        ... on LimitReachedError { message }
        ... on InvalidInputError { message }
      }
    }
  `;
  const input = {
    channelId: CHANNEL_ID,
    text: POST_TEXT,
    schedulingType: 'automatic',
    mode: 'customScheduled',
    dueAt: DUE_AT,
    assets: {
      documents: [{
        url: pdfUrl,
        title: DOC_TITLE,
        thumbnailUrl: THUMBNAIL_URL,
      }],
    },
  };
  return gql(mutation, { input });
}

async function main() {
  if (!TOKEN) { console.error('Missing BUFFER_API_TOKEN in .env'); process.exit(1); }
  if (!CHANNEL_ID) { console.error('Missing LINKEDIN_CHANNEL_ID in .env'); process.exit(1); }

  const localPath = await buildPdf();
  const pdfUrl = await uploadPdfAsRaw(localPath);
  await verifyAccessible(pdfUrl);
  const result = await schedulePost(pdfUrl);

  console.log('\n=== Buffer response ===');
  console.log(JSON.stringify(result, null, 2));

  const post = result.data?.createPost;
  if (post?.__typename === 'PostActionSuccess') {
    console.log(`\n✓ Scheduled! Post ID: ${post.post.id}`);
    console.log(`  Status: ${post.post.status}`);
    console.log(`  Due at: ${post.post.dueAt}`);
  } else if (post?.message) {
    console.error(`\nFAILED (${post.__typename}): ${post.message}`);
    process.exit(1);
  } else if (result.errors) {
    console.error('\nFAILED — see errors above.');
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
