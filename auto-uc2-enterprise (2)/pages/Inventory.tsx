
import React, { useState } from 'react';
import { Card, Button, Badge, Table, Input } from '../components/UI';
import { MOCK_VEHICLES } from '../constants';
import { Plus, Filter, Search, Edit2, Trash2, Eye, Globe, Sparkles, X, ExternalLink, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export const Inventory: React.FC = () => {
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ text: string, links: { web: { uri: string, title: string } }[] } | null>(null);

  const performMarketAnalysis = async (vehicle: typeof MOCK_VEHICLES[0]) => {
    setAnalyzing(vehicle.id);
    try {
      // Use process.env.API_KEY directly for initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Research the current market value for a ${vehicle.year} ${vehicle.make} ${vehicle.model}. Compare it to our listing price of $${vehicle.price}. Is our price competitive? Provide a brief summary and mention current trends.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const links = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as any[];
      setAnalysisResult({
        text: response.text || "No analysis generated.",
        links: links.filter(l => l.web).map(l => l)
      });
    } catch (error) {
      console.error(error);
      setAnalysisResult({ text: "Market analysis unavailable. Please check connectivity.", links: [] });
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Vehicle Fleet</h1>
          <p className="text-zinc-500 font-medium">Manage your active listings and stock status.</p>
        </div>
        <Button className="shadow-lg shadow-zinc-800/20">
          <Plus size={18} /> Add New Vehicle
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by Make, Model, or VIN..." 
              className="w-full pl-10 pr-4 py-2 bg-zinc-100 rounded-lg text-sm border-transparent border-2 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="border border-zinc-200">
              <Filter size={18} /> Filters
            </Button>
            <Button variant="ghost" className="border border-zinc-200">
              Sort by Price
            </Button>
          </div>
        </div>

        <Table headers={['Vehicle Info', 'Price Analysis', 'Mileage', 'Price', 'Status', 'Actions']}>
          {MOCK_VEHICLES.map(v => (
            <tr key={v.id} className="border-b border-zinc-50 group hover:bg-zinc-50/50 transition-colors">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded-md overflow-hidden bg-zinc-100">
                    <img src={v.images?.[0] || v.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70'} className="w-full h-full object-cover" alt={v.model} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">{v.make} {v.model}</p>
                    <p className="text-xs text-zinc-400 font-medium">{v.year}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <button 
                  onClick={() => performMarketAnalysis(v)}
                  disabled={analyzing === v.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100 disabled:opacity-50"
                >
                  {analyzing === v.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  Market Check
                </button>
              </td>
              <td className="px-4 py-4 text-sm text-zinc-600 font-semibold">{v.mileage.toLocaleString()} km</td>
              <td className="px-4 py-4 text-sm font-black text-zinc-900">${v.price.toLocaleString()}</td>
              <td className="px-4 py-4">
                <Badge variant={(v.status === 'Available' || v.status === 'Disponible') ? 'success' : v.status === 'Sold' ? 'error' : 'warning'}>
                  {v.status}
                </Badge>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-1">
                  <button className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"><Eye size={16} /></button>
                  <button className="p-2 text-zinc-400 hover:text-amber-500 transition-colors"><Edit2 size={16} /></button>
                  <button className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Analysis Modal */}
      {analysisResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Globe size={20} />
                </div>
                <h2 className="text-xl font-black text-zinc-900">Market Intelligence Verdict</h2>
              </div>
              <button onClick={() => setAnalysisResult(null)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-700 leading-relaxed text-sm">
                {analysisResult.text}
              </div>

              {analysisResult.links.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-widest mb-3">Sources & Comparisons</h4>
                  <div className="space-y-2">
                    {analysisResult.links.map((link, i) => (
                      <a 
                        key={i} 
                        href={link.web.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 border border-zinc-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 group transition-all"
                      >
                        <span className="text-sm font-semibold text-zinc-600 group-hover:text-blue-700 truncate mr-4">
                          {link.web.title || link.web.uri}
                        </span>
                        <ExternalLink size={14} className="text-zinc-400 group-hover:text-blue-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => setAnalysisResult(null)} className="w-full py-3">
                Got it, thanks
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
