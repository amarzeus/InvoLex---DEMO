# InvoLex Application Architecture

This document outlines the architectural design for the InvoLex application, detailing the hybrid backend system, authentication flow, and data management strategy.

## 1. System Overview: Hybrid Architecture

InvoLex employs a hybrid architecture that combines a **Backend-as-a-Service (BaaS)** platform with a **custom backend service**. This approach leverages the strengths of both systems: the rapid development and managed services of a BaaS for common tasks, and the power and security of a custom service for specialized, sensitive operations.

### Components

1.  **Frontend Client (React)**: The user-facing application built with React and TypeScript. It is responsible for all UI rendering, user interaction, and local state management. It communicates with both backend services.

2.  **Backend-as-a-Service (Supabase)**: This service acts as the primary user and data management hub.
    *   **Responsibilities**:
        *   **User Authentication**: Manages the entire user lifecycle, including sign-up, login, password management, and session control via JSON Web Tokens (JWTs).
        *   **Database**: Provides a managed PostgreSQL database for storing core application data (users, billable entries, matters, settings).
        *   **Row-Level Security (RLS)**: Enforces strict data access policies at the database level, ensuring users can only ever access their own data.
        *   **Simple Data APIs**: Exposes APIs for direct, secure CRUD (Create, Read, Update, Delete) operations from the frontend.

3.  **Custom AI Backend (Node.js + Express)**: A separate, custom-built service that handles all AI processing and sensitive operations.
    *   **Responsibilities**:
        *   **Secure API Key Management**: This is the ONLY component with access to the `API_KEY` for the Gemini API. The key is stored securely as an environment variable and is never exposed to the client or the BaaS.
        *   **AI Logic Execution**: Contains all logic for interacting with the Gemini API, including prompt engineering, making API calls, and parsing responses.
        *   **Complex Business Logic**: Handles tasks that are too complex for a simple database query, such as generating detailed analytics or reports.
        *   **Third-Party Integrations**: Manages server-to-server integrations with legal practice management tools like Clio or PracticePanther.

## 2. Authentication and Data Flow

The security of the system relies on the separation of concerns and the use of JWTs for authenticating requests to the custom backend.

### Authentication Flow

1.  **Login/Signup**: The user interacts with the React frontend. The frontend communicates **exclusively with Supabase** for all authentication actions.
2.  **JWT Issuance**: Upon successful login, Supabase generates a secure JWT and sends it to the React client.
3.  **Token Storage**: The React client stores this JWT securely.

### AI Request Flow (Example: Generating a Billable Entry)

1.  **User Action**: The user initiates an AI action in the React client (e.g., clicking "Generate Summary").
2.  **API Call to Custom Backend**: The client makes an API request to the custom Node.js backend. It includes the Supabase JWT in the `Authorization: Bearer <token>` header.
3.  **Token Verification**: The Node.js backend receives the request. It uses Supabase's public key to verify the JWT's signature. This proves the request is from a valid, authenticated user **without** needing to contact Supabase directly.
4.  **AI Processing**: Once the token is verified, the Node.js backend proceeds. It uses its protected Gemini API key to perform the requested AI task.
5.  **Data Persistence**: After receiving the AI-generated data, the Node.js backend connects to the Supabase database (using its own secure server-side credentials) and saves the new data, associating it with the `user_id` extracted from the verified JWT.
6.  **Response**: The custom backend sends a success response back to the React client, which updates the UI.

## 3. Database Schema

All data tables are designed with multi-tenancy in mind.

*   **`users` table**: Stores user identity information.
*   **Data Tables (`billable_entries`, `matters`, etc.)**: Every data table that contains user-specific information **must** have a `user_id` foreign key column that references the `users` table.
*   **Row-Level Security (RLS)**: Policies are configured in Supabase to ensure that any `SELECT`, `INSERT`, `UPDATE`, or `DELETE` query can only operate on rows where the `user_id` matches the ID of the currently authenticated user making the request.

## 4. Current Implementation & Future Path

*   **Current State**: The application currently **simulates** this entire architecture within the `services/supabase.ts` file. This file mimics the `auth`, `data`, and `ai` components, using the browser's `localStorage` to persist data between sessions. This allows for rapid feature development in a realistic, user-specific environment.
*   **Future Development**: To move to a production environment, the simulation will be replaced with real services:
    1.  A Supabase project will be created and configured.
    2.  A separate Node.js/Express backend project will be created and deployed to a hosting service (e.g., Vercel, Render, AWS).
    3.  The frontend code will be updated to make real HTTP requests to the Supabase APIs for auth/data and to the deployed custom backend for all AI-related functionality.
