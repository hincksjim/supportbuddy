# Local Storage Usage

This document outlines how the application uses the browser's `localStorage`. All data is stored locally on the user's device and is partitioned by the logged-in user's email address to ensure data isolation between different accounts on the same browser.

---

## Key: `currentUserEmail`

-   **Component(s):**
    -   `src/app/login/page.tsx` (Writes)
    -   `src/app/signup/page.tsx` (Writes)
    -   All authenticated pages (e.g., `dashboard`, `support-chat`, `profile`, etc.) (Reads)
-   **Action:** Stores the email address of the currently logged-in user.
-   **Schema:** `string` (e.g., `"user@example.com"`)
-   **Purpose:** To identify the current user and retrieve all other associated data from `localStorage`. It acts as the primary key for all user-specific data.

---

## Key: `userData_{email}`

-   **Component(s):**
    -   `src/app/login/page.tsx` (Writes on first login)
    -   `src/app/signup/page.tsx` (Writes)
    -   `src/app/onboarding/page.tsx` (Writes)
    -   `src/app/(app)/profile/page.tsx` (Reads/Writes)
    -   `src/app/(app)/settings/page.tsx` (Reads/Writes)
    -   `src/app/(app)/support-chat/page.tsx` (Reads)
    -   `src/app/(app)/summary/page.tsx` (Reads)
    -   `src/app/(app)/benefits-checker/page.tsx` (Reads)
    -   `src/app/(app)/finance/page.tsx` (Reads)
-   **Action:** Stores the user's complete profile information.
-   **Schema:**
    ```json
    {
      "name": "string",
      "lastName": "string",
      "age": "string",
      "gender": "string",
      "address1": "string",
      "address2": "string",
      "townCity": "string",
      "countyState": "string",
      "country": "string",
      "postcode": "string",
      "dob": "string",
      "employmentStatus": "string",
      "income": "string",
      "savings": "string",
      "benefits": ["string"],
      "initialDiagnosis": "string",
      "avatar_medical": "string",
      "avatar_mental_health": "string",
      "avatar_financial": "string",
      "voice_medical": "string",
      "voice_mental_health": "string",
      "voice_financial": "string",
      "responseMood": "string"
    }
    ```
-   **Purpose:** To maintain the user's profile data across sessions and to provide necessary context to the AI agents for personalized responses.

---

## Key: `conversationHistory_{email}`

-   **Component(s):**
    -   `src/app/(app)/support-chat/page.tsx` (Reads/Writes)
-   **Action:** Stores the messages of the *current, active* chat session.
-   **Schema:** `Array<Message>`
    ```json
    {
      "role": "'user' | 'assistant'",
      "content": "string",
      "metadata": {
          "specialist": "'medical' | 'mental_health' | 'financial'"
      }
    }
    ```
-   **Purpose:** To persist the ongoing conversation so the user can leave the page and return without losing their place. This item is cleared when a new chat is started.

---

## Key: `allConversations_{email}`

-   **Component(s):**
    -   `src/app/(app)/support-chat/page.tsx` (Writes)
    -   `src/app/(app)/dashboard/page.tsx` (Reads for deletion)
    -   `src/app/(app)/summary/page.tsx` (Reads)
-   **Action:** Stores the full message history of *all* completed and saved conversations.
-   **Schema:** `Array<{ id: string, messages: Array<Message> }>`
-   **Purpose:** To keep a permanent record of all past chat transcripts, which can be viewed from the Activity page or used to generate the Personal Summary report.

---

## Key: `conversationSummaries_{email}`

-   **Component(s):**
    -   `src/app/(app)/support-chat/page.tsx` (Writes)
    -   `src/app/(app)/dashboard/page.tsx` (Reads/Writes for deletion)
    -   `src/app/(app)/profile/page.tsx` (Writes)
-   **Action:** Stores the metadata for items appearing in the "Activity" feed. This includes AI-generated conversation summaries, saved chat snippets, and profile update notifications.
-   **Schema:** `Array<ConversationSummary | SavedMessageActivity | ProfileUpdateActivity>`
    -   **`ConversationSummary`**: `{ "id": "string", "title": "string", "summary": "string", "date": "string", "specialist": "string" }`
    -   **`SavedMessageActivity`**: `{ "id": "string", "type": "savedMessage", "title": "string", "content": "string", "date": "string" }`
    -   **`ProfileUpdateActivity`**: `{ "id": "string", "type": "profileUpdate", "title": "string", "content": "string", "date": "string" }`
-   **Purpose:** To populate the Activity feed on the dashboard with a variety of user actions, providing a chronological overview of their engagement with the app.

---

## Key: `analysisResults_{email}`

-   **Component(s):**
    -   `src/app/(app)/document-analysis/page.tsx` (Reads/Writes)
    -   `src/app/(app)/dashboard/page.tsx` (Reads/Writes for deletion)
    -   `src/app/(app)/summary/page.tsx` (Reads)
-   **Action:** Stores the results of all document analyses performed by the user.
-   **Schema:** `Array<AnalysisResult>`
    ```json
    {
      "id": "string",
      "title": "string",
      "question": "string",
      "fileDataUri": "string",
      "fileType": "string",
      "fileName": "string",
      "analysis": "string",
      "date": "string"
    }
    ```
-   **Purpose:** To save the AI-generated analysis of uploaded medical documents, allowing the user to review them later without needing to re-upload or re-analyze. This data also serves as a key context source for other AI agents.

---

## Key: `treatmentTimeline_{email}`

-   **Component(s):**
    -   `src/app/(app)/timeline/page.tsx` (Reads/Writes)
    -   `src/app/(app)/summary/page.tsx` (Reads)
-   **Action:** Stores the user's interactive treatment timeline, including any notes or status changes they have made.
-   **Schema:** `GenerateTreatmentTimelineOutput` (a complex object with stages and steps).
-   **Purpose:** To persist the user's personalized treatment plan, allowing them to track their progress over time.

---

## Key: `diaryEntries_{email}`

-   **Component(s):**
    -   `src/app/(app)/diary/page.tsx` (Reads/Writes)
    -   `src/app/(app)/summary/page.tsx` (Reads)
-   **Action:** Stores all of the user's daily diary entries.
-   **Schema:** `Array<DiaryEntry>` (a complex object including mood scores, pain scores, notes, and medications taken).
-   **Purpose:** To provide a detailed log of the user's wellness journey, which is used for generating trend charts on the Summary page and providing context to the AI.

---

## Key: `medications_{email}`

-   **Component(s):**
    -   `src/app/(app)/medication/page.tsx` (Reads/Writes)
    -   `src/app/(app)/diary/page.tsx` (Reads)
    -   `src/app/(app)/summary/page.tsx` (Reads)
-   **Action:** Stores the user's list of prescribed medications and the AI-generated analysis for each.
-   **Schema:** `Array<Medication>`
-   **Purpose:** To maintain an accurate list of the user's medications for reference, dose checking in the diary, and interaction checks.

---

## Key: `goodbyeData_{email}`

-   **Component(s):**
    -   `src/app/(app)/just-in-case/page.tsx` (Reads/Writes)
-   **Action:** Stores all the information from the "Just In Case" section.
-   **Schema:** `GoodbyeData` (a complex object containing messages, instructions, wishes, etc.).
-   **Purpose:** To save the user's sensitive and important end-of-life information securely on their own device.

---

## Caching Keys

The application also uses `localStorage` for caching data to reduce redundant AI calls and API lookups.

-   **`benefitsMatrixCache_{email}`**: Caches the generated benefits matrix to avoid re-running the AI on the "Benefits Checker" page if the user's profile hasn't changed.
-   **`financialSuggestionsCache_{email}`**: Caches the financial suggestions for the "Finance" page.
-   **`locationInfo_{email}`**: Caches the result of the postcode lookup to avoid repeated API calls.
-   **`personalSummaryReport_{email}`**: Caches the last generated markdown report for the "Summary" page.
-   **`personalSummaryFingerprint_{email}`**: Stores a "fingerprint" (a hash) of all the data used to generate the summary report. This is used to determine if a new report needs to be generated.
