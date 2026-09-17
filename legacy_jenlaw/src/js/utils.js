// ── Utility ─────────────────────────────────────────────────────────────
function el(id) { return document.getElementById(id); }

function showToast(message, type = 'default', duration = 3000) {
  const toast = el('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function detectDocType(text) {
  const t = text.toLowerCase();
  if (t.includes('lease') || t.includes('tenancy') || t.includes('landlord') || t.includes('tenant'))
    return 'Lease / Tenancy Agreement';
  if (t.includes('employment') || t.includes('employee') || t.includes('employer') || t.includes('salary'))
    return 'Employment Agreement';
  if (t.includes('non-disclosure') || t.includes('nda') || t.includes('confidential'))
    return 'NDA / Confidentiality Agreement';
  if (t.includes('service agreement') || t.includes('statement of work') || t.includes('services to be performed'))
    return 'Service Agreement';
  if (t.includes('purchase') || t.includes('buyer') || t.includes('seller') || t.includes('sale price'))
    return 'Purchase Agreement';
  if (t.includes('loan') || t.includes('borrower') || t.includes('lender') || t.includes('principal amount'))
    return 'Loan Agreement';
  if (t.includes('terms of service') || t.includes('terms and conditions') || t.includes('user agreement'))
    return 'Terms of Service';
  if (t.includes('privacy') || t.includes('personal data') || t.includes('gdpr') || t.includes('data protection'))
    return 'Privacy Policy';
  if (t.includes('partnership') || t.includes('shareholders') || t.includes('operating agreement'))
    return 'Partnership / Corporate Agreement';
  return 'Legal Document';
}

// ── Simple Markdown Renderer ─────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    // HR
    .replace(/^---$/gm, '<hr>')
    // Unordered lists
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newline to <br> within paragraphs
    .replace(/\n/g, '<br>');

  // Wrap consecutive <li> with <ul>
  html = html.replace(/(<li>.*?<\/li>(\s*<br>)*)+/g, match => {
    const items = match.replace(/<br>/g, '').trim();
    return '<ul>' + items + '</ul>';
  });

  return '<p>' + html + '</p>';
}

// ── PDF.js text extraction ───────────────────────────────────────────────
async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          fullText += `\n--- Page ${i} ---\n${pageText}\n`;
        }
        resolve(fullText.trim());
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
