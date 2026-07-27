/**
 * T6-C: Export Utility
 * Helper functions to export documents as PDF, HTML, or plain text.
 * Uses browser APIs for client-side export.
 */

export type ExportFormat = "html" | "txt" | "pdf";

interface ExportOptions {
  title: string;
  content: string; // HTML content
  format: ExportFormat;
  filename?: string;
}

/**
 * Export document content in the specified format.
 * Returns a Blob that can be downloaded.
 */
export async function exportDocument({ title, content, format, filename }: ExportOptions): Promise<Blob | null> {
  switch (format) {
    case "html":
      return exportAsHtml(title, content);
    case "txt":
      return exportAsText(content);
    case "pdf":
      return exportAsPdf(title, content);
    default:
      return null;
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger export and download
 */
export async function downloadDocument({ title, content, format, filename }: ExportOptions) {
  const blob = await exportDocument({ title, content, format, filename });
  if (!blob) return;
  
  const extMap: Record<ExportFormat, string> = {
    html: "html",
    txt: "txt",
    pdf: "pdf",
  };
  
  const safeName = (filename || title || "document")
    .replace(/[^a-zA-Z-9-_ ]/g, "")
    .replace(/\s+/g, "_")
    .substring(, 50);
  
  downloadBlob(blob, `${safeName}.${extMap[format]}`);
}

/**
 * Export as styled HTML document
 */
function exportAsHtml(title: string, content: string): Blob {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin:  auto; padding: 2rem; color: #1a1a2e; line-height: 1.6; }
    h1 { font-size: 2rem; border-bottom: 2px solid #3b82f6; padding-bottom: .5rem; }
    h2 { font-size: 1.5rem; color: #2563eb; margin-top: 1.5rem; }
    h3 { font-size: 1.25rem; color: #1e40af; }
    p { margin: .5rem  ; }
    ul, ol { margin: .5rem  ; padding-left: 1.5rem; }
    li { margin: .25rem  ; }
    hr { border: none; border-top: 1px solid #e2e8f; margin: 1.5rem  ; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1rem ; padding: .5rem 1rem; background: #f8fafc; }
    code { background: #f1f5f9; padding: .2rem .4rem; border-radius: 4px; font-size: .875em; }
    pre { background: #f1f5f9; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
  return new Blob([html], { type: "text/html;charset=utf-8" });
}

/**
 * Export as plain text
 */
function exportAsText(content: string): Blob {
  const text = stripHtml(content);
  return new Blob([text], { type: "text/plain;charset=utf-8" });
}

/**
 * Export as PDF using browser print-to-PDF
 */
async function exportAsPdf(title: string, content: string): Promise<Blob | null> {
  // Create a temporary iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return null;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin:  auto; padding: 1in; color: #; line-height: 1.6; }
    h1 { font-size: 24pt; }
    h2 { font-size: 18pt; }
    h3 { font-size: 14pt; }
    @media print { body { margin:  ; padding: .5in; } }
  </style>
</head>
<body>${content}</body>
</html>`;

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to render
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Trigger print dialog which allows "Save as PDF"
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  } catch {
    // Fallback
  }

  // Remove iframe after a delay
  setTimeout(() => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }, 100);

  // Return null since we're using browser print
  return null;
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
