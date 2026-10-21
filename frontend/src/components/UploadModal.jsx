import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Trash2, Database, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

const SUPPORTED_EXTS = [
  "PDF", "DOCX", "PPTX", "XLSX", "TXT", "MD", "CSV", "JSON", "PNG", "JPG", "WEBP"
];

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  activeConversation
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachToCurrentChat, setAttachToCurrentChat] = useState(true);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFiles = (files) => {
    setError(null);
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    if (attachToCurrentChat && activeConversation?.id) {
      formData.append("conversation_id", activeConversation.id);
    }

    try {
      const res = await api.documents.upload(formData);
      setSelectedFiles([]);
      if (onUploadSuccess) {
        onUploadSuccess(
          res.documents || [],
          attachToCurrentChat ? activeConversation?.id : null
        );
      }
      onClose();
    } catch (err) {
      setError(err.message || "Upload failed. Please check file format and size.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl rounded-2xl bg-[#0c0c0f] border border-amber-500/20 p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/25">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Upload Knowledge Documents</h3>
            <p className="text-xs text-slate-400">PDF, Word, Excel, PowerPoint, Images, Text</p>
          </div>
        </div>

        {/* Chat Scope Destination Banner */}
        {activeConversation && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Database className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400">Target Chat: </span>
                <span className="font-semibold text-amber-300 truncate">{activeConversation.title || "Active Chat"}</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={attachToCurrentChat}
                onChange={(e) => setAttachToCurrentChat(e.target.checked)}
                className="rounded accent-amber-400 cursor-pointer w-4 h-4"
              />
              <span className="text-[11px] font-medium">Attach to this Chat</span>
            </label>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? "border-amber-400 bg-amber-500/10"
              : "border-amber-500/20 hover:border-amber-500/40 bg-black/40"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            className="hidden"
            accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md,.json,.png,.jpg,.jpeg,.webp"
          />
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Drag & drop files here, or <span className="text-amber-400 underline decoration-amber-400/50 underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports: {SUPPORTED_EXTS.join(", ")} (up to 50MB per file)
            </p>
          </div>
        </div>

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 max-h-40 custom-scrollbar">
            <div className="text-xs font-semibold text-slate-400 px-1">
              Selected files ({selectedFiles.length})
            </div>
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-amber-500/15 text-xs text-slate-300"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="text-[10px] text-slate-500">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="p-1 hover:text-red-400 text-slate-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-amber-500/15">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="btn-primary px-6 py-2.5 text-xs font-semibold disabled:opacity-50"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing & Vectorizing...</span>
              </div>
            ) : (
              <span>Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
