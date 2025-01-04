## Setup

### Prerequisites

1. Node.js
   - Required version: Node.js 18.x or higher recommended
   - Download from [nodejs.org](https://nodejs.org/)

2. Yarn Package Manager
   - Required since the project uses a yarn.lock file
   - Install using: `npm install -g yarn`

3. Ollama and Llama3.2 3B and nomic-embed-text
   - Required for running the RAG pipeline
   - Download the latest version from [ollama.ai](https://ollama.ai/)
   - Follow the installation instructions for your operating system
   - Make sure Ollama is downloaded properly by running `ollama -v` in your terminal
   - Download [Llama3.2 3B](https://ollama.com/library/llama3.2)
   - Download [nomic-embed-text](https://ollama.com/library/nomic-embed-text)
  
4. Git
   - Download from [git](https://git-scm.com/)

### Setup Steps

1. Clone the project repository to your local machine

   ```bash
   git clone [repository-url]
   cd [project-directory]
   ```

2. Install dependencies

   ```bash
   yarn
   ```

3. Environment Variables
fill out the .env.development file with your own values if you want to use OpenAI
```
   NEXT_PUBLIC_USE_OPENAI=false # set this as 'true' to use OpenAI
   NEXT_PUBLIC_OPENAI_API_KEY= # also set this if you want to use OpenAI
```

4. Run the development server

   ```bash
   yarn dev
   ```

   This will start the Next.js development server, typically on http://localhost:3000


5. Open Ollama by running `ollama serve` in your terminal


### Done

The application should now be ready for use. Visit http://localhost:3000 to view the application.

Feel free to jump right in, and try it out with the included `use-this-pdf.pdf` file from a cool class I took.


Note: the first message will take a bit of time to generate when you use Ollama, but subsequent messages will be much faster.

## Demo

Here's a [quick demo]() on using tokto and an overview of the features.

## Stretch Goals

Before I explain the choices I made, I want to list the stretch goals that influenced my decisions:

1. I wanted to build a chatbot with great UX/UI
2. features for debugging and tracing the RAG pipeline.
3. I wanted to do the whole chatbot locally

I was motivated to choose those stretch goals because I am interested in the observability and interpretability of RAG pipelines,and I wanted to build a chatbot that I wished I had when I was in University and the WiFi didn't work :(

## Tool Choices

### Frameworks

I measured frameworks based on the following criteria:

- Ease of use: How fast can you iterate and build using the framework?
- Effectiveness: Can it help me build a high-quality RAG pipeline and a good chatbot?

I picked the above criterias because they were important for building products.

I decided to use Langchain because it had a lot of integrations and utility for quickly building a chatbot, especially for a fully local chatbot. I was able to use it to build a RAG pipeline that ran on a web worker and integrate it with Ollama quickly and reliably. Despite LlamaIndex having great parser and indexing capabilities, Langchain makes up for it with a much more robust and flexible framework and library of integrations.

### Embedding Model

I measured embedding models based on the following criteria:

- Speed: how fast are inferences for the embeddings?
- Ease of use: how easy is it to use the embeddings?
- Evaluation score average: how well does the embedding perform on average across all tasks?
- Cost: how much does it cost to use the embeddings?

Once again I picked the above metrics because they were important for building products. Speed is needed for a seamless experience, and a high score average is important for getting relevant retrieval results. Lastly, cost and ease of use is important for building a product that is affordable and usable for students.

When evaluating embedding models, I consulted the MTEB leaderboard https://huggingface.co/spaces/mteb/leaderboard. I decided on `nomic-text-embed-v1` because it's one of the best open-source local embeddings with a great average score across all tasks. It is a bit slower than the other options, but it is still fast enough for a chatbot. Lastly, it is easy to host and use with Ollama.

### LLM Provider

For model providers, I measured them based on the following criteria:

- Cost: how much does it cost to run the model?
- Ease of use: can I run the model locally easily?
- Performance: how well does the model learn from long and short contexts?
- Context window size: how many tokens can the model handle?

Cost and ease of use are important for building a product that is affordable for students, especially since they would be hosting the model on their own computers. Performance and context window size are important for giving relevant and accurate answers to questions about users' short assignments or long notes.

Since it's important to have a model that is easy to run locally and cost-effective, I looked at open-source models that were significantly smaller and had 1B-5B parameters. I ended up choosing `llama3.2 3B` as it was very lightweight and performed in general better on evaluations than offerings like `Gemma 2 2B IT` and `Phi-3.5-mini IT`. Also, it has a context window size of 128k tokens, which is amazing for short and long contexts.

For a backup model, I picked `GPT-4o` since it was fairly cheap @ $2.50 / 1M tokens, performs very well on retrieval evaluations, and has a context window size of 128k tokens.

## What worked and what didn't

### What worked?

In the end, I was able to build a chatbot that runs sufficiently fast locally with relevant answers. It was also very useful to have a debug panel to trace the retrieved documents, and the generated query, and to have an easy way to swap out the system prompt.
Also picking Langchain was a great choice, since more tedious tasks like managing chat history and integrating with external tools like Ollama were made simpler, so I could focus on creating a good chatbot.

### What didn't?

Since I was using a WebPDF parser, it was not good at handling documents with sophisticated formatting or images. So it was difficult to get certain details in research papers. Since I am trying to create a locally running RAG pipeline, I was limited to WebPDF parser (after researching for alternatives). As a result, I improved the parsed PDF content by configuring text splitting with separators and adding spacing to parsed text for better clarity and to deal with the rich formatting.

At first, I wanted to retrieve documents, only if it was necessary. However, the model did not give me relevant answers. I then debugged by checking the traced retrieved documents panel and realized that the retrieval tool was never called. As a solution, I decided to retrieve documents for every message, since self-hosting was cost-effective. Overall, it slowed the inference time, but it allowed me to get relevant results.

The model gave answers but struggled with some specific details. After doing some research on simple techniques, I improved the answers by rewriting the question to create a better query to grab relevant context. I also prompt-engineered the system prompt by adding better formatting to the context and adding rules to the prompt to make it more concise and relevant.

## What to do next?

- I would like to improve the readability and maintainability of the codebase by adding E2E tests and refactoring states into custom hooks and contexts.
- Use a better PDF parser, potentially with Llama parser.
- I would like to use more advanced RAG techniques, specifically hybrid search (using both semantic and keyword search) with a reordering technique to improve the retrieval results.
- I would like to improve the UI by adding a cancel sent button, a chat history panel, and a reset chat without a refreshing button.
- I also want to add a voice chat feature, since it's a feature I use a lot in my daily life.
