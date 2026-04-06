import React, { useState } from 'react';
import { Image as ImageIcon, Wand2, Download, Loader2 } from 'lucide-react';

export default function ImageGenView() {
  const [prompt, setPrompt] = useState(() => localStorage.getItem("docmind_image_prompt") || "");
  const [image, setImage] = useState(() => localStorage.getItem("docmind_image_data") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/tools/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setImage(data.image_data);
      localStorage.setItem("docmind_image_data", data.image_data);
      localStorage.setItem("docmind_image_prompt", prompt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-dark p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <ImageIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Image Generation</h2>
            <p className="text-slate-400">Generate diagrams, charts, and art using Stable Diffusion on HuggingFace.</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="mb-10 relative">
          <input 
            type="text" 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="E.g., A minimalist flowchart showing machine learning architecture, blue and teal colors" 
            className="w-full bg-bg-panel border border-border-dark rounded-xl pl-6 pr-32 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-xl"
          />
          <button 
            type="submit" 
            disabled={!prompt.trim() || loading}
            className="absolute right-2 top-2 bottom-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-6 flex items-center gap-2 font-medium disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Generate
          </button>
        </form>

        {error && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl mb-6">{error}</div>}

        <div className="glass rounded-2xl min-h-[400px] flex items-center justify-center p-4 border border-border-dark/60 shadow-2xl relative overflow-hidden group">
          {loading && (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
              <p className="text-purple-400 font-medium animate-pulse">Rendering image...</p>
            </div>
          )}
          {!loading && !image && !error && (
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Your generated image will appear here</p>
            </div>
          )}
          {image && !loading && (
            <>
              <img src={image} alt={prompt} className="max-w-full max-h-[600px] object-contain rounded-xl shadow-2xl animate-fade-in" />
              
              <div className="absolute bottom-6 right-6 flex gap-2">
                <a 
                  href={image} 
                  download={`docmind-ai-image-${Date.now()}.jpg`}
                  className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-medium transition-all shadow-lg backdrop-blur-sm transform hover:scale-105"
                  title="Download Image"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span className="text-sm">Download Image</span>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
