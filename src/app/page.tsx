"use client";
import { Button } from "@/components/ui/button";
import { WorkerOutMessage, WorkerOutMessageToken } from "@/workers/types";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, ChatRole } from "./types";
import ChatBubble from "@/components/ui/chatbubble";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/appsidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { Document } from "@langchain/core/documents";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const workerRef = useRef<Worker | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoadingMessage, setIsLoadingMessage] = useState<boolean>(false);
  const [generatedQuery, setGeneratedQuery] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are an assistant for question-answering tasks about PDF documents." +
      "Use the following pieces of retrieved context to answer " +
      "the question. If you don't know the answer, say that you " +
      "don't know. Use eight sentences maximum and keep the " +
      "answer concise."
  );

  const handleWorkerMessage = ({ data }: MessageEvent<WorkerOutMessage>) => {
    if (data.type === "TOKEN") {
      const msg = data as WorkerOutMessageToken;
      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        const updatedMsg = {
          ...last,
          content: last.content + msg.payload.token,
        };
        return [...prev.slice(0, -1), updatedMsg];
      });
    } else if (data.type === "INGEST_DONE") {
      setIsFileLoading(false);
    } else if (data.type === "DOC") {
      setDocs(data.payload.docs);
    } else if (data.type === "QUERY") {
      setGeneratedQuery(data.payload.query);
    } else if (data.type === "DONE") {
      setIsLoadingMessage(false);
    } else if (data.type === "ERROR") {
      console.error(data.payload.error);
      toast({
        title: "Error",
        description: data.payload.error,
      });
    }
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/rag.worker.ts", import.meta.url)
    );
    workerRef.current.addEventListener("message", handleWorkerMessage);
  }, []);

  const handleFileUpload = (file: File) => {
    setIsFileLoading(true);
    setFile(file);

    const fileblob = new Blob([file], { type: "application/pdf" });
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "INGEST",
        payload: { data: fileblob },
      });
    }
  };

  const onSubmit = () => {
    if (workerRef.current) {
      const message = { role: ChatRole.USER, content: inputValue };
      setChatMessages((prev) =>
        prev.concat(message, { role: ChatRole.AI, content: "" })
      );
      workerRef.current.postMessage({
        type: "CHAT",
        payload: { messages: [message], systemPrompt },
      });
    }
    setIsLoadingMessage(true);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <SidebarProvider>
      <Toaster />
      <AppSidebar
        handleFileUpload={handleFileUpload}
        file={file}
        docs={docs}
        query={generatedQuery ?? "No query generated yet"}
        isFileLoading={isFileLoading}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
      />
      <main className="flex flex-col w-full h-svh">
        <div className="flex flex-col h-svh">
          <div
            style={{ boxShadow: "3px 30px 30px 8px #292524" }}
            className="sticky top-0 w-full z-10 mb-4 shadow-fade-bottom"
          >
            <SidebarTrigger className="h-16 w-16 [&_svg]:size-6 [&_svg]:pointer-events-auto" />
          </div>
          <ScrollArea className="mx-auto w-full max-w-screen-sm">
            {chatMessages.map((msg, i) => (
              <ChatBubble key={i} content={msg.content} role={msg.role} />
            ))}
          </ScrollArea>
          <div className="mt-auto min-h-[10svh] mx-auto w-full border-white max-w-screen-md px-2 pb-2">
            <Card className="w-full bg-stone-700 border-stone-500 z-10">
              <CardContent className="p-2 flex flex-row gap-2">
                <Textarea
                  className="bg-stone-700 h-full w-full border-0 resize-none"
                  value={inputValue}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                />
                <Button disabled={isLoadingMessage} onClick={() => onSubmit()}>
                  <Send />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
