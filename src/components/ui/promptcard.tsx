import React from "react";
import { Card, CardContent } from "./card";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

type PromptCardProps = {
    disabled?: boolean;
    className?: string;
};

export const PromptCard: React.FC<PromptCardProps> = ({ disabled, className}) => {
  return (
    <Card className="w-full bg-stone-700 border-stone-500">
      <CardContent className="p-2 flex flex-row gap-2">
        <Textarea
          disabled={disabled}
          className={cn("bg-stone-700 h-full w-full border-0 resize-none text-sm text-sidebar-foreground/70", className)}
          defaultValue={"Hello, I'm a chatbot. Ask me anything!"}
        />
      </CardContent>
    </Card>
  );
};
// 