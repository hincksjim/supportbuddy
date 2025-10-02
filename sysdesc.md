# System Description: Support Buddy Application

This document provides a detailed overview of the Support Buddy application's architecture. It is designed to be understood by both developers and Large Language Models (LLMs) to explain how the app works, from the user interface to the AI-powered features.

---

## 1. Core Technologies

The application is built on a modern web stack:

-   **Next.js (React Framework):** Used for building the user interface (UI). It handles both the frontend (what you see in the browser) and the backend server logic.
-   **TypeScript:** A programming language that adds type safety to JavaScript, helping to prevent common bugs.
-   **Tailwind CSS & shadcn/ui:** Used for styling the application. `shadcn/ui` provides a set of pre-built, accessible UI components like buttons, cards, and forms that are styled with Tailwind CSS.
-   **Genkit (AI Framework):** A framework from Google for building AI-powered features. It connects the application to powerful language models like Gemini.
-   **Browser Local Storage:** The app stores all user data directly on the user's device in their browser's `localStorage`. This means there is no central database, making the app private and secure by design.

---

## 2. Overall Architecture

The application is divided into two main parts:

1.  **The Frontend Application (`/src/app`)**: This is the user-facing part of the app, built with Next.js and React. It includes all the pages a user can visit, like the Dashboard, Diary, and Support Chat.
2.  **The AI Backend (`/src/ai`)**: This contains all the "brains" of the application. It uses Genkit to define AI "flows" that can understand user input, process information, and generate intelligent responses.

All data is stored in the user's browser. When an AI feature is needed, the frontend sends the relevant data from `localStorage` to a Genkit flow. The flow processes the data, communicates with a Google AI model, and returns a structured response to the frontend to be displayed to the user.

---

## 3. Directory & File Breakdown

### `/` (Root Directory)

This directory contains configuration files that manage the project's setup.

-   **`package.json`**: Lists all the project's software libraries (dependencies) and defines command-line scripts (like `npm run dev` to start the app).
-   **`next.config.ts`**: The main configuration file for the Next.js framework.
-   **`tailwind.config.ts`**: Configures the app's styling, including colors, fonts, and spacing.
-   **`src/app/globals.css`**: Defines the application's core color theme (light and dark modes).

### `/src/ai` - The AI Engine

This is where all the artificial intelligence logic lives.

-   **`/src/ai/genkit.ts`**: Initializes Genkit and configures which AI model the application will use by default (e.g., `googleai/gemini-2.5-flash-lite`).
-   **`/src/ai/flows/*.ts`**: Each file in this directory represents a specific AI "agent" or "flow." A flow is a self-contained task that the AI can perform. For example:
    -   **`conversational-support.ts`**: The main AI for the "Support Chat." It takes a massive amount of context (user profile, diary entries, document analyses, etc.) and generates a personalized, empathetic response based on the selected specialist persona (Medical, Mental Health, or Financial).
    -   **`analyze-medical-document.ts`**: Takes a medical document (like a PDF or an image of a report) and a user's question. It analyzes the document and provides a structured, easy-to-understand answer.
    -   **`generate-personal-summary.ts`**: A powerful flow that reads *all* the user's data from every section of the app and synthesizes it into a comprehensive Markdown report, citing its sources along the way.
    -   **`generate-dietary-recommendation.ts`**: Analyzes the user's health condition and recent meals to provide dietary commentary and suggest new meal ideas.

### `/src/app` - The User Interface

This directory uses the Next.js App Router to define the pages of the application.

-   **`/src/app/layout.tsx`**: The main template for the entire application. It sets up the overall HTML structure, theme provider (for light/dark mode), and notification system.
-   **`/src/app/(app)`**: This is a "route group" for all the pages a user sees *after* they have logged in.
    -   **`/layout.tsx`**: The layout for the authenticated section, which includes the main sidebar navigation and header.
    -   **`/dashboard/page.tsx`**: The main activity feed, showing a timeline of saved conversations, document analyses, and other events.
    -   **`/support-chat/page.tsx`**: The core chat interface where the user interacts with their AI support buddies.
    -   **`/diary/page.tsx`**: The daily diary page, where users can log their mood, pain, meals, medications, and other health metrics.
    -   **`/summary/page.tsx`**: The page that displays the AI-generated personal summary report and wellness charts.
    -   Other pages like `/medication`, `/timeline`, and `/finance` correspond directly to the features in the sidebar.
-   **`/src/app/login/page.tsx` & `/src/app/signup/page.tsx`**: The public-facing pages for user authentication.

### `/src/components` - Reusable Building Blocks

This directory contains the reusable React components that make up the UI.

-   **`/src/components/app-shell.tsx`**: The main navigation shell component, which defines the collapsible sidebar menu.
-   **`/src/components/diary-chart.tsx`**: The component responsible for rendering the line charts on the Health Dashboard and Summary pages. It takes diary data as input and visualizes it.
-   **`/src/components/ui`**: This subdirectory contains all the basic UI elements from the `shadcn/ui` library, such as `Button.tsx`, `Card.tsx`, and `Dialog.tsx`.

---

## 4. Data Flow & Storage (`localStorage`)

The app's entire state is managed in the browser's `localStorage`. This is a key-value store. All keys are prefixed with the user's email to ensure that if multiple users share the same browser, their data remains separate and private.

-   **`currentUserEmail`**: Stores the email of the logged-in user. This is the master key used to find all other data.
-   **`userData_{email}`**: A JSON object containing the user's complete profile (name, age, address, health conditions, avatar preferences, etc.). This is the primary source of context for many AI flows.
-   **`diaryEntries_{email}`**: An array of all the user's daily diary logs. This is used for generating charts and providing wellness insights to the AI.
-   **`conversationHistory_{email}`**: Stores the messages of the *current, active* chat session so the user can refresh the page without losing their place.
-   **`allConversations_{email}`**: A permanent archive of all *saved* chat transcripts.
-   **`conversationSummaries_{email}`**: A list of AI-generated summaries and other activity feed items (like saved notes or appointments). This list populates the `/dashboard` page.
-   **`analysisResults_{email}`**: Stores the results of all document analyses, including the original file and the AI's response.

This local-first approach ensures user privacy, as no sensitive health information is ever sent to or stored on a central server. The only time data leaves the device is when it's sent to the Google AI models for processing, and even then, it is not stored long-term.
