// Secret Code Mapping & AES-256-GCM Encrypted QR Code Utility
import QRCode from 'qrcode';

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

// Compact AES-256-GCM Encryption
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
    throw new Error('Invalid code format or length');
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

// Draw Encrypted QR Code to Canvas with Secret Code Text Below
export async function drawQRCodeToCanvas(
  canvas: HTMLCanvasElement, 
  text: string, 
  options?: { secretCodeText?: string }
) {
  if (!text) return;

  const qrSize = 260;
  const canvasWidth = qrSize;
  const canvasHeight = options?.secretCodeText ? qrSize + 40 : qrSize;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Temporary canvas to generate high resolution QR Code
  const tempCanvas = document.createElement('canvas');
  await QRCode.toCanvas(tempCanvas, text, {
    width: qrSize,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });

  ctx.drawImage(tempCanvas, 0, 0, qrSize, qrSize);

  // Draw Secret Code text cleanly BELOW the QR Code
  if (options?.secretCodeText) {
    const textY = canvasHeight - 8;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(options.secretCodeText, canvasWidth / 2, textY);
  }
}

// Retain alias for backwards compatibility
export const drawBarcodeToCanvas = drawQRCodeToCanvas;
