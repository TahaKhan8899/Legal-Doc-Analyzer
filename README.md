# AI Legal Document Analyzer (Demo)

A premium, demo-ready web application for analyzing legal contracts using Next.js 14 and OpenAI.

## Features
- **PDF Processing**: Real-time extraction and chunking.
- **In-Memory RAG**: Vectors are stored in a singleton Map (no DB dependency).
- **Structured Risk Report**: AI-generated JSON report with exact clause citations.
- **Grounded Chat**: Chat with the document; answers are strictly grounded in contract text.
- **Modern UI**: Built with Tailwind CSS, shadcn/ui, and Lucide icons.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` file in the root:
   ```env
   OPENAI_API_KEY=your_api_key_here
   ```
   *If no key is provided, the app runs in MOCK MODE with pre-defined responses.*

3. **Run the App**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## How the In-Memory Index Works
- Uploaded PDFs are stored in `./uploads/`.
- Metadata (Chat history, Report JSON) is saved to `./data/{id}.json`.
- **Vectors are ONLY in memory**. If you restart the dev server, the vectors are lost. 
- The UI handles this via an "Index Lost" state, prompting a re-upload to re-index the document.

## Demo Sample
If you don't have a contract handy, use any standard PDF or search for "Standard NDA PDF" online.
