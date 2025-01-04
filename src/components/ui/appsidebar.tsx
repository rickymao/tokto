import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { FileCard, FileUploadCard } from "./fileupload";
import { Separator } from "./separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { DocumentCard } from "./documentcard";
import { PromptCard } from "./promptcard";
import { Info } from "lucide-react";
import { Document } from "@langchain/core/documents";

type AppSidebarProps = {
  handleFileUpload: (file: File) => void;
  file: File | null;
  isFileLoading: boolean;
  systemPrompt: string;
  query: string;
  docs: Document[];
  setSystemPrompt: (prompt: string) => void;
};
export const AppSidebar: React.FC<AppSidebarProps> = ({
  handleFileUpload,
  isFileLoading,
  docs,
  file,
  systemPrompt,
  query,
  setSystemPrompt,
}) => {
  return (
    <Sidebar className="z-20 border-r-2 border-stone-700">
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            {file ? (
              <FileCard file={file} isLoading={isFileLoading} />
            ) : (
              <FileUploadCard handleFileUpload={handleFileUpload} />
            )}
          </SidebarGroupContent>
          <Separator />
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Debug</SidebarGroupLabel>
          <SidebarGroupContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="query">
                <AccordionTrigger>Query Generated</AccordionTrigger>
                <AccordionContent>
                  <PromptCard content={query} disabled />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="retrieved_docs">
                <AccordionTrigger>Retrieved Documents</AccordionTrigger>
                <AccordionContent>
                  {docs.map((doc, i) => {
                    return <DocumentCard key={i} id={i} doc={doc} />;
                  })}
                  {docs.length === 0 && (
                    <p className="py-4 text-sm text-sidebar-foreground/40 flex flex-row gap-2">
                      No documents found. Try sending a new message.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="system_prompt">
                <AccordionTrigger>System Prompt</AccordionTrigger>
                <AccordionContent>
                  <PromptCard
                    content={systemPrompt}
                    className="h-[10rem]"
                    handleChange={setSystemPrompt}
                  />
                  <p className="py-4 text-sm text-sidebar-foreground/40 flex flex-row gap-2">
                    <Info />
                    the prompt updates when a message is sent.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="sample_questions">
                <AccordionTrigger>Sample Questions</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside py-4 text-sm">
                    <li>
                      What are Crista{"'"}s Five Laws of Performant Software?
                    </li>
                    <li>
                      What is the maximum latency recommended for systems that
                      need to respond instantaneously
                    </li>
                    <li>
                      How does the document explain the difference between
                      bandwidth and latency?
                    </li>
                    <li>
                      {" "}
                      According to the lecture, why is parallelization not
                      always the answer to performance problems?
                    </li>
                    <li>
                      What was the specific problem mentioned in the anecdote
                      about report generation taking three hours, and how was it
                      solved?
                    </li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
