import {
  MessageSquare,
  FileText,
  ShieldCheck,
  Globe,
  Code,
  Share2,
  BookOpen,
  Briefcase,
  GraduationCap
} from "lucide-react";

export const DOC_MODES = [
  { id: "chat", label: "Document Chat", icon: MessageSquare, description: "RAG chat with uploaded PDFs" },
  { id: "insights", label: "Document Insights", icon: FileText, description: "Auto-summary, topics, keywords" },
  { id: "authenticity", label: "Authenticity Checker", icon: ShieldCheck, description: "Verify claims against the web" },
  { id: "graph", label: "Knowledge Graph", icon: Share2, description: "Entity relationship extraction" },
  { id: "flashcards", label: "Flashcards", icon: BookOpen, description: "Study material from docs" },
];

export const OTHER_MODES = [
  { id: "research", label: "AI Research Agent", icon: Globe, description: "Deep web research & synthesis" },
  { id: "resume", label: "Resume ATS Optimizer", icon: Briefcase, description: "Critique and optimize resumes" },
  { id: "paper", label: "Paper Analyzer", icon: GraduationCap, description: "Analyze research methodology" },
  { id: "code", label: "Code Generation", icon: Code, description: "Generate code from context" },
];

export const AI_MODES = [...DOC_MODES, ...OTHER_MODES];

