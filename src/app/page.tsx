'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles, LogOut, ArrowRight, ShieldCheck, Cpu, Volume2, Disc, Play, Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollProgressRef = useRef(0);

  // 1. Session Check & Authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        preloadImages();
      } else {
        router.replace('/login');
      }
    };
    checkUser();
  }, [router]);

  // 2. Preload 240 Image Frames
  const preloadImages = () => {
    let loadedCount = 0;
    const imagesArray: HTMLImageElement[] = [];
    const totalFrames = 240;

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/bg/ezgif-frame-${frameNum}.jpg`;
      
      img.onload = () => {
        loadedCount++;
        setLoadingProgress(Math.round((loadedCount / totalFrames) * 100));
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
          setLoading(false);
        }
      };
      
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
          setLoading(false);
        }
      };
      
      imagesArray.push(img);
    }
    setImages(imagesArray);
  };

  // 3. Scroll Handler
  useEffect(() => {
    if (!isAuthenticated || !imagesLoaded) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      const currentScroll = -rect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / totalScrollable));
      
      scrollProgressRef.current = progress;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, imagesLoaded]);

  // 4. Canvas Resizing
  const handleResize = () => {
    if (!canvasRef.current || images.length === 0) return;
    const canvas = canvasRef.current;
    
    // Scale canvas to match viewport size and high DPI displays
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    
    // Draw current frame immediately on resize
    const progress = scrollProgressRef.current;
    const frameIndex = Math.min(images.length - 1, Math.max(0, Math.floor(progress * images.length)));
    drawFrame(frameIndex);
  };

  // 5. Draw Image to Canvas
  const drawFrame = (frameIndex: number) => {
    if (!canvasRef.current || !images[frameIndex]) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const image = images[frameIndex];
    if (!context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = image.width;
    const imgHeight = image.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, drawX, drawY;

    // Object-fit: contain (with pillarboxing/letterboxing)
    if (canvasRatio > imgRatio) {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    }

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  };

  // 6. Canvas Animation loop
  useEffect(() => {
    if (!imagesLoaded || images.length === 0) return;

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing

    let animId: number;
    let lastProgress = -1;

    const renderLoop = () => {
      const progress = scrollProgressRef.current;
      if (progress !== lastProgress) {
        const frameIndex = Math.min(images.length - 1, Math.max(0, Math.floor(progress * images.length)));
        drawFrame(frameIndex);
        lastProgress = progress;
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [imagesLoaded, images]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // Loading Screen
  if (loading || !imagesLoaded) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white px-6">
        <div className="relative mb-8">
          <Loader2 className="w-16 h-16 animate-spin text-[#0050FF]" />
          <div className="absolute inset-0 bg-[#00D6FF]/20 blur-xl rounded-full scale-75 animate-pulse" />
        </div>
        
        <h2 className="text-xl font-bold tracking-widest uppercase mb-2 text-white/90">Rex Mobile & Computers</h2>
        <p className="text-xs text-white/40 mb-6 uppercase tracking-wider">Loading system assets & blueprints</p>
        
        <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-[#0050FF] to-[#00D6FF] transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <span className="text-sm font-mono mt-2 text-white/60">{loadingProgress}%</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full bg-[#050505] text-white" style={{ height: '450vh' }}>
      
      {/* Fixed Content Container */}
      <div className="fixed inset-0 w-full h-screen overflow-hidden flex flex-col justify-between z-10 bg-[#050505] pointer-events-none">
        
        {/* Apple style Navbar */}
        <nav className={`fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 md:px-12 z-50 transition-all duration-500 border-b pointer-events-auto ${
          scrollProgress > 0.02 
            ? 'bg-[#050505]/75 backdrop-blur-md border-white/5 shadow-2xl' 
            : 'bg-transparent border-transparent'
        }`}>
          {/* Left logo */}
          <Link href="/" className="font-bold tracking-tight text-white/90 hover:text-white transition-colors text-sm md:text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00D6FF]" />
            <span>Rex Mobile & Computers</span>
          </Link>

          {/* Center Links (Store Navigation - Desktop) */}
          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-white/60 tracking-wider uppercase">
            <Link href="/dashboard-stats" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/inventory" className="hover:text-white transition-colors">Inventory</Link>
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <Link href="/sales" className="hover:text-white transition-colors">Sales</Link>
            <Link href="/billing" className="hover:text-[#00D6FF] transition-colors text-[#00D6FF]/90 font-bold">POS Billing</Link>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link 
              href="/dashboard-stats"
              className="hidden sm:flex text-xs font-bold bg-gradient-to-r from-[#0050FF] to-[#00D6FF] hover:opacity-90 text-white px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(0,80,255,0.4)] items-center gap-1.5"
            >
              <span>Manage Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            
            <button 
              onClick={handleLogout}
              className="hidden sm:block text-white/40 hover:text-red-400 transition-colors p-1.5 rounded-full hover:bg-white/5"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburguer button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white/80 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown Overlay */}
        <div className={`fixed inset-0 bg-[#050505]/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden pointer-events-auto ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}>
          <Link href="/dashboard-stats" className="text-xl font-medium hover:text-[#00D6FF] transition-colors" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
          <Link href="/inventory" className="text-xl font-medium hover:text-[#00D6FF] transition-colors" onClick={() => setMobileMenuOpen(false)}>Inventory</Link>
          <Link href="/products" className="text-xl font-medium hover:text-[#00D6FF] transition-colors" onClick={() => setMobileMenuOpen(false)}>Products</Link>
          <Link href="/sales" className="text-xl font-medium hover:text-[#00D6FF] transition-colors" onClick={() => setMobileMenuOpen(false)}>Sales</Link>
          <Link href="/billing" className="text-xl font-bold text-[#00D6FF] hover:opacity-90 transition-colors" onClick={() => setMobileMenuOpen(false)}>POS Billing</Link>
          <button 
            onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
            className="text-white/40 hover:text-red-400 text-sm mt-8 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Dynamic Glowing Background Behind Headphone */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,80,255,0.06)_0%,transparent_60%)] pointer-events-none z-0" />

        {/* Sticky HTML5 Canvas Sequence */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0 bg-[#050505]"
        />

        {/* Interactive Storytelling beats (Absolute Center Overlays) */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 md:px-24">
          
          {/* Beat 1: Store CTA (0% to 15%) */}
          <div className={`absolute left-6 right-6 md:left-auto md:right-auto flex flex-col items-center text-center max-w-xl transition-all duration-1000 transform ${
            scrollProgress < 0.15 
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
              : 'opacity-0 -translate-y-10 scale-95 pointer-events-none'
          }`}>
            <h1 className="text-3xl md:text-6xl font-black tracking-tight text-white/95 mb-3 select-none">
              Rex Mobile & Computers
            </h1>
            <p className="text-xs md:text-sm text-[#00D6FF] uppercase font-bold tracking-[0.2em] mb-6">
              All your technology needs under one roof
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link 
                href="/inventory"
                className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-8 py-3 rounded-full font-bold text-sm border border-white/10 transition-all min-w-[140px] flex items-center justify-center"
              >
                Inventory
              </Link>
              
              <Link 
                href="/billing"
                className="bg-gradient-to-r from-[#0050FF] to-[#00D6FF] text-white px-8 py-3 rounded-full font-bold text-sm shadow-[0_0_25px_rgba(0,80,255,0.45)] hover:opacity-90 transition-all flex items-center justify-center gap-2 group min-w-[160px]"
              >
                <span>POS Billing</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/sales"
                className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-8 py-3 rounded-full font-bold text-sm border border-white/10 transition-all min-w-[140px] flex items-center justify-center"
              >
                Sales
              </Link>
            </div>
            
            <p className="text-[10px] text-white/30 mt-6 tracking-wide uppercase">
              Premium devices. Top accessories. Lifetime hardware repair.
            </p>
          </div>

          {/* Beat 2: Smartphones & Protection (15% to 40%) */}
          <div className={`absolute left-6 right-6 md:right-auto md:left-24 max-w-lg flex flex-col items-center md:items-start text-center md:text-left transition-all duration-1000 transform ${
            scrollProgress >= 0.15 && scrollProgress < 0.40 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 -translate-x-10 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00D6FF] uppercase tracking-wider mb-2">
              <Cpu className="w-4 h-4" />
              <span>Smartphones & Cases</span>
            </div>
            <h2 className="text-2xl md:text-5xl font-bold tracking-tight text-white/95 mb-4">
              Latest Phones & Custom Cases.
            </h2>
            <p className="text-xs md:text-base text-white/60 leading-relaxed space-y-4">
              Upgrade to the newest iPhone, Samsung Galaxy, or flagship Google Pixel.
              <br /><br />
              Protect your screen and device with our extensive catalog of shockproof, luxury, and personalized phone cases.
            </p>
          </div>

          {/* Beat 3: Audio Essentials (40% to 65%) */}
          <div className={`absolute left-6 right-6 md:left-auto md:right-24 max-w-lg flex flex-col items-center md:items-end text-center md:text-right transition-all duration-1000 transform ${
            scrollProgress >= 0.40 && scrollProgress < 0.65 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-10 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00D6FF] uppercase tracking-wider mb-2">
              <Volume2 className="w-4 h-4" />
              <span>Immersive Audio</span>
            </div>
            <h2 className="text-2xl md:text-5xl font-bold tracking-tight text-white/95 mb-4">
              Headphones & Earbuds.
            </h2>
            <ul className="text-xs md:text-base text-white/60 space-y-3 text-left md:text-right">
              <li className="flex items-start md:justify-end gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D6FF] mt-2 shrink-0 md:order-last" />
                <span>Premium over-ear wireless headphones with active noise cancellation.</span>
              </li>
              <li className="flex items-start md:justify-end gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D6FF] mt-2 shrink-0 md:order-last" />
                <span>Compact wireless earbuds with deep bass and smart touch controls.</span>
              </li>
              <li className="flex items-start md:justify-end gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D6FF] mt-2 shrink-0 md:order-last" />
                <span>High-fidelity audio for movies, workouts, and music on the go.</span>
              </li>
            </ul>
          </div>

          {/* Beat 4: Premium Accessories (65% to 85%) */}
          <div className={`absolute left-6 right-6 md:left-auto md:right-auto max-w-2xl flex flex-col items-center text-center transition-all duration-1000 transform ${
            scrollProgress >= 0.65 && scrollProgress < 0.85 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00D6FF] uppercase tracking-wider mb-2">
              <Disc className="w-4 h-4 animate-spin-slow" />
              <span>Essential Power & Connect</span>
            </div>
            <h2 className="text-2xl md:text-6xl font-bold tracking-tight text-white/95 mb-4">
              Cables, Chargers & More.
            </h2>
            <p className="text-xs md:text-base text-white/60 leading-relaxed max-w-xl">
              Equip your tech with fast chargers, wireless pads, high-performance cables, screen protectors, car mounts, and laptop docks. Everything you need to power your tech stack.
            </p>
          </div>

          {/* Beat 5: Intro (85% to 100%) */}
          <div className={`absolute left-6 right-6 md:left-auto md:right-auto flex flex-col items-center text-center max-w-3xl transition-all duration-1000 transform ${
            scrollProgress >= 0.85 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
          }`}>
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#00D6FF] mb-3">Rex Mobile & Computers</span>
            <h2 className="text-3xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60 mb-4 select-none">
              Your Premium Tech Hub
            </h2>
            <p className="text-xs md:text-lg text-white/60 max-w-xl leading-relaxed">
              Providing top-tier smartphones, custom cases, premium audio, essential accessories, and expert repair services.
            </p>
          </div>

        </div>

        {/* Scroll down indicator / footer detail (Fixed Bottom) */}
        <div className="relative z-10 p-6 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest select-none pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D6FF]" />
            <span>Phones & Tech Accessories</span>
          </div>
          
          <div className={`transition-opacity duration-500 ${scrollProgress > 0.05 ? 'opacity-0' : 'opacity-100 animate-bounce'}`}>
            <span>Scroll to explore shop</span>
          </div>
          
          <div>
            <span>Expert Technical Repair</span>
          </div>
        </div>

      </div>

    </div>
  );
}
