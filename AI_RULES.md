# AI Rules for Marsen Marketplace Application

This document outlines the technical stack and specific library usage guidelines for developing the Marsen Marketplace application. Adhering to these rules ensures consistency, maintainability, and leverages the strengths of our chosen technologies.

## Tech Stack Overview

*   **React**: The core JavaScript library for building user interfaces.
*   **TypeScript**: Preferred language for development, providing type safety and improved developer experience.
*   **Vite**: The build tool for a fast development experience and optimized production builds.
*   **Tailwind CSS**: A utility-first CSS framework for rapid and consistent styling.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and styled with Tailwind CSS.
*   **React Router**: For declarative client-side routing within the application.
*   **Supabase**: Our backend-as-a-service for authentication, database, and storage.
*   **Stripe**: For handling payment processing and subscriptions.
*   **Framer Motion**: A library for declarative animations and gestures.
*   **Lucide React**: A set of beautiful and customizable open-source icons.

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please follow these guidelines for library usage:

1.  **UI Components**:
    *   **Always prioritize `shadcn/ui` components** for all UI elements (e.g., buttons, dialogs, toasts, forms).
    *   If a specific `shadcn/ui` component is not available or requires significant deviation from its intended use, create a new, custom component. **Do not modify `shadcn/ui` component files directly.**
2.  **Styling**:
    *   **Exclusively use Tailwind CSS classes** for all styling. Avoid writing custom CSS in separate files or using inline styles, except for global styles defined in `src/index.css`.
    *   Ensure all designs are **responsive** using Tailwind's utility classes.
3.  **Routing**:
    *   Use `react-router-dom` for all client-side navigation.
    *   **Keep all main application routes defined in `src/App.jsx`**.
4.  **State Management**:
    *   For local component state, use React's `useState` and `useReducer` hooks.
    *   For global authentication state, use the `useAuth` hook from `src/contexts/SupabaseAuthContext.jsx`.
    *   For other global state, create new React Contexts as needed, keeping them simple and focused.
5.  **Authentication & Database**:
    *   All interactions with the backend (authentication, database queries, storage) must use the `supabase` client from `src/lib/customSupabaseClient.js` and the `useAuth` hook from `src/contexts/SupabaseAuthContext.jsx`.
6.  **Payments**:
    *   Use `@stripe/react-stripe-js` and `@stripe/stripe-js` for all payment-related functionalities, as demonstrated in `src/pages/CheckoutPage.jsx`.
7.  **Icons**:
    *   Use icons from the `lucide-react` library.
8.  **Animations**:
    *   For any animations, transitions, or interactive gestures, use `framer-motion`.
9.  **Toasts**:
    *   For all user notifications (success, error, info messages), use the `toast` utility from `@/components/ui/use-toast`.
10. **Utility Functions**:
    *   For common utility functions, especially those related to class merging (like `cn`), use `src/lib/utils.js`.

## General Development Practices

*   **File Structure**:
    *   Place all source code in the `src` folder.
    *   Pages should reside in `src/pages/`.
    *   Reusable components should be in `src/components/`.
    *   New components or hooks should always be created in their own dedicated files.
*   **Code Quality**:
    *   Write clean, readable, and maintainable code.
    *   Keep components small and focused (ideally under 100 lines of code).
    *   Avoid partial implementations; features should be fully functional.
    *   Do not over-engineer solutions; aim for simplicity and elegance.
*   **Error Handling**:
    *   Do not use `try/catch` blocks for errors unless specifically requested. Let errors bubble up for better debugging and centralized handling.