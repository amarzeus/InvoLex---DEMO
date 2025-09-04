
<div align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGZ5Z2k4aXFqZHF2Z2w4MHc0OHlneGV5aXN2N3V3MnNudnd5MXRkbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1JjnySdj2xT3v2YFN/giphy.gif" alt="Animated 3D Abstract Tech" width="400"/>
  <br/>
  <br/>
  <h1>InvoLex - AI Billable Hour Tracker</h1>
  <p><strong>Stop logging hours. Start practicing law.</strong></p>
  <p>
    An AI-powered application that automatically tracks, summarizes, and logs lawyers’ billable email activity into legal practice management tools.
  </p>

  <p>
    <a href="#"><img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
    <a href="#"><img src="https://img.shields.io/badge/version-1.0.0-informational" alt="Version"></a>
    <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-ff69b4" alt="PRs Welcome"></a>
  </p>
</div>

---

## ✨ Key Features

InvoLex is designed to eliminate the administrative overhead of time tracking, allowing legal professionals to focus on what matters most: their clients.

| Icon | Feature                     | Description                                                                                                                           |
| :--: | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **🤖** | **AI-Powered Triage**       | Automatically analyzes emails to identify billable work and generates concise, accurate time entries.                               |
| **⚡** | **Live Billing**            | Get real-time billable entry drafts as you compose or reply to emails, capturing value as it's created.                           |
| **🔄** | **Seamless Integrations**   | Connect directly with leading practice management software like Clio.                                  |
| **🧠** | **AI Personalization**      | InvoLex learns from your edits to improve future suggestions, tailoring its style and accuracy to your preferences.               |
| **⚙️** | **Powerful Automation Rules** | Create custom rules to auto-approve, adjust hours, or categorize entries based on sender, subject, or content.                    |
| **📊** | **Insightful Analytics**    | Visualize your firm's productivity with dashboards for billable hours, revenue by matter, and entry statuses.                     |
| **🔒** | **Secure & Private**        | Built with a security-first architecture. All AI processing is handled on a secure backend, and your API keys are never exposed. |

<br/>
<div align="center">
  <img src="https://storage.googleapis.com/gemini-codelab-images/invo-lex-demo.gif" alt="InvoLex Application Demo" width="800"/>
  <p><em>Triage an email, review the AI suggestion, and save a draft in seconds.</em></p>
</div>
<br/>

---

## 🛠️ Tech Stack

This project is built with a modern, robust, and scalable technology stack.

-   **Frontend:** React, TypeScript, Tailwind CSS
-   **Backend:** Node.js, Express.js, PostgreSQL, Prisma ORM
-   **AI Integration:** Google Gemini API
-   **Authentication:** JWT with refresh tokens
-   **Database:** PostgreSQL with connection pooling
-   **Charting:** Recharts
-   **UI/UX:** Headless UI, Heroicons

---

## 🚀 Getting Started

This project is transitioning from a simulated environment to a production-ready application with real backend infrastructure.

### Prerequisites

-   **Development Environment:**
    - Node.js 18+
    - PostgreSQL 15+
    - Modern web browser (Chrome, Firefox, Safari, Edge)
-   **API Keys:**
    - Google Gemini API key
    - Gmail API credentials (for email integration)
    - Clio API access (for practice management)

### Development Setup

1.  **Clone and Install:**
    ```bash
    git clone <repository-url>
    cd involex
    npm install
    ```

2.  **Database Setup:**
    ```bash
    # Set up PostgreSQL database
    # Configure Prisma ORM
    npx prisma migrate dev
    ```

3.  **Environment Variables:**
    Create `.env` file with:
    ```
    DATABASE_URL="postgresql://..."
    GEMINI_API_KEY="your-gemini-key"
    JWT_SECRET="your-jwt-secret"
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

> **Note:** The current prototype uses localStorage for data persistence. Production version will use PostgreSQL database with full backend API.

---

## 📂 Project Structure

The codebase is organized to be clean, modular, and easy to navigate.

```
/
├── public/
├── src/
│   ├── components/       # Reusable React components (UI, views)
│   ├── contexts/         # React Context providers (Auth, Notifications)
│   ├── services/         # Backend services (AI, Database, APIs)
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main application component
│   └── index.tsx         # Application entry point
├── .gitignore
├── ARCHITECTURE.md       # Detailed system architecture
├── index.html            # HTML entry point
├── LICENSE
└── README.md             # You are here!
```

---

## 🏛️ Architecture

InvoLex is designed with a modern full-stack architecture that separates concerns for maximum security and scalability. For a deep dive, please see the [**ARCHITECTURE.md**](ARCHITECTURE.md) file.

-   **Frontend (React)**: Chrome extension handling all user interactions and UI.
-   **Backend API (Node.js/Express)**: RESTful API managing authentication, database operations, and external integrations.
-   **Database (PostgreSQL)**: Primary data storage with Prisma ORM for type-safe database operations.
-   **AI Service**: Secure backend service handling all interactions with the Google Gemini API. **The API key lives only here.**
-   **External Integrations**: OAuth-based connections to Gmail, Outlook, and Clio APIs.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please read our [**CONTRIBUTING.md**](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📄 License

This project is licensed under the MIT License - see the [**LICENSE**](LICENSE) file for details.
