# Resume Advisor Next

A modern, fully responsive resume builder application built with Next.js, React, TypeScript, and Tailwind CSS. This project implements best practices in component architecture, type safety, and mobile-first responsive design.

## 🌟 Features

- **📱 Fully Responsive Design (RWD)**: Perfect experience on mobile, tablet, and desktop devices
- **🎯 Mobile-First Approach**: Optimized for mobile devices with progressive enhancement
- **🧩 Modular Component Architecture**: Decoupled, reusable components following SOLID principles
- **⚡ Type-Safe**: Full TypeScript support with comprehensive type definitions
- **🎨 Modern UI**: Built with Tailwind CSS utility-first approach
- **🔐 Authentication**: Supabase Auth with Google OAuth and cookie-based sessions
- **🔄 API Integration**: Next.js Route Handlers under `/api` with an Axios client (`withCredentials`) for authenticated requests
- **📝 Multiple Resume Sections**: Education, Experience, Projects, Leadership, and Technical Skills
- **🎯 Drag & Drop**: Intuitive drag-and-drop section reordering with @dnd-kit
- **✅ Form Validation**: Zod-based schema validation for all forms
- **📄 LaTeX PDF Generation**: Built-in LaTeX service for professional PDF resume generation
- **🐳 Docker Support**: Containerized development environment with Docker Compose

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun
- Docker and Docker Compose (optional, for containerized development)

### Installation

#### Option 1: Local Development

1. Clone the repository:

```bash
git clone <repository-url>
cd Resume-Advisor-Next
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Copy environment variables from the example file and fill in your Supabase and Groq credentials:

```bash
cp .env.example .env.local
```

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq (AI: job analysis, description enrich, cover letter)
GROQ_API_KEY=your-groq-api-key

# LaTeX PDF service (Docker dev default)
LATEX_SERVICE_URL=http://localhost:5400
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

#### Option 2: Docker Development (Recommended)

1. Clone the repository:

```bash
git clone <repository-url>
cd Resume-Advisor-Next
```

2. Build and run with Docker Compose:

```bash
npm run docker:dev:build
# or
docker-compose -f docker-compose.dev.yml up --build
```

This will start two services:

- **Next.js App**: Available at [http://localhost:3000](http://localhost:3000)
- **LaTeX Service**: Available at [http://localhost:5400](http://localhost:5400)

3. To stop the services:

```bash
npm run docker:dev:down
# or
docker-compose -f docker-compose.dev.yml down
```

### Docker Commands

```bash
# Development with hot reloading
npm run docker:dev          # Start services
npm run docker:dev:build    # Build and start services
npm run docker:dev:down     # Stop services

# Production
npm run docker:build        # Build production images
npm run docker:up           # Start production services
npm run docker:up:build     # Build and start production
npm run docker:down         # Stop production services

# Logs
npm run docker:logs         # View service logs
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx         # Button component with variants
│   │   ├── Input.tsx          # Input field component
│   │   ├── Textarea.tsx       # Textarea component
│   │   ├── Label.tsx          # Label component
│   │   ├── IconButton.tsx     # Icon button component
│   │   ├── PasswordInput.tsx  # Password input with visibility toggle
│   │   ├── PhoneInput.tsx     # Phone number input with formatting
│   │   ├── Tabs.tsx           # Tabs component
│   │   ├── DashboardCard.tsx  # Dashboard card component
│   │   ├── UserDropdown.tsx   # User dropdown menu
│   │   └── index.ts           # UI components exports
│   ├── resume/                # Resume-specific components
│   │   ├── ProgressBar.tsx    # Progress indicator
│   │   ├── Breadcrumb.tsx     # Breadcrumb navigation
│   │   ├── SectionCard.tsx    # Section card container
│   │   ├── DraggableSection.tsx # Drag-and-drop section component
│   │   ├── FormField.tsx      # Form field wrapper
│   │   ├── KeywordChip.tsx    # Keyword chip component
│   │   └── index.ts           # Resume components exports
│   └── form/                  # Form components
│       ├── content-builder-form.tsx # Resume content builder form
│       └── job-description-form.tsx # Job description form
├── types/
│   ├── user.ts                # User type definitions
│   ├── resume.ts              # Resume type definitions
│   ├── job-description.ts     # Job description type definitions
│   └── keywords.ts            # Keywords type definitions
├── stores/
│   ├── useAccountStore.ts     # Zustand store for account state
│   ├── useJobPostingStore.ts  # Zustand store for job posting state
│   ├── useResumeStore.ts      # Zustand store for resume state
│   ├── useAuthStore.ts        # Auth session UI state
│   ├── useCoverLetterStore.ts # Cover letter editor state
│   └── index.ts               # Store exports
├── hooks/
│   ├── useProfile.ts          # React Query: user profile
│   ├── useDocuments.ts        # React Query: resumes & cover letters
│   ├── useResumeVersions.ts   # React Query: resume version history
│   ├── useResumeForm.ts       # Resume form helpers
│   ├── usePDFGeneration.ts    # PDF generation helpers
│   └── index.ts               # Hooks exports
├── lib/
│   ├── api-client.ts          # Axios client → `/api` (cookie auth)
│   ├── api-services.ts        # Typed API service functions
│   ├── supabase/              # Supabase browser & server clients
│   ├── auth-helper.ts         # `getAuthUser()` for Route Handlers
│   ├── resume-versions.ts     # Resume version snapshots
│   ├── latex-client.ts        # LaTeX service client
│   ├── latex-generator.ts     # LaTeX template generator
│   └── latex-parser.ts        # LaTeX → form data parser
└── app/
    ├── (main)/                # Authenticated app routes
    │   ├── dashboard/         # Document dashboard
    │   ├── resume/          # Resume builder
    │   ├── cover-letter/    # Cover letter editor
    │   └── settings/        # Account settings
    ├── (auth)/              # Login (Google OAuth)
    ├── profile/setup/       # First-time profile (OAuth users)
    ├── providers/           # AuthProvider, QueryProvider
    ├── api/                 # Route Handlers (resumes, jobs, AI, user, …)
    ├── auth/callback/       # Supabase OAuth callback
    ├── layout.tsx
    └── page.tsx             # Landing page

latex-service/                 # LaTeX to PDF microservice
├── server.js                  # Express server for LaTeX compilation
└── package.json               # Service dependencies
```

## 📱 Responsive Design

The application uses a **Mobile-First** design strategy with Tailwind CSS breakpoints:

### Breakpoints

- **Base (< 640px)**: Mobile devices
  - Single column layout
  - Smaller text and spacing (px-4, text-xs)
  - Hidden preview panel
  - Full-width content area

- **md (≥ 768px)**: Tablet devices
  - Increased text size and spacing
  - Enhanced touch targets

- **lg (≥ 1024px)**: Desktop devices
  - Two-column layout (form + preview)
  - Fixed-width panels (720px each)
  - Visible real-time preview panel

## 🧩 Component Architecture

### UI Components (`components/ui/`)

Fully reusable, framework-agnostic components:

- **Button**: Supports multiple variants (primary, secondary, outline, gradient) and sizes
- **Input**: Text input with optional label and responsive styling
- **Textarea**: Multi-line text input with responsive design
- **Label**: Accessible form label component
- **IconButton**: Compact button for icon-only actions
- **PasswordInput**: Password input with show/hide toggle
- **PhoneInput**: International phone number input with validation
- **Tabs**: Tabbed navigation component
- **DashboardCard**: Card component for dashboard layout
- **UserDropdown**: User profile dropdown menu

### Resume Components (`components/resume/`)

Domain-specific components for resume building:

- **ProgressBar**: Step progress indicator
- **Breadcrumb**: Hierarchical navigation breadcrumbs
- **SectionCard**: Container for resume sections with controls
- **DraggableSection**: Drag-and-drop enabled section component
- **FormField**: Unified form field wrapper
- **KeywordChip**: Interactive keyword selection chip

### Form Components (`components/form/`)

Specialized form components with validation:

- **ContentBuilderForm**: Resume content creation (form + LaTeX mode, version history)
- **JobDescriptionForm**: Job description input and AI analysis

## 🗄️ State Management with Zustand

The application uses **[Zustand](https://github.com/pmndrs/zustand)** for state management, providing a simple and efficient way to manage global state without the boilerplate of Redux.

### Global Stores

#### Account Store (`stores/useAccountStore.ts`)

Manages user account state and profile data:

- User profile information
- Account settings
- Profile update operations

#### Job Posting Store (`stores/useJobPostingStore.ts`)

Manages job description analysis and keyword selection:

- Job description ID tracking
- Available keywords data
- Selected keywords state
- Keyword toggle operations

#### Resume Store (`stores/useResumeStore.ts`)

Manages resume content and structure:

- Resume sections data
- Section ordering
- Form state management

### Store Features

- **Persistence**: Uses `zustand/middleware` persist to save state to localStorage
- **Type Safety**: Full TypeScript support with typed actions and state
- **Immutable Updates**: State updates follow immutability patterns
- **Devtools Integration**: Compatible with Redux DevTools for debugging

## 🎣 Custom Hooks

Server state is handled with **TanStack React Query**; editor state uses **Zustand** (with persistence where needed).

### Profile (`hooks/useProfile.ts`)

```typescript
const { data: user, isLoading } = useProfile();
```

Fetches the current user profile from `GET /api/user`.

### Documents (`hooks/useDocuments.ts`)

```typescript
const { data: resumes } = useResumes();
const { data: resume } = useResume(resumeId);
const { data: job } = useJobPosting(jobId);
```

List/load resumes and cover letters; includes optimistic delete mutations.

### Resume Versions (`hooks/useResumeVersions.ts`)

Lists and restores resume snapshots from `GET/POST /api/resumes/[id]/versions`.

### Resume Form & PDF (`hooks/useResumeForm.ts`, `hooks/usePDFGeneration.ts`)

Form helpers and LaTeX PDF preview/generation utilities.

## 🔌 API Integration

All backend logic runs as **Next.js Route Handlers** under `/api`. The browser talks to the same origin (no separate Java backend).

### API Client (`lib/api-client.ts`)

```typescript
const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: true, // Supabase session cookies
});
```

- **Session**: Supabase sets HTTP-only cookies; no manual `Authorization` header in the client
- **401**: Redirects to `/login` when a protected request fails
- **Errors**: Surfaces `error` / `message` from JSON responses

### API Services (`lib/api-services.ts`)

Typed helpers for Route Handlers, for example:

| Area | Examples |
|------|----------|
| User | `getUserData`, `updateUserData`, `deleteUser` |
| Resumes | `getUserResumes`, `getResumeById`, `createOrUpdateResume`, `deleteResume` |
| Jobs | `getJobPosting`, `createOrUpdateJobPosting`, `analyzeJobDescription` |
| Cover letters | `getUserCoverLetters`, `createOrUpdateCoverLetter` |
| Versions | `listResumeVersions`, `restoreResumeVersion` |

AI routes (`/api/ai/analyze-job`, `/api/enrich-description`, `/api/generate-cover-letter`) require an authenticated session.

### Usage Example

```typescript
import { getUserData, updateUserData } from "@/lib/api-services";

const user = await getUserData();
await updateUserData({ first_name: "Jane", last_name: "Doe", location: "Calgary, AB" });
```

## 🔐 Authentication

Authentication uses **Supabase Auth** with **Google OAuth**:

### Features

- Cookie-based sessions (via `@supabase/ssr`)
- Middleware refreshes sessions and protects app routes
- New OAuth users complete profile at `/profile/setup`
- Logout clears Supabase session and local Zustand persistence

### Authentication Flow

1. User signs in with Google on `/login`
2. Supabase redirects to `/auth/callback` to exchange the code
3. If no `profiles` row exists → `/profile/setup`; otherwise → `/dashboard`
4. Route Handlers call `getAuthUser()` to read the session from cookies
5. AI and data APIs reject unauthenticated requests with `401`

### Configuration

See `.env.example` for `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, and `GROQ_API_KEY`.

## 🎨 Design Principles

1. **Component Decoupling**: UI components are independent and reusable
2. **Type Safety**: Full TypeScript coverage with strict type checking
3. **Composition over Inheritance**: Complex components built from simple ones
4. **Single Responsibility**: Each component has one clear purpose
5. **Mobile-First**: Base styles for mobile, enhanced for larger screens
6. **Accessibility**: ARIA labels and semantic HTML throughout

## 🔧 Technology Stack

### Core

- **Framework**: [Next.js 15.5+](https://nextjs.org/) with App Router
- **Runtime**: [React 19.1](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3.4+](https://tailwindcss.com/)

### State Management & Data Fetching

- **State Management**: [Zustand 5.0+](https://github.com/pmndrs/zustand)
- **HTTP Client**: [Axios 1.13+](https://axios-http.com/)

### UI & Interaction

- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Icons**: [@radix-ui/react-icons](https://www.radix-ui.com/icons)
- **Form Labels**: [@radix-ui/react-label](https://www.radix-ui.com/)
- **Toast Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Styling Utilities**: [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge)
- **Variants**: [class-variance-authority](https://cva.style/)

### Validation & Type Safety

- **Schema Validation**: [Zod 3.25+](https://zod.dev/)
- **Type Checking**: TypeScript with strict mode

### Development Tools

- **Linting**: [ESLint 9](https://eslint.org/) with Next.js config
- **Code Formatting**: [Prettier 3.3+](https://prettier.io/) with Tailwind plugin
- **Font**: [Geist Font Family](https://vercel.com/font)

### Services

- **PDF Generation**: LaTeX with custom microservice
- **Containerization**: Docker & Docker Compose

## 📄 LaTeX Service

The application includes a dedicated LaTeX microservice for generating professional PDF resumes:

- **Service**: Express.js server running on port 5400 (dev Docker)
- **Functionality**: Compiles LaTeX templates to PDF format
- **Integration**: REST API endpoint at `/api/compile-latex`
- **Deployment**: Containerized with Docker using TeX Live

### LaTeX Service Features

- Real-time LaTeX compilation
- Professional resume templates
- Error handling and validation
- CORS-enabled for cross-origin requests
- Automatic cleanup of temporary files

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Docker Development
npm run docker:dev       # Start dev services
npm run docker:dev:build # Build and start dev services
npm run docker:dev:down  # Stop dev services

# Docker Production
npm run docker:build     # Build production images
npm run docker:up        # Start production services
npm run docker:down      # Stop services
npm run docker:logs      # View logs
```

### Code Style

This project uses:

- ESLint for code linting
- TypeScript for type checking
- Prettier-compatible formatting (via Tailwind CSS)

## 🎯 Best Practices

- ✅ Full TypeScript type definitions
- ✅ Tailwind CSS utility-first styling
- ✅ Component reusability and composition
- ✅ Minimal props drilling with proper composition
- ✅ Code organization by feature
- ✅ Mobile-first responsive design
- ✅ Performance optimization with React best practices
- ✅ Accessibility considerations

## 🔄 Future Enhancements

- [x] ✅ Form validation with Zod
- [x] ✅ Drag-and-drop section reordering
- [x] ✅ Complete RWD implementation
- [x] ✅ Authentication system
- [x] ✅ API integration
- [x] ✅ Auto-save functionality
- [ ] AI-powered Smartfill feature
- [ ] Enhanced PDF export functionality
- [x] ✅ Unit tests (Vitest: LaTeX parser, resume versions)
- [ ] Integration / E2E tests
- [ ] End-to-end testing with Playwright
- [ ] Dark mode support (nice to have)
- [ ] Touch gesture optimizations (swipe to delete, etc.) (nice to have)
- [ ] Internationalization (i18n)
- [ ] Resume templates selection
- [ ] Export to different formats (Word, PDF, JSON)

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js and TypeScript
