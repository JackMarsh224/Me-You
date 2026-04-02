# You & Me — A Life Story, Told

## Overview
A personal book creation platform where users pay £49.99 upfront, provide delivery details, then go through an AI-guided interview to capture their life story, beliefs, and predictions. The AI asks thoughtful questions across 7 life categories, captures the interviewee's unique speech patterns and voice, then generates a beautifully formatted book (50+ pages) written in the person's authentic voice. After generation, users review the book and approve it for printing — which emails the complete book file to admin.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js with RESTful API + SSE streaming for AI chat
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 model)
- **Auth**: Passport-local + express-session (SESSION_SECRET env var)
- **File uploads**: Multer for photos (10MB) and videos (100MB), stored in `uploads/` directory
- **QR Codes**: `qrcode` package for generating video QR codes
- **Email**: Nodemailer sends book HTML file to jack@jigsawgym.com on approval
- **Payments**: Stripe placeholder (TODO: integrate Stripe connector)

## Key Features
1. **Landing Page** - Clean black and white design with "You & Me" logo and hero background image; "Shipped to Your Door" messaging
2. **User Authentication** - Register/login with username+password; session-based auth; auth-aware header navigation; `?next` redirect param supported
3. **Order Page (`/order`)** - Delivery address form + payment form (£49.99, Stripe placeholder); book created with paid=true + delivery info stored; requires login
4. **AI Interview** - 7-category guided conversation (Early Life, Family, Career, Beliefs, Wisdom, Predictions, Legacy); gated behind payment
5. **Voice Capture** - AI learns how the person speaks and writes the book in their authentic voice
6. **Voice Interaction** - Text-to-speech reads AI prompts aloud (toggle in header); Speech-to-text microphone input transcribes spoken responses (Web Speech API, no external deps)
7. **Voice Selector** - Users can choose which TTS voice interviews them (dropdown on speaker icon when TTS is enabled); saved in localStorage as "you-and-me-voice"
8. **Per-Section Photo Uploads** - Each interview category prompts photo uploads for that era; photos tagged with category and woven into the correct chapter
9. **Video Uploads with QR Codes** - Users upload videos during interview; QR codes generated linking to public video viewer page; QR codes embedded in printed book via [VIDEO_QR:id:title] markers
10. **Book Generation** - AI compiles interview into a 50+ page book written in the interviewee's voice with [PHOTO:id:filename] and [VIDEO_QR:id:title] markers embedded inline
11. **Book Preview & Approval** - Full book view after generation; "Approve for Print" button sends complete HTML book file to admin via email; book status moves to `in_production`
12. **Admin Dashboard (`/admin`)** - Admin-only page showing all orders with status, delivery info, approval dates; accessible via "Admin" nav link when logged in as admin
13. **Admin Account** - Username `admin`, password from `ADMIN_PASSWORD` env var (default "admin123" in dev); seeded automatically on server startup
14. **Print-Ready Download** - HTML file with base64-embedded photos and QR codes; available after approval
15. **Personal Library (My Library)** - Authenticated users see all their books with status; View & Approve link for completed books; download for in_production books
16. **Story Library** - Public page showing opted-in shared books
17. **About Us** - Company mission page

## User Flow
1. Landing page → Enter name → If not logged in → `/login?next=/order&name=...` → After login → `/order?name=...`
2. Order page → Fill delivery address + payment details → Pay £49.99 → Book created (paid=true, delivery stored) → Navigate to `/interview/:id`
3. AI intro message (explains process) → User says "ready" → Interview begins (7 categories)
4. Photo and video uploads per section during interview
5. Generate book → Redirected to `/book/:id` (full view)
6. Review book → Click "Approve for Print" → Email sent to jack@jigsawgym.com with book HTML file attached → Status → `in_production`
7. My Library → View all books, download approved books

## Admin Flow
1. Login as `admin` / `admin123` (or ADMIN_PASSWORD)
2. "Admin" link appears in landing nav
3. `/admin` dashboard shows all orders, status, delivery info, approval dates

## Database Schema
- `users` - id, username, password (scrypt hash), isAdmin (boolean, default false), createdAt
- `books` - id, authorName, title, status, generatedContent, paid, shared, userId (nullable FK to users), customerEmail, deliveryName, deliveryAddress, deliveryCity, deliveryPostcode, deliveryCountry, approvedAt, emailSentAt, createdAt
- `interview_messages` - id, bookId (FK), role, content, category, createdAt
- `photos` - id, bookId (FK), filename, originalName, caption, category, createdAt
- `videos` - id, bookId (FK), userId (nullable FK), filename, originalName, title, description, category, createdAt

## Project Structure
- `shared/schema.ts` - Database schema (users, books, interview_messages, photos, videos)
- `server/auth.ts` - Passport-local auth setup, register/login/logout/user routes, seedAdminUser()
- `server/ai.ts` - AI interview and book generation logic
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database CRUD operations (IStorage interface + DatabaseStorage)
- `server/db.ts` - Database connection
- `server/services/sendOrderEmail.ts` - Nodemailer email service (sends to jack@jigsawgym.com)
- `server/services/generateBookFile.ts` - Book HTML file generator
- `client/src/pages/landing.tsx` - Landing page with hero image; admin nav link for admin users
- `client/src/pages/login.tsx` - Login page; handles ?next and ?name redirect params
- `client/src/pages/register.tsx` - Register page; handles ?next and ?name redirect params
- `client/src/pages/order.tsx` - Order page: delivery form + £49.99 payment (Stripe placeholder); requires login
- `client/src/pages/admin.tsx` - Admin dashboard: all orders, filters, delivery info
- `client/src/pages/my-library.tsx` - Personal library (auth-required)
- `client/src/pages/interview.tsx` - Interview chat page with photo/video uploads
- `client/src/pages/book-preview.tsx` - Full book view; Approve for Print button; Download button
- `client/src/pages/video-viewer.tsx` - Public video viewer page (accessed via QR code scan)
- `client/src/pages/story-library.tsx` - Story Library page (shared public books)
- `client/src/pages/about.tsx` - About Us page
- `client/src/App.tsx` - Routes: /, /order, /admin, /login, /register, /my-library, /library, /about, /interview/:id, /book/:id/preview, /book/:id, /video/:id

## API Endpoints
### Auth
- POST /api/register - Create new user account
- POST /api/login - Login with username+password
- POST /api/logout - Logout current session
- GET /api/user - Get current authenticated user (returns isAdmin field)

### Admin
- GET /api/admin/orders - Get all books (admin only, requires isAdmin=true)

### Books
- POST /api/books - Create new book (requires auth; accepts delivery fields + paid=true)
- GET /api/books/:id - Get book details
- GET /api/books/:id/messages - Get interview messages
- POST /api/books/:id/chat - Send message (SSE streaming)
- POST /api/books/:id/generate - Generate book content (16384 max tokens for 50+ pages)
- POST /api/books/:id/approve - Approve book for print (generates HTML + emails to admin)
- GET /api/books/:id/download - Download print-ready HTML
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
- Black and white / monochrome color palette; all prices in £ (GBP)
- Libre Baskerville serif for headings, Plus Jakarta Sans for body
- Custom "You & Me" logo from attached assets (uses dark:invert on variable/light backgrounds; invert always-on for always-dark backgrounds like hero and book covers)
- Hero background image with overlay on landing page
- Dark mode support
- Responsive design

## Voice/TTS
- TTS preference: localStorage key "you-and-me-tts"
- Voice selection: localStorage key "you-and-me-voice"
- Voices filtered to English only
- Preview plays when selecting a new voice

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `OPENAI_API_KEY` - OpenAI API key (via Replit AI integration)
- `NODE_ENV` - Set to "production" for Railway
- `SMTP_HOST` - Email server host
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password
- `ADMIN_PASSWORD` - Password for admin account (default: "admin123" in dev)

## TODO
- Integrate Stripe payment processing (set STRIPE_SECRET_KEY environment variable)
- Replace placeholder payment endpoint with real Stripe checkout
- Add `ADMIN_PASSWORD` to Railway environment variables for production security
