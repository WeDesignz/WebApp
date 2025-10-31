# WeDesign - Creative Design Marketplace

## Overview
WeDesign is a Next.js 14 design marketplace and portfolio platform connecting designers with clients. It facilitates showcasing work, selling digital assets, offering freelance services, and team collaboration. The platform emphasizes rich animations, 3D experiences, and an intuitive UI, aiming to be both a marketplace and a creative community hub with significant market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
Built with **Next.js 14 (App Router, React Server Components)** and **TypeScript**. Uses **Radix UI** for accessible components and **Tailwind CSS** for styling, with a custom theming system for light/dark modes. **Framer Motion**, **GSAP**, **Three.js (@react-three/fiber, @react-three/drei)**, and **OGL** are used for animations and 3D visuals. **TanStack Query** manages server state and data fetching.

### Design System & Theming
Employs an HSL-based color system for theming, supporting light/dark modes. Features interactive components like spotlight effects, magnetic hover, particle systems, and a 3D model viewer.

### Page Structure
-   **Landing Page**: Single-page application with sections for hero, statistics, spotlight features, 3D gallery, categories, interactive Bento grid, pricing, creator CTAs, and FAQ.
-   **Designer Console**: A comprehensive dashboard for designers, including:
    -   **Dashboard**: KPIs, wallet balance, notifications, smart settlement widget.
    -   **My Designs**: Uploads, filtering, grid/list views, design detail panel, performance scoring.
    -   **Upload Design**: Form for design details, category, tags, pricing, and file uploads with validation.
    -   **Analytics**: Performance overview with KPIs, trend charts (Views, Purchases, Downloads) with AI-generated insights, and per-design analytics.
    -   **Earnings & Wallet**: Wallet summary, monthly settlement window with acceptance/rejection, transaction history with filtering, and payout tracking.
-   **Customer Dashboard**: User-facing interface for browsing and managing purchases, featuring:
    -   **Sidebar Navigation**: Collapsible on desktop, full-screen overlay on mobile, with menu items and utility links.
    -   **Top Bar**: Search input, category filter, profile menu.
    -   **Main Content**: Category cards slider, "Invite Freelancers" CTA, responsive design feed grid with hover effects for free/premium designs, infinite scroll.
    -   **Product Modal**: Detailed product view with description, plan types, sub-product table, and conditional actions (Download, Add to Cart, Buy Now, Purchase Plan).
-   **Global Layout**: Includes theme provider, toast notifications, tooltip provider, query client provider, and a full-page WebGL particle background.

### Data Fetching
Utilizes a custom `apiRequest` helper for standardized fetch calls with JSON handling, configured for session-based authentication and error handling. **TanStack Query** is configured for no automatic refetching and infinite stale time.

### Build & Development
Uses **Next.js** development server, standard build commands, and **TypeScript** with strict mode and path aliases.

### Asset Management
Manages static assets in the public directory. Optimizes images via **Next.js Image** component and uses dynamic imports for heavy client-side components. Supports GLTF/GLB, FBX, and OBJ 3D models with environmental rendering.

## External Dependencies

### UI & Styling
-   **@radix-ui/***: Accessible UI primitives.
-   **tailwindcss**: Utility-first CSS framework.
-   **next-themes**: Theme switching.
-   **lucide-react**: Icon library.

### Animation & Graphics
-   **framer-motion**: React animation library.
-   **gsap**: Professional animation platform.
-   **@react-three/fiber**: React renderer for Three.js.
-   **@react-three/drei**: Three.js helper components for React.
-   **ogl**: Minimal WebGL library.
-   **@use-gesture/react**: Gesture recognition.

### Data Management
-   **@tanstack/react-query**: Async state management for data fetching.

### Utilities
-   **class-variance-authority**: Type-safe component variants.
-   **clsx**: Conditional className utility.
-   **cmdk**: Command menu/palette.

### Development
-   **TypeScript**: Static type checking.
-   **Next.js 14**: React framework.
-   **React 18**: UI library.