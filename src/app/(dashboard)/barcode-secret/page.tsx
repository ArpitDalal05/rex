'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Barcode, 
  Lock, 
  Key, 
  Printer, 
  Download, 
  Camera, 
  History, 
  Settings, 
  Sparkles, 
  Search, 
  Trash2, 
  Check, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  encodePriceToSecretCode, 
  decodeSecretCodeToPrice, 
  encryptSecretCode, 
  decryptBarcodeData, 
  drawBarcodeToCanvas 
} from '@/lib/barcodeSecret';

interface HistoryItem {
  id: string;
  price: string;
  secretCode: string;
  encryptedData: string;
  createdAt: string;
}

export default function BarcodeSecretPage() {
  const [activeTab, setActiveTab] = useState('generator');

  // Encryption Key State
  const [encryptionKey, setEncryptionKey] = useState<string>('REX_SECRET_KEY_2026');
  const [showKey, setShowKey] = useState(false);

  // Generator State
  const [priceInput, setPriceInput] = useState<string>('250');
  const [secretCode, setSecretCode] = useState<string>('OGH');
  const [encryptedData, setEncryptedData] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Decoder State
  const [manualCode, setManualCode] = useState<string>('OGH');
  const [manualPriceResult, setManualPriceResult] = useState<string>('250');

  // Scanner State
  const [scannedEncryptedText, setScannedEncryptedText] = useState<string>('');
  const [scanResultCode, setScanResultCode] = useState<string | null>(null);
  const [scanResultPrice, setScanResultPrice] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanningCamera, setIsScanningCamera] = useState<boolean>(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isScanningRef = useRef<boolean>(false);

  // Load Settings & History from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('rex_encryption_key');
      if (savedKey) setEncryptionKey(savedKey);

      const savedHistory = localStorage.getItem('rex_barcode_history');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse saved history", e);
        }
      }
    }
  }, []);

  // Update Secret Code & Encrypted Data when Price or Key changes
  useEffect(() => {
    const code = encodePriceToSecretCode(priceInput);
    setSecretCode(code);
    
    let isMounted = true;
    if (code) {
      setIsEncrypting(true);
      encryptSecretCode(code, encryptionKey)
        .then((encryptedStr) => {
          if (isMounted) {
            setEncryptedData(encryptedStr);
            setIsEncrypting(false);
          }
        })
        .catch((err) => {
          console.error("Encryption error:", err);
          if (isMounted) setIsEncrypting(false);
        });
    } else {
      setEncryptedData('');
    }

    return () => { isMounted = false; };
  }, [priceInput, encryptionKey]);

  // Redraw Barcode Canvas when Encrypted Data or Secret Code changes
  useEffect(() => {
    if (canvasRef.current && encryptedData) {
      drawBarcodeToCanvas(canvasRef.current, encryptedData, {
        secretCodeText: secretCode
      });
    }
  }, [encryptedData, secretCode]);

  // Manual Secret Code Decoder
  useEffect(() => {
    if (manualCode) {
      setManualPriceResult(decodeSecretCodeToPrice(manualCode));
    } else {
      setManualPriceResult('');
    }
  }, [manualCode]);

  // Save Key to LocalStorage
  const handleSaveKey = (newKey: string) => {
    setEncryptionKey(newKey);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rex_encryption_key', newKey);
    }
  };

  // Save Sticker to History
  const handleSaveToHistory = () => {
    if (!encryptedData || !secretCode) return;
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      price: priceInput,
      secretCode,
      encryptedData,
      createdAt: new Date().toLocaleString()
    };

    const updated = [newItem, ...history];
    setHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rex_barcode_history', JSON.stringify(updated));
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Clear History
  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all sticker history?")) {
      setHistory([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rex_barcode_history');
      }
    }
  };

  // Export PNG / JPG (Contains ONLY the barcode and secret code text, no shop title)
  const handleExportImage = (format: 'png' | 'jpg') => {
    if (!encryptedData || !secretCode) return;

    const exportCanvas = document.createElement('canvas');
    drawBarcodeToCanvas(exportCanvas, encryptedData, {
      secretCodeText: secretCode
    });

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataUrl = exportCanvas.toDataURL(mimeType, 1.0);
    const link = document.createElement('a');
    link.download = `barcode_${secretCode}_${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
  };

  // Direct Barcode Print (No header text)
  const handlePrintSticker = () => {
    if (!canvasRef.current) return;

    const barcodeDataUrl = canvasRef.current.toDataURL('image/png');

    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${secretCode}</title>
          <style>
            @page {
              size: 50mm 30mm;
              margin: 0;
            }
            body {
              font-family: sans-serif;
              margin: 0;
              padding: 4px;
              text-align: center;
              background: #fff;
              color: #000;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            .barcode-img {
              width: 95%;
              height: auto;
              max-height: 95%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${barcodeDataUrl}" class="barcode-img" />
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Decrypt Barcode Text
  const handleDecryptScannedText = async (text: string) => {
    try {
      setScanError(null);
      const code = await decryptBarcodeData(text, encryptionKey);
      setScanResultCode(code);
      setScanResultPrice(decodeSecretCodeToPrice(code));
    } catch (err: any) {
      console.error("Decryption failed:", err);
      setScanError("Failed to decrypt barcode! Invalid encryption key or corrupted data.");
      setScanResultCode(null);
      setScanResultPrice(null);
    }
  };

  // Camera Scanner Handler with Detection Loop
  const startCameraScanner = async () => {
    setIsScanningCamera(true);
    isScanningRef.current = true;
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setScanError("Camera access denied or unavailable.");
      setIsScanningCamera(false);
      isScanningRef.current = false;
    }
  };

  const scanVideoFrame = async () => {
    if (!videoRef.current || !isScanningRef.current) return;

    if ('BarcodeDetector' in window) {
      try {
        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ['code_128', 'qr_code', 'ean_13'] });
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          if (rawValue) {
            setScannedEncryptedText(rawValue);
            handleDecryptScannedText(rawValue);
            stopCameraScanner();
            return;
          }
        }
      } catch (e) {
        // continue loop
      }
    }

    if (isScanningRef.current) {
      requestAnimationFrame(scanVideoFrame);
    }
  };

  const stopCameraScanner = () => {
    isScanningRef.current = false;
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanningCamera(false);
  };

  const filteredHistory = history.filter(item => 
    item.secretCode.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.price.includes(historySearch) ||
    item.createdAt.includes(historySearch)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Barcode className="w-8 h-8 text-primary" />
            <span>Encrypted Barcode Secret System</span>
          </h1>
          <p className="text-muted-foreground">
            Convert prices to secret letter codes, encrypt into standard Code 128 barcodes, print stickers, and scan to decrypt.
          </p>
        </div>

        <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1.5 gap-1.5 border-primary/30 bg-primary/5 text-primary">
          <ShieldCheck className="w-4 h-4" />
          <span>AES-256-GCM Secure Encryption</span>
        </Badge>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/60">
          <TabsTrigger value="generator" className="gap-2 py-2.5">
            <Barcode className="w-4 h-4" />
            <span>Barcode Generator</span>
          </TabsTrigger>

          <TabsTrigger value="scanner" className="gap-2 py-2.5">
            <Camera className="w-4 h-4" />
            <span>Scanner & Decoder</span>
          </TabsTrigger>

          <TabsTrigger value="history" className="gap-2 py-2.5">
            <History className="w-4 h-4" />
            <span>Sticker History</span>
          </TabsTrigger>

          <TabsTrigger value="settings" className="gap-2 py-2.5">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: STICKER GENERATOR */}
        <TabsContent value="generator" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Card: Input & Conversion Details */}
            <Card className="border-none shadow-sm flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Encode Price & Encrypt</span>
                </CardTitle>
                <CardDescription>
                  Enter a numeric price. Digits are mapped to secret letters and encrypted into the barcode.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Numeric Price (₹)</label>
                    <Input 
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="e.g. 250"
                      className="text-lg font-bold font-mono tracking-wide"
                    />
                    <p className="text-xs text-muted-foreground">
                      Mapping: 1=L, 2=O, 3=R, 4=D, 5=G, 6=A, 7=N, 8=E, 9=S, 0=H
                    </p>
                  </div>

                  {/* Secret Code Display */}
                  <div className="p-4 rounded-xl bg-muted/50 border space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated Secret Code</span>
                    <div className="text-3xl font-black font-mono tracking-widest text-primary">
                      {secretCode || '---'}
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Price <span className="font-semibold text-foreground">₹{priceInput || '0'}</span> converts to secret code <span className="font-semibold text-foreground">{secretCode || '---'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t">
                  <Button 
                    onClick={handleSaveToHistory} 
                    disabled={!encryptedData}
                    className="w-full gap-2"
                  >
                    {saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <History className="w-4 h-4" />}
                    <span>{saveSuccess ? 'Saved to History!' : 'Save to History'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Card: Crisp Code 128 Barcode Preview & Export Controls */}
            <Card className="border-none shadow-sm flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Printer className="w-5 h-5 text-primary" />
                  <span>Barcode Preview</span>
                </CardTitle>
                <CardDescription>
                  100% Scanner-readable Code 128 barcode preview with embedded secret code.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col justify-center items-center">
                {/* Crisp Canvas Container */}
                <div className="w-full max-w-[360px] p-4 bg-white rounded-lg border-2 border-slate-300 shadow-md flex flex-col items-center justify-center select-none overflow-x-auto">
                  <canvas ref={canvasRef} className="w-full max-h-[160px] object-contain" />
                </div>

                <div className="text-center text-xs text-muted-foreground max-w-xs">
                  Barcode contains encrypted data only. Secret Code (<span className="font-semibold text-foreground">{secretCode || '---'}</span>) is printed below the bars.
                </div>
              </CardContent>

              {/* Action Buttons */}
              <div className="p-6 pt-0 border-t mt-4 grid grid-cols-3 gap-3">
                <Button variant="outline" size="sm" onClick={() => handleExportImage('png')} disabled={!encryptedData} className="gap-1.5">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>PNG</span>
                </Button>

                <Button variant="outline" size="sm" onClick={() => handleExportImage('jpg')} disabled={!encryptedData} className="gap-1.5">
                  <Download className="w-4 h-4 text-purple-500" />
                  <span>JPG</span>
                </Button>

                <Button size="sm" onClick={handlePrintSticker} disabled={!encryptedData} className="gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:opacity-90">
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: BARCODE SCANNER & MANUAL DECODER */}
        <TabsContent value="scanner" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Box: Camera & Text Barcode Scanner */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  <span>Barcode Scanner</span>
                </CardTitle>
                <CardDescription>
                  Scan an encrypted barcode using your camera or handheld scanner.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Camera Feed Container */}
                <div className="relative w-full h-48 bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center border">
                  {isScanningCamera ? (
                    <video ref={videoRef} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400 p-4 text-center">
                      <Camera className="w-10 h-10 stroke-1" />
                      <span className="text-xs">Camera is idle. Click below to activate scanner.</span>
                    </div>
                  )}

                  {isScanningCamera && (
                    <div className="absolute inset-0 border-2 border-emerald-500/60 m-6 rounded-lg pointer-events-none animate-pulse flex items-center justify-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-black/60 px-2 py-0.5 rounded">Scanning Barcode...</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {!isScanningCamera ? (
                    <Button onClick={startCameraScanner} className="w-full gap-2">
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Scanner</span>
                    </Button>
                  ) : (
                    <Button onClick={stopCameraScanner} variant="destructive" className="w-full gap-2">
                      <Camera className="w-4 h-4" />
                      <span>Stop Camera</span>
                    </Button>
                  )}
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-muted"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-muted-foreground uppercase">OR USE HARDWARE SCANNER / PASTE</span>
                  <div className="flex-grow border-t border-muted"></div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Scanned Barcode Text</label>
                  <div className="flex gap-2">
                    <Input 
                      value={scannedEncryptedText}
                      onChange={(e) => {
                        setScannedEncryptedText(e.target.value);
                        if (e.target.value) handleDecryptScannedText(e.target.value);
                      }}
                      placeholder="Click here & trigger hardware scanner..."
                      className="font-mono text-xs"
                      autoFocus
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => handleDecryptScannedText(scannedEncryptedText)}
                      disabled={!scannedEncryptedText}
                    >
                      Decrypt
                    </Button>
                  </div>
                </div>

                {/* Scan & Decrypt Result */}
                {scanError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-medium">
                    {scanError}
                  </div>
                )}

                {scanResultCode && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Successfully Decrypted Barcode</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Decrypted Secret Code</span>
                        <div className="text-2xl font-black font-mono text-foreground">{scanResultCode}</div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Original Price</span>
                        <div className="text-2xl font-black font-mono text-emerald-600">₹{scanResultPrice}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Box: Manual Secret Code Decoder */}
            <Card className="border-none shadow-sm flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  <span>Manual Secret Code Decoder</span>
                </CardTitle>
                <CardDescription>
                  If you see a secret code on a barcode (e.g. OGH), enter it here to view its numeric price.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col justify-center">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secret Letters Code</label>
                  <Input 
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="e.g. OGH"
                    className="text-2xl font-black font-mono uppercase tracking-widest text-center h-14"
                  />
                </div>

                <div className="flex justify-center my-2">
                  <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Original Numeric Price</span>
                  <div className="text-5xl font-black font-mono tracking-tight text-foreground">
                    ₹{manualPriceResult || '0'}
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground leading-relaxed">
                  Decodes secret letters back into numbers (L=1, O=2, R=3, D=4, G=5, A=6, N=7, E=8, S=9, H=0).
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: STICKER HISTORY */}
        <TabsContent value="history" className="mt-6 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <span>Generated Sticker History</span>
                </CardTitle>
                <CardDescription>
                  View and manage past stickers saved locally on this device.
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search secret code or date..."
                    className="pl-9 text-xs"
                  />
                </div>

                <Button variant="outline" size="sm" onClick={handleClearHistory} disabled={history.length === 0} className="text-red-500 hover:text-red-600 gap-1.5">
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {filteredHistory.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all flex flex-col justify-between gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">{item.createdAt}</span>
                          <div className="text-2xl font-black font-mono tracking-wider text-primary mt-1">{item.secretCode}</div>
                          <span className="text-xs text-muted-foreground">Original Price: <strong className="text-foreground">₹{item.price}</strong></span>
                        </div>
                        <Badge variant="secondary" className="font-mono text-[10px]">Code 128</Badge>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs gap-1"
                          onClick={() => {
                            setPriceInput(item.price);
                            setActiveTab('generator');
                          }}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Load Barcode</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <History className="w-10 h-10 mx-auto stroke-1 text-muted-foreground/60" />
                  <p className="text-sm">No saved sticker history found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: SETTINGS */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card className="border-none shadow-sm max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>Barcode & Encryption Settings</span>
              </CardTitle>
              <CardDescription>
                Customize your secret encryption key passphrase.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Secret Key Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>Secret AES Encryption Key</span>
                  <span className="text-xs text-muted-foreground">Stored securely in browser storage</span>
                </label>
                <div className="relative">
                  <Input 
                    type={showKey ? 'text' : 'password'}
                    value={encryptionKey}
                    onChange={(e) => handleSaveKey(e.target.value)}
                    placeholder="Enter secret passphrase..."
                    className="pr-10 font-mono text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only scanners configured with this exact key can decrypt barcodes generated by your app.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
