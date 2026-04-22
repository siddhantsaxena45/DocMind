import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Share2, Loader2, Workflow, Activity, MousePointer2, RefreshCw, X } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';

export default function GraphView({ documentId, userId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  const containerRef = useRef(null);
  const fgRef = useRef(null);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        // Ensure we have a minimum height to avoid invisible graphs
        setDimensions({ 
          width: width || 800, 
          height: Math.max(height, 500) 
        });
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleGenerate = async (force = false) => {
    if (!documentId) return;
    setLoading(true);
    setSelectedItem(null);
    try {
      const res = await fetch(`http://localhost:8000/document/${documentId}/graph?user_id=${encodeURIComponent(userId)}&force=${force ? 'true' : 'false'}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail);
      
      const rawData = json.graph || [];
      const nodes = [];
      const links = [];
      const nodeIds = new Set();

      rawData.forEach(item => {
        if (!nodeIds.has(item.source)) {
          nodes.push({ id: item.source, name: item.source });
          nodeIds.add(item.source);
        }
        if (!nodeIds.has(item.target)) {
          nodes.push({ id: item.target, name: item.target });
          nodeIds.add(item.target);
        }
        links.push({
          source: item.source,
          target: item.target,
          relation: item.relation,
          confidence: item.confidence,
          evidence: item.evidence
        });
      });

      setGraphData({ nodes, links });
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 50);
        }
      }, 500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId && userId) {
      handleGenerate(false);
    }
  }, [documentId, userId]);

  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHovered = hoveredNode === node;
    const isSelected = selectedItem === node || 
                       (selectedItem && (selectedItem.source?.id === node.id || selectedItem.target?.id === node.id));
    
    const size = isHovered || isSelected ? 8 : 6;
    const color = isSelected ? '#6366f1' : (isHovered ? '#818cf8' : '#1e1b4b');
    const borderColor = isHovered || isSelected ? '#a5b4fc' : '#334155';

    if (isHovered || isSelected) {
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 15;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.5 / globalScale;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    const label = node.name;
    const fontSize = 11 / globalScale;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);
    
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y + size + 2, bckgDimensions[0], bckgDimensions[1], 4 / globalScale);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHovered || isSelected ? '#ffffff' : '#94a3b8';
    ctx.fillText(label, node.x, node.y + size + 2 + bckgDimensions[1]/2);
  }, [hoveredNode, selectedItem]);

  const paintLink = useCallback((link, ctx, globalScale) => {
    const start = link.source;
    const end = link.target;
    if (typeof start !== 'object' || typeof end !== 'object') return;

    const isHovered = hoveredLink === link || hoveredNode === start || hoveredNode === end;
    const isSelected = selectedItem === link;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = isSelected ? 'rgba(99, 102, 241, 0.8)' : (isHovered ? 'rgba(165, 180, 252, 0.5)' : 'rgba(71, 85, 105, 0.3)');
    ctx.lineWidth = isSelected || isHovered ? 2 / globalScale : 1 / globalScale;
    ctx.stroke();

    const label = link.relation;
    if (label && globalScale > 0.8) {
      const fontSize = 8 / globalScale;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      const midPos = { x: start.x + (end.x - start.x) / 2, y: start.y + (end.y - start.y) / 2 };
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

      ctx.save();
      ctx.translate(midPos.x, midPos.y);
      let angle = Math.atan2(end.y - start.y, end.x - start.x);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
      ctx.rotate(angle);

      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.beginPath();
      ctx.roundRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], 2 / globalScale);
      ctx.fill();
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isSelected ? '#a5b4fc' : (isHovered ? '#818cf8' : '#475569');
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }, [hoveredLink, hoveredNode, selectedItem]);

  if (!documentId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5">
          <Share2 className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">Knowledge Network</h3>
        <p className="text-sm max-w-xs leading-relaxed">Select a document to visualize the semantic map of concepts and entities.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full p-4 md:p-10 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-8 border-b border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Share2 className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em]">Knowledge Extraction</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Interactive Graph</h2>
          <p className="text-slate-400 mt-2 text-sm">Physics-simulated map of entity relationships and core document themes.</p>
        </div>
        
        <button 
          onClick={() => handleGenerate(true)} 
          disabled={loading}
          className="btn-ghost flex items-center gap-2 text-xs font-bold uppercase tracking-wider h-11"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <RefreshCw className="w-4 h-4" />}
          {graphData.nodes.length > 0 ? "Rebuild Network" : "Generate Graph"}
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 relative">
        <div ref={containerRef} className="flex-1 glass-card bg-slate-950/20 relative overflow-hidden group min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm z-50 rounded-2xl">
               <div className="text-center p-6">
                 <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-6" />
                 <p className="text-indigo-400 text-sm md:text-lg font-bold animate-pulse uppercase tracking-widest">Processing Entities...</p>
               </div>
            </div>
          )}

          {!loading && graphData.nodes.length === 0 && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 p-10 text-center text-sm">
              Click 'Generate Graph' to visualize concepts.
            </div>
          )}

          {error && <div className="absolute inset-0 flex items-center justify-center text-red-400 p-10 text-center text-sm">{error}</div>}

          {graphData.nodes.length > 0 && (
            <div className="w-full h-full">
              <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeCanvasObject={paintNode}
                linkCanvasObject={paintLink}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={d => d === hoveredLink || d === selectedItem ? 0.01 : 0.003}
                linkDirectionalParticleWidth={d => d === hoveredLink || d === selectedItem ? 2.5 : 1}
                linkDirectionalParticleColor={() => '#6366f1'}
                onNodeHover={setHoveredNode}
                onLinkHover={setHoveredLink}
                onNodeClick={node => setSelectedItem(node)}
                onLinkClick={link => setSelectedItem(link)}
                onBackgroundClick={() => setSelectedItem(null)}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
              />
            </div>
          )}

          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex items-center gap-4 md:gap-6 pointer-events-none">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Entities</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-6 h-[1px] bg-slate-800"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Connections</span>
             </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedItem && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute inset-x-0 bottom-0 md:relative md:inset-auto w-full md:w-96 glass-card p-6 md:p-8 flex flex-col shrink-0 z-20 max-h-[60%] md:max-h-full overflow-hidden shadow-2xl"
            >
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <MousePointer2 className="w-4 h-4 text-indigo-400" /> Inspector
                  </h3>
                  <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
               </div>

               {selectedItem.relation ? (
                 <div className="space-y-6 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                       <div className="text-[9px] uppercase font-black text-indigo-400 mb-2 tracking-widest">Semantic Link</div>
                       <div className="text-[14px] font-bold text-slate-200 leading-snug">
                         {selectedItem.source.name} <span className="text-indigo-400 font-black px-1.5 opacity-80">→</span> {selectedItem.relation} <span className="text-indigo-400 font-black px-1.5 opacity-80">→</span> {selectedItem.target.name}
                       </div>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Confidence Score</div>
                        <div className="text-xs font-black text-indigo-400">{selectedItem.confidence}%</div>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedItem.confidence}%` }}
                          className="bg-linear-to-r from-indigo-600 to-indigo-400 h-full shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Extracted Evidence</div>
                      <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 text-[13px] text-slate-400 italic leading-relaxed relative">
                        <Workflow className="absolute -top-3 -right-1 w-6 h-6 text-white/5" />
                        "{selectedItem.evidence || "Direct thematic link identified within the source material."}"
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="p-6 bg-indigo-500/5 rounded-3xl border border-white/5 text-center relative overflow-hidden group">
                       <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       <Workflow className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
                       <div className="text-xl font-bold text-white mb-1 truncate px-4">{selectedItem.name}</div>
                       <div className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Document Concept</div>
                    </div>
                    <p className="text-slate-400 text-[13px] leading-relaxed">
                      This concept serves as a significant node within the document structure. Explore connected themes to understand its broader contextual implications.
                    </p>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


