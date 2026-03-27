# You & Me — A Life Story, Told

## Overview
A personal book creation platform where users go through an AI-guided interview to capture their life story, beliefs, and predictions. The AI asks thoughtful questions across 7 life categories, captures the interviewee's unique speech patterns and voice, then generates a beautifully formatted book (50+ pages) written in the person's authentic voice. After generation, users review the book and place an order to have it printed and shipped to their door.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js with RESTful API + SSE streaming for AI chat
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 model)
- **Auth**: Passport-local + express-session (SESSION_SECRET env var)
- **File uploads**: Multer for photos (10MB) and videos (100MB), stored in `uploads/` directory
- **QR Codes**: `qrcode` package for generating video QR codes
- **Payments**: Stripe (placeholder — TODO: integrate Stripe connector)

## Key Features
1. **Landing Page** - Clean black and white design with "You & Me" logo and hero background image; "Shipped to Your Door" messaging
2. **User Authentication** - Register/login with username+password; session-based auth; auth-aware header navigation
3. **Explanatory Intro** - First AI message explains the purpose/process, ending with "ready to begin" before questions start
4. **AI Interview** - 7-category guided conversation (Early Life, Family, Career, Beliefs, Wisdom, Predictions, Legacy)
5. **Voice Capture** - AI learns how the person speaks and writes the book in their authentic voice
6. **Voice Interaction** - Text-to-speech reads AI prompts aloud (toggle in header); Speech-to-text microphone input transcribes spoken responses (Web Speech API, no external deps)
7. **Voice Selector** - Users can choose which TTS voice interviews them (dropdown on speaker icon when TTS is enabled); saved in localStorage as "you-and-me-voice"
8. **Per-Section Photo Uploads** - Each interview category prompts photo uploads for that era; photos tagged with category and woven into the correct chapter
9. **Video Uploads with QR Codes** - Users upload videos during interview; QR codes generated linking to public video viewer page; QR codes embedded in printed book via [VIDEO_QR:id:title] markers
10. **Book Generation** - AI compiles interview into a 50+ page book written in the interviewee's voice with [PHOTO:id:filename] and [VIDEO_QR:id:title] markers embedded inline
11. **Checkout / Paywall** - After generation, user reviews the book and places an order ($49.99). Stripe integration TODO. Currently marks as paid directly (placeholder).
12. **Book Preview** - Beautiful chapter-by-chapter reading view with inline photos and video QR codes at contextual positions. Available as preview before payment and full view after payment.
13. **Print-Ready Download** - HTML file with base64-embedded photos and QR codes for manufacturing; gated behind payment.
14. **Personal Library (My Library)** - Authenticated users see all their books with status and download options, plus their uploaded videos
15. **Story Library** - Public page showing opted-in shared books
16. **About Us** - Company mission page

## User Flow
1. Landing page → Enter name → Start interview (optionally register/login first)
2. AI intro message (explains process) → User says "ready" → Interview begins
3. 7-category interview with photo and video uploads per section
4. Generate book → Redirected to checkout page
5. Review book preview → Place order (pay $49.99)
6. After payment → Full book view with download available
7. My Library → View all books and videos, download paid books

## Database Schema
- `users` - id, username, password (scrypt hash), createdAt
- `books` - id, authorName, status, generatedContent, paid, shared, userId (nullable FK to users), createdAt
- `interview_messages` - id, bookId (FK), role, content, category, createdAt
- `photos` - id, bookId (FK), filename, originalName, caption, category, createdAt
- `videos` - id, bookId (FK), userId (nullable FK), filename, originalName, title, description, category, createdAt

## Project Structure
- `shared/schema.ts` - Database schema (users, books, interview_messages, photos, videos)
- `server/auth.ts` - Passport-local auth setup, register/login/logout/user routes
- `server/ai.ts` - AI interview and book generation logic
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database CRUD operations (IStorage interface + DatabaseStorage)
- `server/db.ts` - Database connection
- `client/src/pages/landing.tsx` - Landing page with hero image
- `client/src/pages/login.tsx` - Login page
- `client/src/pages/register.tsx` - Register page
- `client/src/pages/my-library.tsx` - Personal library (auth-required)
- `client/src/pages/interview.tsx` - Interview chat page with photo/video uploads
- `client/src/pages/checkout.tsx` - Checkout/payment page with book review and order
- `client/src/pages/book-preview.tsx` - Book preview page (preview-only mode and paid full mode)
- `client/src/pages/video-viewer.tsx` - Public video viewer page (accessed via QR code scan)
- `client/src/pages/story-library.tsx` - Story Library page (shared public books)
- `client/src/pages/about.tsx` - About Us page
- `client/src/App.tsx` - Routes: /, /login, /register, /my-library, /library, /about, /interview/:id, /book/:id/checkout, /book/:id/preview, /book/:id, /video/:id

## API Endpoints
### Auth
- POST /api/register - Create new user account
- POST /api/login - Login with username+password
- POST /api/logout - Logout current session
- GET /api/user - Get current authenticated user

### Books
- POST /api/books - Create new book (associates with logged-in user if authenticated)
- GET /api/books/:id - Get book details
- GET /api/books/:id/messages - Get interview messages
- POST /api/books/:id/chat - Send message (SSE streaming)
- POST /api/books/:id/generate - Generate book content (16384 max tokens for 50+ pages)
- POST /api/books/:id/pay - Process payment (placeholder — marks book as paid)
- GET /api/books/:id/download - Download print-ready HTML (gated behind payment)
- GET /api/shared-books - Get publicly shared books
- POST /api/books/:id/share - Toggle book sharing
- GET /api/my-books - Get books for authenticated user

### Photos
- POST /api/books/:id/photos - Upload photo (with category tag, 10MB limit)
- GET /api/books/:id/photos - Get photos for a book

### Videos
- POST /api/books/:id/videos - Upload video (100MB limit)
- GET /api/books/:id/videos - Get videos for a book
- GET /api/videos/:id - Get single video metadata
- GET /api/videos/:id/qr - Get QR code PNG for video
- GET /api/my-videos - Get videos for authenticated user

### Static Files
- GET /api/uploads/:filename - Serve uploaded photos and videos

## Design
- Black and white / monochrome color palette
- Libre Baskerville serif for headings, Plus Jakarta Sans for body
- Custom "You & Me" logo from attached assets (uses mix-blend-multiply dark:mix-blend-screen dark:invert for transparent background)
- Hero background image with overlay on landing page
- Dark mode support
- Responsive design

## Voice/TTS
- TTS preference: localStorage key "you-and-me-tts"
- Voice selection: localStorage key "you-and-me-voice"
- Voices filtered to English only
- Preview plays when selecting a new voice

## TODO
- Integrate Stripe payment processing (set STRIPE_SECRET_KEY environment variable)
- Replace placeholder payment endpoint with real Stripe checkout
