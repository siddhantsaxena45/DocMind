import { Layers, FileText, X, Settings2 } from 'lucide-react';
import { DOC_MODES, OTHER_MODES } from './aiModes';

export default function Sidebar({ currentMode, onSetMode, documents, activeDoc, onSelectDoc, onDeleteDoc, sidebarOpen, setSidebarOpen }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 h-full bg-bg-panel border-r border-border-dark flex flex-col pt-6 pb-4 px-4
        transform transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 overflow-hidden
      `}>
        <div className="flex items-center justify-between gap-3 mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)]">
              <Layers className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">DocMind AI</h1>
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 pr-1">
        <div>
          <div className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Tools</div>
          <div className="space-y-1">
            {DOC_MODES.map(mode => {
              const Icon = mode.icon;
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onSetMode(mode.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                    isActive 
                      ? 'bg-primary-500/10 text-primary-500' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-500' : 'text-slate-400'}`} />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            <span>Your Documents</span>
          </div>
          <div className="space-y-1">
            {documents.map(doc => (
              <div 
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                  activeDoc === doc.id
                    ? 'bg-white/10 text-white' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{doc.filename}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                >
                  ×
                </button>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-slate-500 text-xs px-3 py-3 text-center border border-dashed border-border-dark rounded-lg">
                Upload a PDF to start
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Settings2 className="w-3 h-3" /> Pro AI Tools
          </div>
          <div className="space-y-1">
            {OTHER_MODES.map(mode => {
              const Icon = mode.icon;
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onSetMode(mode.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                    isActive 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
