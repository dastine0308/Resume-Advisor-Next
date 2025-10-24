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

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

### Installation

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

### Accessing the Resume Builder

Navigate to [http://localhost:3000/content-builder](http://localhost:3000/content-builder) to access the resume content builder page.

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
│   └── resume.ts              # TypeScript type definitions
├── hooks/
│   ├── useResumeForm.ts       # Custom hook for form state
│   └── index.ts               # Hooks exports
└── app/
    ├── content-builder/
    │   ├── page.tsx           # Resume builder main page
    │   └── fake_resume_data.json
    ├── login/
    │   └── page.tsx           # Login page
    ├── signup/
    │   └── page.tsx           # Signup page
    ├── layout.tsx             # Root layout
    ├── page.tsx               # Home page
    └── globals.css            # Global styles
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

### Key Responsive Features

```tsx
// Main container: single column on mobile, two columns on desktop
<div className="flex flex-col lg:flex-row">

// Form panel: full width on mobile, fixed 720px on desktop
<div className="w-full lg:w-[720px] h-auto lg:h-[780px]">

// Preview panel: hidden on mobile, visible on desktop
<div className="hidden lg:block w-[720px] h-[780px]">

// Responsive text sizing
<h2 className="text-sm md:text-base">

// Responsive spacing
<div className="p-4 md:p-6">
```

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
- **UI Components**: Custom-built with React
- **Font**: [Geist Font Family](https://vercel.com/font)

## 📚 Documentation

For detailed component documentation, see:

- [COMPONENTS.md](./COMPONENTS.md) - Comprehensive component API documentation (Chinese)
- [RWD_SUMMARY.md](./RWD_SUMMARY.md) - Responsive design implementation details (Chinese)

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

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

- [ ] Form validation with Zod or Yup
- [ ] Drag-and-drop section reordering
- [ ] Auto-save functionality
- [ ] AI-powered Smartfill feature
- [ ] PDF export functionality
- [ ] Unit and integration tests
- [x] ✅ Complete RWD implementation
- [ ] Dark mode support
- [ ] Touch gesture optimizations (swipe to delete, etc.)
- [ ] Internationalization (i18n)

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js and TypeScript
