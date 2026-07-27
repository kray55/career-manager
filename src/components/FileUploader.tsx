"use client";

import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface FileUploaderProps {
  onFileUpload?: (file: File, url: string) => void;
  accept?: Record<string, string[]>;
  maxSize?: number; // in MB
  multiple?: boolean;
  label?: string;
}

export default function FileUploader({
  onFileUpload,
  accept = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg"],
  },
  maxSize = 10,
  multiple = false,
  label = "Upload a file",
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[];
    if (!file) return;

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large. Max size: ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    try {
      // For now, create a local object URL
      // In production, this would upload to S3/WebDAV
      const url = URL.createObjectURL(file);
      setUploadedUrl(url);
      setUploadedName(file.name);
      onFileUpload?.(file, url);
      toast.success(`${file.name} uploaded`);
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  }, [maxSize, onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize: maxSize * 1024 * 1024,
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-primary-500 bg-primary-500/10"
            : "border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <svg className="animate-spin h-8 w-8 text-primary-400" viewBox="  24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8  018-8VC5.373   5.373  12h4zm2 5.291A7.962 7.962  014 12Hc 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="  24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4  01-.88-7.903A5 5  0115.9 6L16 6a5 5  019 9H7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-4m   2.5l-2.5-2.5M10 11.5l2.5 2.5" />
            </svg>
          )}
          <div>
            <p className="text-sm text-slate-300">{isDragActive ? "Drop files here" : label}</p>
            <p className="text-xs text-slate-500 mt-1">
              {Object.values(accept).flat().join(", ")} up to {maxSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded file preview */}
      {uploadedUrl && uploadedName && (
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="  24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2  01-2-2V5a2 2  012-2h5.586a1 1  01.707.293l5.414 5.414a1 1  01.293.707V19a2 2  01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-">
            <p className="text-sm text-white truncate">{uploadedName}</p>
          </div>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary-400 hover:text-primary-300">
            View
          </a>
          <button onClick={() => { setUploadedUrl(null); setUploadedName(null); }}
            className="text-xs text-slate-500 hover:text-red-400">
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
