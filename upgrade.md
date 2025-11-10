# App Migration Plan: From LocalStorage to AWS

## 1. Objective

This document outlines the detailed plan for migrating the Support Buddy application from its current prototype architecture (Next.js with browser `localStorage`) to a robust, scalable, and production-ready architecture using Amazon Web Services (AWS).

**Current Architecture:**
- **Frontend:** Next.js / React
- **Authentication:** Simulated (stores email in `localStorage`)
- **Data Storage:** All user data (JSON objects) stored in browser `localStorage`.
- **File Storage:** Files (images, PDFs) are stored as Base64 data URIs directly within `localStorage`.

**Target Architecture:**
- **Frontend Hosting:** Next.js application deployed on AWS Amplify Hosting.
- **Authentication:** AWS Cognito User Pools for secure user signup, login, and session management.
- **Data Storage:** AWS DynamoDB for storing all structured user data (profiles, diary entries, etc.).
- **File Storage:** AWS S3 (Simple Storage Service) for storing all user-uploaded files (documents, images, audio, etc.).
- **Backend Logic:** Next.js API Routes or AWS Lambda functions (via Amplify) to handle interactions between the frontend and the AWS services.

---

## 2. Migration Phases

The migration will be conducted in a phased approach to ensure a smooth transition and minimize disruption.

### Phase 1: AWS Infrastructure Setup

This phase involves provisioning all the necessary AWS resources.

1.  **Set up AWS Account & IAM:**
    *   Create an AWS account if one doesn't exist.
    *   Create an IAM (Identity and Access Management) user with administrative privileges for setting up the services. Note the `accessKeyId` and `secretAccessKey`.

2.  **Configure AWS Cognito:**
    *   Create a new **Cognito User Pool**.
    *   Configure the sign-in options (e.g., allow sign-in with email).
    *   Define required user attributes (e.g., `email`, `given_name`, `family_name`, `birthdate`, `gender`, `address`, `custom:postcode`).
    *   Create an **App Client** within the User Pool for the web application.
    *   Take note of the **User Pool ID** and the **App Client ID**.

3.  **Configure AWS DynamoDB:**
    *   Create a new **DynamoDB table**. A single-table design is recommended.
    *   **Table Name:** `SupportBuddyData`
    *   **Primary Key:**
        *   **Partition Key (PK):** `userId` (string) - This will correspond to the Cognito user's `sub` (unique ID).
        *   **Sort Key (SK):** `itemId` (string) - This will identify the data item (e.g., `PROFILE`, `DIARY#2024-08-15`, `CONVERSATION#<uuid>`).
    *   This structure allows for efficient querying of all data for a specific user, or specific types of data for that user.

4.  **Configure AWS S3:**
    *   Create a new **S3 bucket**.
    *   **Bucket Name:** `supportbuddy-user-files-<random-uuid>` (must be globally unique).
    *   Configure CORS (Cross-Origin Resource Sharing) on the bucket to allow `GET`, `PUT`, `POST`, `DELETE` requests from the application's domain.
    *   Set up a folder structure within the bucket to organize files, e.g., `/private/{cognito-identity-id}/documents/`, `/private/{cognito-identity-id}/images/`.
    *   Configure bucket policies and IAM roles to ensure that authenticated users can only access files under their own identity folder.

5.  **Set up AWS Amplify:**
    *   Connect the application's Git repository (e.g., GitHub) to AWS Amplify.
    *   Configure the build settings for a Next.js application.
    *   Set up environment variables within the Amplify console for all AWS resource IDs and keys.

### Phase 2: Application Code Refactoring

This is the most intensive phase, involving updating the application code to interact with AWS instead of `localStorage`.

1.  **Authentication Overhaul:**
    *   **Install AWS SDKs:** Add `aws-amplify` library to `package.json`.
    *   **Configure Amplify:** Create a new file, e.g., `src/lib/aws-config.ts`, to configure the Amplify library with the Cognito User Pool ID, App Client ID, and other AWS resource details.
    *   **Update Login/Signup Pages:** Replace the `localStorage` logic in `src/app/login/page.tsx` and `src/app/signup/page.tsx` with calls to `Auth.signIn()` and `Auth.signUp()` from the `aws-amplify` library.
    *   **Implement Session Management:** Create an authentication context provider (`src/context/auth-context.tsx`) that wraps the application. This provider will manage the user's session state, check for a currently logged-in user using `Auth.currentAuthenticatedUser()`, and provide user information (like `userId` and `email`) to the rest of the app via a `useAuth` hook.
    *   **Protect Authenticated Routes:** Update the main app layout `src/app/(app)/layout.tsx` to use the `useAuth` hook to check for an authenticated user. If no user is logged in, redirect to `/login`.

2.  **Data Storage Migration (from `localStorage` to DynamoDB):**
    *   **Create Data Service Module:** Create a new file, e.g., `src/services/database.ts`, to encapsulate all DynamoDB interactions. This module will export functions like `getUserData(userId)`, `saveUserData(userId, data)`, `getDiaryEntries(userId)`, `saveDiaryEntry(userId, entry)`, etc.
    *   **Implement API Routes:** Create Next.js API routes (e.g., `/src/app/api/diary/route.ts`) that will be called from the frontend. These server-side routes will use the AWS SDK (`@aws-sdk/client-dynamodb`) and the functions from `database.ts` to interact with DynamoDB. This is crucial for security, as AWS credentials should not be exposed on the client side.
    *   **Update Component Logic:** Go through every page component that currently reads from or writes to `localStorage` (e.g., `diary/page.tsx`, `profile/page.tsx`, `medication/page.tsx`, etc.).
        *   Replace all `localStorage.getItem()` calls with `fetch` requests to the newly created API routes to get data. Use a library like `SWR` or `React Query` for efficient data fetching, caching, and state management.
        *   Replace all `localStorage.setItem()` calls with `fetch` requests (using `POST`, `PUT`) to the API routes to save data.

3.  **File Storage Migration (from `localStorage` to S3):**
    *   **Update File Upload Logic:** In components like `document-analysis/page.tsx` and `just-in-case/page.tsx`, modify the file upload process.
        *   Instead of reading the file as a Base64 data URI for storage, use the `aws-amplify` `Storage.put()` method to upload the file directly to the S3 bucket.
        *   The key for the S3 object should include the user's unique ID to ensure data isolation (e.g., `private/{cognito-identity-id}/documents/report.pdf`).
    *   **Store References in DynamoDB:** After a successful upload to S3, store the S3 object key (not the full URL) in the corresponding DynamoDB item. For example, an `analysisResult` item in DynamoDB would have an attribute `s3_key: "private/{id}/documents/report.pdf"`.
    *   **Update File Viewing Logic:** When displaying a file (e.g., in `ViewAnalysisDialog`), use `Storage.get()` from `aws-amplify` to generate a temporary, secure, pre-signed URL for the S3 object. Use this URL as the `src` for images or iframes. This ensures that files remain private and are only accessible to their owner.

### Phase 3: Deployment & Testing

1.  **Deploy to Amplify:** Trigger a deployment in the AWS Amplify console. Amplify will build the Next.js application and deploy it.
2.  **Data Migration (Optional):** For existing users (if any), a one-time migration script would be needed to move data from `localStorage` to DynamoDB/S3. This script could be a temporary page in the app that the user runs once after logging in with the new Cognito system.
3.  **Thorough Testing:**
    *   Test the entire user lifecycle: signup, email confirmation (if configured), login, logout.
    *   Verify that all data CRUD (Create, Read, Update, Delete) operations are working correctly for every feature by checking the DynamoDB table.
    *   Verify file uploads and downloads are working correctly for every feature that uses them by checking the S3 bucket.
    *   Confirm that a user can only access their own data and files.

---

## 4. Environment Variables

The application will require a `.env.local` file (and corresponding variables in AWS Amplify) to store configuration for the AWS services.

`# AWS Cognito
NEXT_PUBLIC_AWS_REGION=eu-west-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=...
NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=...
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=... # Required for S3 access

# AWS S3
NEXT_PUBLIC_S3_BUCKET_NAME=...

# AWS DynamoDB (credentials for server-side access)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
DYNAMODB_TABLE_NAME=SupportBuddyData
`
