import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function printElement(elementId: string) {
  if (typeof window === 'undefined') return;
  const element = document.getElementById(elementId);
  if (!element) return;

  // Clone the receipt node to avoid modifying original layout/state
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'print-receipt-clone';
  document.body.appendChild(clone);
  
  // Add printing class to body
  document.body.classList.add('printing-receipt');

  // Trigger native print dialog (blocks thread in most browsers until resolved)
  window.print();

  // Remove class and clone on next tick to restore page view
  setTimeout(() => {
    document.body.classList.remove('printing-receipt');
    clone.remove();
  }, 100);
}
