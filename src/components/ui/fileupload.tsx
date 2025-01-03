import React, { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CircleCheck, File, Upload } from "lucide-react";
import { LoadingSpinner } from "./spinner";

type FileUploadCardProps = {
  handleFileUpload: (file: File) => void;
};

type FileCardProps = {
  file: File;
  isLoading: boolean;
};

export const FileCard: React.FC<FileCardProps> = ({ file, isLoading }) => {
  return (
    <Card className="h-24 mb-4">
      <CardContent className="p-4 flex flex-row gap-2">
        <File />
        <p>{file.name}</p>
        <div className="ml-auto">
          {isLoading ? (
            <LoadingSpinner className="w-6 h-6" />
          ) : (
            <CircleCheck className="w-6 h-6" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  handleFileUpload,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      handleFileUpload(e.target.files[0]);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setFile(e.dataTransfer.files[0]);
        handleFileUpload(e.dataTransfer.files[0]);
      }
    },
    [handleFileUpload]
  );

  return (
    <Card className="w-full mb-2 bg-sidebar-background border-transparent max-w-md mx-auto">
      <CardContent className="p-2">
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 ${
            dragActive ? "border-primary" : "border-stone-300"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleChange}
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center h-full cursor-pointer"
          >
            <Upload className="w-12 h-12 text-stone-300" />
            <p className="mt-2 text-sm text-stone-300">
              Drag and drop your file here, or click to select a file
            </p>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};
