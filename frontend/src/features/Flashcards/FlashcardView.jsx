import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

export default function FlashcardView({ documentId, userId }) {
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async (force = false) => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/document/${documentId}/flashcards?user_id=${encodeURIComponent(userId)}&force=${force ? 'true' : 'false'}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail);
      setCards(json.flashcards);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCards(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setError(null);
    if (documentId && userId) {
      // Auto-load cached flashcards (if any)
      handleGenerate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, userId]);

  const nextCard = () => {
    if (cards && currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  if (!documentId) return <div className="p-8 text-slate-400">Select a document first.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
       <div className="flex justify-between items-center mb-10 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-yellow-500" /> Study Flashcards
          </h2>
          <p className="text-slate-400">Auto-generated Q&A to help you master the document content.</p>
        </div>
        {!cards && (
          <button 
            onClick={() => handleGenerate(true)} 
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white shadow-[0_0_15px_rgba(202,138,4,0.4)] px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate Flashcards
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl mb-6 shrink-0">{error}</div>}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
          <p className="text-yellow-400 animate-pulse">Generating study materials...</p>
        </div>
      )}

      {cards && cards.length > 0 && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative animate-fade-in w-full max-w-2xl mx-auto">
          
          <div className="text-slate-500 font-bold mb-6 tracking-widest text-sm">
            CARD {currentIndex + 1} OF {cards.length}
          </div>

          {/* Perspective Container for 3D Flip */}
          <div 
            className="w-full h-80 relative cursor-pointer group perspective-[1000px]"
            onClick={() => setIsFlipped(!isFlipped)}
          >
             <div className={`w-full h-full transition-transform duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
               
               {/* Front */}
               <div className="absolute inset-0 backface-hidden glass rounded-3xl p-8 flex flex-col items-center justify-center text-center border-t border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-linear-to-br from-bg-panel to-bg-dark" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="text-yellow-500 font-bold uppercase tracking-wider text-xs mb-4">Question</div>
                  <h3 className="text-2xl font-bold text-slate-100 leading-snug">{cards[currentIndex].question}</h3>
                  <div className="absolute bottom-6 text-slate-500 text-sm flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    Click to flip
                  </div>
               </div>

               {/* Back */}
               <div className="absolute inset-0 backface-hidden glass rounded-3xl p-8 flex flex-col items-center text-center justify-center border-t border-yellow-500/30 shadow-[0_20px_50px_rgba(202,138,4,0.15)] bg-linear-to-br from-yellow-900/20 to-bg-dark transform rotate-y-180" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <div className="text-yellow-400 font-bold uppercase tracking-wider text-xs mb-4">Answer</div>
                  <p className="text-xl text-slate-200 leading-relaxed font-medium">{cards[currentIndex].answer}</p>
               </div>
             </div>
          </div>

          <div className="flex justify-between w-full mt-10">
            <button 
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="p-4 rounded-full glass-button disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </button>
            
            <button 
              onClick={nextCard}
              disabled={currentIndex === cards.length - 1}
              className="p-4 rounded-full glass-button disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
