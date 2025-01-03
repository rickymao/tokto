import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
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
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  model: "text-embedding-3-large",
});
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  temperature: 0,
});
const vectorStore = new MemoryVectorStore(embeddings);

// init trimmer
const trimmer = trimMessages({
  maxTokens: 100000,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

// RAG Implementation: Ingest data, create RAG, and respond to messages
async function ingestData(blob: Blob) {
  const chunkSize = 1000;
  const chunkOverlap = 200;
  const pdfLoader = new WebPDFLoader(blob);
  const docs = await pdfLoader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
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
});

// create query node
const createQuery = async (
  state: typeof StateAnnotation.State,
  config: RunnableConfig
) => {
  // grab last human message
  const lastHumanMessage = state.messages[state.messages.length - 1];

  // combine context from last 5 messages
  const lastMessages = await trimmer.invoke(state.messages);
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
  return { query: resp.content };
};

// retrieve node
const retrieve = async (
  state: typeof StateAnnotation.State,
  config: RunnableConfig
) => {
  const query = state.query;
  const retriever = await vectorStore.asRetriever();
  const docs = await retriever.invoke(query, config);
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
    [
      "system",
      "You are an assistant for question-answering tasks. " +
        "Use the following pieces of retrieved context to answer " +
        "the question. If you don't know the answer, say that you " +
        "don't know. Use three sentences maximum and keep the " +
        "answer concise.",
    ],
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

const runRag = async (messages: BaseMessage[]) => {
  const eventStream = await rag.streamEvents(
    {
      messages: [new HumanMessage(messages[0].content.toString())], //TODO: cleaner way to do this
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
      await ingestData(file);
      self.postMessage({
        type: "INGEST_DONE",
      });
    } else if (event.data.type === "CHAT") {
      const messages = event.data.payload.messages;
      await runRag(messages);
    }
  }
);
