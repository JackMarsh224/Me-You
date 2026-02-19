import OpenAI from "openai";
import type { Book, InterviewMessage, Photo } from "@shared/schema";
import { INTERVIEW_CATEGORIES } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are a deeply empathetic, thoughtful interviewer helping someone create their personal manifesto — a book that captures their life story, core beliefs, predictions for the future, and the wisdom they want to pass on to future generations.

Your role:
- Ask one thoughtful, open-ended question at a time
- Listen carefully to their answers and ask meaningful follow-up questions
- Be warm, encouraging, and genuinely interested in their story
- Draw out details, emotions, and deeper reflections
- Help them articulate things they may have never put into words before
- When you sense they've shared enough on a topic, naturally transition to the next area

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
        content: `The person's name is ${authorName}. Please warmly welcome them and ask your first question about their early life and childhood. Be warm and personal. Keep it brief — just a welcome and one question.`,
      },
    ],
    max_completion_tokens: 512,
  });

  return response.choices[0]?.message?.content || `Welcome, ${authorName}! I'm honored to help you create your personal manifesto. Let's start at the beginning — can you tell me about where you grew up and your earliest childhood memories?`;
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

  const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + categoryContext },
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
        content: `You are a world-class ghostwriter and book editor. Your task is to transform an interview transcript into a beautifully written personal manifesto book.

The book should:
- Be written in first person from the author's perspective
- Have a literary, heartfelt, and authentic tone
- Be organized into clear chapters with evocative titles
- Preserve the author's unique voice and personality
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

Please write the complete personal manifesto book based on this interview. Make it beautiful, heartfelt, and deeply personal.`,
      },
    ],
    max_completion_tokens: 8192,
  });

  return response.choices[0]?.message?.content || "Unable to generate book content.";
}
