import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Client-side PDF export using html2canvas + jsPDF.
 * The backend Puppeteer route is preferred in production; this hook
 * provides an always-available fallback (or primary) for the React app.
 *
 * Usage:
 *   const { exporting, exportPDF } = useExportPDF();
 *   <button onClick={() => exportPDF(ref, "report.pdf")} disabled={exporting}>
 */
export default function useExportPDF() {
  const [exporting, setExporting] = useState(false);

  async function exportPDF(elementRef, filename = "report.pdf", title = "Monitoring Report") {
    if (!elementRef?.current) return;
    setExporting(true);

    try {
      const el = elementRef.current;

      // Capture the DOM element at 2× resolution for crisp output
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        // Ensure canvases (recharts SVG-to-canvas) are included
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();   // 210
      const pageH = pdf.internal.pageSize.getHeight();  // 297
      const margin = 12;
      const usableW = pageW - margin * 2;

      // ── Header ──────────────────────────────────────────────────────────
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageW, pageH, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.setTextColor(17, 24, 39);
      pdf.text(title, margin, 17);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text(
        `April 2026 · All environments · Generated ${new Date().toLocaleString()}`,
        margin,
        23
      );

      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.4);
      pdf.line(margin, 27, pageW - margin, 27);

      // ── Dashboard screenshot ────────────────────────────────────────────
      const aspect = canvas.height / canvas.width;
      const imgW = usableW;
      const imgH = imgW * aspect;
      const maxH = pageH - 35 - margin;
      const finalH = Math.min(imgH, maxH);
      const finalW = finalH / aspect;

      pdf.addImage(imgData, "PNG", margin, 31, finalW, finalH);

      // If content overflows to a second page
      if (imgH > maxH) {
        const remainH = imgH - maxH;
        const scale = finalW / canvas.width;
        pdf.addPage();
        pdf.addImage(
          imgData, "PNG",
          margin, margin,
          finalW, imgH,
          undefined, "FAST",
          0,
          -(maxH / scale) // vertical offset into the source image
        );
      }

      // ── Footer ──────────────────────────────────────────────────────────
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(156, 163, 175);
        pdf.text("Confidential · Auto-generated monitoring report", margin, pageH - 6);
        pdf.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 6, { align: "right" });
      }

      pdf.save(filename);
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportPDF };
}
