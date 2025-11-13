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
-   **Landing Page**: Single-page application with sections for hero, statistics, spotlight features, 3D gallery, infinite-scrolling category sliders, interactive Bento grid, 3D jersey showcase with model viewer, enhanced pricing plans with electric borders, creator CTAs, and FAQ. The navbar includes desktop navigation links (Resources dropdown, Pricing, Sign In) and action buttons (Customer Dashboard, Designer Onboarding, Designer Console). Mobile menu includes all navigation links and buttons. Features:
    -   **Infinite Sliders**: CardSlider components with looping animation for Popular Categories and Trending Collections
    -   **Jersey Showcase**: Interactive 3D model viewer for jersey designs with carousel navigation, auto-rotate, zoom controls, model selector grid, and interactive controls guide
    -   **Pricing Plans**: Three-tier pricing (Free/Pro/Agency) with enhanced electric border animation on the Pro plan (purple color, high chaos effect)
<<<<<<< HEAD
-   **Designer Onboarding**: Full-screen guided wizard with three-step process for new designers:
    -   **Step 1 - Basic Profile**: Personal information form with real-time validation, profile photo upload, email/phone OTP verification modals, password strength meter, and inline error messages.
    -   **Step 2 - Business & Razorpay Details**: Tabbed form (Contact Details / Business Details / Legal Info) for business registration, address, PAN/GST/MSME documents, and Razorpay linked account creation with status display.
    -   **Step 3 - Bulk Upload**: Minimum 50 designs requirement with .zip file upload, clear folder structure requirements, template download option, and server-side validation messaging. Each design must include .eps, .cdr, .jpg, .png, and .svg files.
    -   **Features**: Three-step progress indicator, two-column layout (tips + form), OTP verification for all contact methods, file uploads with validation, Razorpay account creation flow with verification status (verified/pending/rejected), and responsive design.
-   **Designer Console**: A comprehensive dashboard for designers, including:
    -   **Verification System**: Account verification gates control access to designer features:
        -   **Pending State**: Shows "Account Pending Verification" message with estimated 24-48 hour wait time. Only Dashboard, Notifications, Messages/Support, and Settings are accessible.
        -   **Locked Features**: My Designs, Upload Design, Analytics, Earnings & Wallet, Settlements, and Downloads (PDFs) are locked with lock icons until account approval.
        -   **Manual Toggle (Development)**: Top bar includes a toggle button (marked with "DEV" badge) to switch between pending/verified states for testing the lock feature.
        -   **Context Management**: Uses DesignerVerificationContext for centralized verification state management across the console.
=======
-   **Designer Onboarding**: Full-screen guided wizard with two-step process for new designers:
    -   **Step 1 - Basic Profile**: Personal information form with real-time validation, profile photo upload, email/phone OTP verification modals, password strength meter, and inline error messages.
    -   **Step 2 - Business & Razorpay Details**: Tabbed form (Contact Details / Business Details / Legal Info) for business registration, address, PAN/GST/MSME documents, and Razorpay linked account creation with status display.
    -   **Features**: Progress indicator, two-column layout (tips + form), OTP verification for all contact methods, file uploads with validation, Razorpay account creation flow with verification status (verified/pending/rejected), and responsive design.
-   **Designer Console**: A comprehensive dashboard for designers, including:
>>>>>>> 0b4980ae997493b4e66d931e29ebc509012a0276
    -   **Dashboard**: KPIs, wallet balance, notifications, smart settlement widget.
    -   **My Designs**: Uploads, filtering, grid/list views, design detail panel, performance scoring.
    -   **Upload Design**: Form for design details, category, tags, pricing, and file uploads with validation.
    -   **Analytics**: Performance overview with KPIs, trend charts (Views, Purchases, Downloads) with AI-generated insights, and per-design analytics.
    -   **Earnings & Wallet**: Wallet summary, monthly settlement window with acceptance/rejection, transaction history with filtering, and payout tracking.
    -   **Notifications**: Centralized message hub with Today/This Week/Older grouping, type-specific icons (sales, achievements, messages, approvals, warnings, info, system), bulk actions (mark all as read, delete selected), filter by category, contextual actions (View Design, navigate to related pages), mark as read/delete per notification, and animated list items.
    -   **Settings**: Profile and account management with two tabs:
        -   **Profile Tab**: Editable personal information (first name, last name, email, phone), profile photo upload with validation (images only, max 5MB), re-verification buttons for email/phone with OTP modals, password & security section with change password option.
        -   **Business & Account Tab**: Razorpay linked account status UI (Not Created/Pending/Verified/Rejected states), rejection reason with step-by-step corrections and retry button, pending state with action items and ETA, verified state with status cards, editable business information (business email, phone, legal name, business type readonly, PAN number, GST number optional).
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
-   **Authentication System**: Complete JWT-based authentication with OTP verification:
    -   **Register Page** (`/auth/register`): Registration form with first name, last name, email (with OTP verification), mobile number (with OTP verification), password with strength meter, confirm password. Real-time validation, inline errors. Cannot submit without verified email and mobile.
    -   **Login Page** (`/auth/login`): Email/username and password fields, remember me option, forgot password link, social login buttons (Google/GitHub ready for integration).
    -   **Reset Password Page** (`/auth/reset-password`): Email input to request password reset link, success state with next steps.
    -   **Set Password Page** (`/auth/set-password`): New password form with token validation, password strength meter, requirements checklist, confirm password.
    -   **OTP Verification Modal**: Reusable component with 6-digit input, auto-submit on completion, resend with 60-second timer, error handling, success animation.
    -   **Auth Context** (`contexts/AuthContext.tsx`): Centralized authentication state management with JWT token persistence in localStorage, methods for login, register, logout, password reset/set, OTP sending/verification for email and mobile.
    -   **Features**: Dark theme with purple accents, Framer Motion animations, toast notifications, password strength indicator (5 levels), real-time validation, responsive design.
-   **Global Layout**: Includes theme provider, auth provider, toast notifications, tooltip provider, query client provider, and a full-page CSS-animated particle background with purple/violet glowing particles.

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