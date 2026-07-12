# 🚀 AI Studio Pro

> **A Modern Multi-Module AI SaaS Platform built with Next.js 15 &
> FastAPI**

AI Studio Pro is a full-stack AI workspace that brings multiple
specialized AI tools into one application. Instead of relying on a
single chatbot, users can choose purpose-built AI modules for document
intelligence, CSV analytics, recipe generation, sports knowledge, and
general AI conversations.

------------------------------------------------------------------------

## ✨ Highlights

-   🤖 Multi-Provider LLM Support (OpenAI, Claude, Gemini, DeepSeek)
-   📄 Document AI (RAG)
-   📊 CSV Analytics AI
-   🍳 AI Recipe Generator
-   ⚽ Sports AI Assistant
-   🔐 JWT Authentication
-   🔑 API Key Manager
-   🌙 Dark / Light Theme
-   📱 Responsive UI
-   🏗 Modular FastAPI + Next.js Architecture

------------------------------------------------------------------------

## 🖼 Screenshots

> Replace these placeholders after finishing the UI.

  Dashboard                General AI
  ------------------------ -------------------------
  `assets/dashboard.png`   `assets/general-ai.png`

  Document AI                CSV Analytics
  -------------------------- ---------------------
  `assets/document-ai.png`   `assets/csv-ai.png`

  Recipe AI                Sports AI
  ------------------------ ------------------------
  `assets/recipe-ai.png`   `assets/sports-ai.png`

------------------------------------------------------------------------

# 📚 Modules

## 🤖 General AI

-   Chat interface
-   Streaming responses
-   Markdown rendering
-   Code highlighting
-   Conversation history
-   Multiple AI providers

## 📄 Document AI

-   Upload PDF, DOCX, TXT, Markdown
-   Ask questions
-   Source citations
-   Conversation memory

## 📊 CSV Analytics

-   Upload multiple CSVs
-   Natural language querying
-   Summary statistics
-   Auto-generated charts
-   SQL generation

## 🍳 Recipe Generator

-   Meal planning
-   Cuisine selection
-   Ingredient-based recipes
-   Nutrition estimates

## ⚽ Sports AI

-   Cricket
-   Football
-   Basketball
-   Tennis
-   Formula 1
-   Olympics

## 🔑 API Key Manager

-   Store provider keys
-   Test API connectivity
-   Switch providers

------------------------------------------------------------------------

# 🏗 Architecture

``` text
                 Next.js Frontend
                        │
                        ▼
                FastAPI REST API
                        │
      ┌─────────┬────────┼─────────┐
      ▼         ▼        ▼         ▼
 General AI  Document   CSV     Recipe
               AI       AI        AI
                        │
                        ▼
      OpenAI • Claude • Gemini • DeepSeek
                        │
                        ▼
                   SQLite Database
```

------------------------------------------------------------------------

# 🛠 Tech Stack

## Frontend

-   Next.js 15
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   Framer Motion
-   Lucide Icons

## Backend

-   FastAPI
-   SQLAlchemy
-   Pydantic
-   SQLite
-   Uvicorn

## AI

-   OpenAI
-   Claude
-   Gemini
-   DeepSeek

------------------------------------------------------------------------

# 📁 Project Structure

``` text
AI-Studio-Pro/
├── backend/
├── frontend/
├── assets/
├── docs/
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── .gitignore
```

------------------------------------------------------------------------

# 🚀 Getting Started

## Backend

``` bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend: `http://localhost:8000`

API Docs: `http://localhost:8000/docs`

## Frontend

``` bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000`

------------------------------------------------------------------------

# 🔐 Authentication

-   Register
-   Login
-   Forgot Password
-   JWT Authentication
-   Protected Routes

------------------------------------------------------------------------

# 📌 Why AI Studio Pro?

Unlike traditional chatbot applications, AI Studio Pro organizes AI
capabilities into specialized workspaces. This modular architecture
demonstrates scalable software engineering principles while solving
real-world productivity tasks.

------------------------------------------------------------------------

# 🗺 Roadmap

-   [x] JWT Authentication
-   [x] General AI
-   [x] Document AI
-   [x] CSV Analytics
-   [x] Recipe Generator
-   [x] Sports AI
-   [x] API Key Management
-   [ ] Voice Assistant
-   [ ] Image Generation
-   [ ] PostgreSQL
-   [ ] Redis
-   [ ] Docker Deployment
-   [ ] Kubernetes

------------------------------------------------------------------------

# 🤝 Contributing

Contributions, ideas, and feature requests are welcome. Please open an
issue before submitting significant changes.

------------------------------------------------------------------------

# 🛡 Security

If you discover a security issue, please report it privately rather than
opening a public issue.

------------------------------------------------------------------------

# 📄 License

This project is licensed under the MIT License.

------------------------------------------------------------------------

# 👨‍💻 Author

**Inshal Zafar**

-   GitHub: https://github.com/InshalZafar

------------------------------------------------------------------------

# ⭐ Support

If you found this project useful:

-   ⭐ Star the repository
-   🍴 Fork it
-   🐞 Report issues
-   💡 Suggest improvements

------------------------------------------------------------------------

> **AI Studio Pro** was built as a portfolio-quality full-stack AI
> platform to demonstrate modern software engineering, scalable
> architecture, and practical AI integration using FastAPI and Next.js.
