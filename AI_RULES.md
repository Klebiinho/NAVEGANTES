# AI Development Rules

This document outlines the technical stack and provides clear rules for the AI assistant on how to build and modify this application.

## Tech Stack

This project is built with a modern, component-based architecture. The key technologies are:

-   **Framework**: React (using Vite for a fast development experience).
-   **Language**: TypeScript for type safety and improved developer experience.
-   **Styling**: Tailwind CSS for a utility-first styling approach.
-   **UI Components**: `shadcn/ui` provides a set of reusable, accessible, and stylable components.
-   **Routing**: React Router (`react-router-dom`) for client-side navigation.
-   **Data Fetching & State**: TanStack Query (React Query) for managing server state, caching, and data synchronization.
-   **Backend & Database**: Supabase for database, authentication, and other backend services.
-   **Icons**: `lucide-react` for a comprehensive and consistent set of icons.
-   **Forms**: React Hook Form for performant and flexible form handling, paired with Zod for schema validation.

## Library Usage Rules

To maintain consistency and quality, please adhere to the following rules when adding or modifying code:

### 1. UI and Components

-   **Primary Component Library**: Always prioritize using components from the `shadcn/ui` library located in `src/components/ui`.
-   **Custom Components**: If a required component is not available in `shadcn/ui`, create a new, reusable component in `src/components/`. These components should be built using Tailwind CSS and follow the existing project's coding style.
-   **Styling**: All styling MUST be done using Tailwind CSS utility classes. Do not write custom CSS files or use inline styles. Use the `cn` utility from `src/lib/utils.ts` to conditionally apply classes.

### 2. Routing and Navigation

-   **Routing**: All client-side routing must be handled by `react-router-dom`.
-   **Route Definitions**: All routes should be defined within the `<Routes>` component in `src/App.tsx`.
-   **Links**: Use the `<Link>` component from `react-router-dom` for internal navigation to ensure single-page application behavior.

### 3. State Management

-   **Server State**: For any data fetched from an API or the Supabase database, use TanStack Query (`@tanstack/react-query`). This includes handling loading, error, and caching states.
-   **Client State**: For simple, local component state, use React's built-in hooks like `useState` and `useReducer`. Avoid introducing complex global state management libraries (like Redux or Zustand) unless the application's complexity absolutely requires it.

### 4. Backend and Data

-   **Backend Provider**: Supabase is the exclusive backend for this project. All database operations, authentication, and storage should be handled via the Supabase client.
-   **Supabase Client**: Use the pre-configured Supabase client instance from `src/integrations/supabase/client.ts`.

### 5. Forms

-   **Form Logic**: Use `react-hook-form` for managing form state, validation, and submission.
-   **Validation**: Use `zod` to define validation schemas for forms.
-   **Form Components**: Integrate `react-hook-form` with the form components provided by `shadcn/ui` (e.g., `Input`, `Select`, `Checkbox`).

### 6. Icons

-   **Icon Library**: Only use icons from the `lucide-react` package. This ensures visual consistency across the application.

### 7. File Structure

-   **Pages**: Top-level page components go into `src/pages/`.
-   **Reusable Components**: General-purpose, reusable components are placed in `src/components/`.
-   **UI Primitives**: Base UI components from `shadcn/ui` reside in `src/components/ui/`.
-   **Hooks**: Custom hooks should be created in the `src/hooks/` directory.
-   **Utilities**: General utility functions are located in `src/lib/`.