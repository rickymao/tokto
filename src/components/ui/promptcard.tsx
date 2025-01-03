import React from "react";
import { Card, CardContent } from "./card";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

type PromptCardProps = {
    disabled?: boolean;
    className?: string;
    content?: string;
    handleChange?: (str: string) => void;
};

export const PromptCard: React.FC<PromptCardProps> = ({ disabled, className, content, handleChange}) => {
  return (
    <Card className="w-full bg-stone-700 border-stone-500">
      <CardContent className="p-2 flex flex-row">
        <Textarea
          disabled={disabled}
          className={cn("bg-stone-700 w-full border-0 resize-none text-sm text-sidebar-foreground/70", className)}
          defaultValue={content ?? ""}
            onChange={(e) => handleChange && handleChange(e.target.value)}
        />
      </CardContent>
    </Card>
  );
};
// 