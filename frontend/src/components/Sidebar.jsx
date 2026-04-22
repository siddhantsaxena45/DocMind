import React from 'react';
import { Layers, FileText, X, Settings2, Trash2, ChevronRight } from 'lucide-react';
import { DOC_MODES, OTHER_MODES } from './aiModes';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ currentMode, onSetMode, documents, activeDoc, onSelectDoc, onDeleteDoc, sidebarOpen, setSidebarOpen }) {
  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 h-full bg-bg-main flex flex-col pt-6 pb-4 px-4
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 overflow-hidden
      `}>
        <div className="flex items-center justify-between gap-3 mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Layers className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">DocMind</h1>
              <span className="text-[10px] text-brand-secondary font-bold uppercase tracking-widest">Premium AI</span>
            </div>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white p-2" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 min-h-0">
          <section>
            <div className="mb-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Core Experience</div>
            <div className="space-y-1">
              {DOC_MODES.map(mode => {
                const Icon = mode.icon;
                const isActive = currentMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onSetMode(mode.id)}
                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-primary/10 text-white shadow-sm shadow-brand-primary/5' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-brand-primary/20' : 'bg-transparent'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-slate-400'}`} />
                      </div>
                      <span className="text-sm font-medium">{mode.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-brand-primary/50" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex justify-between items-center">
              <span>My Library</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{documents.length}</span>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => onSelectDoc(doc.id)}
                  className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    activeDoc === doc.id
                      ? 'bg-slate-800 text-white border border-white/5' 
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <FileText className={`w-4 h-4 shrink-0 ${activeDoc === doc.id ? 'text-brand-secondary' : ''}`} />
                    <span className="text-xs font-medium truncate">{doc.filename}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-slate-600 text-[11px] px-3 py-4 text-center border border-dashed border-white/5 rounded-xl">
                  No documents found
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5" /> Advanced Tools
            </div>
            <div className="space-y-1">
              {OTHER_MODES.map(mode => {
                const Icon = mode.icon;
                const isActive = currentMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onSetMode(mode.id)}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-amber-500/10 text-amber-100 border border-amber-500/20' 
                        : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-500'}`} />
                    <span className="text-sm font-medium">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

