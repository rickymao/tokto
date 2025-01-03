import { Card, CardContent } from "./card";

type DocumentCardProps = {
  id: string;
};

export const DocumentCard: React.FC<DocumentCardProps> = ({ id}) => {
  return (
    <Card className="h-24 mb-4">
      <CardContent className="p-4 flex flex-row gap-4">
        <p className="text-sm text-sidebar-foreground/70">{id}</p>
        <div className="">
            <p>Document</p>
        </div>
      </CardContent>
    </Card>
  );
};
