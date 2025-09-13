# My Chat Editor

This is a Next.js application that provides a self-contained chat, editor, and diff viewer. It's designed to run in constrained sandboxes and has a fallback for the Monaco editor if it's not installed.

## Features

*   **Chat Interface**: A simple chat interface for interacting with an AI assistant.
*   **Code Editor**: A code editor with a fallback to a simple textarea if Monaco is not available.
*   **Diff Viewer**: A component to show the difference between two pieces of code.
*   **Tool Calls**: The chat understands simple tool calls in JSON format to write files and show diffs.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts a production server.
*   `npm run lint`: Lints the codebase using ESLint.