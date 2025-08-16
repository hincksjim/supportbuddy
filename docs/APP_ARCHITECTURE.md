# Application Architecture

This document provides an overview of the file structure and the purpose of each key file within the Support Buddy application.

## Root Directory

- **`.env`**: Stores environment variables for the application, such as API keys. This file is not checked into version control.
- **`README.md`**: The main README file for the project, containing general information.
- **`apphosting.yaml`**: Configuration file for Firebase App Hosting, defining settings like the number of server instances.
- **`components.json`**: Configuration file for `shadcn/ui`, specifying the style, component library, and aliases for UI components.
- **`devDependencies.d.ts`**: A TypeScript declaration file used to provide type definitions for JavaScript modules that do not have their own.
- **`next.config.ts`**: The configuration file for Next.js. It controls settings like redirects, image optimization, and build process configurations.
- **`package.json`**: Defines the project's metadata, dependencies, and scripts (e.g., `dev`, `build`, `start`).
- **`tailwind.config.ts`**: The configuration file for Tailwind CSS, where the design system (colors, fonts, spacing) is defined and extended.
- **`tsconfig.json`**: The configuration file for the TypeScript compiler, specifying how TypeScript files should be checked and compiled.

## `/src` Directory

### `/src/ai` - Artificial Intelligence

This directory contains all the Genkit AI functionality.

- **`/src/ai/genkit.ts`**: Initializes the core Genkit `ai` object, configuring the plugins (like Google AI) and setting the default model for the application.
- **`/src/ai/dev.ts`**: The entry point for the Genkit development server. It imports all the defined AI flows so they can be run and tested.

#### `/src/ai/flows`

This subdirectory holds all the individual, self-contained AI agents (Flows) that power the application's features.

- **`analyze-medical-document.ts`**: An AI agent that analyzes an uploaded medical document (image or PDF) and answers a user's question about it.
- **`analyze-medication.ts`**: An AI agent that provides a summary, side effects, and potential interaction warnings for a given medication.
- **`check-medication-dose.ts`**: An AI agent that checks if the total quantity of a medication taken in a day exceeds the prescribed dose.
- **`conversational-support.ts`**: The main AI for the "Support Chat". It takes the user's profile, conversation history, and data from all other app sections (diary, documents, etc.) to provide a context-aware, empathetic response.
- **`generate-benefits-matrix.ts`**: An AI agent that creates a table comparing potential UK benefits eligibility across different life scenarios.
- **`generate-benefits-suggestion.ts`**: An AI agent that suggests potential UK benefits a user might be eligible for based on their profile.
- **`generate-conversation-summary.ts`**: An AI agent that creates a title and a concise summary of a chat conversation.
- **`generate-personal-summary.ts`**: An AI agent that synthesizes information from *all* user data sources (profile, documents, chats, diary, meds, timeline) to create a comprehensive Markdown report.
- **`generate-treatment-timeline.ts`**: An AI agent that creates a structured, illustrative treatment timeline based on the user's conversation history.
- **`summarize-voice-note.ts`**: An AI agent that takes a text transcript from a voice note and produces a short summary.
- **`text-to-speech.ts`**: An AI flow that converts text into audible speech using a specified voice, returning it as a playable audio file.

### `/src/app` - Application Pages & Layouts

This is the core of the Next.js application, using the App Router.

- **`/src/app/globals.css`**: The global stylesheet for the application. It defines the base Tailwind CSS layers and the HSL color variables for the app's light and dark themes.
- **`/src/app/layout.tsx`**: The root layout for the entire application. It sets up the HTML structure, includes the `ThemeProvider` for light/dark mode, and the `Toaster` for notifications.
- **`/src/app/login/page.tsx`**: The user login page.
- **`/src/app/signup/page.tsx`**: The user registration page.
- **`/src/app/onboarding/page.tsx`**: The page where a new user selects their support buddy avatar.

#### `/src/app/(app)` - Authenticated Routes

This is a route group for all pages that require a user to be logged in.

- **`/src/app/(app)/layout.tsx`**: The layout for all authenticated pages. It wraps the content in the `AppShell`, which includes the main sidebar navigation and header.
- **`/src/app/(app)/*`**: Each subdirectory represents a page within the main application interface (e.g., `dashboard`, `diary`, `timeline`). Each `page.tsx` file within these directories is the main React component for that route.

### `/src/components` - Reusable Components

This directory contains all the reusable React components for the application.

- **`/src/components/app-shell.tsx`**: The main navigation shell, including the collapsible sidebar menu.
- **`/src/components/header.tsx`**: The top header bar component.
- **`/src/components/icons.tsx`**: A library of custom SVG icon components, including the application logo and the support buddy avatars.
- **`/src/components/diary-chart.tsx`**: The component responsible for rendering the line charts on the Summary page based on diary data.
- **`/src/components/theme-provider.tsx`**: The provider component that manages the application's light and dark themes.

#### `/src/components/ui`

This subdirectory contains all the `shadcn/ui` components that form the building blocks of the user interface, such as `Button`, `Card`, `Input`, `Dialog`, etc.

### `/src/hooks` - Custom React Hooks

This directory contains custom React hooks used throughout the application.

- **`/src/hooks/use-mobile.ts`**: A hook to detect if the application is being viewed on a mobile-sized screen.
- **`/src/hooks/use-speech-recognition.ts`**: A hook that provides a simple interface to the browser's Web Speech API for voice-to-text transcription.
- **`/src/hooks/use-toast.ts`**: A hook for displaying toast notifications (pop-up messages).

### `/src/lib` - Library & Utility Functions

- **`/src/lib/utils.ts`**: Contains utility functions, most notably the `cn` function, which merges Tailwind CSS classes.

### `/src/services` - External Services

- **`/src/services/postcode-lookup.ts`**: A service that defines a Genkit "Tool" for looking up UK postcode information from an external API. This tool can be used by AI flows.
