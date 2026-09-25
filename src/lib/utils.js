import { marked } from 'marked';
import DOMPurify from 'dompurify';
import * as pdfjsLib from 'pdfjs-dist';

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/** Maximum allowed upload file size (5 MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Chunk size (characters) and overlap for RAG-style retrieval.
 * ~1500 chars ≈ ~375 tokens, a comfortable context window slice.
 */
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

// ── In-memory document-processing cache ─────────────────────────────────
// Key: a simple content hash (cheap to compute in the browser).
// Value: the extracted text string.
// We cap the cache at 10 entries so it doesn't grow unbounded in a session.
const _docCache = new Map();
const _DOC_CACHE_MAX = 10;

/**
 * Cheaply hash a string to use as a cache key.
 * Uses a djb2-style polynomial hash — good enough for cache keying.
 * @param {string} str
 * @returns {string}
 */
export function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash.toString(36);
}

/** Evict the oldest cache entry when the cache is full. */
function _cacheSet(key, value) {
  if (_docCache.size >= _DOC_CACHE_MAX) {
    _docCache.delete(_docCache.keys().next().value);
  }
  _docCache.set(key, value);
}

/**
 * Validate a file before processing.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file) {
  if (!file) return { valid: false, error: 'No file provided.' };
  if (file.size === 0) return { valid: false, error: 'The file is empty.' };
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` };
  }
  const allowed = ['application/pdf', 'text/plain', 'text/markdown'];
  const ext = file.name.split('.').pop().toLowerCase();
  const allowedExts = ['pdf', 'txt', 'md'];
  if (!allowed.includes(file.type) && !allowedExts.includes(ext)) {
    return { valid: false, error: `Unsupported file type: ${file.name}. Please upload a PDF, TXT, or MD file.` };
  }
  return { valid: true };
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function escapeHtml(unsafe) {
  return (unsafe || '').toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function renderMarkdown(md) {
  if (!md) return '';
  const rawHtml = marked.parse(md);
  
  // Secure configuration for DOMPurify
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'del'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  });
}

/**
 * Split text into overlapping chunks for retrieval.
 * @param {string} text
 * @param {number} [chunkSize]
 * @param {number} [overlap]
 * @returns {string[]}
 */
export function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!text || text.length === 0) return [];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize - overlap;
    if (start + overlap >= text.length) break;
  }
  // Include any trailing text not already captured
  const lastStart = Math.max(0, text.length - chunkSize);
  if (chunks.length === 0 || lastStart > (chunks.length - 1) * (chunkSize - overlap)) {
    const tail = text.slice(lastStart);
    if (tail && (chunks.length === 0 || tail !== chunks[chunks.length - 1])) {
      chunks.push(tail);
    }
  }
  return chunks;
}

/**
 * Retrieve the most relevant chunks for a query using simple term frequency.
 * Deduplicates and returns up to `topK` chunks joined as a single string.
 *
 * @param {string[]} chunks - Pre-chunked document slices
 * @param {string} query   - The user's question
 * @param {number} [topK]  - Number of top chunks to return
 * @returns {string}       - Concatenated relevant context
 */
export function retrieveRelevantChunks(chunks, query, topK = 4) {
  if (!chunks || chunks.length === 0) return '';
  if (!query || query.trim().length === 0) return chunks.slice(0, topK).join('\n\n---\n\n');

  // Tokenise query into lowercase words (≥3 chars), deduplicated
  const terms = [...new Set(
    query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length >= 3)
  )];

  if (terms.length === 0) return chunks.slice(0, topK).join('\n\n---\n\n');

  const scored = chunks.map((chunk, idx) => {
    const lower = chunk.toLowerCase();
    const score = terms.reduce((acc, term) => {
      // Count occurrences, normalize by chunk length to favour precision
      const count = (lower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      return acc + count;
    }, 0);
    return { idx, chunk, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, topK)
    .sort((a, b) => a.idx - b.idx) // restore document order
    .map(s => s.chunk)
    .join('\n\n---\n\n') ||
    chunks.slice(0, topK).join('\n\n---\n\n'); // fallback: first N chunks
}

/**
 * Extract text from a PDF file with in-memory caching.
 * Re-extracting the same file (same bytes) returns instantly from cache.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result);

        // Cache key: hash of raw bytes (fast uint8 reduce)
        const cacheKey = hashString(Array.from(typedarray.slice(0, 4096)).join(','));
        if (_docCache.has(cacheKey)) {
          resolve(_docCache.get(cacheKey));
          return;
        }

        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n\n'; // fix: was wrongly escaped as \\n\\n
        }
        
        const result = fullText.trim();
        _cacheSet(cacheKey, result);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  });
}
