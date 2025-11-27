# WeDesignz WebApp - Replit Project Documentation

## Project Overview
WeDesignz is a Next.js 15 web application for a design marketplace platform that connects designers with customers. The application features:
- Customer dashboard for browsing and purchasing designs
- Designer console for managing designs, earnings, and analytics
- Designer onboarding workflow
- Authentication system (login, registration, password reset)
- Shopping cart and wishlist functionality
- Support and messaging system

## Technology Stack
- **Frontend Framework**: Next.js 15.5.6 (React 18.3.1)
- **Language**: TypeScript 5.6.3
- **Styling**: Tailwind CSS 3.4.17 with custom theme
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion, GSAP
- **3D Rendering**: Three.js with React Three Fiber
- **State Management**: React Context API, TanStack Query
- **Form Handling**: React Hook Form

## Project Architecture

### Directory Structure
```
app/                    - Next.js app router pages
  auth/                - Authentication pages (login, register, etc.)
  customer-dashboard/  - Customer-facing dashboard pages
  designer-console/    - Designer console pages
  designer-onboarding/ - Designer registration workflow
components/            - React components
  auth/               - Authentication components
  customer-dashboard/ - Customer dashboard components
  designer-console/   - Designer console components
  ui/                 - Reusable UI components (based on shadcn/ui)
contexts/             - React context providers
hooks/                - Custom React hooks
lib/                  - Utility functions and API client
  api.ts             - API client for Django backend
public/               - Static assets
```

### Backend Integration
This frontend application connects to a separate Django backend API. The API base URL is configured via the `NEXT_PUBLIC_API_BASE_URL` environment variable.

**Current API URL**: https://api.wedesignz.com

The application expects the following API endpoints:
- `/api/auth/*` - Authentication (login, register, refresh tokens)
- `/api/catalog/*` - Design catalog
- `/api/orders/*` - Order management
- `/api/profiles/*` - User profiles
- `/api/wallet/*` - Designer wallet/earnings
- `/api/notifications/*` - Notifications

## Replit Configuration

### Environment Setup
- **Node.js Version**: 20.x
- **Development Port**: 5000 (bound to 0.0.0.0)
- **Production Port**: 5000

### Environment Variables
- `NEXT_PUBLIC_API_BASE_URL`: Backend API base URL (development: https://api.wedesignz.com)

### Workflows
- **Next.js Dev Server**: Runs `npm run dev` on port 5000 with webview output

### Deployment Configuration
- **Type**: Autoscale (stateless web app)
- **Build**: `npm run build`
- **Start**: `npm start` (production server on port 5000)

## Recent Changes (Nov 27, 2025)

### Hero Section Redesign
- Replaced centered search-focused hero with split-layout design
- Left side: Large headline "Discover, collect, and sell extraordinary Designs", subtitle with lightning icon, Explore/Create buttons
- Right side: Featured design card with countdown timer, creator info, and current bid price
- Added floating mini cards around the main featured card
- Added grid background pattern effect
- Added rotating circular "Explore Designs" button
- Added `spin-slow` animation for rotating text
- Implemented stacked card carousel with 3 designs that auto-rotate every 4 seconds
- Cards are smaller and positioned in a queue-like stack with perspective effect

### Navbar Redesign (ForestLock Style)
- Made navbar transparent with glass effect (`bg-black/20 backdrop-blur-md`)
- Removed navbar border for cleaner look
- Simplified navigation to: Logo, Resources dropdown (About, Contact, FAQ), Blog, Customer Dashboard, Designer Console
- Added tube light glow effect at the bottom of the navbar (casts light downward only, not inside navbar)
- Added 360-degree vertical spin animation on hover for nav menu text (Resources, Blog)
- Removed: Pricing, Sign In, Designer Onboarding from navbar
- Updated mobile menu with same simplified navigation structure
- Added `spin-y` keyframe animation to Tailwind config

### Particle Effect Upgrade
- Replaced CSS-based particle effect with WebGL-based OGL particle effect on the landing page
- Uses `components/Particles.tsx` with WebGL rendering for smoother, more performant animations
- Configuration: 200 particles, white colors, hover interaction enabled, slow rotation

### Initial Replit Setup
1. Installed Node.js 20 and npm dependencies
2. Configured Next.js for Replit environment:
   - Updated dev script to use port 5000 instead of 5002
   - Added `allowedDevOrigins: ['*']` to allow proxy access
   - Added cache control headers to prevent caching issues
   - Removed deprecated `devIndicators.appIsrStatus` option
3. Set up environment variable for backend API connection
4. Configured workflow for Next.js dev server
5. Configured deployment settings for autoscale deployment
6. Updated xlsx package to latest version (security patches)

## Known Issues
- **xlsx vulnerability**: The xlsx package (0.18.5+) has known high severity vulnerabilities (Prototype Pollution, ReDoS). No fix is available yet from the upstream package. Consider migrating to an alternative library if security is critical.
- **Hydration mismatch**: Minor React hydration warnings appear in development (common in Next.js apps with animations/dynamic content)

## User Preferences
None documented yet.

## Next Steps for Users
1. **Configure Backend API**: Update the `NEXT_PUBLIC_API_BASE_URL` environment variable to point to your actual Django backend API
2. **Authentication Setup**: Ensure the backend API is running and accessible for authentication features to work
3. **Security Review**: Consider replacing the xlsx package with a more secure alternative for Excel file handling
4. **Customize Content**: Update branding, copy, and design assets in the public/ folder

## Maintenance Notes
- Dependencies are managed via npm (package.json)
- The .gitignore is configured to exclude node_modules, .next build output, and environment files
- The application uses the Next.js App Router (not Pages Router)
- All API calls go through the centralized API client in `lib/api.ts`
