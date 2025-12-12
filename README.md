# Onys

Onys is a full-stack web application featuring a Python FastAPI backend and a React frontend. It provides a comprehensive interface for chat interactions, file management, and integration with AI models via Ollama.

## Features

- **Chat Interface**: 
  - Real-time chat with AI models.
  - Markdown rendering for rich text responses (`MarkdownRenderer`).
  - Message history and session management.
  - Timeline sidebar for navigating conversations.
- **Ollama Integration**: 
  - Direct integration with Ollama for running local LLMs.
  - Model selection and management.
- **File Management**: 
  - File upload capabilities (`FileUploadBar`).
  - Backend service for handling file operations.
- **Instructions Management**: 
  - System instruction configuration (`InstructionModal`).
- **Session Management**: 
  - Create, list, and manage chat sessions (`SidebarSessionList`).
- **Settings**: 
  - Application-wide configuration (`SettingsModal`).
- **Launcher**: 
  - Includes `OnysLauncher.exe` (and `.ahk` source) for easy application startup.

## File Tree

```
.
├── OnysLauncher.ahk
├── OnysLauncher.exe
├── backend
│   ├── data
│   │   └── sessions
│   ├── features
│   │   ├── chat
│   │   │   ├── models.py
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   ├── files
│   │   │   └── service.py
│   │   ├── instructions
│   │   │   ├── models.py
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   ├── ollama
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   ├── providers
│   │   │   └── router.py
│   │   ├── sessions
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   └── settings
│   │       ├── models.py
│   │       └── router.py
│   └── main.py
└── frontend
    ├── README.md
    ├── eslint.config.js
    ├── index.html
    ├── postcss.config.js
    ├── public
    │   └── vite.svg
    └── src
        ├── App.css
        ├── App.jsx
        ├── assets
        │   └── react.svg
        ├── features
        │   ├── chat
        │   │   ├── ChatArea.jsx
        │   │   ├── ChatLoadingBubble.jsx
        │   │   ├── MarkdownRenderer.jsx
        │   │   └── components
        │   │       ├── InputArea.jsx
        │   │       ├── MessageList.jsx
        │   │       └── TimelineSidebar.jsx
        │   ├── files
        │   │   └── FileUploadBar.jsx
        │   ├── instructions
        │   │   └── InstructionModal.jsx
        │   ├── layout
        │   │   └── MainLayout.jsx
        │   ├── sessions
        │   │   └── SidebarSessionList.jsx
        │   └── settings
        │       └── SettingsModal.jsx
        ├── index.css
        └── main.jsx
```

## Dependencies

### Backend (Python)
See `requirements.txt` for the full list. Key dependencies include:
- `fastapi`
- `uvicorn`
- `pydantic`
- `httpx`
- `pypdf`

### Frontend (Node.js)
Key dependencies:
- `react`
- `vite`
- `tailwindcss`
- `prismjs`

## Setup and Running

### Backend
1. Navigate to the `backend` directory.
2. Create and activate a virtual environment (if not using the root `venv`).
3. Install dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Launcher
Alternatively, use `OnysLauncher.exe` to start the application.
