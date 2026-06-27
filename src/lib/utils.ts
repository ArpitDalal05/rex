import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function printElement(elementId: string) {
  if (typeof window === 'undefined') return;
  const element = document.getElementById(elementId);
  if (!element) return;

  // Clean up any existing duplicate clone first
  const existing = document.getElementById('print-receipt-clone');
  if (existing) {
    existing.remove();
  }

  // Clone the receipt node to avoid modifying original layout/state
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'print-receipt-clone';
  document.body.appendChild(clone);
  
  // Add printing class to body
  document.body.classList.add('printing-receipt');

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.body.classList.remove('printing-receipt');
    clone.remove();
  };

  // Trigger native print dialog
  window.print();

  // Revert the UI after 5 seconds to ensure print preview is fully generated
  setTimeout(cleanup, 5000);
}
