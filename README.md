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

## Suggested Loom Demo Script (3-Minute Flow)

1. **The Upload (0:00 - 0:45)**:
   - "Welcome to the AI Legal Doc Analyzer. Today I'll show you how we can perform a deep risk assessment on a contract in seconds."
   - Drag and drop a sample PDF (e.g., an NDA or Service Agreement).
   - Point out the progress UI: "The app is currently extracting text, chunking it semantically, and generating embeddings for our in-memory vector store."

2. **Risk Assessment (0:45 - 2:00)**:
   - "Once processed, we land in the workspace. I'll hit 'Generate Risk Report'."
   - Show the result: "Notice the risk score and the structured red flags. Each flag is tied back to the contract with exact evidence quotes."
   - Click through the tabs: "We can see the executive summary, critical flags like auto-renewals, and even a negotiation strategy suggested by the AI."

3. **Grounded Chat (2:00 - 3:00)**:
   - "Finally, let's use the Grounded Chat. I'll ask: 'What is the liability cap?'."
   - Show the assistant response: "The answer isn't just generated; it's retrieved from the specific chunks of the PDF. You can see the sources cited right below the message, ensuring zero hallucinations."
   - Wrap up: "Premium, fast, and grounded. That's the AI Legal Doc Analyzer."

## Demo Sample
If you don't have a contract handy, use any standard PDF or search for "Standard NDA PDF" online.
