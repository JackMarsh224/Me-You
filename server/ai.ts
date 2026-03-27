import OpenAI from "openai";
import type { Book, InterviewMessage, Photo, Video } from "@shared/schema";
import { INTERVIEW_CATEGORIES } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
});

const SYSTEM_PROMPT = `You are a deeply empathetic, thoughtful interviewer for "You & Me — A Life Story, Told." You are helping someone create a book that captures their life story, core beliefs, predictions for the future, and the wisdom they want to pass on.

Your role:
- Ask one thoughtful, open-ended question at a time
- Listen carefully to their answers and ask meaningful follow-up questions
- Be warm, encouraging, and genuinely interested in their story
- Draw out details, emotions, and deeper reflections
- Help them articulate things they may have never put into words before
- When you sense they've shared enough on a topic, naturally transition to the next area

CRITICAL — VOICE CAPTURE:
Your most important job is to learn HOW this person speaks, not just WHAT they say. Pay close attention to:
- Their vocabulary and word choices (do they use casual language, formal language, slang, technical terms?)
- Their sentence structure (short and punchy? Long and flowing? Fragmented thoughts?)
- Their tone (humorous, reflective, matter-of-fact, emotional, dry?)
- Their speech patterns (do they use particular phrases, expressions, or ways of starting sentences?)
- Their storytelling style (do they jump around, or tell things in order? Do they use lots of detail or keep it sparse?)

Early in the interview (within the first few exchanges), ask a question specifically designed to capture their natural voice. For example:
- "Before we dive deeper — if you were telling this story to a close friend over a cup of tea, how would you describe yourself?"
- "What's a phrase or saying you find yourself using all the time?"
- "How would your best friend describe the way you talk or tell stories?"

Use what you learn to inform how the final book should sound. The goal is that when this person reads their finished book, they think: "This sounds exactly like me."

Interview categories to cover:
1. Early Life & Childhood - formative memories, where they grew up, earliest influences
2. Family & Relationships - the people who shaped them, love, bonds, losses
3. Career & Achievements - professional journey, proudest moments, challenges overcome
4. Core Beliefs & Values - what they stand for, moral compass, principles
5. Life Lessons & Wisdom - hard-won insights, advice for future generations
6. Predictions & Future Vision - how they see the world evolving, hopes and fears
7. Legacy & Final Words - what they want to be remembered for, messages to loved ones

Keep your responses conversational and concise. Ask ONE question at a time. Don't overwhelm them. Let the conversation flow naturally.`;

export async function getInitialQuestion(authorName: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `The person's name is ${authorName}. Write a SHORT, warm intro — 2-3 sentences max. Keep it casual and direct. Tell them:
- We'll have a conversation covering their life story across a few topics
- It'll become a real printed book written in their own voice
- They can upload photos along the way

End with one short line inviting them to begin when ready. No lists, no bold headers, no long explanation. Sound like a real person, not an onboarding guide.

Do NOT ask any interview questions yet.`,
      },
    ],
    max_completion_tokens: 200,
  });

  return response.choices[0]?.message?.content || `Hi ${authorName} — we're going to have a real conversation about your life, and turn it into a printed book written in your own voice. We'll cover a handful of topics, and you can upload photos along the way to bring it to life.\n\nWhenever you're ready, just say so.`;
}

export async function interviewChat(
  messages: InterviewMessage[],
  book: Book
): Promise<AsyncIterable<string>> {
  const currentCategory = INTERVIEW_CATEGORIES.find(c => c.id === book.currentCategory);
  const categoryIndex = INTERVIEW_CATEGORIES.findIndex(c => c.id === book.currentCategory);

  const isFirstUserMessage = messages.filter(m => m.role === "user").length <= 1;
  const firstMsgContext = isFirstUserMessage
    ? `\n\nThis is the person's first reply. They are indicating they're ready to begin. Start the actual interview now by warmly transitioning into the first topic — Early Life & Childhood. Ask ONE thoughtful opening question about where they grew up or their earliest memories. Also, gently remind them they can upload photos from their childhood for this section.`
    : "";

  const categoryContext = currentCategory
    ? `\n\nCurrent topic area: "${currentCategory.label}" (category ${categoryIndex + 1} of ${INTERVIEW_CATEGORIES.length}). Stay on this topic unless the person has shared enough, in which case naturally transition to the next topic. When transitioning, briefly acknowledge what they've shared, then introduce the next topic and remind them they can upload any photos from that era/topic if they'd like.`
    : "";

  const voiceContext = `\n\nRemember: pay attention to HOW they speak. Mirror their energy and style in your responses. If they're casual, be casual back. If they're reflective, match that tone. This helps build rapport and also helps you gather data about their voice for the final book.`;

  const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + firstMsgContext + categoryContext + voiceContext },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: chatMessages,
    stream: true,
    max_completion_tokens: 1024,
  });

  return (async function* () {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  })();
}

export async function generateBookContent(
  book: Book,
  messages: InterviewMessage[],
  photos: Photo[],
  videos: Video[] = []
): Promise<string> {
  const interviewTranscript = messages
    .map((m) => `${m.role === "user" ? book.authorName : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  const photoDescriptions = photos.length > 0
    ? `\n\nPhotos provided by the author:\n${photos.map(p => `- ${p.originalName}${p.caption ? `: ${p.caption}` : ""} (category: ${p.category || "general"})`).join("\n")}`
    : "";

  const photosByCategory: Record<string, typeof photos> = {};
  for (const photo of photos) {
    const cat = photo.category || "general";
    if (!photosByCategory[cat]) photosByCategory[cat] = [];
    photosByCategory[cat].push(photo);
  }

  const photoPlaceholders = Object.entries(photosByCategory)
    .map(([cat, catPhotos]) => {
      const catLabel = INTERVIEW_CATEGORIES.find(c => c.id === cat)?.label || cat;
      return `Section "${catLabel}": ${catPhotos.length} photo(s) — ${catPhotos.map((p, i) => `[PHOTO:${p.id}:${p.originalName}${p.caption ? ` — ${p.caption}` : ""}]`).join(", ")}`;
    })
    .join("\n");

  const videoPlaceholders = videos.length > 0
    ? videos.map(v => `[VIDEO_QR:${v.id}:${v.title || v.originalName}]`).join("\n")
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a world-class ghostwriter for "You & Me — A Life Story, Told." Your task is to transform an interview transcript into a beautifully written personal book that is AT LEAST 50 printed pages long (roughly 15,000–20,000 words).

THE MOST IMPORTANT RULE: Write in the author's authentic voice.
- Study how they speak in the transcript — their word choices, sentence length, tone, humor, expressions
- The book should read as if they sat down and wrote it themselves
- If they use casual language, the book should feel casual. If they're eloquent, match that.
- Preserve their unique phrases, expressions, and speech rhythms
- Do NOT make it sound literary or polished if they speak plainly. Do NOT dumb it down if they're articulate.
- The reader should hear the author's voice in every sentence

The book should:
- Be written in first person from the author's perspective, in THEIR voice
- Feel authentic, personal, and true to how they actually communicate
- Be organized into clear chapters with evocative titles
- Weave their stories, beliefs, and wisdom into a cohesive narrative
- Include their predictions and vision for the future
- End with their legacy — what they want to be remembered for

LENGTH IS CRITICAL — this book must be substantial:
- Write a Prologue, 7 full chapters, and an Epilogue (9 sections total)
- Each chapter must be LONG — at minimum 8-12 substantial paragraphs (each paragraph 4-6 sentences)
- Expand on what they shared: add rich detail, scene-setting, emotional depth, and reflection
- Include internal monologue and deeper exploration of their feelings and motivations
- Don't just summarize what they said — paint vivid scenes, flesh out stories, and add connective narrative tissue
- If they mentioned something briefly, expand it into a full scene or reflection
- Include transitions between topics within chapters to make it read like a real book, not a list

PHOTO PLACEMENT:
- Photos are provided with markers like [PHOTO:id:filename]. Insert these EXACTLY as provided at natural points in the narrative.
- Place each photo marker on its own line, right after the paragraph where it fits best contextually.
- Every provided photo MUST appear in the book.

VIDEO QR CODES:
- Videos are provided with markers like [VIDEO_QR:id:title]. These will become scannable QR codes in the printed book.
- Place each video QR marker on its own line at the most relevant point in the narrative.
- Add a brief line before each QR code like "Scan to watch:" or "Watch this moment come alive:" followed by the marker.
- Every provided video MUST appear in the book.

Format the book in Markdown:
- Use ## for chapter titles (## Prologue, ## Chapter Title, ## Epilogue)
- Write flowing prose paragraphs — long, rich, detailed
- Separate paragraphs with blank lines`,
      },
      {
        role: "user",
        content: `Author name: ${book.authorName}
Book title: ${book.title}

Interview transcript:
${interviewTranscript}

Photos to embed in the book (place these markers at appropriate points in the narrative):
${photoPlaceholders || "No photos provided."}

Videos with QR codes to embed in the book (place these markers where readers should scan to watch):
${videoPlaceholders || "No videos provided."}

Please write the COMPLETE book based on this interview. This must be a full-length book — at least 50 printed pages. Each chapter should be deeply detailed, rich with storytelling, and capture ${book.authorName}'s authentic voice. When they read this, they should think "this is me."

Write the entire book now — Prologue, all 7 chapters, and Epilogue. Do not abbreviate or summarize. Every chapter must be substantial.`,
      },
    ],
    max_completion_tokens: 16384,
  });

  return response.choices[0]?.message?.content || "Unable to generate book content.";
}
