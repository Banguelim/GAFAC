# Overview

This is a pizza and traditional food ordering system designed for small food vendors. The application provides a simple, intuitive interface for vendors to register orders and an administrative dashboard for tracking sales, payments, and deliveries. It handles three main product categories: caldos (broths), pizza, and traditional foods (comidas típicas) with appropriate sizing options and pricing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using **React** with **TypeScript** and styled with **Tailwind CSS**. It uses the shadcn/ui component library for consistent UI elements and follows a component-based architecture.

**Key decisions:**
- **React Router (wouter)**: Lightweight routing solution chosen for minimal bundle size and simplicity
- **TanStack Query**: Handles server state management, caching, and API calls with automatic refetching
- **React Hook Form with Zod**: Form validation and management for type-safe data handling
- **Mobile-first design**: Optimized for small screens since vendors typically use mobile devices

**Components structure:**
- `/components/ui/`: Reusable UI components from shadcn/ui
- `/components/`: Business logic components (order forms, tables, charts)
- `/pages/`: Route-level components for vendor and admin dashboards
- `/hooks/`: Custom hooks for API calls and shared logic

## Backend Architecture
The backend uses **Express.js** with **TypeScript** running on Node.js. It follows a clean separation of concerns with distinct layers for routing, business logic, and data access.

**Key decisions:**
- **Express.js**: Chosen for simplicity and rapid development
- **Storage abstraction**: Interface-based storage layer allows for easy testing and potential database changes
- **Zod validation**: Shared validation schemas between frontend and backend ensure type safety
- **PDF generation**: Server-side ticket generation using PDFKit for thermal printer receipts

**Architecture layers:**
- **Routes** (`/server/routes.ts`): API endpoint definitions and request handling
- **Storage** (`/server/storage.ts`): Data access layer with interface abstraction
- **Services** (`/server/services/`): Business logic like PDF generation
- **Shared schemas** (`/shared/schema.ts`): Common data types and validation

## Data Storage Solutions
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations.

**Key decisions:**
- **PostgreSQL with Neon**: Cloud-hosted Postgres for reliability and scalability
- **Drizzle ORM**: Type-safe database queries and migrations
- **Enum-based status tracking**: Database-level enums for payment methods and status values ensure data consistency

**Database design:**
- **users**: Vendor and admin account management
- **products**: Product catalog with types, sizes, and pricing
- **orders**: Order headers with payment and delivery status
- **orderItems**: Line items linking orders to products with quantities

## Authentication and Authorization
The system implements a simplified authentication mechanism suitable for a small vendor environment.

**Current approach:**
- **Session-based authentication**: Simple username/password login
- **Role-based access**: Admin and vendor roles with different dashboard access
- **No JWT complexity**: Simplified for the target use case

**Note:** This is a basic implementation suitable for the demo/small business context. Production deployment would require enhanced security measures.

## External Dependencies

### Database and ORM
- **@neondatabase/serverless**: PostgreSQL database hosting and connection
- **drizzle-orm**: Type-safe database queries and schema management
- **drizzle-kit**: Database migration and schema management tools

### UI and Styling
- **@radix-ui/react-***: Accessible, unstyled UI primitives (accordion, dialog, dropdown, etc.)
- **tailwindcss**: Utility-first CSS framework for rapid styling
- **class-variance-authority**: Type-safe CSS class variants
- **lucide-react**: Modern icon library

### Form Management and Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Zod integration for form validation
- **zod**: Runtime type validation and schema definition

### State Management and API
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React routing library

### PDF Generation
- **pdfkit**: Server-side PDF generation for thermal printer receipts
- **@types/pdfkit**: TypeScript definitions for PDFKit

### Development and Build Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development tools

### Date and Utility Libraries
- **date-fns**: Modern date utility library
- **clsx**: Conditional className utility
- **cmdk**: Command palette component