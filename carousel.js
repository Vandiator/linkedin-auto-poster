import 'dotenv/config';
import OpenAI, { toFile } from 'openai';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { uploadMedia } from './upload.js';

const MIME_BY_EXT = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

async function loadRef(filePath) {
  const buf = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const mime = MIME_BY_EXT[ext] ?? 'image/jpeg';
  const safeName = basename(filePath).replace(/[^a-zA-Z0-9._-]/g, '_');
  return await toFile(buf, safeName, { type: mime });
}

const openai = new OpenAI();

const STYLE_REFS = [
  'Style-Guide/thumbnail-3 (4).jpg',
  'Style-Guide/thumbnail-1 (22).jpg',
];

const STYLE_RULES = `
Visual style — match these exactly:
- Background: near-black with a subtle blue/grey grid pattern, soft warm orange ambient glow from one corner.
- Typography: bold uppercase condensed sans-serif headlines (think Anton or Bebas Neue). Some words pure white; the punchline word sits inside a chunky solid yellow rectangular highlight block with black text.
- Lighting: soft warm orange rim light on objects, dark falloff to edges.
- Objects: rendered as clean, modern 3D with soft shadows and slight gloss — laptop, phone, dashboard cards, app icons floating.
- Mascot: a soft 3D rounded-square character, terracotta-orange clay material, with bold black ">" and "<" eyes (closed/squinting). It can hold things or peek into the frame.
- No real photos of people. No human faces. Mascot only.
- Aspect ratio: 1:1 square. Composition kept centered with safe margins so nothing critical hits the edges.
- Mood: confident, modern AI-builder energy — same vibe as a premium YouTube tech thumbnail.
`;

const TOPIC = '5 Claude Skills I Cant Live Without';
const FOLDER_SLUG = 'claude-skills';

const slides = [
  {
    id: 'slide-1-hook',
    label: 'Hook',
    prompt: `INSTAGRAM CAROUSEL SLIDE 1 OF 6 — HOOK.
Headline composition (top 50% of frame, large):
Line 1 (white, all-caps): "5 CLAUDE SKILLS"
Line 2 (black text inside a chunky solid yellow highlight block, all-caps): "I CAN'T LIVE WITHOUT"

Below the headline, a vertical numbered list (1 through 5) rendered as five clean 3D rounded-square tiles stacked or arranged in a tight 2-column grid floating on the dark grid surface, each tile a soft warm-grey or off-white with a tiny different colored accent dot. Each tile shows a number badge (1, 2, 3, 4, 5) and a placeholder word: "HUMANIZER", "DIAGRAM", "REMOTION", "FRONTEND", "PDF" — one per tile. Bold, black text on each tile.

Bottom-right corner: small white "Swipe →" cue.

${STYLE_RULES}`,
  },
  {
    id: 'slide-2-humanizer',
    label: 'Humanizer',
    prompt: `INSTAGRAM CAROUSEL SLIDE 2 OF 6 — SKILL #1.
Top-left small label (white, sans-serif): "01 / 05"
Headline composition:
Line 1 (white, all-caps): "MAKE AI WRITING"
Line 2 (black text inside chunky solid yellow highlight block, all-caps): "SOUND HUMAN"

Below, on the dark grid surface: a clean 3D scene showing a sheet of paper with typed text on it, where some words are highlighted/scrubbed and being "rewritten" — soft glowing ink trails replacing stiff text. Next to the paper, a small 3D rounded-square "skill chip" tile that reads "/humanizer" in clean monospace black text on white.
The orange clay mascot peeks in from one side, > < eyes, holding a tiny eraser or red pen.

Bottom-center caption (small white text): "Skill: humanizer"

${STYLE_RULES}`,
  },
  {
    id: 'slide-3-diagram',
    label: 'Diagram',
    prompt: `INSTAGRAM CAROUSEL SLIDE 3 OF 6 — SKILL #2.
Top-left small label (white, sans-serif): "02 / 05"
Headline composition:
Line 1 (white, all-caps): "ARCHITECTURE DIAGRAMS"
Line 2 (black text inside chunky solid yellow highlight block, all-caps): "IN ONE PROMPT"

Below, on the dark grid surface: a clean 3D rendered architecture flow diagram floating in mid-air — three or four rounded-rectangle nodes connected by glowing orange directional arrows, with small icons inside each node (database cylinder, gear, cloud, screen). Soft shadows beneath.
Next to the diagram, a small 3D "skill chip" tile reading "/diagram" in monospace black text on white.

Bottom-center caption (small white text): "Skill: architecture-diagram-creator"

${STYLE_RULES}`,
  },
  {
    id: 'slide-4-remotion',
    label: 'Remotion',
    prompt: `INSTAGRAM CAROUSEL SLIDE 4 OF 6 — SKILL #3.
Top-left small label (white, sans-serif): "03 / 05"
Headline composition:
Line 1 (white, all-caps): "MAKE VIDEOS"
Line 2 (black text inside chunky solid yellow highlight block, all-caps): "WITH CODE"

Below, on the dark grid surface: a clean 3D scene of a film clapperboard merged with a code editor — a stylized monitor showing JSX code with timeline scrubber bars at the bottom, and a glowing orange play button overlay. A small filmstrip curl floats nearby.
Next to it, a small 3D "skill chip" tile reading "/remotion" in monospace black text on white.

Bottom-center caption (small white text): "Skill: Remotion video-as-code"

${STYLE_RULES}`,
  },
  {
    id: 'slide-5-frontend',
    label: 'Frontend Design',
    prompt: `INSTAGRAM CAROUSEL SLIDE 5 OF 6 — SKILL #4.
Top-left small label (white, sans-serif): "04 / 05"
Headline composition:
Line 1 (white, all-caps): "PRODUCTION UI"
Line 2 (black text inside chunky solid yellow highlight block, all-caps): "IN ONE SHOT"

Below, on the dark grid surface: a clean 3D scene with a tilted laptop showing a sleek modern web app hero section (big heading, gradient buttons, a card grid). Floating beside the laptop, a smaller phone showing the responsive version of the same UI. Soft warm glow.
Next to the devices, a small 3D "skill chip" tile reading "/frontend-design" in monospace black text on white.

Bottom-center caption (small white text): "Skill: frontend-design"

${STYLE_RULES}`,
  },
  {
    id: 'slide-6-pdf-cta',
    label: 'PDF + CTA',
    prompt: `INSTAGRAM CAROUSEL SLIDE 6 OF 6 — SKILL #5 + CTA.
Top-left small label (white, sans-serif): "05 / 05"
Headline composition:
Line 1 (white, all-caps): "READ, WRITE, MERGE"
Line 2 (black text inside chunky solid yellow highlight block, all-caps): "ANY PDF"

Center: a clean 3D scene of two PDF documents tilted toward the viewer, one being merged into the other with soft glowing seam lines. A small 3D "skill chip" tile reading "/pdf" in monospace black text on white floats nearby.

Below the visual, smaller clean white text (sentence case, not all caps): "Comment 'SKILLS' for my full Claude Code setup"
The orange clay mascot stands at bottom-right pointing forward enthusiastically, both arms raised, > < eyes, surrounded by a soft warm orange glow.

${STYLE_RULES}`,
  },
];

async function generateSlide(slide, refFiles) {
  const candidates = ['gpt-image-2', 'gpt-image-1'];
  let lastError;
  for (const model of candidates) {
    try {
      console.log(`[${slide.id}] Generating with ${model}...`);
      const result = await openai.images.edit({
        model,
        image: refFiles,
        prompt: slide.prompt,
        size: '1024x1024',
        quality: 'high',
        n: 1,
      });
      const b64 = result.data[0].b64_json;
      const localPath = `./output/${slide.id}.png`;
      writeFileSync(localPath, Buffer.from(b64, 'base64'));
      console.log(`[${slide.id}] Saved local. Uploading to Cloudinary...`);
      const dateSlug = new Date().toISOString().slice(0, 10);
      const upload = await uploadMedia(localPath, {
        folder: `carousel/${FOLDER_SLUG}/${dateSlug}`,
        publicId: slide.id,
        tags: ['carousel', 'instagram', FOLDER_SLUG, slide.label.toLowerCase()],
      });
      return { ...upload, model, label: slide.label };
    } catch (e) {
      lastError = e;
      const isModelMissing = /not.*found|invalid.*model|does not exist|model.*available|unknown.*model/i.test(e.message);
      if (model === candidates[0] && isModelMissing) {
        console.log(`[${slide.id}] ${model} unavailable, falling back...`);
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

async function main() {
  mkdirSync('./output', { recursive: true });
  console.log('Loading style reference images...');
  const refFiles = await Promise.all(STYLE_REFS.map(loadRef));

  const results = [];
  for (const slide of slides) {
    try {
      const r = await generateSlide(slide, refFiles);
      results.push({ slide: slide.id, label: r.label, url: r.url, model: r.model });
      console.log(`[${slide.id}] DONE — ${r.url}`);
    } catch (e) {
      console.error(`[${slide.id}] FAILED: ${e.message}`);
      results.push({ slide: slide.id, error: e.message });
    }
  }

  console.log('\n=== Carousel Results ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
