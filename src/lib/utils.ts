import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function printElement(elementId: string) {
  if (typeof window === 'undefined') return;
  const element = document.getElementById(elementId);
  if (!element) return;

  // Create temporary iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // Clone all styles from parent head
  const styles = document.querySelectorAll('link[rel="stylesheet"], style');
  let stylesHtml = '';
  styles.forEach(style => {
    stylesHtml += style.outerHTML;
  });

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Print Receipt</title>
        ${stylesHtml}
        <style>
          body {
            margin: 0 !important;
            padding: 10px !important;
            background: white !important;
            color: black !important;
            font-family: system-ui, -apple-system, sans-serif;
          }
          #receipt-print-wrapper {
            width: 100% !important;
            max-width: 380px !important;
            margin: 0 auto !important;
            background: white !important;
            color: black !important;
          }
          /* Reset color styles to high contrast black on white */
          #receipt-print-wrapper,
          #receipt-print-wrapper * {
            color: black !important;
            background-color: transparent !important;
            border-color: #ddd !important;
          }
          /* Specific table and border styling for thermal receipts */
          #receipt-print-wrapper table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          #receipt-print-wrapper th, 
          #receipt-print-wrapper td {
            padding: 6px 4px !important;
            border-bottom: 1px solid #ddd !important;
          }
          #receipt-print-wrapper th {
            border-bottom: 2px solid black !important;
          }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
        </style>
      </head>
      <body>
        <div id="receipt-print-wrapper">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Wait 500ms for style sheets to load, then print
  setTimeout(() => {
    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
    setTimeout(() => {
      iframe.remove();
    }, 1000);
  }, 500);
}
