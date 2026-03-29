import jsPDF from "jspdf";
import type { RecipeData } from "@/lib/api";

const ORANGE = [234, 120, 30] as const;
const DARK = [30, 30, 30] as const;
const GRAY = [100, 100, 100] as const;
const LIGHT_GRAY = [150, 150, 150] as const;
const BODY = [60, 60, 60] as const;

function drawDivider(doc: jsPDF, y: number, margin: number, pageWidth: number) {
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
}

function sectionTitle(doc: jsPDF, text: string, margin: number, y: number): number {
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(text, margin, y);
  // orange underline
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 2, margin + doc.getTextWidth(text), y + 2);
  doc.setLineWidth(0.2);
  return y + 10;
}

export function exportSingleRecipePdf(recipe: RecipeData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) { doc.addPage(); y = 20; addFooter(); }
  };

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text("Native Indian Recipe AI — Detailed Report", margin, pageHeight - 10);
    doc.text(new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }), pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  // Header bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageWidth, 4, "F");

  y = 18;

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ORANGE);
  doc.text(recipe.title, margin, y);
  y += 10;

  // Meta row
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  const metaParts: string[] = [];
  if (recipe.region) metaParts.push(`📍 Region: ${recipe.region}`);
  if (recipe.time) metaParts.push(`⏱ Time: ${recipe.time}`);
  if (recipe.servings) metaParts.push(`🍽 Servings: ${recipe.servings}`);
  doc.text(metaParts.join("    |    "), margin, y);
  y += 8;

  drawDivider(doc, y, margin, pageWidth);
  y += 8;

  // Description
  if (recipe.description) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(recipe.description, contentWidth);
    checkPage(descLines.length * 6);
    doc.text(descLines, margin, y);
    y += descLines.length * 6 + 8;
  }

  // Ingredients
  y = sectionTitle(doc, "Ingredients", margin, y);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BODY);
  recipe.ingredients.forEach((ing, i) => {
    checkPage(8);
    // Numbered bullet
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ORANGE);
    doc.text(`${i + 1}.`, margin + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BODY);
    doc.text(ing, margin + 12, y);
    y += 7;
  });
  y += 6;

  // Steps
  checkPage(15);
  y = sectionTitle(doc, "Step-by-Step Method", margin, y);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BODY);
  recipe.steps.forEach((step, i) => {
    const lines = doc.splitTextToSize(step, contentWidth - 16);
    checkPage(lines.length * 6 + 8);
    // Step number circle
    doc.setFillColor(...ORANGE);
    doc.circle(margin + 5, y - 2, 4, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${i + 1}`, margin + 5, y - 0.5, { align: "center" });
    // Step text
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BODY);
    doc.text(lines, margin + 14, y);
    y += lines.length * 6 + 6;
  });

  // Nutritional / Traditional note
  y += 6;
  checkPage(30);
  y = sectionTitle(doc, "Traditional Notes", margin, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  const noteText = `This authentic ${recipe.region || "Indian"} recipe has been preserved through generations, maintaining traditional cooking methods and spice combinations. For best results, use freshly ground spices and follow the steps in order.`;
  const noteLines = doc.splitTextToSize(noteText, contentWidth);
  doc.text(noteLines, margin, y);
  y += noteLines.length * 5 + 6;

  // Footer
  addFooter();

  // Bottom bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  doc.save(`${recipe.title.replace(/\s+/g, "_")}_Report.pdf`);
}

export function exportRecipeBookPdf(recipes: RecipeData[], options?: { addCover?: boolean }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const addPageFooter = (pageNum?: number, total?: number) => {
    doc.setFontSize(7);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text("Native Indian Recipe AI — Recipe Book", margin, pageHeight - 10);
    if (pageNum !== undefined && total !== undefined) {
      doc.text(`Page ${pageNum} of ${total}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }
  };

  // Cover page
  if (options?.addCover) {
    // Orange header bar
    doc.setFillColor(...ORANGE);
    doc.rect(0, 0, pageWidth, 8, "F");

    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ORANGE);
    doc.text("Native Indian", pageWidth / 2, 70, { align: "center" });
    doc.text("Recipe Book", pageWidth / 2, 85, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(`${recipes.length} Authentic Regional Recipes`, pageWidth / 2, 105, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth / 2, 115, { align: "center" });
    doc.text("AI-Powered Recipe Platform", pageWidth / 2, 123, { align: "center" });

    // Decorative line
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 40, 95, pageWidth / 2 + 40, 95);
    doc.setLineWidth(0.2);

    // Bottom bar
    doc.setFillColor(...ORANGE);
    doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

    // Table of contents
    doc.addPage();
    doc.setFillColor(...ORANGE);
    doc.rect(0, 0, pageWidth, 4, "F");

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ORANGE);
    doc.text("Table of Contents", margin, 28);

    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.8);
    doc.line(margin, 32, margin + 60, 32);
    doc.setLineWidth(0.2);

    let tocY = 44;
    doc.setFontSize(11);
    recipes.forEach((r, i) => {
      if (tocY > pageHeight - 30) { doc.addPage(); tocY = 28; }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...ORANGE);
      doc.text(`${String(i + 1).padStart(2, "0")}`, margin, tocY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.text(r.title, margin + 12, tocY);
      doc.setTextColor(...LIGHT_GRAY);
      doc.text(r.region || "", pageWidth - margin, tocY, { align: "right" });
      // Dotted line
      doc.setDrawColor(200, 200, 200);
      const titleEnd = margin + 12 + doc.getTextWidth(r.title) + 4;
      const regionStart = pageWidth - margin - doc.getTextWidth(r.region || "") - 4;
      if (regionStart > titleEnd) {
        doc.setLineDashPattern([1, 2], 0);
        doc.line(titleEnd, tocY, regionStart, tocY);
        doc.setLineDashPattern([], 0);
      }
      tocY += 9;
    });

    addPageFooter();
  }

  // Recipe pages
  const totalRecipes = recipes.length;
  recipes.forEach((recipe, idx) => {
    if (idx > 0 || options?.addCover) doc.addPage();
    let y = 16;

    const checkPage = (needed: number) => {
      if (y + needed > pageHeight - 25) { doc.addPage(); y = 16; }
    };

    // Top bar
    doc.setFillColor(...ORANGE);
    doc.rect(0, 0, pageWidth, 4, "F");

    y = 18;

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ORANGE);
    doc.text(recipe.title, margin, y);
    y += 9;

    // Meta
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    const meta: string[] = [];
    if (recipe.region) meta.push(`Region: ${recipe.region}`);
    if (recipe.time) meta.push(`Time: ${recipe.time}`);
    if (recipe.servings) meta.push(`Servings: ${recipe.servings}`);
    doc.text(meta.join("    |    "), margin, y);
    y += 7;

    drawDivider(doc, y, margin, pageWidth);
    y += 7;

    // Description
    if (recipe.description) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(recipe.description, contentWidth);
      checkPage(descLines.length * 5);
      doc.text(descLines, margin, y);
      y += descLines.length * 5 + 6;
    }

    // Ingredients
    y = sectionTitle(doc, "Ingredients", margin, y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BODY);
    recipe.ingredients.forEach((ing, i) => {
      checkPage(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...ORANGE);
      doc.text(`${i + 1}.`, margin + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BODY);
      doc.text(ing, margin + 12, y);
      y += 6;
    });
    y += 5;

    // Steps
    checkPage(14);
    y = sectionTitle(doc, "Step-by-Step Method", margin, y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BODY);
    recipe.steps.forEach((step, i) => {
      const lines = doc.splitTextToSize(step, contentWidth - 14);
      checkPage(lines.length * 5 + 6);
      // Step number
      doc.setFillColor(...ORANGE);
      doc.circle(margin + 5, y - 2, 3.5, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${i + 1}`, margin + 5, y - 0.8, { align: "center" });
      // Step text
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BODY);
      doc.text(lines, margin + 14, y);
      y += lines.length * 5 + 5;
    });

    // Page footer
    doc.setFontSize(8);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text(`Recipe ${idx + 1} of ${totalRecipes}`, pageWidth / 2, pageHeight - 12, { align: "center" });

    // Bottom bar
    doc.setFillColor(...ORANGE);
    doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
  });

  doc.save("Native_Indian_Recipe_Book.pdf");
}
