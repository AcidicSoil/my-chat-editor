# Project Overview

This is a Next.js project that functions as a self-contained chat, editor, and diff viewer. It is designed to run in sandboxed environments and includes a fallback from the Monaco editor to a simple textarea if the dependency is not present. The application uses Tailwind CSS for styling and the Vercel AI SDK for chat functionality.

# Building and Running

To get the development environment running, use the following command:

```bash
npm run dev
```

This will start the development server on [http://localhost:3000](http://localhost:3000).

Other available scripts:

*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts a production server.
*   `npm run lint`: Lints the codebase using ESLint.

# Development Conventions

*   **Styling**: The project uses Tailwind CSS. Utility classes should be used for styling components.
*   **Components**: The main application logic is contained within the `src/app/page.tsx` file. This file includes the chat, editor, and diff viewer components.
*   **Dependencies**: The project uses `npm` for package management. Key dependencies include `next`, `react`, `tailwindcss`, `@monaco-editor/react`, and `ai`.
*   **Linting**: ESLint is configured for the project. Run `npm run lint` to check for any linting errors.
