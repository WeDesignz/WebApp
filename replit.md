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
    -   **Top Bar**: Search input, category filter, cart button (with count badge), wishlist button (with count badge), profile menu.
    -   **Main Content**: Category cards slider, "Invite Freelancers" CTA, responsive design feed grid with hover effects for free/premium designs, infinite scroll.
    -   **Product Modal**: Detailed product view with description, plan types, sub-product table, heart button (add to wishlist), and conditional actions (Download, Add to Cart, Buy Now, Purchase Plan).
    -   **Cart & Wishlist**: Full shopping cart and wishlist functionality with context-based state management and localStorage persistence.
        -   **Cart Drawer**: Slide-in drawer from right with items list, coupon input (visual), promo callout, subtotal/total, "View Cart" and "Continue Shopping" CTAs.
        -   **Cart Page** (`/customer-dashboard/cart`): Two-column layout (desktop, single-column mobile) with item list (left), order summary (right). Features: bulk select/actions, individual item actions (Remove, Save to Wishlist), coupon application, payment methods display, empty state.
        -   **Wishlist Page** (`/customer-dashboard/wishlist`): Grid (4-column) and list view toggle. Features: bulk select/actions, individual actions (Add to Cart, Quick View, Remove), filled heart icons, premium badges, empty state.
        -   **Quick View Modal**: Product preview modal with image, details, tags, file formats, license, price, heart button, Add to Cart button.
        -   **Context State Management** (`contexts/CartWishlistContext.tsx`): React Context with localStorage persistence for cart and wishlist. Functions: addToCart, removeFromCart, clearCart, moveToWishlist, addToWishlist, removeFromWishlist, clearWishlist, moveToCart, helper functions for counts and totals.
        -   **Animations**: Framer Motion for drawer slide-in, item add/remove, modal open/close. Toast notifications for all user actions.
        -   **Responsive Design**: Cart drawer 450px on desktop, full-width on mobile. Cart page stacks columns on mobile. Wishlist grid adapts 1/2/3/4 columns based on breakpoint.
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