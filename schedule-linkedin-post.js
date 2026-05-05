import 'dotenv/config';
import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { cloudinary } from './client.js';

const TOKEN = process.env.BUFFER_API_TOKEN;
const CHANNEL_ID = process.env.LINKEDIN_CHANNEL_ID;
const URL = 'https://api.buffer.com/graphql';

// === Edit these for each post ===
const SLIDES = [
  './output/slide-1-hook.png',
  './output/slide-2-humanizer.png',
  './output/slide-3-diagram.png',
  './output/slide-4-remotion.png',
  './output/slide-5-frontend.png',
  './output/slide-6-pdf-cta.png',
];

const POST_TEXT = `I used to think Claude "skills" were a gimmick.

Nice idea, marketing fluff, real work still happens in the chat window.

I was wrong.

Six months later, five of them do most of the work in my day:

1. Humanizer — strips the AI fingerprints out of my drafts. Em-dashes, "delve", every parallelism. The output reads like me.

2. Architecture-diagram-creator — describe a system, get a clean diagram. I haven't opened Figma to draw a flow chart in months.

3. Remotion — I write JSX, I get a rendered video. My short-form workflow is now a folder of scripts.

4. Frontend-design — "build me a landing page for X" produces something that doesn't look AI-generated. First try.

5. PDF — read, write, merge, fill, OCR. The unglamorous half of every contract and invoice job is gone.

The reason it took me so long to use them: I was treating Claude like a chatbot when it was already an OS.

Full walkthrough of how I use each one is on YouTube — link in the comments.

#ClaudeAI #AI #Productivity #BuildInPublic`;

const DOC_TITLE = "5 Claude Skills I Can't Live Without";
const PDF_FOLDER = 'carousel/claude-skills/2026-05-05';
const PDF_PUBLIC_ID = 'carousel-claude-skills';
const THUMBNAIL_URL = 'https://res.cloudinary.com/dbmdg3kmz/image/upload/v1777947242/carousel/claude-skills/2026-05-05/slide-1-hook.png';
const DUE_AT = '2026-05-06T09:30:00+10:00';
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

// PDFs must be uploaded as resource_type='raw' so Cloudinary serves them
// with Content-Type: application/pdf. The default 'image' type is blocked
// by Cloudinary's PDF/ZIP delivery security setting.
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
    console.log(`\n✓ Scheduled. Post ID: ${post.post.id}`);
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
