import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-light text-text-dark font-sans selection:bg-accent-earthy selection:text-neutral-light">
      {/* Navigation */}
      <nav className="fixed w-full z-10 bg-neutral-light/90 backdrop-blur-md border-b border-neutral-warm/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-earthy rounded-lg rotate-3"></div>
              <span className="font-bold text-xl tracking-tight text-text-dark">Brand</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#" className="text-text-dark hover:text-accent-earthy transition-colors duration-200">Home</a>
              <a href="#" className="text-text-dark/80 hover:text-accent-earthy transition-colors duration-200">Features</a>
              <a href="#" className="text-text-dark/80 hover:text-accent-earthy transition-colors duration-200">About</a>
              <a href="#" className="text-text-dark/80 hover:text-accent-earthy transition-colors duration-200">Contact</a>
            </div>
            <div>
               <button className="bg-text-dark text-neutral-light px-5 py-2 rounded-full hover:bg-accent-earthy transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" aria-label="Get Started">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-20 lg:py-32">
          <span className="inline-block py-1 px-3 rounded-full bg-neutral-warm/30 text-accent-earthy text-sm font-medium mb-6 animate-fade-in-up">
            New Design System
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-text-dark">
            Simplicity Meets <span className="text-accent-earthy italic relative">
              Aesthetics
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-neutral-warm -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.5" />
              </svg>
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-text-dark/80 leading-relaxed mb-10">
            A clean, responsive, and accessible interface designed with focus and clarity in mind. 
            Experience the harmony of our earthy color palette.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-accent-earthy text-neutral-light px-8 py-3.5 rounded-full text-lg font-medium hover:bg-text-dark transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2">
              Explore Components
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
              </svg>
            </button>
            <button className="bg-transparent border-2 border-text-dark/20 text-text-dark px-8 py-3.5 rounded-full text-lg font-medium hover:border-text-dark transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
          {[
            { title: "Simplicity", desc: "Clean interface focused on user goals without clutter." },
            { title: "Consistency", desc: "Uniform design patterns across all pages and features." },
            { title: "Accessibility", desc: "Designed to be inclusive for all users regardless of ability." }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-2xl bg-white/50 border border-neutral-warm/20 hover:border-accent-earthy/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
              <div className="h-12 w-12 bg-neutral-warm/30 rounded-xl mb-6 flex items-center justify-center text-accent-earthy group-hover:bg-accent-earthy group-hover:text-neutral-light transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-dark">{feature.title}</h3>
              <p className="text-text-dark/70 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Color Palette Showcase */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-text-dark">Our Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="space-y-2">
               <div className="h-32 rounded-2xl bg-neutral-light border border-neutral-warm/20 shadow-sm flex items-end p-4">
                 <span className="text-xs font-mono text-text-dark/60">#E4E0E1</span>
               </div>
               <p className="text-center font-medium text-text-dark">Neutral Light</p>
             </div>
             <div className="space-y-2">
               <div className="h-32 rounded-2xl bg-neutral-warm shadow-sm flex items-end p-4">
                 <span className="text-xs font-mono text-white/90">#D6C0B3</span>
               </div>
               <p className="text-center font-medium text-text-dark">Neutral Warm</p>
             </div>
             <div className="space-y-2">
               <div className="h-32 rounded-2xl bg-accent-earthy shadow-sm flex items-end p-4">
                 <span className="text-xs font-mono text-white/90">#AB886D</span>
               </div>
               <p className="text-center font-medium text-text-dark">Earthy Accent</p>
             </div>
             <div className="space-y-2">
               <div className="h-32 rounded-2xl bg-text-dark shadow-sm flex items-end p-4">
                 <span className="text-xs font-mono text-white/70">#493628</span>
               </div>
               <p className="text-center font-medium text-text-dark">Text Dark</p>
             </div>
          </div>
        </section>
      </main>

      <footer className="bg-text-dark text-neutral-light py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-neutral-light/60 text-sm">
            © 2024 Design System Demo. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-neutral-light/60 hover:text-accent-earthy transition-colors">Privacy</a>
            <a href="#" className="text-neutral-light/60 hover:text-accent-earthy transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
