# You & Me — A Life Story, Told

## Overview
A personal book creation platform where users go through an AI-guided interview to capture their life story, beliefs, and predictions. The AI asks thoughtful questions across 7 life categories, captures the interviewee's unique speech patterns and voice, then generates a beautifully formatted book (50+ pages) written in the person's authentic voice. After generation, users review the book and place an order to have it printed and shipped to their door.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js with RESTful API + SSE streaming for AI chat
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 model)
- **File uploads**: Multer for photo management
- **Payments**: Stripe (placeholder — TODO: integrate Stripe connector)

## Key Features
1. **Landing Page** - Clean black and white design with "You & Me" logo; "Shipped to Your Door" messaging
2. **Explanatory Intro** - First AI message explains the purpose/process, ending with "ready to begin" before questions start
3. **AI Interview** - 7-category guided conversation (Early Life, Family, Career, Beliefs, Wisdom, Predictions, Legacy)
4. **Voice Capture** - AI learns how the person speaks and writes the book in their authentic voice
5. **Voice Interaction** - Text-to-speech reads AI prompts aloud (toggle in header); Speech-to-text microphone input transcribes spoken responses (Web Speech API, no external deps)
6. **Voice Selector** - Users can choose which TTS voice interviews them (dropdown on speaker icon when TTS is enabled); saved in localStorage as "you-and-me-voice"
7. **Per-Section Photo Uploads** - Each interview category prompts photo uploads for that era; photos tagged with category and woven into the correct chapter
8. **Book Generation** - AI compiles interview into a 50+ page book written in the interviewee's voice with photo markers ([PHOTO:id:filename]) embedded inline
9. **Checkout / Paywall** - After generation, user reviews the book and places an order ($49.99). Stripe integration TODO. Currently marks as paid directly (placeholder).
10. **Book Preview** - Beautiful chapter-by-chapter reading view with inline photos at contextual positions. Available as preview before payment and full view after payment.
11. **Print-Ready Download** - HTML file with base64-embedded photos for manufacturing; gated behind payment. Handles both inline photo markers and category-based fallback.

## User Flow
1. Landing page → Enter name → Start interview
2. AI intro message (explains process) → User says "ready" → Interview begins
3. 7-category interview with photo uploads per section
4. Generate book → Redirected to checkout page
5. Review book preview → Place order (pay $49.99)
6. After payment → Full book view with download available

## Project Structure
- `shared/schema.ts` - Database schema (books with `paid` field, interview_messages, photos)
- `server/ai.ts` - AI interview and book generation logic
- `server/routes.ts` - All API endpoints including `/api/books/:id/pay`
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - Database connection
- `client/src/pages/landing.tsx` - Landing page
- `client/src/pages/interview.tsx` - Interview chat page
- `client/src/pages/checkout.tsx` - Checkout/payment page with book review and order
- `client/src/pages/book-preview.tsx` - Book preview page (preview-only mode and paid full mode)
- `client/src/pages/story-library.tsx` - Story Library page (shared public books)
- `client/src/pages/about.tsx` - About Us page
- `client/src/App.tsx` - Routes: /, /library, /about, /interview/:id, /book/:id/checkout, /book/:id/preview, /book/:id

## API Endpoints
- POST /api/books - Create new book
- GET /api/shared-books - Get publicly shared books
- POST /api/books/:id/share - Toggle book sharing
- GET /api/books/:id - Get book details
- GET /api/books/:id/messages - Get interview messages
- POST /api/books/:id/chat - Send message (SSE streaming)
- POST /api/books/:id/photos - Upload photo (with category tag)
- GET /api/books/:id/photos - Get photos
- POST /api/books/:id/generate - Generate book content (16384 max tokens for 50+ pages)
- POST /api/books/:id/pay - Process payment (placeholder — marks book as paid)
- GET /api/books/:id/download - Download print-ready HTML (gated behind payment)

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

## TODO
- Integrate Stripe payment processing (connector: ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y)
- Replace placeholder payment endpoint with real Stripe checkout
