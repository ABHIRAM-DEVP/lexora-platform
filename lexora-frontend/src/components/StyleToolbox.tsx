"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paintbrush, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, X, Layers } from 'lucide-react';

interface ColorOption {
  name: string;
  hex: string;
}

import { MediaResponse } from '@/types/api';

export interface StyleState {
  alignment: 'left' | 'center' | 'right';
  size: 'md' | 'xl';
  textColor: string;
  bgColor: string;
  case: 'normal' | 'upper' | 'lower';
  shadow: boolean;
  fontFamily: string;
  mediaLayout: 'parallax' | 'breakout' | 'marginalia' | 'masonry' | 'overlay' | 'grid';
}

export interface StyleToolboxProps {
  style: StyleState;
  updateStyle: (updates: Partial<StyleState>) => void;
  media?: MediaResponse[];
  selectedMediaIds?: string[];
  onReorderMedia?: (newIds: string[]) => void;
}

export default function StyleToolbox({ 
  style, 
  updateStyle, 
  media = [], 
  selectedMediaIds = [], 
  onReorderMedia 
}: StyleToolboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('TEXT');

  const applyToSelection = (command: string, value: string = '') => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, value);
    }
  };

  const textColors: ColorOption[] = [
    { name: 'Deep Slate', hex: '#1A202C' },
    { name: 'Snow White', hex: '#F8FAFC' },
    { name: 'Cobalt Ink', hex: '#1E3A8A' },
    { name: 'Evergreen', hex: '#14532D' },
    { name: 'Berry Jam', hex: '#831843' },
    { name: 'Burnt Sienna', hex: '#7C2D12' },
    { name: 'Electric Indigo', hex: '#3730A3' },
    { name: 'Gold Rush', hex: '#EAB308' },
  ];

  const bgColors: ColorOption[] = [
    { name: 'Pure Porcelain', hex: '#FCFCFC' },
    { name: 'Charcoal Grey', hex: '#212121' },
    { name: 'Steel Blue', hex: '#F0F4F8' },
    { name: 'Sage Tint', hex: '#F1F5F0' },
    { name: 'Blush Shell', hex: '#FFF5F5' },
    { name: 'Creamsicle', hex: '#FFF9F2' },
    { name: 'Dusty Rose', hex: '#FDF2F2' },
  ];

  return (
    <div className="relative w-full">
      
      {/* ADD STYLE BUTTON */}
      <div className="flex flex-col items-center gap-3 w-fit">
        <motion.button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center justify-center w-[72px] h-[72px] rounded-full bg-[#18181b] border-[3px] border-[#fbbf24]/30 transition-all duration-500 shadow-[0_0_30px_rgba(251,191,36,0.15)]"
          whileHover={{ scale: 1.05, borderColor: 'rgba(251,191,36,0.8)', boxShadow: '0 0 40px rgba(251,191,36,0.3)' }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Inner dark circle */}
          <div className="absolute inset-1 rounded-full bg-[#1f2937]" />
          
          <motion.div 
            className="relative z-10 flex items-center justify-center"
            animate={{ 
                rotate: [0, 5, -5, 0],
            }}
            transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }}
          >
            <Paintbrush size={28} className="text-[#fbbf24] stroke-[2.5px] drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          </motion.div>
          
          {/* Subtle glow ring */}
          <div className="absolute -inset-2 rounded-full bg-[#fbbf24]/10 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
        </motion.button>
        <div className="flex flex-col items-center text-center mt-1">
          <span className="text-[#fbbf24] font-bold tracking-[0.25em] text-[13px] uppercase drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">ADD STYLE</span>
        </div>
      </div>

      {/* TOOLBOX MODAL */}
      <AnimatePresence>
{isOpen && (
          <motion.div 
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed right-6 bottom-6 w-[90vw] h-[80vh] sm:w-[70vw] sm:h-[70vh] md:w-[50vw] md:h-[60vh] lg:w-[30vw] lg:h-[85vh] max-w-sm max-h-[85vh] bg-[#181818] border-2 border-yellow-400/30 rounded-3xl shadow-2xl z-[9999] text-white cursor-grab active:cursor-grabbing"
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-3 bg-[#0F0F0F] border-b border-yellow-400/10 rounded-t-2xl">
              <div className="flex gap-1 flex-1">
                {['TEXT', 'MEDIA', 'COLORS'].map((tab) => (
                  <motion.button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-2 text-xs font-bold transition-all uppercase tracking-wider rounded-xl ${
                      activeTab === tab 
                        ? 'bg-gradient-to-r from-yellow-500/20 border border-yellow-400 text-yellow-400 shadow-md' 
                        : 'text-gray-400 hover:text-gray-200 bg-[#181818]'
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    {tab}
                  </motion.button>
                ))}
              </div>
              <motion.button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 ml-2 rounded-full hover:bg-gray-700 transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} className="text-gray-400 hover:text-white" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-3 max-h-[calc(80vh-4rem)] overflow-auto">
              {activeTab === 'TEXT' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-gray-700/50 p-3 rounded-2xl bg-[#141414] shadow-sm">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 font-bold px-1">Align</h4>
                      <div className="flex gap-2">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => {
                              updateStyle({ alignment: align as StyleState['alignment'] });
                              applyToSelection('justify' + (align.charAt(0).toUpperCase() + align.slice(1)));
                            }}
                            className={`flex-1 flex items-center justify-center p-2 rounded-lg border transition-all ${
                              style.alignment === align 
                                ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-lg shadow-yellow-400/10' 
                                : 'border-gray-800 text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {align === 'left' && <AlignLeft size={16} />}
                            {align === 'center' && <AlignCenter size={16} />}
                            {align === 'right' && <AlignRight size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border border-gray-700/50 p-3 rounded-2xl bg-[#141414] shadow-sm">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 font-bold px-1">Size</h4>
                      <div className="flex gap-2">
                        {['md', 'xl'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              updateStyle({ size: size as StyleState['size'] });
                              applyToSelection('fontSize', size === 'xl' ? '6' : '4');
                            }}
                            className={`flex-1 p-2 rounded-lg border text-xs font-bold transition-all ${
                              style.size === size 
                                ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-lg shadow-yellow-400/10' 
                                : 'border-gray-800 text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {size.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-gray-700/50 p-3 rounded-2xl bg-[#141414] shadow-sm">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 font-bold px-1">Case</h4>
                      <div className="space-y-2">
                        {['normal', 'upper', 'lower'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateStyle({ case: c as StyleState['case'] })}
                            className={`w-full p-2 rounded-lg border text-[10px] text-left transition-all ${
                              style.case === c 
                                ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400' 
                                : 'border-gray-800 text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            <span className={c === 'upper' ? 'uppercase' : c === 'lower' ? 'lowercase' : ''}>
                              Sample {c}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border border-gray-700/50 p-3 rounded-2xl bg-[#141414] shadow-sm">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 font-bold px-1">Effect</h4>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => updateStyle({ shadow: true })}
                          className={`w-full p-3 rounded-lg border transition-all text-[10px] font-bold flex items-center gap-3 ${
                            style.shadow 
                              ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400' 
                              : 'border-gray-800 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <Layers size={14} />
                          <span>Shadow Effect ON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStyle({ shadow: false })}
                          className={`w-full p-3 rounded-lg border transition-all text-[10px] font-bold flex items-center gap-3 ${
                            !style.shadow 
                              ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400' 
                              : 'border-gray-800 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <Layers size={14} className="opacity-40" />
                          <span>Shadow Effect OFF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'MEDIA' && (
                <div className="space-y-6 pb-20">
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'parallax', name: 'Parallax', desc: '3D Scroll Effect' },
                      { id: 'breakout', name: 'Breakout', desc: 'Full Width Media' },
                      { id: 'marginalia', name: 'Sidebar', desc: 'Floating Images' },
                      { id: 'masonry', name: 'Masonry', desc: 'Adaptive Gallery' },
                      { id: 'overlay', name: 'Overlay UI', desc: 'Glassmorphism' }
                    ].map(({ id, name, desc }) => (
                      <div key={id} className="relative border border-gray-600 p-3 rounded-xl bg-[#1a1a1a] shadow-md hover:shadow-lg transition-all">
                        <span className="absolute -top-1 right-1 bg-gray-700 text-xs px-1 py-0.5 rounded text-yellow-400 font-mono font-bold">{id.slice(0,2).toUpperCase()}</span>
                        <h3 className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-2 font-semibold border-b border-gray-600 pb-1">{name}</h3>
                        <motion.button
                          type="button"
                          onClick={() => updateStyle({ mediaLayout: id as StyleState['mediaLayout'] })}
                          className={`premium-button w-full p-2 h-14 rounded-xl text-xs font-bold uppercase flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all duration-300 ${
                            style.mediaLayout === id 
                            ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' 
                            : 'bg-blue-500/10 border-blue-500/30 text-slate-300 hover:bg-blue-500/20'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ImageIcon size={14} />
                          <span>{desc}</span>
                        </motion.button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-yellow-400 mb-3 font-bold px-1 flex items-center gap-2">
                      <Layers size={12} />
                      <span>Position Media</span>
                    </h4>
                    <div className="space-y-2">
                      {selectedMediaIds.length === 0 && (
                        <p className="text-[11px] text-gray-500 italic px-2">Select media items from the workspace to reorder them here.</p>
                      )}
                      {selectedMediaIds.map((id, index) => {
                        const m = media.find(item => item.id === id);
                        if (!m) return null;
                        return (
                          <div key={id} className="flex items-center gap-3 p-2 bg-[#141414] border border-gray-800 rounded-xl hover:border-gray-600 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                              {index + 1}
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-[11px] font-bold truncate">{m.fileName}</p>
                              <p className="text-[9px] text-gray-500 uppercase">{m.fileType.split('/')[1]}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => {
                                  const newIds = [...selectedMediaIds];
                                  [newIds[index], newIds[index - 1]] = [newIds[index - 1], newIds[index]];
                                  onReorderMedia?.(newIds);
                                }}
                                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                              >
                                <Layers size={12} className="rotate-180" />
                              </button>
                              <button
                                type="button"
                                disabled={index === selectedMediaIds.length - 1}
                                onClick={() => {
                                  const newIds = [...selectedMediaIds];
                                  [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
                                  onReorderMedia?.(newIds);
                                }}
                                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                              >
                                <Layers size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

{activeTab === 'COLORS' && (
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-300 mb-1 px-1">Text</h4>
                    <div className="max-h-32 overflow-auto space-y-2 pr-1 custom-scrollbar">
                      {textColors.map((c) => (
                        <motion.div 
                          key={c.hex}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                            style.textColor === c.hex 
                              ? 'bg-gradient-to-r from-yellow-500/30 border-2 border-yellow-400 shadow-lg ring-2 ring-yellow-400/50' 
                              : 'bg-slate-800/50 border border-gray-600 hover:border-gray-400'
                          }`}
                          onClick={() => {
                            updateStyle({ textColor: c.hex });
                            applyToSelection('foreColor', c.hex);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-10 h-10 rounded-xl border-2 shadow-lg" style={{ backgroundColor: c.hex }} />
                          <div>
                            <div className="font-bold text-sm tracking-wide">{c.name}</div>
                            <div className="font-mono text-xs opacity-80">{c.hex}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-300 mb-1 px-1">Background</h4>
                    <div className="max-h-32 overflow-auto space-y-2 pr-1 custom-scrollbar">
                      {bgColors.map((c) => (
                        <motion.div 
                          key={c.hex}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                            style.bgColor === c.hex 
                              ? 'bg-gradient-to-r from-yellow-500/30 border-2 border-yellow-400 shadow-lg ring-2 ring-yellow-400/50' 
                              : 'bg-slate-800/50 border border-gray-600 hover:border-gray-400'
                          }`}
                          onClick={() => updateStyle({ bgColor: c.hex })}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-10 h-10 rounded-xl border-2 shadow-lg" style={{ backgroundColor: c.hex }} />
                          <div>
                            <div className="font-bold text-sm tracking-wide">{c.name}</div>
                            <div className="font-mono text-xs opacity-80">{c.hex}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                  </div>
                </div>
              )}

              {/* Live Preview */}
              <div className="mt-3 pt-2 border-t border-gray-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-2 text-center">Preview</h4>
                <motion.div 
                  className={`w-full p-3 rounded-xl border-2 border-gray-600 shadow-lg ${style.shadow ? 'shadow-lg shadow-black/30 ring-1 ring-black/20' : ''}`}
                  style={{ 
                    backgroundColor: style.bgColor,
                    color: style.textColor
                  }}
                  animate={{ scale: style.shadow ? 1.01 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`text-xs font-bold text-${style.alignment} p-2 rounded transition-all ${style.case === 'upper' ? 'uppercase tracking-widest' : style.case === 'lower' ? 'lowercase italic tracking-wide' : 'tracking-wide'}`}>
                    Style Preview
                    <br />
                    <span className="text-[10px] opacity-80 mt-1 block">
                      Live updates applied
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

