import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { ViewState } from '../types';
import { fetchWikiSuggestions } from '../services/wikipediaService';
import supabase from '../utils/supabase';
import { Github, Database, FileCode2, Menu, X, Search, LogOut } from 'lucide-react';
import { Logo } from './Logo';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState, hash?: string) => void;
  onSearch?: (query: string) => void;
  user?: any;
  fullScreenMode?: boolean; // New prop to hide header/footer
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, onSearch, user, fullScreenMode = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  // Click outside for mobile suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce for mobile suggestions (Defaults to Wiki for mobile simplicity)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        const results = await fetchWikiSuggestions(searchTerm);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);


  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleMobileNav = (view: ViewState) => {
    setIsMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() && onSearch) {
      setIsMobileMenuOpen(false);
      setShowSuggestions(false);
      onSearch(searchTerm); 
      setSearchTerm('');
    }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setIsMobileMenuOpen(false);
      onNavigate('LOGIN');
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-800 bg-[#f9f8f6] relative overflow-x-hidden selection:bg-moss-200 selection:text-moss-900">
      
      {/* --- AMBIENT BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         {/* Noise Texture */}
         <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
         }}></div>
         
         {/* Gradient Orbs */}
         <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-moss-200/30 rounded-full blur-[100px] animate-blob"></div>
         <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-earth-200/30 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
         <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-mist-200/30 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* --- FLOATING NAVIGATION --- */}
      {!fullScreenMode && (
        <header className="fixed top-6 left-0 right-0 z-[60] flex justify-center px-4">
            <div className="w-full max-w-4xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-stone-200/20 rounded-full px-6 py-3 flex items-center justify-between transition-all duration-300">
                
                {/* Logo */}
                <button 
                    onClick={() => {
                        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                        onNavigate('HOME');
                    }} 
                    className="flex items-center gap-3 group focus:outline-none"
                >
                    <div className="w-8 h-8 transition-transform group-hover:scale-105">
                        <Logo />
                    </div>
                    <span className="font-serif text-xl font-bold tracking-tight text-stone-900 group-hover:text-moss-800 transition-colors hidden sm:block">
                    Verdant
                    </span>
                </button>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    <button onClick={() => onNavigate('A_Z')} className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 rounded-full transition-all">
                        Index
                    </button>
                    <button onClick={() => onNavigate('SAVED')} className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 rounded-full transition-all">
                        Collection
                    </button>
                    {user && (
                         <button onClick={() => onNavigate('HISTORY')} className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 rounded-full transition-all">
                            History
                        </button>
                    )}
                </nav>

                {/* Auth & Menu */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <button onClick={handleLogout} className="hidden md:block px-5 py-2 bg-stone-900 text-white text-sm font-medium rounded-full hover:bg-stone-700 transition-all shadow-md">
                            Log Out
                        </button>
                    ) : (
                        <button onClick={() => onNavigate('LOGIN')} className="hidden md:block px-5 py-2 bg-moss-700 text-white text-sm font-medium rounded-full hover:bg-moss-800 transition-all shadow-md shadow-moss-900/10">
                            Join
                        </button>
                    )}
                    
                    {/* Mobile Menu Toggle */}
                    <button 
                        onClick={toggleMenu} 
                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 text-stone-900 hover:bg-stone-200 transition-colors focus:outline-none"
                        aria-label="Menu"
                    >
                         {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-[#f9f8f6] flex flex-col pt-32 px-6 pb-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isMobileMenuOpen 
            ? 'opacity-100 visible' 
            : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className={`flex flex-col h-full max-w-lg mx-auto w-full transition-all duration-700 delay-100 ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
           
           {/* Mobile Search */}
           <div className="mb-8 relative z-50" ref={mobileSearchRef}>
              <form onSubmit={handleMobileSearch} className="relative" role="search">
                <input 
                  type="search" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..." 
                  className="w-full bg-white border border-stone-200 rounded-2xl px-5 py-4 text-lg font-serif shadow-sm focus:outline-none focus:ring-2 focus:ring-moss-200 focus:border-moss-400 placeholder:text-stone-300 pl-12"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                    <Search size={20} />
                </div>
              </form>
           </div>

           {/* Mobile Links */}
           <nav className="flex flex-col gap-4 flex-grow relative z-40">
              {['Home', 'A_Z', 'Saved', 'History', 'Support'].map((item, idx) => (
                  <button 
                    key={item}
                    onClick={() => handleMobileNav(item.toUpperCase() as ViewState)} 
                    className="text-left font-serif text-4xl font-light text-stone-800 hover:text-moss-700 hover:pl-4 transition-all duration-300 border-b border-stone-100 pb-4"
                  >
                      {item === 'A_Z' ? 'Index' : item === 'Saved' ? 'Collection' : item}
                  </button>
              ))}
           </nav>

           <div className="mt-8 pt-4 flex justify-between items-center text-sm font-medium">
             {user ? (
                 <button onClick={handleLogout} className="text-stone-500 hover:text-stone-900 flex items-center gap-2">
                    <LogOut size={16} /> Log Out
                 </button>
             ) : (
                 <button onClick={() => handleMobileNav('LOGIN')} className="px-6 py-3 bg-stone-900 text-white rounded-full">Log In</button>
             )}
             <div className="flex gap-4 text-stone-400">
               <button onClick={() => handleMobileNav('PRIVACY')}>Privacy</button>
               <button onClick={() => handleMobileNav('TERMS')}>Terms</button>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative z-10 pt-24 md:pt-32 pb-12">
        {children}
      </main>

      {/* Footer */}
      {!fullScreenMode && (
        <footer className="relative z-10 bg-white border-t border-stone-100 pt-16 pb-8">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    <div className="md:col-span-5 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8">
                                <Logo />
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-stone-900">Verdant</h3>
                        </div>
                        <p className="text-stone-500 leading-relaxed max-w-sm">
                            The quiet encyclopedia of everything alive. Dedicated to the digital preservation of nature's stories through modern technology and open knowledge.
                        </p>
                    </div>
                    
                    <div className="md:col-span-2 md:col-start-7">
                        <h4 className="font-bold text-stone-900 mb-6 text-xs uppercase tracking-widest text-moss-700">Explore</h4>
                        <ul className="space-y-4 text-stone-500 text-sm font-medium">
                            <li><button onClick={() => onNavigate('HOME')} className="hover:text-stone-900 transition-colors">Home</button></li>
                            <li><button onClick={() => onNavigate('A_Z')} className="hover:text-stone-900 transition-colors">Index</button></li>
                            <li><button onClick={() => onNavigate('SAVED')} className="hover:text-stone-900 transition-colors">Collection</button></li>
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="font-bold text-stone-900 mb-6 text-xs uppercase tracking-widest text-moss-700">About</h4>
                        <ul className="space-y-4 text-stone-500 text-sm font-medium">
                            <li><button onClick={() => onNavigate('ABOUT')} className="hover:text-stone-900 transition-colors">Mission</button></li>
                            <li><button onClick={() => onNavigate('SUPPORT')} className="hover:text-stone-900 transition-colors">Support</button></li>
                            <li><button onClick={() => onNavigate('CONTACT')} className="hover:text-stone-900 transition-colors">Contact</button></li>
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                         <h4 className="font-bold text-stone-900 mb-6 text-xs uppercase tracking-widest text-moss-700">Legal</h4>
                         <ul className="space-y-4 text-stone-500 text-sm font-medium">
                            <li><button onClick={() => onNavigate('PRIVACY')} className="hover:text-stone-900 transition-colors">Privacy</button></li>
                            <li><button onClick={() => onNavigate('TERMS')} className="hover:text-stone-900 transition-colors">Terms</button></li>
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-stone-100 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <span className="font-serif font-medium text-stone-900">Developed by Mon Torneado</span>
                        <span className="hidden md:block w-1.5 h-1.5 bg-stone-300 rounded-full"></span>
                        <div className="flex items-center gap-4 text-stone-400">
                            {/* Github Icon */}
                            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-stone-900 transition-colors bg-stone-50 p-2 rounded-full border border-stone-200 hover:border-stone-400 hover:shadow-sm" aria-label="Github">
                                <Github size={18} />
                            </a>
                            {/* Database Icon (Supabase Proxy) */}
                            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors bg-stone-50 p-2 rounded-full border border-stone-200 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-sm" aria-label="Supabase">
                                <Database size={18} />
                            </a>
                            {/* FileCode Icon (TypeScript Proxy) */}
                            <a href="https://www.typescriptlang.org" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors bg-stone-50 p-2 rounded-full border border-stone-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm" aria-label="TypeScript">
                                <FileCode2 size={18} />
                            </a>
                        </div>
                    </div>

                    <div className="text-center md:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Powered By</p>
                        <p className="text-xs text-stone-500 font-medium">Gemini 3.0 • Wikipedia • GBIF • iNaturalist</p>
                    </div>
                </div>
                
                <div className="text-center mt-8 text-[10px] text-stone-300">
                    © {new Date().getFullYear()} Verdant. All rights reserved.
                </div>
            </div>
        </footer>
      )}
    </div>
  );
};