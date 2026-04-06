import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Share2, Loader2, Workflow, Download, Activity, MousePointer2 } from 'lucide-react';

export default function GraphView({ documentId, userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Physics states
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const svgRef = useRef(null);

  const handleGenerate = async (force = false) => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/document/${documentId}/graph?user_id=${encodeURIComponent(userId)}&force=${force ? 'true' : 'false'}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail);
      
      const rawData = json.graph || [];
      setData(rawData);
      initializeSimulation(rawData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Basic Force-Directed Placement Logic
  const initializeSimulation = (rawData) => {
    const nodeMap = {};
    const processedLinks = [];

    rawData.forEach(item => {
      if (!nodeMap[item.source]) nodeMap[item.source] = { id: item.source, x: Math.random() * 800, y: Math.random() * 500, type: 'source' };
      if (!nodeMap[item.target]) nodeMap[item.target] = { id: item.target, x: Math.random() * 800, y: Math.random() * 500, type: 'target' };
      processedLinks.push({
        source: item.source,
        target: item.target,
        relation: item.relation,
        confidence: item.confidence,
        evidence: item.evidence
      });
    });

    const initialNodes = Object.values(nodeMap);
    setNodes(initialNodes);
    setLinks(processedLinks);
  };

  // Simple Physics Tick (Run several times to stabilize)
  useEffect(() => {
    if (nodes.length === 0 || loading) return;

    let iterations = 120;
    let currentNodes = [...nodes];
    const width = 800;
    const height = 500;

    const tick = () => {
      const newNodes = currentNodes.map(node => ({ ...node, vx: 0, vy: 0 }));
      
      // Repulsion (Coulomb's Law)
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          const dx = newNodes[i].x - newNodes[j].x;
          const dy = newNodes[i].y - newNodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 12000 / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          newNodes[i].vx += fx;
          newNodes[i].vy += fy;
          newNodes[j].vx -= fx;
          newNodes[j].vy -= fy;
        }
      }

      // Attraction (Hooke's Law)
      links.forEach(link => {
        const s = newNodes.find(n => n.id === link.source);
        const t = newNodes.find(n => n.id === link.target);
        if (!s || !t) return;
        const dx = s.x - t.x;
        const dy = s.y - t.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const strength = 0.08;
        const force = (distance - 150) * strength;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        s.vx -= fx;
        s.vy -= fy;
        t.vx += fx;
        t.vy += fy;
      });

      // Update positions & bounds
      currentNodes = newNodes.map(node => ({
        ...node,
        x: Math.max(50, Math.min(width - 50, node.x + node.vx)),
        y: Math.max(50, Math.min(height - 50, node.y + node.vy))
      }));
    };

    while (iterations--) tick();
    setNodes(currentNodes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links.length, loading]);

  useEffect(() => {
    if (documentId && userId) {
      handleGenerate(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, userId]);

  if (!documentId) return <div className="p-8 text-slate-400">Select a document first.</div>;

  return (
    <div className="p-4 md:p-8 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Share2 className="w-8 h-8 text-cyan-400" /> Interactive Knowledge Graph
          </h2>
          <p className="text-slate-400">Physics-simulated relationship map. Drag & explore.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleGenerate(true)} 
            disabled={loading}
            className="glass-button px-6 py-3 rounded-xl flex items-center gap-2 bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all font-bold"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
            {data.length > 0 ? "Rebuild Graph" : "Generate Graph"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
        {/* Main Graph Component */}
        <div className="flex-1 glass rounded-2xl border-white/5 bg-slate-950/20 relative overflow-hidden group">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm z-50 rounded-2xl">
               <div className="text-center">
                 <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
                 <p className="text-cyan-400 text-lg font-bold animate-pulse">Running Physics Simulation...</p>
                 <p className="text-slate-500 text-sm mt-1">Extracting entities & links...</p>
               </div>
            </div>
          )}

          {!loading && nodes.length === 0 && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 p-10 text-center">
              Click 'Generate Graph' to visualize the core concepts detected in this document.
            </div>
          )}

          {error && <div className="absolute inset-0 flex items-center justify-center text-red-400 p-10 text-center">{error}</div>}

          <svg 
            ref={svgRef}
            viewBox="0 0 800 500" 
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#1e293b" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Links */}
            {links.map((link, i) => {
              const s = nodes.find(n => n.id === link.source);
              const t = nodes.find(n => n.id === link.target);
              if (!s || !t) return null;
              
              const isHighlighted = hoveredNode === s.id || hoveredNode === t.id || selectedItem === link;

              return (
                <g key={`link-${i}`} onClick={() => setSelectedItem(link)} className="cursor-pointer">
                  <line 
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y} 
                    stroke={isHighlighted ? "#06b6d4" : "#334155"} 
                    strokeWidth={isHighlighted ? 3 : 1}
                    className="transition-all duration-300"
                    opacity={hoveredNode && !isHighlighted ? 0.2 : 0.6}
                  />
                  <rect 
                    x={(s.x + t.x) / 2 - 40} y={(s.y + t.y) / 2 - 10} 
                    width="80" height="20" rx="4"
                    fill="#0f172a" stroke="#1e293b" strokeWidth="1"
                    opacity={hoveredNode && !isHighlighted ? 0 : 1}
                  />
                  <text 
                    x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 + 4} 
                    textAnchor="middle" 
                    fill={isHighlighted ? "#67e8f9" : "#94a3b8"} 
                    fontSize="9" fontWeight="bold" 
                    opacity={hoveredNode && !isHighlighted ? 0 : 1}
                  >
                    {link.relation}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node, i) => {
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedItem?.id === node.id || selectedItem?.source === node.id || selectedItem?.target === node.id;

              return (
                <g 
                  key={`node-${i}`} 
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedItem(node)}
                  className="cursor-pointer"
                >
                  <circle 
                    cx={node.x} cy={node.y} 
                    r={isHovered ? 24 : 18} 
                    fill="#0f172a" 
                    stroke={isSelected || isHovered ? "#06b6d4" : "#1e293b"} 
                    strokeWidth="3"
                    className="transition-all duration-300"
                    filter="url(#glow)"
                  />
                  <text 
                    x={node.x} y={node.y + 35} 
                    textAnchor="middle" 
                    fill={isHovered || isSelected ? "#fff" : "#94a3b8"} 
                    fontSize={isHovered ? "12" : "11"} 
                    fontWeight="bold"
                    className="transition-all pointer-events-none"
                  >
                    {node.id.length > 20 ? node.id.substring(0, 17) + '...' : node.id}
                  </text>
                  <circle cx={node.x} cy={node.y} r={6} fill={isHovered ? "#06b6d4" : "#083344"} />
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-6 left-6 flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
                <span className="text-xs text-slate-400">Entity Nodes</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-10 h-px bg-slate-700"></div>
                <span className="text-xs text-slate-400">AI Relation</span>
             </div>
          </div>
        </div>

        {/* Evidence Side Panel */}
        <div className={`w-full md:w-80 glass border-white/5 p-6 rounded-2xl flex flex-col transition-all duration-500 ${selectedItem ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
           {selectedItem && (
             <div className="flex flex-col h-full animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-cyan-400" /> Details
                  </h3>
                  <button onClick={() => setSelectedItem(null)} className="text-slate-500 hover:text-white text-xs px-2 py-1 bg-white/5 rounded">Close</button>
                </div>

                {selectedItem.relation ? (
                  /* Link Details */
                  <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                    <div className="space-y-4">
                      <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/40">
                         <div className="text-[10px] uppercase font-black text-cyan-500 mb-1">Relationship</div>
                         <div className="text-sm font-bold text-slate-200">
                           {selectedItem.source} <span className="text-cyan-400">is {selectedItem.relation}</span> {selectedItem.target}
                         </div>
                      </div>
                      
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">AI Confidence</div>
                          <div className="text-xs font-bold text-emerald-400">{selectedItem.confidence}%</div>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${selectedItem.confidence}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] uppercase font-black text-slate-500">Source Evidence</div>
                      <div className="p-4 bg-bg-panel rounded-xl border border-white/5 text-xs text-slate-300 italic leading-relaxed relative">
                        <span className="absolute -top-3 -left-1 text-3xl text-cyan-500/20 font-serif">“</span>
                        {selectedItem.evidence || "Direct relationship inferred from document context."}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Node Details */
                  <div className="space-y-6">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-center">
                       <Workflow className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                       <div className="text-lg font-bold text-white mb-1">{selectedItem.id}</div>
                       <div className="text-xs text-slate-500 uppercase font-black tracking-widest">Document Entity</div>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      This entity was identified as a core component of your document. Use the graph to explore its direct and indirect relationships with other themes.
                    </p>
                  </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
