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

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Print Receipt</title>
        <style>
          body {
            margin: 0;
            padding: 10px;
            font-family: system-ui, -apple-system, sans-serif;
            background: white;
            color: black;
          }
          #receipt-print-wrapper {
            width: 100%;
            max-width: 380px;
            margin: 0 auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          th, td {
            text-align: left;
            padding: 6px 4px;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
          }
          th {
            font-weight: bold;
            border-bottom: 2px solid black;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-mono { font-family: monospace; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .text-xs { font-size: 11px; }
          .text-sm { font-size: 13px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .space-y-1 > * + * { margin-top: 4px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .border-b { border-bottom: 1px solid #ddd; }
          .border-t { border-top: 1px solid #ddd; }
          .border-t-2 { border-top: 2px solid black; }
          .pb-4 { padding-bottom: 16px; }
          .mb-4 { margin-bottom: 16px; }
          .mt-4 { margin-top: 16px; }
          .pt-2 { padding-top: 8px; }
          .pt-4 { padding-top: 16px; }
          .italic { font-style: italic; }
          /* Reset color styles to high contrast black on white */
          * {
            color: black !important;
            background-color: transparent !important;
          }
        </style>
      </head>
      <body>
        <div id="receipt-print-wrapper">
          ${element.innerHTML}
        </div>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() {
              window.frameElement.remove();
            }, 1000);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();
}
