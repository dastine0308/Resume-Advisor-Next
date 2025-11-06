# Resume Advisor Next

A modern, fully responsive resume builder application built with Next.js, React, TypeScript, and Tailwind CSS. This project implements best practices in component architecture, type safety, and mobile-first responsive design.

## 🌟 Features

- **📱 Fully Responsive Design (RWD)**: Perfect experience on mobile, tablet, and desktop devices
- **🎯 Mobile-First Approach**: Optimized for mobile devices with progressive enhancement
- **🧩 Modular Component Architecture**: Decoupled, reusable components following SOLID principles
- **⚡ Type-Safe**: Full TypeScript support with comprehensive type definitions
- **🎨 Modern UI**: Built with Tailwind CSS utility-first approach
- **🔄 Real-time Preview**: Side-by-side editing and preview on desktop devices
- **📝 Multiple Resume Sections**: Education, Experience, Projects, Leadership, and Technical Skills
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

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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
│   │   ├── IconButton.tsx     # Icon button component
│   │   └── index.ts           # UI components exports
│   └── resume/                # Resume-specific components
│       ├── Navigation.tsx     # Top navigation bar
│       ├── ProgressBar.tsx    # Progress indicator
│       ├── Breadcrumb.tsx     # Breadcrumb navigation
│       ├── SectionCard.tsx    # Section card container
│       ├── FormField.tsx      # Form field wrapper
│       └── index.ts           # Resume components exports
├── types/
│   ├── resume.ts              # TypeScript type definitions
│   ├── job-description.ts     # Job description type definitions
│   └── keywords.ts            # Keywords type definitions
├── stores/
│   ├── useKeywordsStore.ts    # Zustand store for keywords state
│   └── index.ts               # Store exports
├── hooks/
│   ├── useResumeForm.ts       # Custom hook for form state
│   ├── usePDFGeneration.ts    # Custom hook for PDF generation
│   ├── useJobDescription.ts   # Custom hook for form state management
│   ├── useKeywordsSelection.ts # Custom hook for keywords selection
│   └── index.ts               # Hooks exports
├── lib/
│   ├── latex-client.ts        # LaTeX service client
│   └── latex-generator.ts     # LaTeX template generator
└── app/
    ├── content-builder/
    │   ├── page.tsx           # Resume builder main page
    │   └── fake_resume_data.json
    ├── job-description/
    │   └── page.tsx           # Job description input page
    ├── keywords-selection/
    │   └── page.tsx           # Keywords selection page
    ├── api/
    │   ├── compile-latex/
    │   │   └── route.ts       # LaTeX compilation API endpoint
    │   └── analyze-job-description/
    │        └── route.ts      # API endpoint for analysis
    ├── login/
    │   └── page.tsx           # Login page
    ├── signup/
    │   └── page.tsx           # Signup page
    ├── layout.tsx             # Root layout
    ├── page.tsx               # Home page
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
- **IconButton**: Compact button for icon-only actions

### Resume Components (`components/resume/`)

Domain-specific components for resume building:

- **Navigation**: Top navigation bar with back button
- **ProgressBar**: Step progress indicator
- **Breadcrumb**: Hierarchical navigation breadcrumbs
- **SectionCard**: Container for resume sections with controls
- **FormField**: Unified form field wrapper

## 🗄️ State Management with Zustand

The application uses **[Zustand](https://github.com/pmndrs/zustand)** for state management, providing a simple and efficient way to manage global state without the boilerplate of Redux.

### Keywords Store (`stores/useKeywordsStore.ts`)

The keywords store manages the state for job description analysis and keyword selection:

#### Store Structure

```typescript
interface KeywordsStore {
  jobId: string;                    // Current job description ID
  keywordsData: Keyword[];          // All available keywords
  selectedKeywords: Keyword[];      // User-selected keywords

  // Actions
  setJobId: (id: string) => void;
  setKeywordsData: (data: Keyword[]) => void;
  toggleKeyword: (id: string) => void;
  resetKeywords: () => void;
  updateSelectedKeywords: () => void;
}
```

#### Features

- **Persistence**: Uses `zustand/middleware` persist to save state to localStorage
- **Automatic Updates**: Selected keywords are automatically updated when toggled
- **Type Safety**: Full TypeScript support with typed actions and state

## 🎨 Design Principles

1. **Component Decoupling**: UI components are independent and reusable
2. **Type Safety**: Full TypeScript coverage with strict type checking
3. **Composition over Inheritance**: Complex components built from simple ones
4. **Single Responsibility**: Each component has one clear purpose
5. **Mobile-First**: Base styles for mobile, enhanced for larger screens
6. **Accessibility**: ARIA labels and semantic HTML throughout

## 🔧 Technology Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI Components**: Custom-built with React
- **Font**: [Geist Font Family](https://vercel.com/font)
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

- [ ] Form validation with Zod
- [ ] Drag-and-drop section reordering
- [ ] Auto-save functionality
- [ ] AI-powered Smartfill feature
- [ ] PDF export functionality
- [ ] Unit and integration tests
- [x] ✅ Complete RWD implementation
- [ ] Dark mode support (nice to have)
- [ ] Touch gesture optimizations (swipe to delete, etc.) (nice to have)
- [ ] Internationalization (i18n)

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js and TypeScript
