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

// AES-256-GCM Encryption
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

export async function encryptSecretCode(text: string, passKey: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not supported in this environment');
  }
  const key = await getAESKey(passKey || 'REX_BARCODE_SECRET_DEFAULT_KEY');
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
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

export async function decryptBarcodeData(encryptedHex: string, passKey: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not supported in this environment');
  }
  const cleanHex = encryptedHex.trim().replace(/[^0-9A-Fa-f]/g, '');
  if (cleanHex.length < 32) {
    throw new Error('Invalid barcode data format or invalid length');
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }

  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);

  const key = await getAESKey(passKey || 'REX_BARCODE_SECRET_DEFAULT_KEY');
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

// Code 128 (Code 128B) Barcode Patterns Table
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
  
  // Use Code 128B for ASCII text
  const startCodeB = 104;
  let checksum = startCodeB;
  let binaryStr = CODE128_PATTERNS[startCodeB];

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    let codeIndex = charCode - 32;
    if (codeIndex < 0 || codeIndex > 95) {
      codeIndex = 31; // fallback to space if non-ASCII
    }
    checksum += codeIndex * (i + 1);
    binaryStr += CODE128_PATTERNS[codeIndex];
  }

  const checksumIndex = checksum % 103;
  binaryStr += CODE128_PATTERNS[checksumIndex];
  binaryStr += CODE128_PATTERNS[106]; // Stop Code

  return binaryStr;
}

export function drawBarcodeToCanvas(
  canvas: HTMLCanvasElement, 
  text: string, 
  options?: { width?: number; height?: number; quietZone?: number }
) {
  const binary = generateCode128Binary(text);
  if (!binary) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const height = options?.height || 80;
  const quietZone = options?.quietZone || 10;
  const moduleWidth = Math.max(1, Math.floor((options?.width || 300) / (binary.length + quietZone * 2)));

  const totalWidth = (binary.length + quietZone * 2) * moduleWidth;
  canvas.width = totalWidth;
  canvas.height = height;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bars
  ctx.fillStyle = '#000000';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      const x = (quietZone + i) * moduleWidth;
      ctx.fillRect(x, 0, moduleWidth, height);
    }
  }
}
