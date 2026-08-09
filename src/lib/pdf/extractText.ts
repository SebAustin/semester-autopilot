/**
 * Client-only PDF text extraction. pdfjs-dist (~350kb) is imported
 * dynamically inside the call so it never touches any route's initial bundle.
 */

export interface PdfTextResult {
  text: string;
  pageCount: number;
  charsPerPage: number;
  /** Almost no text layer → likely a scan; we tell the user to paste instead. */
  looksScanned: boolean;
}

const SCANNED_CHARS_PER_PAGE = 50;

interface TextItemLike {
  str?: string;
  hasEOL?: boolean;
}

export async function extractPdfText(file: File): Promise<PdfTextResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const document = await loadingTask.promise;

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => {
        const textItem = item as TextItemLike;
        if (typeof textItem.str !== "string") return "";
        return textItem.str + (textItem.hasEOL ? "\n" : " ");
      })
      .join("");
    pages.push(pageText.trim());
  }

  await loadingTask.destroy();

  const text = pages.join("\n\n").trim();
  const charsPerPage = Math.round(text.length / Math.max(1, pages.length));

  return {
    text,
    pageCount: pages.length,
    charsPerPage,
    looksScanned: charsPerPage < SCANNED_CHARS_PER_PAGE,
  };
}
