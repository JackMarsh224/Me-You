import OpenAI from "openai";
import type { Book, InterviewMessage, Photo } from "@shared/schema";
import { INTERVIEW_CATEGORIES } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
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
        content: `The person's name is ${authorName}. Please warmly welcome them and ask your first question about their early life and childhood. Be warm and personal. Keep it brief — just a welcome and one question. Also let them know you'll be paying attention to how they express themselves so the final book sounds authentically like them.`,
      },
    ],
    max_completion_tokens: 512,
  });

  return response.choices[0]?.message?.content || `Welcome, ${authorName}! I'm so glad you're here to tell your story. Before we begin — I want you to know that I'll be listening not just to what you share, but how you share it. The goal is for your finished book to sound exactly like you. So just be yourself. Let's start at the very beginning — where did you grow up, and what's your earliest memory?`;
}

export async function interviewChat(
  messages: InterviewMessage[],
  book: Book
): Promise<AsyncIterable<string>> {
  const currentCategory = INTERVIEW_CATEGORIES.find(c => c.id === book.currentCategory);
  const categoryIndex = INTERVIEW_CATEGORIES.findIndex(c => c.id === book.currentCategory);

  const categoryContext = currentCategory
    ? `\n\nCurrent topic area: "${currentCategory.label}" (category ${categoryIndex + 1} of ${INTERVIEW_CATEGORIES.length}). Stay on this topic unless the person has shared enough, in which case naturally transition to the next topic. When transitioning, briefly acknowledge what they've shared before moving on.`
    : "";

  const voiceContext = `\n\nRemember: pay attention to HOW they speak. Mirror their energy and style in your responses. If they're casual, be casual back. If they're reflective, match that tone. This helps build rapport and also helps you gather data about their voice for the final book.`;

  const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + categoryContext + voiceContext },
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
  photos: Photo[]
): Promise<string> {
  const interviewTranscript = messages
    .map((m) => `${m.role === "user" ? book.authorName : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  const photoDescriptions = photos.length > 0
    ? `\n\nPhotos provided by the author:\n${photos.map(p => `- ${p.originalName}${p.caption ? `: ${p.caption}` : ""} (category: ${p.category || "general"})`).join("\n")}`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a world-class ghostwriter for "You & Me — A Life Story, Told." Your task is to transform an interview transcript into a beautifully written personal book.

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

Format the book in Markdown:
- Use ## for chapter titles
- Write flowing prose paragraphs
- Include 7 chapters covering: Early Life, Family, Career, Beliefs, Wisdom, Predictions, Legacy
- Each chapter should be substantial (3-5 paragraphs minimum)
- Begin with a brief prologue and end with an epilogue

If photos are mentioned, reference where they would naturally fit in the narrative.`,
      },
      {
        role: "user",
        content: `Author name: ${book.authorName}
Book title: ${book.title}

Interview transcript:
${interviewTranscript}
${photoDescriptions}

Please write the complete book based on this interview. The most important thing is that it sounds EXACTLY like ${book.authorName} — their voice, their way of expressing things, their personality. When they read this, they should think "this is me."`,
      },
    ],
    max_completion_tokens: 8192,
  });

  return response.choices[0]?.message?.content || "Unable to generate book content.";
}
