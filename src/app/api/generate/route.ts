import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs"; // IMPORTANT (sinon Edge runtime = parfois la mort)

type Mode = "resume" | "fiche" | "planning" | "quiz";

function extractRetrySeconds(msg: string): number | null {
  const m1 = msg.match(/retryDelay"\s*:\s*"(\d+)s"/i);
  if (m1) return Number(m1[1]);
  const m2 = msg.match(/Please retry in\s+([\d.]+)s/i);
  if (m2) return Math.ceil(Number(m2[1]));
  return null;
}

function safeText(x: any) {
  return (x ?? "").toString();
}

function clipText(s: string, max = 20000) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "\n\n[TRONQUÉ]" : s;
}

function buildPrompt(mode: Mode, payload: any) {
  const base = `
Tu es un assistant de révision.
Tu dois répondre UNIQUEMENT avec un JSON valide.
Interdictions: pas de markdown, pas de texte autour, pas de \`\`\`.
Langue: français.
Contenu: basé UNIQUEMENT sur le cours fourni (ou le sujet si cours vide).
`;

  if (mode === "fiche") {
    const subject = safeText(payload?.subject).trim();
    const course = clipText(safeText(payload?.text));

    return `
${base}

JSON attendu EXACT:
{
  "title": string,
  "summary": string[],
  "key_points": string[],
  "definitions": [{"term": string, "definition": string}],
  "formulas": [{"label": string, "value": string}],
  "examples": string[],
  "common_mistakes": string[],
  "quiz": [{"question": string, "answer": string}]
}

Contraintes:
- summary: 4-8 puces
- key_points: 8-15 puces
- definitions: 6-12
- formulas: si pertinent sinon []
- examples: 3-6
- common_mistakes: 4-8 (avec mini-correction)
- quiz: 4-8

SUJET: ${subject || "(vide)"}

COURS:
${course || "(vide)"}
`;
  }

  if (mode === "resume") {
    const course = clipText(safeText(payload?.text));
    return `
${base}

JSON attendu EXACT:
{
  "title": string,
  "summary": string[],
  "key_points": string[]
}

Contraintes:
- summary: 6-12 puces
- key_points: 6-12 puces

COURS:
${course || "(vide)"}
`;
  }

  if (mode === "planning") {
    const subjects = safeText(payload?.subjects);
    const days = Number(payload?.days ?? 5);
    const minutes = Number(payload?.minutes ?? 60);
    const goal = safeText(payload?.goal);

    return `
${base}

JSON attendu EXACT:
{
  "title": string,
  "overview": string,
  "days": [{"day": string, "slots": [{"time": string, "task": string}]}],
  "tips": string[]
}

Contraintes strictes:
- ${days} jours
- ${minutes} minutes / jour
- Matières: ${subjects}
- Objectif: ${goal}

Donne des créneaux précis "00:00-20:00" et des tâches actionnables.
`;
  }

  // quiz
  const subject = safeText(payload?.subject).trim();
  const course = clipText(safeText(payload?.text));
  const n = Math.max(1, Math.min(30, Number(payload?.numQuestions ?? 10)));
  const type = safeText(payload?.type).toLowerCase();
  const isQcm = type.includes("qcm") || type.includes("mcq") || type.includes("4");

  return `
${base}

Objectif: générer un quiz basé sur le cours, sans hors-sujet.
Tu dois produire EXACTEMENT ${n} questions.

JSON attendu EXACT:
{
  "title": string,
  "instructions": string,
  "questions": [
    ${isQcm
      ? `{"question": string, "choices": [string,string,string,string], "answerIndex": 0|1|2|3, "explanation": string}`
      : `{"question": string, "answer": string, "explanation": string}`
    }
  ]
}

Contraintes strictes:
- "questions" contient EXACTEMENT ${n} éléments.
- ${isQcm ? "choices contient EXACTEMENT 4 choix." : "réponses courtes."}
- Chaque question doit venir du COURS (sinon du SUJET si cours vide).
- JSON pur uniquement.

SUJET: ${subject || "(vide)"}

COURS:
${course || "(vide)"}
`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = body?.mode as Mode;
    const payload = body?.payload ?? {};

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Mets un modèle QUI EXISTE dans ton ListModels
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const model = genai.getGenerativeModel({ model: modelName });

    const prompt = buildPrompt(mode, payload);

    // ✅ Appel SIMPLE: ça évite 95% des erreurs de format "contents/role/parts"
    const result = await model.generateContent(prompt);

    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (e: any) {
    const msg = e?.message?.toString?.() || "AI Error";
    const status = Number(e?.status) || 500;
    const retrySeconds = extractRetrySeconds(msg);

    console.error("API ERROR =>", e);

    return NextResponse.json(
      {
        error: "AI Error",
        detail: msg,
        code: status,
        retrySeconds,
      },
      { status }
    );
  }
}
