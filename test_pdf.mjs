import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const typedarray = new Uint8Array([37, 80, 68, 70, 45, 49, 46]); // %PDF-1.
try {
  const loadingTask = pdfjsLib.getDocument({ data: typedarray });
  console.log("With {data: typedarray} works!");
} catch (e) {
  console.error("With {data: typedarray} error:", e.message);
}

try {
  const loadingTask = pdfjsLib.getDocument(typedarray);
  console.log("With typedarray works!");
} catch (e) {
  console.error("With typedarray error:", e.message);
}
