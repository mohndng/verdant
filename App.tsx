import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { SearchBar } from './components/SearchBar';
import { SpeciesCard } from './components/SpeciesCard';
import { Reveal } from './components/Reveal';
import { AuthForm } from './components/AuthForms';
import { FeaturedCarousel } from './components/FeaturedCarousel'; // Import Carousel
import { fetchSpeciesData, fetchFeaturedSpeciesBatch, getSpeciesSuggestion, fetchSpeciesByLetter } from './services/geminiService';
import { saveSpeciesToDb, removeSpeciesFromDb, fetchSavedSpecies, addToHistory, fetchHistory, clearHistory } from './services/supabaseService';
import { SpeciesData, ViewState, RelatedSpecies } from './types';
import supabase from './utils/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [currentSpecies, setCurrentSpecies] = useState<SpeciesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [letterSpecies, setLetterSpecies] = useState<{letter: string, list: RelatedSpecies[]} | null>(null);
  
  const [user, setUser] = useState<any>(null);
  const [savedItems, setSavedItems] = useState<SpeciesData[]>([]);
  const [historyItems, setHistoryItems] = useState<{query: string, created_at: string}[]>([]);
  
  const [featuredCollection, setFeaturedCollection] = useState<SpeciesData[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
        if (session?.user && (currentView === 'LOGIN' || currentView === 'SIGNUP')) {
            setCurrentView('HOME');
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user && (currentView === 'LOGIN' || currentView === 'SIGNUP')) {
            setCurrentView('HOME');
        }
      });

      return () => subscription.unsubscribe();
  }, [currentView]);

  useEffect(() => {
      if (user) {
          fetchSavedSpecies(user.id).then(setSavedItems).catch(console.error);
          fetchHistory(user.id).then(setHistoryItems).catch(console.error);
      } else {
          setSavedItems([]);
          setHistoryItems([]);
      }
  }, [user]);

  useEffect(() => {
    const getFeatured = async () => {
        try {
            const data = await fetchFeaturedSpeciesBatch();
            setFeaturedCollection(data);
        } catch (e) {
            console.error("Failed to load featured collection", e);
        }
    };
    getFeatured();
  }, []); 

  const handleSave = async (data: SpeciesData) => {
    if (!user) {
        setCurrentView('LOGIN');
        window.location.hash = '/login';
        return;
    }

    const isAlreadySaved = savedItems.some(item => item.commonName === data.commonName);
    
    if (isAlreadySaved) {
        setSavedItems(prev => prev.filter(item => item.commonName !== data.commonName));
        try {
            await removeSpeciesFromDb(user.id, data.commonName);
        } catch (e) {
            console.error("Failed to remove", e);
            setSavedItems(prev => [...prev, data]); 
        }
    } else {
        setSavedItems(prev => [data, ...prev]);
        try {
            await saveSpeciesToDb(user.id, data);
        } catch (e) {
            console.error("Failed to save", e);
            setSavedItems(prev => prev.filter(item => item.commonName !== data.commonName));
        }
    }
  };

  const isSaved = (data: SpeciesData) => {
    return savedItems.some(item => item.commonName === data.commonName);
  };

  const handleSearch = async (query: string) => {
    if (!query) return;
    setLoading(true);
    setProgress(0);
    setLoadingLogs(['Consulting the library...']);
    setError(null);
    setSuggestion(null);
    setCurrentView('ENTRY');
    
    window.location.hash = `/search/${encodeURIComponent(query)}`;

    if (user) {
        addToHistory(user.id, query).then(() => {
            fetchHistory(user.id).then(setHistoryItems);
        });
    }

    try {
      const data = await fetchSpeciesData(query, (percent, message) => {
        setProgress(prev => Math.max(prev, percent));
        setLoadingLogs(prev => [...prev, message]);
      });
      
      setProgress(100);
      setLoadingLogs(prev => [...prev, "Rendering..."]);
      
      setTimeout(() => {
        setCurrentSpecies(data);
        setLoading(false);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError("The archives are silent on this matter. Try another query.");
      try {
          const suggestedName = await getSpeciesSuggestion(query);
          if (suggestedName && suggestedName.toLowerCase() !== query.toLowerCase()) {
              setSuggestion(suggestedName);
          }
      } catch (e) { /* ignore */ }
      setLoading(false);
    }
  };

  const handleLetterClick = async (letter: string) => {
    setLoading(true);
    setCurrentView('LETTER_VIEW');
    window.location.hash = `/browse/${letter.toLowerCase()}`;
    setLetterSpecies(null);
    try {
        const list = await fetchSpeciesByLetter(letter);
        setLetterSpecies({ letter, list });
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleNavigate = (view: ViewState, hash?: string) => {
    setCurrentView(view);
    if (view === 'HOME') {
        window.location.hash = '/';
        setCurrentSpecies(null);
    } else if (hash) {
        window.location.hash = hash;
    } else {
        const map: Partial<Record<ViewState, string>> = {
            'A_Z': '/browse',
            'SAVED': '/saved',
            'ABOUT': '/about',
            'PRIVACY': '/privacy',
            'TERMS': '/terms',
            'LOGIN': '/login',
            'SIGNUP': '/signup',
            'HISTORY': '/history',
            'SUPPORT': '/support',
            'CONTACT': '/contact'
        };
        if (map[view]) window.location.hash = map[view]!;
    }
  };

  // Handle Hash Change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '' || hash === '#/') {
        setCurrentView(user ? 'HOME' : 'LOGIN');
      } else if (hash.startsWith('#/saved')) {
        setCurrentView('SAVED');
      } else if (hash.startsWith('#/browse')) {
         if (hash.startsWith('#/browse/')) {
            const letter = hash.split('/browse/')[1];
            if (letter) handleLetterClick(letter.toUpperCase());
         } else {
            setCurrentView('A_Z');
         }
      } else if (hash.startsWith('#/login')) {
        setCurrentView('LOGIN');
      } else if (hash.startsWith('#/signup')) {
        setCurrentView('SIGNUP');
      } else if (hash.startsWith('#/history')) {
        setCurrentView('HISTORY');
      } else if (hash.startsWith('#/about')) {
          setCurrentView('ABOUT');
      } else if (hash.startsWith('#/privacy')) {
          setCurrentView('PRIVACY');
      } else if (hash.startsWith('#/terms')) {
          setCurrentView('TERMS');
      } else if (hash.startsWith('#/support')) {
          setCurrentView('SUPPORT');
      } else if (hash.startsWith('#/contact')) {
          setCurrentView('CONTACT');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  // --- VIEWS ---

  const HomeView = () => (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 pt-10 md:pt-20">
      
      <Reveal className="w-full text-center mb-12 space-y-6 relative z-50">
          <h1 className="font-serif text-6xl md:text-9xl font-bold text-stone-900 tracking-tighter leading-[0.8]">
            Verdant
          </h1>
          <p className="font-serif text-xl md:text-2xl text-stone-500 italic max-w-lg mx-auto">
            The quiet encyclopedia of everything alive.
          </p>
          <div className="w-full max-w-xl mx-auto mt-8">
              <SearchBar onSearch={handleSearch} variant="hero" />
          </div>
      </Reveal>

      <Reveal delay={200} className="w-full mb-10">
        {featuredCollection.length > 0 ? (
            <FeaturedCarousel 
                items={featuredCollection} 
                onSelect={(item) => handleSearch(item.commonName)} 
            />
        ) : (
            <div className="relative w-full max-w-6xl mx-auto h-[450px] md:h-[550px] flex items-center justify-center mb-12 perspective-1000">
                 <div className="w-[80%] md:w-[60%] aspect-[16/9] rounded-[2rem] bg-stone-100 border border-stone-200 shadow-xl relative overflow-hidden animate-pulse z-10">
                     <div className="absolute inset-0 bg-gradient-to-tr from-stone-100 via-white to-stone-100 opacity-50"></div>
                     <div className="absolute bottom-8 left-8 right-8 space-y-4 opacity-50">
                         <div className="w-24 h-6 bg-stone-300 rounded-full"></div>
                         <div className="w-3/4 h-12 bg-stone-300 rounded-xl"></div>
                         <div className="w-full h-4 bg-stone-200 rounded-lg"></div>
                     </div>
                 </div>
                 <div className="absolute left-[5%] w-[50%] aspect-[16/9] rounded-[2rem] bg-stone-100 -z-10 scale-90 opacity-30"></div>
                 <div className="absolute right-[5%] w-[50%] aspect-[16/9] rounded-[2rem] bg-stone-100 -z-10 scale-90 opacity-30"></div>
            </div>
        )}
      </Reveal>

      <Reveal delay={300} className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-20">
          {['Fungi', 'Flora', 'Fauna', 'Marine'].map((cat, idx) => (
              <div key={cat} className="h-32 rounded-3xl bg-white border border-stone-100 flex items-center justify-center font-serif text-2xl text-stone-400 hover:text-moss-700 hover:border-moss-200 transition-colors cursor-pointer" onClick={() => handleSearch(cat)}>
                  {cat}
              </div>
          ))}
      </Reveal>

    </div>
  );

  const SavedView = () => (
    <div className="container mx-auto px-6 max-w-7xl animate-fade-in">
        <h2 className="font-serif text-5xl font-bold text-stone-900 mb-12">Collection</h2>
        
        {savedItems.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-stone-300">
                <p className="text-stone-400 text-xl font-serif italic mb-6">Your collection is empty.</p>
                <button onClick={() => setCurrentView('HOME')} className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-700 transition-colors">Start Collecting</button>
            </div>
        ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                {savedItems.map((item, i) => (
                    <div key={i} onClick={() => { setCurrentSpecies(item); setCurrentView('ENTRY'); }} className="break-inside-avoid bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                         <div className="aspect-square bg-stone-200 relative overflow-hidden">
                             {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                             <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">{item.kingdom}</div>
                         </div>
                         <div className="p-6">
                             <h3 className="font-serif text-2xl font-bold text-stone-900 mb-1">{item.commonName}</h3>
                             <p className="text-stone-500 italic text-sm mb-4">{item.scientificName}</p>
                             <p className="text-stone-600 line-clamp-3 text-sm leading-relaxed">{item.description}</p>
                         </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const AZView = () => (
      <div className="container mx-auto px-6 max-w-5xl animate-fade-in">
           <h2 className="font-serif text-5xl font-bold text-stone-900 mb-12 text-center">Index</h2>
           <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
               {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                   <button 
                    key={letter}
                    onClick={() => handleLetterClick(letter)}
                    className="aspect-square rounded-2xl bg-white border border-stone-200 text-stone-400 font-serif text-2xl hover:bg-moss-600 hover:text-white hover:border-moss-600 transition-all shadow-sm hover:shadow-lg hover:scale-105"
                   >
                       {letter}
                   </button>
               ))}
           </div>
      </div>
  );

  const LetterView = () => (
      <div className="container mx-auto px-6 max-w-7xl animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setCurrentView('A_Z')} className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100">&larr;</button>
              <h2 className="font-serif text-4xl font-bold text-stone-900">Letter {letterSpecies?.letter}</h2>
          </div>
          
          {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-[3/4] bg-stone-100 rounded-3xl animate-pulse"></div>)}
              </div>
          ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {letterSpecies?.list.map((item, i) => (
                      <div key={i} onClick={() => handleSearch(item.commonName)} className="group cursor-pointer">
                          <div className="aspect-[4/5] bg-stone-200 rounded-3xl overflow-hidden mb-4 relative">
                              {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                          </div>
                          <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-moss-700 transition-colors">{item.commonName}</h3>
                          <p className="text-sm text-stone-500 italic">{item.scientificName}</p>
                      </div>
                  ))}
              </div>
          )}
      </div>
  );

  const AboutView = () => (
      <div className="container mx-auto px-6 max-w-4xl animate-fade-in py-12">
          <div className="text-center mb-16">
              <h1 className="font-serif text-5xl font-bold text-stone-900 mb-6">Our Mission</h1>
              <p className="text-xl text-stone-500 italic font-serif">"To organize the world's biological information and make it universally accessible and useful."</p>
          </div>
          
          <div className="space-y-16">
              <section>
                  <h3 className="text-lg font-bold uppercase tracking-widest text-moss-700 mb-4">The Quiet Encyclopedia</h3>
                  <p className="text-stone-700 leading-relaxed text-lg">
                      Verdant is a reaction to the noise of the modern internet. In an age of ads, pop-ups, and clickbait, we wanted to build a sanctuary for knowledge. A place where you can learn about a <em>Quercus robur</em> (English Oak) or a <em>Danaus plexippus</em> (Monarch Butterfly) without distraction.
                  </p>
              </section>

              <section>
                  <h3 className="text-lg font-bold uppercase tracking-widest text-moss-700 mb-4">Powered by Intelligence</h3>
                  <p className="text-stone-700 leading-relaxed text-lg">
                      We leverage <strong>Google's Gemini 3.0 Pro</strong> to synthesize vast amounts of biological data into readable, poetic narratives. However, AI is only as good as its sources. That is why we ground every entry with real-world observations from the <strong>Global Biodiversity Information Facility (GBIF)</strong> and <strong>iNaturalist</strong>, ensuring that what you read reflects the living, breathing world.
                  </p>
              </section>
              
              <section>
                  <h3 className="text-lg font-bold uppercase tracking-widest text-moss-700 mb-4">Open Knowledge</h3>
                  <p className="text-stone-700 leading-relaxed text-lg">
                      Nature belongs to everyone. This project is open-source and dedicated to the democratization of science. Whether you are a student, a researcher, or just someone who loves the sound of rain, Verdant is built for you.
                  </p>
              </section>
          </div>
      </div>
  );

  const LegalView = ({ type }: { type: 'PRIVACY' | 'TERMS' }) => (
      <div className="container mx-auto px-6 max-w-4xl animate-fade-in py-12">
          <h1 className="font-serif text-4xl font-bold text-stone-900 mb-8">{type === 'PRIVACY' ? 'Privacy Policy' : 'Terms of Service'}</h1>
          <div className="prose prose-stone prose-lg text-stone-600">
              {type === 'PRIVACY' ? (
                  <>
                    <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
                    <p className="mb-4">At Verdant, we prioritize the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Verdant and how we use it.</p>
                    <h3 className="text-2xl font-bold text-stone-800 mt-8 mb-4">Information We Collect</h3>
                    <p className="mb-4">When you register for an account, we may ask for your contact information, specifically your email address, to secure your saved collection.</p>
                    <h3 className="text-2xl font-bold text-stone-800 mt-8 mb-4">How we use your information</h3>
                    <ul className="list-disc pl-5 space-y-2 mb-4">
                        <li>Provide, operate, and maintain our website</li>
                        <li>Improve, personalize, and expand our website</li>
                        <li>Understand and analyze how you use our website</li>
                        <li>Send you emails regarding your account security</li>
                    </ul>
                    <h3 className="text-2xl font-bold text-stone-800 mt-8 mb-4">Log Files</h3>
                    <p className="mb-4">Verdant follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>
                  </>
              ) : (
                  <>
                     <p className="mb-4">By accessing this website we assume you accept these terms and conditions. Do not continue to use Verdant if you do not agree to take all of the terms and conditions stated on this page.</p>
                     <h3 className="text-2xl font-bold text-stone-800 mt-8 mb-4">Cookies</h3>
                     <p className="mb-4">We employ the use of cookies. By accessing Verdant, you agreed to use cookies in agreement with the Verdant's Privacy Policy.</p>
                     <h3 className="text-2xl font-bold text-stone-800 mt-8 mb-4">License</h3>
                     <p className="mb-4">Unless otherwise stated, Verdant and/or its licensors own the intellectual property rights for all material on Verdant. All intellectual property rights are reserved.</p>
                     <h3 className="text-2xl font-bold text-stone-800 mt-8 mb-4">Disclaimer</h3>
                     <p className="mb-4">The information provided by Verdant is for general informational purposes only. While we strive to keep the information up to date and correct, we make no representations or warranties of any kind about the completeness, accuracy, reliability, suitability or availability with respect to the website or the information.</p>
                  </>
              )}
          </div>
      </div>
  );
  
  const SupportView = () => (
    <div className="container mx-auto px-6 max-w-3xl animate-fade-in py-12 text-center">
        <h1 className="font-serif text-4xl font-bold text-stone-900 mb-6">Support Verdant</h1>
        <p className="text-xl text-stone-600 mb-12">Help us keep the servers running and the encyclopedia ad-free.</p>
        <div className="bg-moss-50 border border-moss-100 p-10 rounded-[3rem] shadow-sm">
            <span className="text-5xl mb-6 block">🌱</span>
            <p className="text-moss-800 mb-8 font-serif text-lg">Every donation goes directly into API costs and server maintenance.</p>
            <a 
                href="https://ko-fi.com/mon4rche" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-moss-700 text-white rounded-full font-bold shadow-lg hover:bg-moss-800 transition-all cursor-pointer"
            >
                Donate via Ko-fi
            </a>
        </div>
    </div>
  );

  const ContactView = () => (
      <div className="container mx-auto px-6 max-w-3xl animate-fade-in py-12 text-center">
           <h1 className="font-serif text-4xl font-bold text-stone-900 mb-6">Contact Us</h1>
           <p className="text-xl text-stone-600 mb-12">Have a suggestion, a correction, or just want to say hello?</p>
           
           <div className="bg-white p-12 rounded-[3rem] border border-stone-100 shadow-xl">
               <p className="text-lg text-stone-800 mb-6">You can reach the development team at:</p>
               <a href="mailto:hello@verdant.app" className="text-3xl font-serif text-moss-700 hover:text-moss-500 transition-colors border-b-2 border-moss-200 hover:border-moss-500">
                   hello@verdant.app
               </a>
           </div>
      </div>
  );

  const isAuthPage = currentView === 'LOGIN' || currentView === 'SIGNUP';

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate} onSearch={handleSearch} user={user} fullScreenMode={isAuthPage}>
       
       {isAuthPage && <AuthForm mode={currentView} onSuccess={() => handleNavigate('HOME')} onSwitchMode={(m) => handleNavigate(m)} />}
       
       {currentView === 'HOME' && <HomeView />}
       {currentView === 'SAVED' && <SavedView />}
       {currentView === 'A_Z' && <AZView />}
       {currentView === 'LETTER_VIEW' && <LetterView />}
       {currentView === 'ABOUT' && <AboutView />}
       {currentView === 'PRIVACY' && <LegalView type="PRIVACY" />}
       {currentView === 'TERMS' && <LegalView type="TERMS" />}
       {currentView === 'SUPPORT' && <SupportView />}
       {currentView === 'CONTACT' && <ContactView />}
       {currentView === 'HISTORY' && (
           <div className="container mx-auto px-6 max-w-4xl">
               <h2 className="font-serif text-4xl font-bold mb-8">History</h2>
               {historyItems.map((item, i) => (
                   <div key={i} onClick={() => handleSearch(item.query)} className="flex items-center justify-between py-4 border-b border-stone-100 hover:bg-white hover:px-4 -mx-4 rounded-xl transition-all cursor-pointer group">
                       <span className="font-serif text-xl text-stone-700 group-hover:text-moss-700">{item.query}</span>
                       <span className="text-xs text-stone-400">{new Date(item.created_at).toLocaleDateString()}</span>
                   </div>
               ))}
           </div>
       )}

       {currentView === 'ENTRY' && (
           <div className="container mx-auto px-4 min-h-[80vh]">
               {loading ? (
                   <div className="flex flex-col items-center justify-center h-[60vh] w-full max-w-md mx-auto animate-fade-in">
                        
                        {/* Animated Nature Icon */}
                        <div className="mb-12 relative">
                            {/* Subtle Pulse Halo */}
                            <div className="absolute inset-0 bg-moss-200 rounded-full blur-xl opacity-20 animate-pulse"></div>
                            {/* Icon Container */}
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-stone-200/50 relative z-10 animate-breathe border border-stone-50">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-moss-700">
                                   <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 0 0 4 15.666 9 9 0 0 0 13 24.666a.75.75 0 0 0 .75-.75 7.5 7.5 0 0 1 .75-3.333c1.926-2.13 5.437-6.07 5.437-12.083a9.75 9.75 0 0 0-6.974-6.214ZM11.433 11.23c.313-.427.653-.827 1.018-1.198a.75.75 0 0 1 1.08 1.038A18.06 18.06 0 0 1 9.8 14.77a.75.75 0 0 1-1.258-.813c.712-1.1 1.803-2.102 2.891-2.727Z" clipRule="evenodd" />
                                 </svg>
                            </div>
                        </div>

                        {/* Text Status Area */}
                        <div className="text-center mb-8 space-y-2 h-16 w-full">
                             <h3 className="font-serif text-2xl text-stone-800 transition-all duration-300">
                                 {loadingLogs[loadingLogs.length - 1] || "Awakening..."}
                             </h3>
                             <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                                 Consulting the Archives
                             </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden relative">
                             <div 
                                 className="h-full bg-moss-600 rounded-full transition-all duration-500 ease-out"
                                 style={{ width: `${progress}%` }}
                             />
                        </div>
                        
                        {/* Percentage */}
                        <div className="mt-3 text-right w-full text-xs font-mono text-stone-300">
                            {Math.round(progress)}%
                        </div>

                   </div>
               ) : currentSpecies ? (
                   <SpeciesCard data={currentSpecies} onSave={handleSave} isSaved={isSaved(currentSpecies)} onRelatedClick={handleSearch} />
               ) : error ? (
                   <div className="text-center py-32">
                       <h3 className="font-serif text-4xl text-stone-300 mb-4">Silence.</h3>
                       <p className="text-stone-500 mb-8">{error}</p>
                       <button onClick={() => setCurrentView('HOME')} className="px-6 py-2 bg-stone-900 text-white rounded-full">Return Home</button>
                   </div>
               ) : null}
           </div>
       )}
    </Layout>
  );
};

export default App;