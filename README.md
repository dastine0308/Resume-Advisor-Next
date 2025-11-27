# Resume Advisor Next

A modern, fully responsive resume builder application built with Next.js, React, TypeScript, and Tailwind CSS. This project implements best practices in component architecture, type safety, and mobile-first responsive design.

## 🌟 Features

- **📱 Fully Responsive Design (RWD)**: Perfect experience on mobile, tablet, and desktop devices
- **🎯 Mobile-First Approach**: Optimized for mobile devices with progressive enhancement
- **🧩 Modular Component Architecture**: Decoupled, reusable components following SOLID principles
- **⚡ Type-Safe**: Full TypeScript support with comprehensive type definitions
- **🎨 Modern UI**: Built with Tailwind CSS utility-first approach
- **🔐 Authentication**: Secure authentication with NextAuth.js and JWT tokens
- **🔄 API Integration**: Axios-based API client with automatic token injection and error handling
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

Edit the `.env` file with your configuration:

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
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
- **LaTeX Service**: Available at [http://localhost:3002](http://localhost:3002)

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
│       ├── sign-up-form.tsx   # User signup form
│       ├── profile-set-up-form.tsx # Profile setup form
│       ├── content-builder-form.tsx # Resume content builder form
│       └── job-description-form.tsx # Job description form
├── types/
│   ├── user.ts                # User type definitions
│   ├── resume.ts              # Resume type definitions
│   ├── job-description.ts     # Job description type definitions
│   └── keywords.ts            # Keywords type definitions
├── stores/
│   ├── useAccountStore.ts     # Zustand store for account state
│   ├── useSignupStore.ts      # Zustand store for signup flow
│   ├── useJobPostingStore.ts    # Zustand store for Job posting state
│   ├── useResumeStore.ts      # Zustand store for resume state
│   └── index.ts               # Store exports
├── hooks/
│   ├── useUserData.ts         # Custom hook for user data management
│   ├── useResumeForm.ts       # Custom hook for resume form state
│   ├── usePDFGeneration.ts    # Custom hook for PDF generation
│   └── index.ts               # Hooks exports
├── lib/
│   ├── api-client.ts          # Axios instance with auth interceptors
│   ├── api-services.ts        # API service functions
│   ├── utils.ts               # Utility functions
│   ├── latex-client.ts        # LaTeX service client
│   ├── latex-generator.ts     # LaTeX template generator
│   └── auth/
│       └── index.ts           # NextAuth configuration
└── app/
    ├── (dashboard)/           # Dashboard route group
    │   └── page.tsx           # Dashboard home page
    ├── providers/             # React context providers
    │   ├── auth-provider.tsx  # Authentication provider
    │   └── themeProvider.tsx  # Theme provider
    ├── resume/
    │   └── page.tsx           # Resume builder page
    ├── settings/
    │   └── page.tsx           # Account settings page
    ├── cover-letter/
    │   └── page.tsx           # Cover letter page
    ├── login/
    │   └── page.tsx           # Login page
    ├── signup/
    │   └── page.tsx           # Signup page
    ├── api/
    │   ├── auth/
    │   │   └── [...nextauth]/
    │   │       └── route.ts   # NextAuth API routes
    │   ├── compile-latex/
    │   │   ├── route.ts       # LaTeX compilation API endpoint
    │   │   └── health/
    │   │       └── route.ts   # Health check endpoint
    │   └── analyze-job-description/
    │        └── route.ts      # Job description analysis API endpoint
    ├── layout.tsx             # Root layout
    ├── page.tsx               # Landing page
    └── globals.css            # Global styles

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

- **SignUpForm**: Multi-step user registration form
- **ProfileSetUpForm**: User profile setup form
- **ContentBuilderForm**: Resume content creation form
- **JobDescriptionForm**: Job description input form

## 🗄️ State Management with Zustand

The application uses **[Zustand](https://github.com/pmndrs/zustand)** for state management, providing a simple and efficient way to manage global state without the boilerplate of Redux.

### Global Stores

#### Account Store (`stores/useAccountStore.ts`)

Manages user account state and profile data:

- User profile information
- Account settings
- Profile update operations

#### Signup Store (`stores/useSignupStore.ts`)

Handles the multi-step signup flow:

- Current step tracking
- Form data persistence across steps
- Validation state management

#### Keywords Store (`stores/useJobPostingStore.ts`)

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

The application includes several custom React hooks for common operations:

### User Data Hook (`hooks/useUserData.ts`)

Automatically fetches and syncs user data with the account store:

```typescript
const { isLoading, isAuthenticated } = useUserData();
```

- Triggers on user login or session restoration
- Prevents duplicate API calls
- Automatically updates account store
- Returns authentication status

### Resume Form Hook (`hooks/useResumeForm.ts`)

Manages resume form state and operations:

- Form data management
- Section CRUD operations
- Validation handling
- Form submission logic

### PDF Generation Hook (`hooks/usePDFGeneration.ts`)

Handles LaTeX PDF generation:

- Resume compilation to LaTeX
- PDF download management
- Error handling for compilation failures
- Loading state management

## 🔌 API Integration

The application uses a centralized API client architecture for all backend communication.

### API Client (`lib/api-client.ts`)

Axios-based HTTP client with the following features:

#### Configuration

```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
```

#### Request Interceptor

- Automatic JWT token injection from NextAuth session
- Adds `Authorization: Bearer <token>` header to all requests
- Retrieves token from active session automatically

#### Response Interceptor

- Unified error handling across all API calls
- Automatic extraction of data from backend response structure
- Network error detection and user-friendly error messages
- Error logging for debugging

### API Services (`lib/api-services.ts`)

Type-safe service functions for all API endpoints:

#### Authentication

- `login(credentials)`: User login with email/password
- `signup(data)`: User registration with profile data

#### User Management

- `getUserData()`: Fetch current user profile
- `updateUserData(data)`: Update user profile
- `deleteUser()`: Delete user account

### Usage Example

```typescript
import { getUserData, updateUserData } from "@/lib/api-services";

// Fetch user data
const user = await getUserData();

// Update user profile
const updatedUser = await updateUserData({
  first_name: "John",
  last_name: "Doe",
  location: "San Francisco, CA"
});
```

### Error Handling

All API calls include automatic error handling:

- Network errors: Connection issues, timeouts
- Server errors: 4xx and 5xx HTTP status codes
- Response validation: Type-safe responses with TypeScript

## 🔐 Authentication

The application uses **NextAuth.js** for secure authentication:

### Features

- JWT-based session management
- Secure credential authentication
- Automatic token refresh
- Session persistence across page reloads
- Protected routes with middleware

### Authentication Flow

1. User submits login credentials
2. NextAuth validates credentials via backend API
3. JWT token stored in secure session
4. Token automatically included in all API requests
5. Session expires after inactivity period

### Configuration

Environment variables required:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

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
- **Phone Input**: [react-phone-number-input](https://www.npmjs.com/package/react-phone-number-input)
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

- **Service**: Express.js server running on port 3002
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
- [ ] Auto-save functionality
- [ ] AI-powered Smartfill feature
- [ ] Enhanced PDF export functionality
- [ ] Unit and integration tests
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
