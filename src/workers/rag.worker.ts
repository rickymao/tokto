import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { WorkerInMessage } from "./types";
import {
  END,
  START,
  StateGraph,
  Annotation,
  MemorySaver,
} from "@langchain/langgraph/web";
import {
  BaseMessage,
  HumanMessage,
  trimMessages,
} from "@langchain/core/messages";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { RunnableConfig } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
// Initialize vector store, embeddings, and language model

const currentChatID = self.crypto.randomUUID();
const embeddings =
  process.env.NEXT_PUBLIC_USE_OPENAI === "true"
    ? new OpenAIEmbeddings({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        model: "text-embedding-3-large",
      })
    : new OllamaEmbeddings({
        model: "nomic-embed-text",
      });
const llm =
  process.env.NEXT_PUBLIC_USE_OPENAI === "true"
    ? new ChatOpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        modelName: "gpt-4o",
        temperature: 0.3, // for more factual responses
        maxRetries: 2,
      })
    : new ChatOllama({
        model: "llama3.2",
        temperature: 0.3,
        maxRetries: 2,
      });
const vectorStore = new MemoryVectorStore(embeddings);

// init trimmer
const trimmer = trimMessages({
  maxTokens: 100000,
  strategy: "last",
  tokenCounter: llm,
  includeSystem: true,
  allowPartial: false,
});

// RAG Implementation: Ingest data, create RAG, and respond to messages
async function ingestData(blob: Blob) {
  const chunkSize = 750;
  const chunkOverlap = 100;
  const pdfLoader = new WebPDFLoader(blob, { parsedItemSeparator: "  " });
  const docs = await pdfLoader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["○", "●", ">", "-"],
  });
  const chunks = await splitter.splitDocuments(docs);

  await vectorStore.addDocuments(chunks);
}

// create state schema
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (state, message) => {
      return [...state, ...message];
    },
  }),
  docs: Annotation<Document[]>,
  query: Annotation<string>,
  systemPrompt: Annotation<string>,
});

// create query node
const createQuery = async (
  state: typeof StateAnnotation.State,
  config: RunnableConfig
) => {
  // grab last human message
  const lastHumanMessage = state.messages[state.messages.length - 1];

  // combine context from last 5 messages
  const lastMessages = state.messages.slice(-5);
  const context = lastMessages
    .map((m) => {
      return `${m.getType() === "ai" ? "Assistant" : "User"}: ${m.content}`;
    })
    .join("\n");

  const promptTemplate = PromptTemplate.fromTemplate(`{context}
    Given the above conversation, rephrase the following question into a natural language query with important keywords that a researcher could later pass into a search engine to get information relevant to the conversation. Do not respond with anything except the query. {question}`);

  const prompt = await promptTemplate.invoke({
    context,
    question: lastHumanMessage.content,
  });

  const resp = await llm.invoke(prompt, config);

  self.postMessage({
    type: "QUERY",
    payload: { query: resp.content },
  });
  return { query: resp.content };
};

// retrieve node
const retrieve = async (
  state: typeof StateAnnotation.State,
  config: RunnableConfig
) => {
  const query = state.query;
  const retriever = await vectorStore.asRetriever(3);
  const docs = await retriever.invoke(query, config);
  self.postMessage({
    type: "DOC",
    payload: { docs },
  });
  return { docs };
};
// generate node
const generate = async (
  state: typeof StateAnnotation.State,
  config: RunnableConfig
) => {
  const docsContent = state.docs
    .map((doc) => `Content: ${doc.pageContent}\n`)
    .join("\n");

  const promptTemplate = ChatPromptTemplate.fromMessages<{
    context: string;
    messages: BaseMessage[];
  }>([
    ["system", state.systemPrompt ?? ""],
    [
      "user",
      "use the following documents as context:\n<context>\n{context}\n</context>",
    ],
    ["placeholder", "{messages}"],
  ]);

  const prompt = await promptTemplate.invoke({
    context: docsContent,
    messages: await trimmer.invoke(state.messages),
  });

  const response = await llm
    .withConfig({ tags: ["generate"] })
    .invoke(prompt, config);

  return { messages: [response] };
};

// Create checkpointer to track chat
const memory = new MemorySaver();

// Create LangGraph
const graphBuilder = new StateGraph(StateAnnotation)
  .addNode("create_query", createQuery)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addEdge(START, "create_query")
  .addEdge("create_query", "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", END);

const rag = graphBuilder.compile({ checkpointer: memory });

const runRag = async (messages: BaseMessage[], systemPrompt: string) => {
  const eventStream = await rag.streamEvents(
    {
      messages: [new HumanMessage(messages[0].content.toString())],
      systemPrompt,
    },
    {
      version: "v2",
      callbacks: [],
      configurable: { thread_id: currentChatID },
    }
  );
  for await (const { event, data, tags } of eventStream) {
    console.log("Event:", event, "Data:", data);
    if (tags && tags.includes("generate") && event === "on_chat_model_stream") {
      self.postMessage({
        type: "TOKEN",
        payload: { token: data.chunk.content ?? "" },
      });
    }
  }
};

self.addEventListener(
  "message",
  async (event: MessageEvent<WorkerInMessage>) => {
    console.log("Worker received:", event.data);
    if (event.data.type === "INGEST") {
      const file = event.data.payload.data;
      try {
        await ingestData(file);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        self.postMessage({
          type: "ERROR",
          payload: { error: e.message },
        });
      }
      self.postMessage({
        type: "INGEST_DONE",
      });
    } else if (event.data.type === "CHAT") {
      const messages = event.data.payload.messages;
      const systemPrompt = event.data.payload.systemPrompt;
      try {
        await runRag(messages, systemPrompt);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        self.postMessage({
          type: "ERROR",
          payload: {
            error:
              process.env.NEXT_PUBLIC_OPENAI_API_KEY === "true"
                ? e.message.replace("OpenAI API key is missing.", "")
                : "Check if Ollama is running.",
          },
        });
      }
      self.postMessage({
        type: "DONE",
      });
    }
  }
);
