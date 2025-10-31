# WeDesign - Creative Design Marketplace

## Overview

WeDesign is a Next.js 14-based design marketplace and portfolio platform that connects designers with clients globally. The platform enables designers to showcase their work, sell digital assets, offer freelance services, and collaborate with teams. Built with a modern tech stack emphasizing rich animations, 3D experiences, and an intuitive UI, WeDesign serves as both a marketplace and a creative community hub.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Rendering**
- **Next.js 14** with App Router using React Server Components where applicable
- Client-side rendering for interactive components marked with `"use client"` directive
- TypeScript for type safety across the application
- Custom path aliases (`@/*` for root, `@assets/*` for public directory)

**UI Component System**
- **Radix UI** primitives for accessible, unstyled components (accordion, dialog, dropdown, popover, tooltip, etc.)
- **Tailwind CSS** for utility-first styling with custom design tokens
- Custom theming system using CSS variables for light/dark modes (defaulting to dark)
- `class-variance-authority` for type-safe component variant management
- `clsx` and `tailwind-merge` utilities for conditional class composition

**Animation & Visual Effects**
- **Framer Motion** for declarative animations and transitions
- **GSAP** for complex timeline-based animations
- **Three.js** ecosystem via `@react-three/fiber` and `@react-three/drei` for 3D model viewing
- **OGL** (minimal WebGL library) for custom particle effects
- Custom-built components: `Particles`, `ElectricBorder`, `DomeGallery`, `MagicBento` for unique visual experiences
- `@use-gesture/react` for touch and drag gesture handling

**State Management**
- **TanStack Query (React Query)** for server state management, caching, and data fetching
- Local component state using React hooks
- Theme management via `next-themes`
- Custom query client configuration with strict caching policies (no auto-refetch, infinite stale time)

### Design System & Theming

**Color System**
- HSL-based color tokens defined in CSS custom properties
- Comprehensive semantic color palette: background, foreground, primary, secondary, muted, accent, destructive
- Status colors: success, warning, info, link
- Card and popover variants with dedicated foreground and border tokens
- Support for both light and dark modes (currently defaulting to dark)

**Component Patterns**
- Spotlight effects with mouse tracking for interactive cards
- Magnetic hover effects and tilt animations
- Particle systems with configurable colors, counts, and behaviors
- 3D model viewer with auto-framing, environment presets, and lighting controls
- Infinite scrolling card sliders with drag-to-scroll functionality

### Page Structure

**Landing Page (app/page.tsx)**
Single-page application structure with sections:
- Hero section with advanced search UI and AI-powered features
- Client statistics with animated counters
- Spotlight features grid
- 3D gallery dome for showcasing designs
- Category sliders
- Magic Bento grid with interactive effects
- Pricing plans with electric borders
- Creator callouts and freelancer CTAs
- FAQ accordion
- Footer with sitemap

**Global Layout**
- Theme provider wrapping entire application
- Toast notification system
- Tooltip provider for accessible hover content
- Query client provider for data fetching

### Data Fetching Strategy

**API Request Abstraction**
- Custom `apiRequest` helper for standardized fetch calls with JSON handling
- Query functions with configurable unauthorized behavior (throw or return null)
- Credentials included by default for session-based authentication
- Error handling with status code and response text

**Query Configuration**
- No automatic refetching on window focus or intervals
- Infinite stale time (data never considered stale)
- Custom error boundaries for 401 handling

### Build & Development

**Scripts**
- Development server on port 5000, bound to all interfaces (0.0.0.0)
- Standard Next.js build and production start commands
- ES modules via `"type": "module"` in package.json

**TypeScript Configuration**
- ES2020 target with ESNext module resolution
- Bundler module resolution for Next.js App Router
- Strict mode enabled
- Incremental compilation for faster builds
- Path aliases for cleaner imports

### Asset Management

**Static Assets**
- Public directory for generated design images (posters, mockups, 3D renders, etc.)
- Dynamic imports for heavy client-side components (ModelViewer, Particles) to reduce initial bundle size
- Image optimization via Next.js Image component (type definitions included)

**3D Model Support**
- GLTF/GLB loader via `@react-three/drei`
- FBX loader support
- OBJ loader from Three.js examples
- Environment maps and contact shadows for realistic rendering
- Screenshot capability for model viewer

## External Dependencies

### UI & Styling Libraries
- **@radix-ui/***: Comprehensive set of accessible, unstyled UI primitives (20+ components)
- **tailwindcss**: Utility-first CSS framework with PostCSS integration
- **next-themes**: Theme switching system with system preference detection
- **lucide-react**: Icon library for consistent iconography

### Animation & Graphics
- **framer-motion**: Production-ready motion library for React
- **gsap**: Professional-grade animation platform
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components for R3F (OrbitControls, useGLTF, Environment, etc.)
- **ogl**: Minimal WebGL library for custom particle effects
- **@use-gesture/react**: Gesture recognition for drag, pinch, scroll

### Data Management
- **@tanstack/react-query**: Powerful async state management for data fetching and caching

### Utilities
- **class-variance-authority**: Type-safe component variants
- **clsx**: Conditional className utility
- **cmdk**: Command menu/palette component (likely for search/command features)

### Development
- **TypeScript**: Static type checking
- **Next.js 14**: React framework with App Router
- **React 18**: UI library with concurrent features

### Future Integration Points
The application structure suggests planned features for:
- User authentication (query client configured for 401 handling)
- Backend API (standardized request helpers in place)
- Database integration (no current implementation visible)
- Payment processing (pricing plans defined)
- File uploads (creator upload flows in UI)
- Real-time collaboration (mentioned in feature descriptions)