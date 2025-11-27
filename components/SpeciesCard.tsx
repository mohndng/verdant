
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SpeciesData, RelatedSpecies } from '../types';
import { Reveal } from './Reveal';
import { fetchRelatedSpecies } from '../services/geminiService';
import { getWeatherDescription } from '../services/openMeteoService';

interface SpeciesCardProps {
  data: SpeciesData;
  onSave?: (data: SpeciesData) => void;
  isSaved?: boolean;
  onRelatedClick?: (query: string) => void;
}

const Badge = ({ text, color = 'bg-stone-100 text-stone-600' }: { text: string, color?: string }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${color}`}>
      {text}
    </span>
);

const BentoBox = ({ title, children, className = '', delay = 0 }: { title?: string, children?: React.ReactNode, className?: string, delay?: number }) => (
    <Reveal delay={delay} className={`bg-stone-50/50 backdrop-blur-sm p-6 rounded-3xl border border-stone-100 hover:border-moss-200 hover:bg-white/60 transition-all duration-300 ${className}`}>
        {title && (
             <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-moss-400"></span>
                {title}
            </h4>
        )}
        {children}
    </Reveal>
);

export const SpeciesCard: React.FC<SpeciesCardProps> = ({ data, onSave, isSaved, onRelatedClick }) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [relatedSpecies, setRelatedSpecies] = useState<RelatedSpecies[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load related species
  useEffect(() => {
    const loadRelated = async () => {
        setLoadingRelated(true);
        setRelatedSpecies([]);
        try {
            const related = await fetchRelatedSpecies(data.commonName, data.family);
            setRelatedSpecies(related);
        } catch (e) {
            console.error("Failed related load", e);
        } finally {
            setLoadingRelated(false);
        }
    };

    if (data.commonName) {
        loadRelated();
    }
  }, [data.commonName, data.family]);

  const isPlant = data.kingdom === 'Plantae';
  const isFungi = data.kingdom === 'Fungi';
  const isAnimal = data.kingdom === 'Animalia';

  const labels = {
    movement: isPlant || isFungi ? 'Growth & Spread' : 'Movement',
    migration: isPlant || isFungi ? 'Dispersal' : 'Migration',
    sleep: isPlant || isFungi ? 'Dormancy' : 'Sleep',
    reproduction: isPlant ? 'Pollination' : isFungi ? 'Spore Release' : 'Reproduction',
    diet: isPlant ? 'Requirements' : isFungi ? 'Substrate' : 'Diet',
  };

  return (
    <div className="w-full mx-auto animate-fade-in pb-20">
      
      {/* --- SPLIT LAYOUT CONTAINER --- */}
      <div className="lg:flex lg:gap-12 relative items-start">
        
        {/* --- LEFT: STICKY VISUALS --- */}
        <div className="lg:w-5/12 lg:sticky lg:top-32 lg:h-[calc(100vh-8rem)] flex flex-col gap-6 mb-12 lg:mb-0">
             
             {/* Main Image Card */}
             <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-stone-200/50 group cursor-pointer border-4 border-white" onClick={() => data.imageUrl && setFullscreenImage(data.imageUrl)}>
                {data.imageUrl ? (
                    <img 
                        src={data.imageUrl} 
                        alt={data.commonName} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400 text-6xl font-serif">
                        {data.commonName.charAt(0)}
                    </div>
                )}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                {/* Floating Action Button */}
                {onSave && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSave(data); }}
                        className="absolute top-6 right-6 p-4 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white hover:text-moss-700 transition-all shadow-lg z-20"
                        title={isSaved ? "Saved" : "Save"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                    </button>
                )}
             </div>

             {/* Quick Stats Row */}
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm flex flex-col justify-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Status</span>
                     <span className={`font-serif font-bold text-lg leading-none ${data.conservationStatus?.includes('Endangered') ? 'text-amber-600' : 'text-moss-700'}`}>
                         {data.conservationStatus}
                     </span>
                 </div>
                 <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm flex flex-col justify-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Family</span>
                     <span className="font-serif font-bold text-lg leading-none text-stone-800 truncate" title={data.family}>
                         {data.family}
                     </span>
                 </div>
             </div>

             {/* Mini Gallery Preview */}
             {data.galleryImages && data.galleryImages.length > 0 && (
                 <div className="grid grid-cols-4 gap-3">
                     {data.galleryImages.slice(0, 4).map((img, i) => (
                         <div key={i} className="aspect-square rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-white shadow-sm" onClick={() => setFullscreenImage(img)}>
                             <img src={img} className="w-full h-full object-cover" loading="lazy" />
                         </div>
                     ))}
                 </div>
             )}

        </div>

        {/* --- RIGHT: SCROLLABLE CONTENT --- */}
        <div className="lg:w-7/12 mt-8 lg:mt-0 space-y-10">
            
            {/* Header */}
            <div className="space-y-4">
                <div className="flex gap-3">
                    <Badge text={data.kingdom} color="bg-moss-100 text-moss-800" />
                    {data.firstNamedBy && <Badge text={data.firstNamedBy.split('(')[0]} />}
                </div>
                <h1 className="font-serif text-5xl md:text-7xl font-bold text-stone-900 leading-[0.9] tracking-tight">
                    {data.commonName}
                </h1>
                <p className="font-serif text-2xl italic text-stone-500 font-light">
                    {data.scientificName}
                </p>
                <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-2xl border-l-4 border-moss-300 pl-6 py-1">
                    {data.description}
                </p>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Origin Card */}
                <BentoBox title="Roots" className="md:col-span-2">
                     <div className="flex flex-col md:flex-row gap-8">
                         <div className="flex-1">
                             <div className="text-sm text-stone-500 mb-1">Native To</div>
                             <div className="text-lg font-medium text-stone-800">{data.ancestralHome}</div>
                         </div>
                         <div className="flex-1">
                             <div className="text-sm text-stone-500 mb-1">Current Range</div>
                             <div className="text-lg font-medium text-stone-800">{data.nativeRange}</div>
                         </div>
                     </div>
                </BentoBox>
                
                {/* Discovery Section */}
                <BentoBox title="Discovery" className="md:col-span-2 bg-stone-100/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="text-sm text-stone-400 mb-1">First Described</div>
                            <div className="font-medium text-stone-800 text-lg">{data.firstNamedBy}</div>
                        </div>
                        <div>
                            <div className="text-sm text-stone-400 mb-1">Etymology</div>
                            <div className="font-medium text-stone-800 italic">"{data.etymology}"</div>
                        </div>
                    </div>
                </BentoBox>

                <BentoBox title={labels.diet}>
                    <p className="text-stone-700 leading-relaxed">{data.diet}</p>
                </BentoBox>

                <BentoBox title={labels.movement}>
                    <p className="text-stone-700 leading-relaxed">{data.movement}</p>
                </BentoBox>

                {/* Survival & Defense */}
                <BentoBox title="Survival Strategy">
                     <div className="space-y-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Defense</span>
                            <p className="text-stone-700 mt-1">{data.defense}</p>
                        </div>
                        {data.toxin && data.toxin !== 'None' && data.toxin !== 'Unknown' && (
                             <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-red-400">Toxicity</span>
                                <p className="text-stone-700 mt-1">{data.toxin}</p>
                            </div>
                        )}
                     </div>
                </BentoBox>

                {/* Symbiosis & Habits */}
                <BentoBox title="Symbiosis & Sleep">
                     <div className="space-y-4">
                        <div>
                             <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Partners</span>
                             <p className="text-stone-700 mt-1">{data.symbiotic}</p>
                        </div>
                        <div>
                             <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{labels.sleep}</span>
                             <p className="text-stone-700 mt-1">{data.sleep}</p>
                        </div>
                     </div>
                </BentoBox>

                {/* Weather/Live Widget */}
                {data.weatherData && (
                    <BentoBox className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Live Habitat
                            </h4>
                            <span className="text-2xl">{data.weatherData.isDay ? '☀️' : '🌙'}</span>
                        </div>
                        <div className="text-4xl font-serif font-bold text-stone-800 mb-1">
                            {Math.round(data.weatherData.temp)}°C
                        </div>
                        <div className="text-sm text-stone-500 font-medium mb-4">
                            {getWeatherDescription(data.weatherData.conditionCode)}
                        </div>
                        <div className="text-xs text-stone-400 border-t border-blue-100 pt-3">
                            Observed in <span className="font-semibold text-stone-600">{data.weatherData.location}</span>
                        </div>
                    </BentoBox>
                )}

                {/* Audio Widget (Conditional) */}
                {isAnimal && data.audioUrl && (
                    <BentoBox className="bg-stone-900 text-stone-300 border-stone-800">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-moss-400 mb-4 flex items-center gap-2">
                            Audio Recording
                        </h4>
                        <div className="mb-4">
                            <p className="text-white italic font-serif text-lg">"{data.sound}"</p>
                        </div>
                        <audio controls className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity">
                            <source src={data.audioUrl} type="audio/mpeg" />
                        </audio>
                        <p className="text-[10px] text-stone-500 mt-2 text-right">Source: Xeno-canto</p>
                    </BentoBox>
                )}

                <BentoBox title="Ecology" className="md:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-stone-400 mb-1">Lifespan</div>
                            <div className="font-medium text-stone-800">{data.lifespan}</div>
                        </div>
                        <div>
                            <div className="text-sm text-stone-400 mb-1">Size</div>
                            <div className="font-medium text-stone-800">{data.size}</div>
                        </div>
                         <div>
                            <div className="text-sm text-stone-400 mb-1">Weight/Max</div>
                            <div className="font-medium text-stone-800">{data.recordSizeWeight}</div>
                        </div>
                    </div>
                </BentoBox>

                {/* Culture & Lore Section */}
                <BentoBox title="Cultural Significance" className="md:col-span-2 bg-stone-100/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                             <div className="text-sm text-stone-400 mb-1">Human History</div>
                             <p className="text-stone-700 leading-relaxed mb-4">{data.history}</p>
                             
                             <div className="text-sm text-stone-400 mb-1">Modern Meaning</div>
                             <p className="text-stone-700">{data.culture}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-stone-200">
                            <div className="text-sm text-stone-400 mb-2 font-bold uppercase tracking-widest">Folklore</div>
                            <p className="text-stone-600 italic text-sm leading-relaxed">
                                "{data.myths}"
                            </p>
                        </div>
                    </div>
                </BentoBox>

                <BentoBox title="Did You Know?" className="md:col-span-2 bg-moss-50/50 border-moss-100">
                     <p className="text-xl font-serif text-moss-900 italic leading-relaxed">
                         "{data.unknownFact}"
                     </p>
                     <div className="mt-4 flex flex-wrap gap-4 text-sm">
                         <span className="px-3 py-1 bg-white rounded-lg text-moss-800 border border-moss-100">
                             <strong>Record:</strong> {data.recordFact}
                         </span>
                         <span className="px-3 py-1 bg-white rounded-lg text-moss-800 border border-moss-100">
                             <strong>Scent:</strong> {data.scent}
                         </span>
                     </div>
                </BentoBox>
            
            </div>

            {/* Related Species Carousel */}
            <div className="pt-10 border-t border-stone-200">
                <h3 className="font-serif font-bold text-2xl text-stone-900 mb-8">Related Species</h3>
                {loadingRelated ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-stone-100 rounded-2xl animate-pulse"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {relatedSpecies.map((s, i) => (
                            <div key={i} onClick={() => onRelatedClick && onRelatedClick(s.commonName)} className="group cursor-pointer">
                                <div className="aspect-[3/4] bg-stone-200 rounded-2xl overflow-hidden mb-3 relative">
                                    {s.imageUrl ? (
                                        <img src={s.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif text-2xl">{s.commonName[0]}</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                </div>
                                <h4 className="font-bold text-stone-800 text-sm group-hover:text-moss-700 transition-colors">{s.commonName}</h4>
                                <p className="text-xs text-stone-500 italic truncate">{s.scientificName}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenImage && createPortal(
        <div 
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col animate-fade-in"
            onClick={() => setFullscreenImage(null)}
        >
            <button className="absolute top-6 right-6 p-4 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="flex-grow flex items-center justify-center p-8">
                <img src={fullscreenImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} />
            </div>
        </div>,
        document.body
      )}

    </div>
  );
};
