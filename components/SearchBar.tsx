
import React, { useState, useEffect, useRef } from 'react';
import { fetchWikiSuggestions } from '../services/wikipediaService';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  variant?: 'hero' | 'minimal';
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Ask nature...", 
  variant = 'minimal' 
}) => {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce input to fetch suggestions (Wiki is generally best for autocomplete names)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (term.trim().length >= 2) {
        // We stick to Wiki for suggestions as it's fast and broad
        const results = await fetchWikiSuggestions(term);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [term]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (term.trim()) {
      onSearch(term);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTerm(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const heroClasses = "w-full pl-6 pr-14 py-5 rounded-full bg-white/90 backdrop-blur-md border border-white/40 shadow-2xl shadow-stone-200/50 focus:outline-none focus:border-moss-300 focus:ring-4 focus:ring-moss-100/50 transition-all placeholder:text-stone-400 text-stone-800 text-lg font-medium";
  const minimalClasses = "w-full text-sm pl-4 pr-4 py-2.5 rounded-full border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-moss-300 focus:bg-white transition-all text-stone-800";

  return (
    <div ref={containerRef} className={`relative z-20 ${variant === 'hero' ? 'w-full' : 'w-full'}`}>
      <form onSubmit={handleSubmit} className="w-full relative flex items-center group">
        
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={variant === 'hero' ? heroClasses : minimalClasses}
        />
        
        <button 
          type="submit"
          className={`absolute transition-all duration-300 ${variant === 'hero' ? 'right-2.5 top-1/2 -translate-y-1/2 p-3 bg-stone-900 rounded-full text-white hover:bg-moss-700 hover:scale-105 shadow-lg' : 'right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-moss-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={variant === 'hero' ? 2 : 1.5} stroke="currentColor" className={variant === 'hero' ? "w-5 h-5" : "w-4 h-4"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={`absolute top-full mt-4 left-0 right-0 bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-stone-200/40 z-[100] overflow-hidden animate-slide-up ${variant === 'hero' ? 'mx-2' : ''}`}>
           <div className="px-6 py-3 bg-stone-50/50 text-[10px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100/50">
               Suggestions
           </div>
          <ul className="py-2">
            {suggestions.map((s, idx) => (
              <li 
                key={idx}
                onClick={() => handleSuggestionClick(s)}
                className="px-6 py-3 hover:bg-moss-50/50 cursor-pointer text-stone-700 hover:text-moss-800 transition-colors flex items-center gap-4 group"
              >
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-moss-100 group-hover:text-moss-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                    </svg>
                </div>
                <span className="font-serif text-lg">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
