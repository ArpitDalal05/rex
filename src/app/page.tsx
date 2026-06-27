'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles, LogOut, ArrowRight, ShieldCheck, Cpu, Volume2, Disc, Play } from 'lucide-react';
import Link from 'next/link';

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  
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
      <div className="fixed inset-0 w-full h-screen overflow-hidden flex flex-col justify-between z-10 bg-[#050505]">
        
        {/* Apple style Navbar */}
        <nav className={`fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 md:px-12 z-50 transition-all duration-500 border-b ${
          scrollProgress > 0.02 
            ? 'bg-[#050505]/75 backdrop-blur-md border-white/5 shadow-2xl' 
            : 'bg-transparent border-transparent'
        }`}>
          {/* Left logo */}
          <Link href="/" className="font-bold tracking-tight text-white/90 hover:text-white transition-colors text-sm md:text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00D6FF]" />
            <span>Rex Mobile & Computers</span>
          </Link>

          {/* Center Links (Store Navigation) */}
          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-white/60 tracking-wider uppercase">
            <Link href="/dashboard-stats" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/inventory" className="hover:text-white transition-colors">Inventory</Link>
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <Link href="/sales" className="hover:text-white transition-colors">Sales</Link>
            <Link href="/billing" className="hover:text-[#00D6FF] transition-colors text-[#00D6FF]/90 font-bold">POS Billing</Link>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard-stats"
              className="text-xs font-bold bg-gradient-to-r from-[#0050FF] to-[#00D6FF] hover:opacity-90 text-white px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(0,80,255,0.4)] flex items-center gap-1.5"
            >
              <span>Manage Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            
            <button 
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors p-1.5 rounded-full hover:bg-white/5"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Dynamic Glowing Background Behind Headphone */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,80,255,0.06)_0%,transparent_60%)] pointer-events-none z-0" />

        {/* Sticky HTML5 Canvas Sequence */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0 bg-[#050505]"
        />

        {/* Interactive Storytelling beats (Absolute Center Overlays) */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 md:px-24">
          
          {/* Beat 1: Intro (0% to 15%) */}
          <div className={`absolute flex flex-col items-center text-center max-w-3xl transition-all duration-1000 transform ${
            scrollProgress < 0.15 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 -translate-y-10 scale-95 pointer-events-none'
          }`}>
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#00D6FF] mb-3">Rex Mobile & Computers</span>
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60 mb-4 select-none">
              Experience WH‑1000XM6
            </h1>
            <p className="text-sm md:text-lg text-white/60 max-w-xl leading-relaxed">
              Flagship wireless audio engineering, now featured at Rex Mobile & Computers.
            </p>
          </div>

          {/* Beat 2: Engineering Reveal (15% to 40%) */}
          <div className={`absolute left-6 md:left-24 max-w-lg transition-all duration-1000 transform ${
            scrollProgress >= 0.15 && scrollProgress < 0.40 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 -translate-x-10 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00D6FF] uppercase tracking-wider mb-2">
              <Cpu className="w-4 h-4" />
              <span>Acoustic Blueprints</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white/95 mb-4">
              Precision sound, curated for you.
            </h2>
            <p className="text-sm md:text-base text-white/60 leading-relaxed space-y-4">
              Rex Mobile & Computers brings you the peak of audio innovation. Custom drivers, sealed acoustic chambers, and optimized air flow deliver studio-grade sound.
              <br /><br />
              Every detail is curated for maximum comfort and pure immersion.
            </p>
          </div>

          {/* Beat 3: Noise Cancelling & Microphones (40% to 65%) */}
          <div className={`absolute right-6 md:right-24 max-w-lg transition-all duration-1000 transform ${
            scrollProgress >= 0.40 && scrollProgress < 0.65 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-10 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00D6FF] uppercase tracking-wider mb-2">
              <Volume2 className="w-4 h-4" />
              <span>Adaptive Processor V3</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white/95 mb-4">
              Silence the world around you.
            </h2>
            <ul className="text-sm md:text-base text-white/60 space-y-3">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D6FF] mt-2 shrink-0" />
                <span>Multi-microphone array filters surrounding ambient noise.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D6FF] mt-2 shrink-0" />
                <span>Advanced processors dynamically adjust to your environment.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D6FF] mt-2 shrink-0" />
                <span>Your sound experience remains pure, curated by Rex Mobile.</span>
              </li>
            </ul>
          </div>

          {/* Beat 4: Sound & Upscaling (65% to 85%) */}
          <div className={`absolute max-w-2xl flex flex-col items-center text-center transition-all duration-1000 transform ${
            scrollProgress >= 0.65 && scrollProgress < 0.85 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00D6FF] uppercase tracking-wider mb-2">
              <Disc className="w-4 h-4 animate-spin-slow" />
              <span>Hi-Res Audio Wireless</span>
            </div>
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-white/95 mb-4">
              Immersive, lifelike sound.
            </h2>
            <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-xl">
              High-performance drivers unlock detail, depth, and texture in every track. AI-enhanced upscaling restores clarity to compressed audio, so every note feels alive.
            </p>
          </div>

          {/* Beat 5: Reassembly & CTA (85% to 100%) */}
          <div className={`absolute flex flex-col items-center text-center max-w-xl transition-all duration-1000 transform ${
            scrollProgress >= 0.85 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
          }`}>
            <h2 className="text-3xl md:text-6xl font-black tracking-tight text-white/95 mb-3">
              Rex Mobile & Computers
            </h2>
            <p className="text-xs md:text-sm text-[#00D6FF] uppercase font-bold tracking-[0.2em] mb-6">
              Your ultimate tech destination
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link 
                href="/dashboard-stats"
                className="bg-gradient-to-r from-[#0050FF] to-[#00D6FF] text-white px-8 py-3 rounded-full font-bold text-sm shadow-[0_0_25px_rgba(0,80,255,0.45)] hover:opacity-90 transition-all flex items-center gap-2 group"
              >
                <span>Go to Stats Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/billing"
                className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-8 py-3 rounded-full font-bold text-sm border border-white/10 transition-all"
              >
                Go to POS Billing
              </Link>
            </div>
            
            <p className="text-[10px] text-white/30 mt-6 tracking-wide uppercase">
              Engineered for airports, offices, and everything in between.
            </p>
          </div>

        </div>

        {/* Scroll down indicator / footer detail */}
        <div className="relative z-10 p-6 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest select-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D6FF]" />
            <span>Dual noise sensor tech</span>
          </div>
          
          <div className={`transition-opacity duration-500 ${scrollProgress > 0.05 ? 'opacity-0' : 'opacity-100 animate-bounce'}`}>
            <span>Scroll to disassemble</span>
          </div>
          
          <div>
            <span>Stereo spatial sound</span>
          </div>
        </div>

      </div>

    </div>
  );
}
