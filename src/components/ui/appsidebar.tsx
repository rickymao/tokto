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

type AppSidebarProps = {
  handleFileUpload: (file: File) => void;
  file: File | null;
  isFileLoading: boolean;
};
export const AppSidebar: React.FC<AppSidebarProps> = ({
  handleFileUpload,
  isFileLoading,
  file,
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
                  <PromptCard disabled />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="retrieved_docs">
                <AccordionTrigger>Retrieved Documents</AccordionTrigger>
                <AccordionContent>
                  <DocumentCard id="1" />
                  <DocumentCard id="2" />
                  <DocumentCard id="3" />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="System Prompt">
                <AccordionTrigger>System Prompt</AccordionTrigger>
                <AccordionContent>
                  <PromptCard />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Sample Questions</AccordionTrigger>
                <AccordionContent>
                  Yes. It's animated by default, but you can disable it if you
                  prefer.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
