import { Document } from "@langchain/core/documents";
import { Card, CardContent } from "./card";

type DocumentCardProps = {
  id: number;
  doc: Document;
};

export const DocumentCard: React.FC<DocumentCardProps> = ({ id, doc }) => {
  return (
    <Card className="mb-4 w-full">
      <CardContent className="w-full p-4 flex flex-row gap-4">
        <p className="text-sm text-sidebar-foreground/70">{id + 1}</p>
        <div className="w-full break-all">
          <p className="text-sidebar-foreground/70">{doc.pageContent.slice(0, 300)+ '...'}</p>
        </div>
      </CardContent>
    </Card>
  );
};
