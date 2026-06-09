import jsPDF from "jspdf";
import { toPng } from "html-to-image";

/**
 * Captures an HTML element by ID and downloads it as a PDF.
 * @param elementId The ID of the HTML element to capture.
 * @param filename The desired output filename (e.g., 'invoice-123.pdf').
 */
export async function downloadHtmlAsPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id '${elementId}' not found.`);
  }

  // html-to-image uses SVG foreignObject, which perfectly supports modern CSS like oklch()
  // that html2canvas fails to parse.
  
  // We specify a white background to avoid transparent backgrounds turning black in JS PDF.
  const imgData = await toPng(element, {
    backgroundColor: "#ffffff",
    pixelRatio: 2, // High resolution
    filter: (node: HTMLElement) => {
      // Ignore elements that have the data-html2canvas-ignore attribute
      if (node.hasAttribute && node.hasAttribute("data-html2canvas-ignore")) {
        return false;
      }
      return true;
    }
  });

  // Calculate PDF dimensions
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  // Get natural dimensions from element to calculate proportional height
  const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
