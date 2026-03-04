# You & Me — A Life Story, Told

## Overview
A personal book creation platform where users go through an AI-guided interview to capture their life story, beliefs, and predictions. The AI asks thoughtful questions across 7 life categories, captures the interviewee's unique speech patterns and voice, then generates a beautifully formatted book (50+ pages) written in the person's authentic voice that can be downloaded as a print-ready file.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js with RESTful API + SSE streaming for AI chat
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 model)
- **File uploads**: Multer for photo management

## Key Features
1. **Landing Page** - Clean black and white design with "You & Me" logo
2. **Explanatory Intro** - First AI message explains the purpose/process, ending with "ready to begin" before questions start
3. **AI Interview** - 7-category guided conversation (Early Life, Family, Career, Beliefs, Wisdom, Predictions, Legacy)
4. **Voice Capture** - AI learns how the person speaks and writes the book in their authentic voice
5. **Voice Interaction** - Text-to-speech reads AI prompts aloud (toggle in header); Speech-to-text microphone input transcribes spoken responses (Web Speech API, no external deps)
6. **Voice Selector** - Users can choose which TTS voice interviews them (dropdown on speaker icon when TTS is enabled); saved in localStorage as "you-and-me-voice"
7. **Per-Section Photo Uploads** - Each interview category prompts photo uploads for that era; photos tagged with category and woven into the correct chapter
8. **Book Generation** - AI compiles interview into a 50+ page book written in the interviewee's voice with photo markers ([PHOTO:id:filename]) embedded inline
9. **Book Preview** - Beautiful chapter-by-chapter reading view with inline photos at contextual positions
10. **Print-Ready Download** - HTML file with base64-embedded photos for manufacturing; handles both inline photo markers and category-based fallback

## Project Structure
- `shared/schema.ts` - Database schema (books, interview_messages, photos)
- `server/ai.ts` - AI interview and book generation logic (with voice capture prompts, intro message, 50+ page generation)
- `server/routes.ts` - All API endpoints + print HTML generation with photo marker processing
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - Database connection
- `client/src/pages/landing.tsx` - Landing page
- `client/src/pages/interview.tsx` - Interview chat page (voice selector, per-category photo uploads, TTS/STT)
- `client/src/pages/book-preview.tsx` - Book preview page (inline photo rendering from markers)

## API Endpoints
- POST /api/books - Create new book
- GET /api/books/:id - Get book details
- GET /api/books/:id/messages - Get interview messages
- POST /api/books/:id/chat - Send message (SSE streaming)
- POST /api/books/:id/photos - Upload photo (with category tag)
- GET /api/books/:id/photos - Get photos
- POST /api/books/:id/generate - Generate book content (16384 max tokens for 50+ pages)
- GET /api/books/:id/download - Download print-ready HTML

## Design
- Black and white / monochrome color palette
- Libre Baskerville serif for headings, Plus Jakarta Sans for body
- Custom "You & Me" logo from attached assets
- Dark mode support
- Responsive design

## Voice/TTS
- TTS preference: localStorage key "you-and-me-tts"
- Voice selection: localStorage key "you-and-me-voice"
- Voices filtered to English only
- Preview plays when selecting a new voice
