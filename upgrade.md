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

This phase involves provisioning all the necessary AWS resources through the AWS Management Console.

1.  **Set up AWS Account & IAM:**
    *   Create an AWS account if one doesn't exist.
    *   Create an IAM (Identity and Access Management) user with administrative privileges for setting up the services. Note the `accessKeyId` and `secretAccessKey` for use in server-side environments.

2.  **Configure AWS Cognito:**
    *   **Create a User Pool:** This will be your user directory.
        *   In the Cognito service, select "Create user pool".
        *   Choose the desired sign-in options (e.g., "Email").
        *   Under "Configure security requirements," you can leave the password policy as default.
        *   Under "Configure sign-up experience," add **custom attributes** to match your user profile data, such as `custom:postcode`.
    *   **Create an App Client:**
        *   In your new User Pool, go to the "App integration" tab.
        *   Under "App clients and analytics," create a new app client.
        *   Select "Web client (public client)" and note the **App Client ID**.
    *   **Create an Identity Pool:** This is essential for granting your authenticated users access to other AWS services like S3.
        *   In the Cognito service, go to "Federated identities" and create a new identity pool.
        *   Link it to the User Pool you created above by providing the **User Pool ID** and the **App Client ID**.
        *   When prompted, allow Cognito to create new IAM roles for authenticated and unauthenticated users. These roles will be modified later to grant S3 access.

3.  **Configure AWS DynamoDB:**
    *   **Create a Table:** Use a single-table design for flexibility.
        *   **Table Name:** `SupportBuddyData`
        *   **Primary Key:**
            *   **Partition Key (PK):** `userId` (Type: String) - This will correspond to the Cognito user's unique `sub` ID.
            *   **Sort Key (SK):** `itemId` (Type: String) - This will identify the data item (e.g., `PROFILE`, `DIARY#2024-08-15`, `CONVERSATION#<uuid>`).
    *   This primary key structure allows for efficient querying of all data for a specific user (`PK = userId`), or specific types of data for that user (`PK = userId` and `SK begins_with "DIARY#"`).

4.  **Configure AWS S3:**
    *   **Create a Bucket:**
        *   **Bucket Name:** `supportbuddy-user-files-<random-uuid>` (S3 bucket names must be globally unique).
        *   Ensure "Block all public access" is checked.
    *   **Configure CORS:**
        *   In the bucket's "Permissions" tab, find the CORS (Cross-Origin Resource Sharing) configuration.
        *   Add a CORS rule to allow `GET`, `PUT`, `POST`, `DELETE` requests from your application's domain (e.g., `https://your-app-domain.com` and `http://localhost:3000` for development).
    *   **Configure IAM Policy for S3 Access:**
        *   Go to the IAM role created by your Cognito Identity Pool for "authenticated" users.
        *   Attach a policy that grants access to the S3 bucket, but *only* for objects under a path that matches their user ID. This is critical for security. The policy will use a variable `${cognito-identity.amazonaws.com:sub}` to restrict access. Example Policy Snippet:
            ```json
            {
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                "Resource": ["arn:aws:s3:::<your-bucket-name>/private/${cognito-identity.amazonaws.com:sub}/*"]
            }
            ```

5.  **Set up AWS Amplify:**
    *   In the AWS Amplify console, choose "Host web app."
    *   Connect your application's Git repository (e.g., GitHub, GitLab).
    *   Configure the build settings for a Next.js application. Amplify often detects this automatically.
    *   In the "Environment variables" section, add all the AWS resource IDs and keys you noted down (User Pool ID, S3 Bucket Name, etc.).

### Phase 2: Application Code Refactoring

This is the most intensive phase, involving updating the application code to interact with AWS instead of `localStorage`.

1.  **Authentication Overhaul:**
    *   **Install AWS SDKs:** Add the `aws-amplify` library to your `package.json` (`npm install aws-amplify`).
    *   **Configure Amplify in Code:** Create a new file, e.g., `src/lib/aws-config.ts`, to configure the Amplify library with your Cognito and S3 details. This file will use the environment variables set up in Amplify.
    *   **Create Auth Context:** Implement a React Context provider (`src/context/auth-context.tsx`). This provider will wrap the application in `src/app/layout.tsx`. It will:
        *   Call `Amplify.configure()` on startup.
        *   Use `Auth.currentAuthenticatedUser()` to check for an active session.
        *   Provide user information (like `userId` and `email`) to the rest of the app via a `useAuth` hook.
    *   **Update Login/Signup Pages:** Replace `localStorage` logic in `src/app/login/page.tsx` and `src/app/signup/page.tsx` with calls to `Auth.signIn()` and `Auth.signUp()` from `aws-amplify`.
    *   **Protect Routes:** In the `src/app/(app)/layout.tsx` file, use the `useAuth` hook. If no user is authenticated, redirect them to the `/login` page.

2.  **Data Storage Migration (from `localStorage` to DynamoDB):**
    *   **Create API Routes:** For each data type (diary, profile, etc.), create a Next.js API Route (e.g., `/src/app/api/diary/route.ts`). **This is the most important architectural change.** The frontend will *never* talk to DynamoDB directly.
    *   **Backend Data Service:** Create a server-side module, e.g., `src/services/database.ts`. This module will contain functions like `saveDiaryEntry(userId, entry)`. These functions will use the AWS SDK for JavaScript (`@aws-sdk/client-dynamodb`) to communicate securely with DynamoDB. Your API Routes will import and use these service functions.
    *   **Update Components:**
        *   Go through every page component that uses `localStorage` (e.g., `diary/page.tsx`, `profile/page.tsx`).
        *   Replace `localStorage.getItem()` calls with `fetch` requests to your new API routes (e.g., `fetch('/api/diary')`). It is highly recommended to use a data-fetching library like `SWR` or `React Query` to handle loading states, caching, and revalidation.
        *   Replace `localStorage.setItem()` calls with `fetch` requests using `POST` or `PUT` methods to send data to your API routes (e.g., `fetch('/api/diary', { method: 'POST', body: JSON.stringify(newEntry) })`).

3.  **File Storage Migration (from `localStorage` to S3):**
    *   **Update File Uploads:** In components that handle file uploads (`document-analysis/page.tsx`, `just-in-case/page.tsx`), change the logic.
        *   Instead of reading the file as a Base64 data URI, use the `Storage.put()` method from `aws-amplify`.
        *   The key for the S3 object must be structured to include the user's unique ID for security: `private/{cognito-identity-id}/documents/report.pdf`. The `{cognito-identity-id}` is retrieved from the authenticated user's session.
    *   **Update Data Model:** After a successful upload, store the S3 object **key** (not the full URL) in the corresponding DynamoDB item. For example, an `analysisResult` item in DynamoDB would have an attribute like `s3Key: "private/{id}/documents/report.pdf"`.
    *   **Update File Viewing:** When displaying a file (e.g., in `ViewAnalysisDialog`), use `Storage.get()` to generate a temporary, secure, pre-signed URL for the S3 object. This URL provides time-limited access to the private file and should be used as the `src` for images or iframes.

### Phase 3: Deployment & Testing

1.  **Deploy to Amplify:** Push your code changes to your main branch. Amplify will automatically detect the changes, build the Next.js application, and deploy it.
2.  **Data Migration Script (Optional):** If you need to migrate existing prototype users, a one-time migration flow is required. This could be a temporary page in the app that, after a user logs in for the first time with their new Cognito account:
    *   Reads all their old data from `localStorage`.
    *   Makes a series of calls to your new API routes to save the data to DynamoDB.
    *   Uploads any Base64 files to S3.
    *   Once complete, it clears the old `localStorage` data.
3.  **Thorough Testing:**
    *   **Auth Flow:** Test signup (with email confirmation if enabled), login, and logout.
    *   **Data Integrity:** Verify that creating, reading, updating, and deleting data in one part of the app (e.g., Diary) is correctly reflected in another (e.g., the Personal Summary report). Check DynamoDB directly to confirm data structures.
    *   **File Security:** Verify that uploaded files are stored in the correct user-specific folder in S3. Confirm that a logged-in user can only access their own files and cannot access another user's files by guessing the URL.

---

## 4. Environment Variables

The application will require a `.env.local` file for local development (and corresponding variables in the AWS Amplify console) to store configuration for the AWS services.

```
# AWS Cognito
NEXT_PUBLIC_AWS_REGION=eu-west-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=...
NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=...
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=... # Required for S3 access

# AWS S3
NEXT_PUBLIC_S3_BUCKET_NAME=...

# AWS DynamoDB (credentials for server-side API routes, not public)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
DYNAMODB_TABLE_NAME=SupportBuddyData
```
