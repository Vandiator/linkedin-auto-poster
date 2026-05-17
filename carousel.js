import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { writeFileSync, mkdirSync } from 'node:fs';
import { uploadMedia } from './upload.js';

// ─── Gemini client (reads GEMINI_API_KEY from .env) ───────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── YOUR SETTINGS ────────────────────────────────────────────────────────
// ✏️ CHANGED: Topic and folder slug updated to tech news theme
const TOPIC = 'Latest Tech & AI Updates You Need To Know';
const FOLDER_SLUG = 'tech-ai-news';

// ─── STYLE RULES ──────────────────────────────────────────────────────────
// ✏️ CHANGED: Entire style rewritten — professional blue/white LinkedIn look
const STYLE_RULES = `
Visual style — follow exactly:
- Background: clean white or very light grey (#F7F9FC). No dark backgrounds.
- Accent color: strong professional blue (#0A66C2 — LinkedIn blue) used for highlight blocks, borders, icons, and divider lines.
- Typography: clean modern sans-serif (Inter or Helvetica style). Headlines in deep navy (#0D1B2A), bold. Subtext in medium grey (#4A5568).
- Key headline words sit inside a solid LinkedIn-blue rectangular highlight block with white text inside.
- Layout: minimal, structured, lots of breathing room. Think McKinsey slide meets LinkedIn post.
- Icons and illustrations: flat 2D line-art style icons in blue and navy. No 3D rendering. No clay characters. No mascots.
- Data or stats: displayed inside clean rounded-rectangle cards with a thin blue border, white fill, and a blue accent bar on the left edge.
- Dividers: thin single-line blue horizontal rules to separate sections.
- No gradients. No glow effects. No dark moody lighting.
- Aspect ratio: 1:1 square. Clean margins on all sides (at least 8% padding).
- Mood: authoritative, professional, trustworthy — like a top LinkedIn thought leader's post.
- Bottom of every slide: a thin blue bottom bar with small white text "Tech & AI Weekly" centered.
`;

// ─── SLIDES ───────────────────────────────────────────────────────────────
// ✏️ CHANGED: All 6 slides rewritten for tech/AI news topic
const slides = [
  {
    id: 'slide-1-hook',
    label: 'Hook',
    prompt: `LINKEDIN CAROUSEL SLIDE 1 OF 6 — HOOK.
Clean white background, professional layout.

Top section:
- Small blue label tag (rounded pill shape): "TECH & AI UPDATE"
- Main headline (large, bold, deep navy): "THE TECH SHIFTS"
- Second line (white text inside solid LinkedIn-blue highlight block, bold): "HAPPENING RIGHT NOW"
- Below headline: a thin blue horizontal divider line.

Center section:
A clean 2x3 grid of six flat icon cards (white cards, thin blue border, blue accent left bar), each showing:
Card 1: rocket icon + "AI Agents"
Card 2: chip icon + "GPT-5 Era"
Card 3: code bracket icon + "AI Coding"
Card 4: paintbrush icon + "AI Design"
Card 5: globe icon + "Open Source AI"
Card 6: arrow icon + "What's Next"
All card text in navy, icons in LinkedIn blue.

Bottom-right: small navy text "Swipe to explore →"
Bottom bar: thin blue bar, white text "Tech & AI Weekly"
${STYLE_RULES}`,
  },
  {
    id: 'slide-2-ai-agents',
    label: 'AI Agents',
    prompt: `LINKEDIN CAROUSEL SLIDE 2 OF 6 — AI AGENTS.
Clean white background, professional layout.

Top-left: small blue pill label "01 / 05"
Headline:
Line 1 (bold navy): "AI AGENTS ARE"
Line 2 (white text in solid blue highlight block): "REPLACING WORKFLOWS"

Below headline, thin blue divider.

Center: three clean white rounded-rectangle stat cards arranged horizontally, each with a thin blue border and blue left accent bar:
Card 1: blue icon of a robot/agent — bold navy number "68%" — grey subtext "of repetitive tasks can be automated by AI agents in 2025"
Card 2: blue icon of a chain/workflow — bold navy "$4.4T" — grey subtext "estimated productivity gain from AI agents by 2030"
Card 3: blue icon of a lightning bolt — bold navy "10x" — grey subtext "faster task completion vs manual workflows"

Below cards: one clean line of navy text (small, sentence case): "Tools leading this: AutoGPT, Claude, LangChain, CrewAI"

Bottom bar: thin blue bar, white text "Tech & AI Weekly"
${STYLE_RULES}`,
  },
  {
    id: 'slide-3-gpt5-era',
    label: 'GPT-5 Era',
    prompt: `LINKEDIN CAROUSEL SLIDE 3 OF 6 — THE NEW AI MODELS.
Clean white background, professional layout.

Top-left: small blue pill label "02 / 05"
Headline:
Line 1 (bold navy): "NEW AI MODELS ARE"
Line 2 (white text in solid blue highlight block): "CHANGING EVERYTHING"

Below headline, thin blue divider.

Center: a clean vertical comparison list — four rows, each row is a white card with blue left accent bar:
Row 1: blue dot + navy bold "Multimodal reasoning" — grey text "Models now see, hear, and read simultaneously"
Row 2: blue dot + navy bold "Real-time web access" — grey text "AI answers are no longer stuck in the past"
Row 3: blue dot + navy bold "Longer context windows" — grey text "Entire codebases and books fit in one prompt"
Row 4: blue dot + navy bold "On-device AI" — grey text "Powerful models running locally on your laptop"

Bottom bar: thin blue bar, white text "Tech & AI Weekly"
${STYLE_RULES}`,
  },
  {
    id: 'slide-4-ai-coding',
    label: 'AI Coding',
    prompt: `LINKEDIN CAROUSEL SLIDE 4 OF 6 — AI CODING TOOLS.
Clean white background, professional layout.

Top-left: small blue pill label "03 / 05"
Headline:
Line 1 (bold navy): "AI IS WRITING"
Line 2 (white text in solid blue highlight block): "YOUR CODE NOW"

Below headline, thin blue divider.

Center: a clean 2x2 grid of four tool cards (white, thin blue border, blue top accent bar):
Card 1: code icon — navy bold "GitHub Copilot" — grey text "Autocomplete for entire functions"
Card 2: terminal icon — navy bold "Claude Code" — grey text "Agentic coding in your terminal"
Card 3: cursor icon — navy bold "Cursor AI" — grey text "AI-native code editor"
Card 4: bolt icon — navy bold "Devin" — grey text "World's first AI software engineer"

Below grid, small navy sentence: "Junior devs who use these tools are outperforming seniors who don't."

Bottom bar: thin blue bar, white text "Tech & AI Weekly"
${STYLE_RULES}`,
  },
  {
    id: 'slide-5-ai-design',
    label: 'AI Design',
    prompt: `LINKEDIN CAROUSEL SLIDE 5 OF 6 — AI IN DESIGN.
Clean white background, professional layout.

Top-left: small blue pill label "04 / 05"
Headline:
Line 1 (bold navy): "DESIGN JUST GOT"
Line 2 (white text in solid blue highlight block): "DISRUPTED BY AI"

Below headline, thin blue divider.

Center: a clean horizontal timeline (left to right) with four steps connected by a thin blue line and blue dot nodes:
Step 1: navy bold "Prompt" — grey text "Describe what you want"
Step 2: navy bold "Generate" — grey text "AI creates multiple variations"
Step 3: navy bold "Refine" — grey text "Edit with natural language"
Step 4: navy bold "Export" — grey text "Production-ready in minutes"

Below timeline, a clean white card with blue left accent bar:
Navy bold text: "Tools: Midjourney V7, Figma AI, Adobe Firefly, Canva AI"
Grey subtext: "Design teams are 3x faster — or being replaced entirely."

Bottom bar: thin blue bar, white text "Tech & AI Weekly"
${STYLE_RULES}`,
  },
  {
    id: 'slide-6-cta',
    label: 'CTA',
    prompt: `LINKEDIN CAROUSEL SLIDE 6 OF 6 — WHAT'S NEXT + CTA.
Clean white background, professional layout.

Top-left: small blue pill label "05 / 05"
Headline:
Line 1 (bold navy): "STAY AHEAD OF"
Line 2 (white text in solid blue highlight block): "EVERY AI SHIFT"

Below headline, thin blue divider.

Center: a clean white rounded card with a thin blue border and subtle blue top accent bar, containing:
- Navy bold title: "What's coming next:"
- Four clean bullet rows (blue bullet dot, navy bold label, grey description text):
  • "Humanoid robots" — Mass production begins in 2025
  • "AI Browsers" — Agents that browse the web for you
  • "Spatial Computing" — Apple Vision Pro ecosystem exploding
  • "Open Source AGI" — Meta and Mistral closing the gap fast

Below card: clean navy text (centered, sentence case): "Follow for weekly updates on what's changing in tech and AI."

A single clean blue rounded CTA button shape (flat, no shadow) with white bold text: "Follow for more →"

Bottom bar: thin blue bar, white text "Tech & AI Weekly"
${STYLE_RULES}`,
  },
];

// ─── GENERATE ONE SLIDE via Gemini 2.0 Flash (FREE) ──────────────────────
async function generateSlide(slide) {
  console.log(`[${slide.id}] Generating with Gemini 2.0 Flash (free)...`);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts: [{ text: slide.prompt }] }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  const parts = response.candidates[0].content.parts;
  const imagePart = parts.find(p => p.inlineData);
  if (!imagePart) throw new Error('No image returned by Gemini');

  const imageBytes = imagePart.inlineData.data;
  const localPath = `./output/${slide.id}.png`;
  writeFileSync(localPath, Buffer.from(imageBytes, 'base64'));
  console.log(`[${slide.id}] Saved locally. Uploading to Cloudinary...`);

  const dateSlug = new Date().toISOString().slice(0, 10);
  const upload = await uploadMedia(localPath, {
    folder: `carousel/${FOLDER_SLUG}/${dateSlug}`,
    publicId: slide.id,
    tags: ['carousel', 'linkedin', FOLDER_SLUG, slide.label.toLowerCase()],
  });

  return { ...upload, label: slide.label };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync('./output', { recursive: true });

  const results = [];
  for (const slide of slides) {
    try {
      const r = await generateSlide(slide);
      results.push({ slide: slide.id, label: r.label, url: r.url });
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
