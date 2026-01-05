'use client';
import jsPDF from "jspdf";

/* HEADER */
const drawHeader = (doc: jsPDF, title: string) => {
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold");
  doc.setFontSize(16);
  doc.text(title || "Document", 12, 13);
  doc.setTextColor(0,0,0);
};

/* SECTION */
const section = (doc: jsPDF, label: string, y: number) => {
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.7);
  doc.line(12, y, 198, y);
  doc.setFont("helvetica","bold");
  doc.setFontSize(12);
  doc.text(label, 12, y - 2);
  return y + 6;
};

/* BULLETS */
const writeBullets = (doc: jsPDF, items: string[], y: number) => {
  doc.setFont("helvetica","normal");
  doc.setFontSize(11);
  for (const it of items || []) {
    const lines = doc.splitTextToSize(it, 176);
    doc.circle(15, y - 2.3, 0.8, "F");
    doc.text(lines, 20, y);
    y += lines.length * 6;
    if (y > 275) { doc.addPage(); y = 20; }
  }
  return y + 2;
};

/* FICHE */
export const exportFichePDF = (fiche: any) => {
  const doc = new jsPDF();
  let y = 26;
  drawHeader(doc, fiche?.title || "Fiche de révision");

  if (fiche?.key_points) {
    y = section(doc, "Points clés", y);
    y = writeBullets(doc, fiche.key_points, y);
  }

  if (fiche?.definitions && Array.isArray(fiche.definitions)) {
    y = section(doc, "Définitions", y);
    y = writeBullets(doc, fiche.definitions.map((d:any)=> `${d.term} : ${d.definition}`), y);
  }

  if (fiche?.formulas && Array.isArray(fiche.formulas)) {
    y = section(doc, "Formules", y);
    y = writeBullets(doc, fiche.formulas.map((f:any)=> `${f.label} = ${f.value}`), y);
  }

  if (fiche?.examples) {
    y = section(doc, "Exemples", y);
    y = writeBullets(doc, fiche.examples, y);
  }

  if (fiche?.quiz && Array.isArray(fiche.quiz)) {
    y = section(doc, "Quiz", y);
    y = writeBullets(doc, fiche.quiz.map((q:any,i:number)=> `Q${i+1}. ${q.question} — Rép: ${q.answer}`), y);
  }

  doc.save((fiche?.title || "fiche") + ".pdf");
};

/* RESUME */
export const exportResumePDF = (res: any) => {
  const doc = new jsPDF();
  let y = 26;

  drawHeader(doc, res?.title || "Résumé");

  if (res?.summary) {
    y = section(doc, "Résumé", y);
    y = writeBullets(doc, res.summary, y);
  }

  doc.save((res?.title || "resume") + ".pdf");
};  

/* PLANNING */
export const exportPlanningPDF = (plan: any) => {
  const doc = new jsPDF();
  let y = 26;

  drawHeader(doc, plan?.title || "Planning");

  if (plan?.overview) {
    y = section(doc, "Aperçu", y);
    const lines = doc.splitTextToSize(plan.overview, 186);
    doc.text(lines, 12, y);
    y += lines.length * 6 + 2;
  }

  if (plan?.days) {
    for (const d of plan.days) {
      y = section(doc, d.day, y);
      y = writeBullets(doc, d.slots.map((s:any)=> `${s.time} — ${s.task}`), y);
    }
  }

  if (plan?.tips) {
    y = section(doc, "Conseils", y);
    y = writeBullets(doc, plan.tips, y);
  }

  doc.save((plan?.title || "planning") + ".pdf");
};
