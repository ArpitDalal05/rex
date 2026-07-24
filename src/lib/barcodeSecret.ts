// Secret Code Mapping & AES-256-GCM Encrypted Barcode Utility

export const DIGIT_TO_LETTER: Record<string, string> = {
  '1': 'L',
  '2': 'O',
  '3': 'R',
  '4': 'D',
  '5': 'G',
  '6': 'A',
  '7': 'N',
  '8': 'E',
  '9': 'S',
  '0': 'H',
};

export const LETTER_TO_DIGIT: Record<string, string> = {
  'L': '1', 'l': '1',
  'O': '2', 'o': '2',
  'R': '3', 'r': '3',
  'D': '4', 'd': '4',
  'G': '5', 'g': '5',
  'A': '6', 'a': '6',
  'N': '7', 'n': '7',
  'E': '8', 'e': '8',
  'S': '9', 's': '9',
  'H': '0', 'h': '0',
};

export function encodePriceToSecretCode(price: string | number): string {
  const str = String(price).trim();
  let result = '';
  for (const char of str) {
    if (DIGIT_TO_LETTER[char]) {
      result += DIGIT_TO_LETTER[char];
    } else {
      result += char;
    }
  }
  return result;
}

export function decodeSecretCodeToPrice(code: string): string {
  const str = String(code).trim().toUpperCase();
  let result = '';
  for (const char of str) {
    if (LETTER_TO_DIGIT[char]) {
      result += LETTER_TO_DIGIT[char];
    } else {
      result += char;
    }
  }
  return result;
}

// AES Key derivation using SHA-256
async function getAESKey(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const hash = await window.crypto.subtle.digest('SHA-256', enc.encode(passphrase));
  return window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Compact AES-256-GCM Encryption (produces clean 22-char uppercase Hex string for 100% Code 128 scanner readability)
export async function encryptSecretCode(text: string, passKey: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not supported in this environment');
  }
  const key = await getAESKey(passKey || 'REX_BARCODE_SECRET_DEFAULT_KEY');
  const iv = window.crypto.getRandomValues(new Uint8Array(4)); // 4-byte IV
  const enc = new TextEncoder();
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 32 },
    key,
    enc.encode(text)
  );

  const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.length);

  return Array.from(combined)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

// AES-256-GCM Decryption
export async function decryptBarcodeData(encryptedText: string, passKey: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not supported in this environment');
  }
  const cleanInput = encryptedText.trim().replace(/[^0-9A-Fa-f]/g, '');
  if (cleanInput.length < 14) {
    throw new Error('Invalid barcode format or length');
  }

  const key = await getAESKey(passKey || 'REX_BARCODE_SECRET_DEFAULT_KEY');
  const bytes = new Uint8Array(cleanInput.length / 2);
  for (let i = 0; i < cleanInput.length; i += 2) {
    bytes[i / 2] = parseInt(cleanInput.substring(i, i + 2), 16);
  }

  // 4-byte IV format
  const iv = bytes.slice(0, 4);
  const ciphertext = bytes.slice(4);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 32 },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    // Legacy 12-byte IV format fallback
    if (bytes.length >= 28) {
      const legacyIv = bytes.slice(0, 12);
      const legacyCt = bytes.slice(12);
      const legacyBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: legacyIv },
        key,
        legacyCt
      );
      return new TextDecoder().decode(legacyBuffer);
    }
    throw err;
  }
}

// Code 128 (Code 128B) Barcode Patterns Table (Standard ISO/IEC 15417)
const CODE128_PATTERNS: string[] = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
  "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
  "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
  "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
  "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
  "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
  "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
  "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
  "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
  "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
  "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
  "10111101110", "11101011110", "11110101110", "11010000100", "11010010000", // 104: Start Code B
  "11010011000", // 105: Start Code C
  "1100011101011" // 106: Stop Code
];

export function generateCode128Binary(text: string): string {
  if (!text) return '';
  
  const startCodeB = 104;
  let checksum = startCodeB;
  let binaryStr = CODE128_PATTERNS[startCodeB];

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    let codeIndex = charCode - 32;
    if (codeIndex < 0 || codeIndex > 95) {
      codeIndex = 31;
    }
    checksum += codeIndex * (i + 1);
    binaryStr += CODE128_PATTERNS[codeIndex];
  }

  const checksumIndex = checksum % 103;
  binaryStr += CODE128_PATTERNS[checksumIndex];
  binaryStr += CODE128_PATTERNS[106];

  return binaryStr;
}

export function drawBarcodeToCanvas(
  canvas: HTMLCanvasElement, 
  text: string, 
  options?: { secretCodeText?: string }
) {
  const binary = generateCode128Binary(text);
  if (!binary) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 3px module width for 100% crisp scanner recognition
  const moduleWidth = 3; 
  const quietZoneModules = 12; // 12 module width quiet zone
  const quietZonePx = quietZoneModules * moduleWidth; // 36px quiet zone

  const barcodeDrawWidth = binary.length * moduleWidth;
  const canvasWidth = barcodeDrawWidth + quietZonePx * 2;
  const canvasHeight = options?.secretCodeText ? 180 : 140;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Disable smoothing for sharp vector-like edges
  ctx.imageSmoothingEnabled = false;

  // Pure White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Uninterrupted Tall Black Bars (topY=10 to 140px height)
  const barHeight = options?.secretCodeText ? 130 : 124;
  const topY = 10;

  ctx.fillStyle = '#000000';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      const x = quietZonePx + i * moduleWidth;
      ctx.fillRect(x, topY, moduleWidth, barHeight);
    }
  }

  // Draw Secret Code text cleanly BELOW the bars on pure white background
  if (options?.secretCodeText) {
    const textY = canvasHeight - 8;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(options.secretCodeText, canvasWidth / 2, textY);
  }
}
