# You & Me — A Life Story, Told

## Overview
A personal book creation platform where users go through an AI-guided interview to capture their life story, beliefs, and predictions. The AI asks thoughtful questions across 7 life categories, captures the interviewee's unique speech patterns and voice, then generates a beautifully formatted book written in the person's authentic voice that can be downloaded as a print-ready file.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js with RESTful API + SSE streaming for AI chat
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 model)
- **File uploads**: Multer for photo management

## Key Features
1. **Landing Page** - Clean black and white design with "You & Me" logo
2. **AI Interview** - 7-category guided conversation (Early Life, Family, Career, Beliefs, Wisdom, Predictions, Legacy)
3. **Voice Capture** - AI learns how the person speaks and writes the book in their authentic voice
4. **Voice Interaction** - Text-to-speech reads AI prompts aloud (toggle in header); Speech-to-text microphone input transcribes spoken responses (Web Speech API, no external deps)
5. **Photo Uploads** - Attach photos that get embedded in the book
6. **Book Generation** - AI compiles interview into a book written in the interviewee's voice
7. **Book Preview** - Beautiful chapter-by-chapter reading view
8. **Print-Ready Download** - HTML file with base64-embedded photos for manufacturing

## Project Structure
- `shared/schema.ts` - Database schema (books, interview_messages, photos)
- `server/ai.ts` - AI interview and book generation logic (with voice capture prompts)
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - Database connection
- `client/src/pages/landing.tsx` - Landing page
- `client/src/pages/interview.tsx` - Interview chat page
- `client/src/pages/book-preview.tsx` - Book preview page

## API Endpoints
- POST /api/books - Create new book
- GET /api/books/:id - Get book details
- GET /api/books/:id/messages - Get interview messages
- POST /api/books/:id/chat - Send message (SSE streaming)
- POST /api/books/:id/photos - Upload photo
- GET /api/books/:id/photos - Get photos
- POST /api/books/:id/generate - Generate book content
- GET /api/books/:id/download - Download print-ready HTML

## Design
- Black and white / monochrome color palette
- Libre Baskerville serif for headings, Plus Jakarta Sans for body
- Custom "You & Me" logo from attached assets
- Dark mode support
- Responsive design
