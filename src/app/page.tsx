"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PDFDropzone } from "../components/PDFDropzone";
import { exportFichePDF, exportResumePDF, exportPlanningPDF } from "../lib/pdf";

type Mode = "resume" | "fiche" | "planning" | "quiz";

type FicheShape = {
  title?: string;
  summary?: string[];
  key_points?: string[];
  definitions?: { term: string; definition: string }[];
  formulas?: { label: string; value: string }[];
  examples?: string[];
  common_mistakes?: string[];
  quiz?: { question: string; answer: string }[];
};

type ResumeShape = {
  title?: string;
  summary?: string[];
  key_points?: string[];
};

type PlanningShape = {
  title?: string;
  overview?: string;
  days?: { day: string; slots: { time: string; task: string }[] }[];
  tips?: string[];
  schedule?: { tasks: string[] }[]; // fallback ancien format
};

type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number; // 0..3
  explanation?: string;
};

type QuizShape = {
  title?: string;
  instructions?: string;
  questions: QuizQuestion[];
};

function safeJSON<T = any>(raw: unknown): T | null {
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match?.(/\{[\s\S]*\}\s*$/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {}
    }
    return null;
  }
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("fiche");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");

  const [subjects, setSubjects] = useState("");
  const [days, setDays] = useState<number | "">("");
  const [minutes, setMinutes] = useState<number | "">("");
  const [goal, setGoal] = useState("");

  // Quiz settings
  const [quizCount, setQuizCount] = useState<number | "">(10);

  // ✅ Mémoire: résultats par onglet
  const [resultsByMode, setResultsByMode] = useState<Record<string, any>>({
    resume: null,
    fiche: null,
    planning: null,
    quiz: null,
  });

  // Pour régénérer: payload par mode
  const [lastPayloadByMode, setLastPayloadByMode] = useState<Record<string, any>>({
    resume: null,
    fiche: null,
    planning: null,
    quiz: null,
  });

  const result = resultsByMode[mode];

  // Quiz interactive state
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const quizResult: QuizShape | null = useMemo(() => {
    if (mode !== "quiz") return null;
    const r = resultsByMode.quiz;
    if (!r) return null;
    // tolérance: si l’IA renvoie "questions" mauvais type -> null
    if (!Array.isArray(r.questions)) return null;
    return r as QuizShape;
  }, [mode, resultsByMode.quiz]);

  // cooldown anti-spam
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Upload PDF -> /api/pdf
  const handlePDF = async (file: File) => {
    try {
      setError(null);
      const form = new FormData();
      form.append("file", file);

      const r = await fetch("/api/pdf", { method: "POST", body: form });
      const data = await r.json();

      if (!r.ok) throw new Error(data?.error || "Erreur PDF");
      if (data?.text) setText(data.text);
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'envoi du PDF.");
    }
  };

  const handleGenerate = async (regen = false) => {
    if (cooldown > 0) return;

    try {
      setLoading(true);
      setError(null);

      const lastPayload = lastPayloadByMode[mode];

      const payload =
        regen && lastPayload
          ? lastPayload
          : mode === "planning"
          ? {
              subjects,
              days: typeof days === "number" ? days : Number(days || 0),
              minutes: typeof minutes === "number" ? minutes : Number(minutes || 0),
              goal,
            }
          : mode === "fiche"
          ? { subject, text }
          : mode === "resume"
          ? { text: text || subject }
          : {
              // quiz
              text: text || subject,
              count: typeof quizCount === "number" ? quizCount : Number(quizCount || 10),
            };

      setLastPayloadByMode((prev) => ({ ...prev, [mode]: payload }));

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || data?.message || "Erreur IA");

      // Backend renvoie { text: string } (JSON)
      const parsed = safeJSON<any>(data?.text);

      if (!parsed || typeof parsed !== "object") {
        // fallback brut -> au moins des puces
        const rawText = (data?.text || "").toString();
        const lines = rawText
          .split(/\n+/)
          .map((l: string) => l.trim())
          .filter(Boolean)
          .slice(0, 30);

        const fallback =
          mode === "quiz"
            ? {
                title: "Quiz IA (fallback)",
                questions: lines.slice(0, 10).map((q: string, i: number) => ({
                  question: q,
                  options: ["A", "B", "C", "D"],
                  answerIndex: 0,
                  explanation: "",
                })),
              }
            : { title: "Résultat IA", summary: lines };

        setResultsByMode((prev) => ({ ...prev, [mode]: fallback }));
      } else {
        setResultsByMode((prev) => ({ ...prev, [mode]: parsed }));
      }

      // Reset quiz UI à chaque nouvelle génération quiz
      if (mode === "quiz") {
        const qCount = parsed?.questions?.length ?? 0;
        setQuizAnswers(Array.from({ length: qCount }, () => -1));
        setQuizSubmitted(false);
      }

      setCooldown(8);
    } catch (e: any) {
      setError(e.message || "Erreur IA");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    if (mode === "fiche") return exportFichePDF(result as FicheShape);
    if (mode === "resume") return exportResumePDF(result as ResumeShape);
    if (mode === "planning") return exportPlanningPDF(result as PlanningShape);

    // Quiz -> export en “fiche” simple via exportFichePDF (réutilise ton PDF actuel)
    const quizAsFiche: FicheShape = {
      title: (result?.title || "Quiz") + " (export)",
      key_points: (result?.questions || []).map((q: any, i: number) => `Q${i + 1}. ${q.question}`),
      examples: (result?.questions || []).map((q: any) => {
        const opts = (q.options || []).map((o: string, idx: number) => `${String.fromCharCode(65 + idx)}. ${o}`).join(" | ");
        return `${q.question}\n${opts}\nRéponse: ${String.fromCharCode(65 + (q.answerIndex ?? 0))}${q.explanation ? ` — ${q.explanation}` : ""}`;
      }),
    };
    return exportFichePDF(quizAsFiche);
  };

  const quizScore = useMemo(() => {
    if (!quizResult) return 0;
    return quizResult.questions.reduce((acc, q, i) => {
      const chosen = quizAnswers[i];
      return acc + (chosen === q.answerIndex ? 1 : 0);
    }, 0);
  }, [quizResult, quizAnswers]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start py-10 animate-fadeup">
      {/* HEADER */}
      <div className="text-center mb-6">
        <h1 className="app-title relative">
          🎓 Outil IA Étudiant
          <span className="absolute inset-0 blur-lg opacity-20 bg-brand-600 rounded-full" />
        </h1>
        <p className="app-sub">Résumé IA • Fiche IA • Planning IA • Quiz IA — Export PDF</p>

        <div className="tabs mt-4">
          <button className={`tab ${mode === "resume" ? "tab-active" : ""}`} onClick={() => setMode("resume")}>
            Résumé IA
          </button>
          <button className={`tab ${mode === "fiche" ? "tab-active" : ""}`} onClick={() => setMode("fiche")}>
            Fiche IA
          </button>
          <button className={`tab ${mode === "planning" ? "tab-active" : ""}`} onClick={() => setMode("planning")}>
            Planning IA
          </button>
          <button className={`tab ${mode === "quiz" ? "tab-active" : ""}`} onClick={() => setMode("quiz")}>
            Quiz IA
          </button>
        </div>
      </div>

      {/* FORM */}
      <div className="card mt-4 w-full max-w-2xl">
        {/* FICHE */}
        {mode === "fiche" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Chapitre / Sujet</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Texte de cours</label>
              <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Importer un PDF</label>
              <PDFDropzone onFileSelected={handlePDF} />
            </div>
          </div>
        )}

        {/* RESUME */}
        {mode === "resume" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Sujet ou texte à résumer</label>
              <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Importer un PDF</label>
              <PDFDropzone onFileSelected={handlePDF} />
            </div>
          </div>
        )}

        {/* PLANNING */}
        {mode === "planning" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="font-medium">Matières</label>
              <input className="input" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-medium">Jours</label>
                <input
                  type="number"
                  className="input"
                  value={days}
                  onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <label className="font-medium">Minutes / jour</label>
                <input
                  type="number"
                  className="input"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Objectif</label>
              <input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
          </div>
        )}

        {/* QUIZ */}
        {mode === "quiz" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="font-medium">Texte / cours (sert de base au quiz)</label>
              <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Importer un PDF</label>
              <PDFDropzone onFileSelected={handlePDF} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-medium">Nombre de questions</label>
                <input
                  type="number"
                  className="input"
                  min={3}
                  max={30}
                  value={quizCount}
                  onChange={(e) => setQuizCount(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Type</label>
                <input className="input" value="QCM (4 choix)" readOnly />
              </div>
            </div>
          </div>
        )}

        {/* BUTTONS */}
        <div className="mt-6 flex gap-3">
          {!result && (
            <button
              onClick={() => handleGenerate(false)}
              disabled={loading || cooldown > 0}
              className={cooldown > 0 ? "btn-cooldown" : "btn-primary"}
            >
              {cooldown > 0 ? `Attends ${cooldown}s` : loading ? "Génération..." : "Générer"}
            </button>
          )}

          {result && (
            <>
              <button onClick={() => handleGenerate(true)} className="btn-primary bg-slate-700 hover:bg-slate-600">
                Régénérer
              </button>
              <button onClick={handleDownload} className="btn-primary">
                Télécharger PDF
              </button>
            </>
          )}
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      {/* RESULT */}
      {result && (
        <div className="card mt-6 w-full max-w-2xl space-y-5">
          {result.title && <h2 className="text-xl font-semibold text-gray-100">{result.title}</h2>}

          {/* QUIZ UI */}
          {mode === "quiz" && quizResult && (
            <div className="space-y-5">
              {quizResult.instructions && <p className="text-slate-300">{quizResult.instructions}</p>}

              <div className="space-y-4">
                {quizResult.questions.map((q, qi) => (
                  <div key={qi} className="bg-slate-900/30 border border-slate-700/60 rounded-xl p-4">
                    <p className="font-medium text-slate-100">
                      {qi + 1}. {q.question}
                    </p>

                    <div className="mt-3 space-y-2">
                      {q.options?.map((opt, oi) => {
                        const chosen = quizAnswers[qi] ?? -1;
                        const isChecked = chosen === oi;

                        const isCorrect = quizSubmitted && oi === q.answerIndex;
                        const isWrongChosen = quizSubmitted && isChecked && oi !== q.answerIndex;

                        return (
                          <label
                            key={oi}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 border cursor-pointer transition
                              ${
                                isCorrect
                                  ? "border-green-500/60 bg-green-500/10"
                                  : isWrongChosen
                                  ? "border-red-500/60 bg-red-500/10"
                                  : "border-slate-700/60 bg-slate-800/20 hover:bg-slate-800/35"
                              }`}
                          >
                            <input
                              type="radio"
                              name={`q_${qi}`}
                              checked={isChecked}
                              disabled={quizSubmitted}
                              onChange={() => {
                                setQuizAnswers((prev) => {
                                  const next = [...prev];
                                  next[qi] = oi;
                                  return next;
                                });
                              }}
                            />
                            <span className="text-slate-200">{opt}</span>
                          </label>
                        );
                      })}
                    </div>

                    {quizSubmitted && q.explanation && (
                      <p className="mt-3 text-slate-300">
                        <span className="text-blue-300 font-semibold">Explication :</span> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {!quizSubmitted ? (
                  <button
                    className="btn-primary"
                    onClick={() => setQuizSubmitted(true)}
                    disabled={!quizResult.questions.length}
                  >
                    Corriger
                  </button>
                ) : (
                  <div className="text-slate-200">
                    Score: <span className="text-blue-300 font-semibold">{quizScore}</span> / {quizResult.questions.length}
                  </div>
                )}

                {quizSubmitted && (
                  <button
                    className="btn-primary bg-slate-700 hover:bg-slate-600"
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers(Array.from({ length: quizResult.questions.length }, () => -1));
                    }}
                  >
                    Refaire
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Résumé + Fiche */}
          {mode !== "planning" && mode !== "quiz" && (
            <>
              {Array.isArray(result.summary) && result.summary.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">🧠 Résumé</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {result.summary.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(result.key_points) && result.key_points.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">📌 Points clés</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {result.key_points.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(result.definitions) && result.definitions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">📖 Définitions</h3>
                  {result.definitions.map((d: any, i: number) => (
                    <p key={i} className="text-gray-300">
                      <b>{d.term} :</b> {d.definition}
                    </p>
                  ))}
                </div>
              )}

              {Array.isArray(result.formulas) && result.formulas.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">📐 Formules</h3>
                  {result.formulas.map((f: any, i: number) => (
                    <p key={i} className="text-gray-300">
                      <b>{f.label} :</b> {f.value}
                    </p>
                  ))}
                </div>
              )}

              {Array.isArray(result.examples) && result.examples.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">🧩 Exemples</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {result.examples.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(result.common_mistakes) && result.common_mistakes.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-300 mb-2">⚠️ Erreurs fréquentes</h3>
                  <ul className="list-disc list-inside text-red-200 space-y-1">
                    {result.common_mistakes.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(result.quiz) && result.quiz.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">🎯 Quiz (format fiche)</h3>
                  {result.quiz.map((q: any, i: number) => (
                    <p key={i} className="text-gray-300 mb-1">
                      <b>Q{i + 1} :</b> {q.question}{" "}
                      <span className="text-green-400">
                        <b>Réponse :</b> {q.answer}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Planning */}
          {mode === "planning" && (
            <>
              {result.overview && <p className="text-gray-300">{result.overview}</p>}

              {Array.isArray(result.days) && (
                <div className="bg-slate-800/40 rounded-xl p-4">
                  {result.days.map((d: any, i: number) => (
                    <div key={i} className="mb-4">
                      <p className="font-semibold text-blue-300">{d.day}</p>
                      <ul className="list-disc list-inside ml-2">
                        {d.slots.map((s: any, j: number) => (
                          <li key={j}>
                            <b>{s.time}</b> — {s.task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(result.schedule) && (
                <div className="bg-slate-800/40 rounded-xl p-4">
                  {result.schedule.map((day: any, idx: number) => (
                    <div key={idx} className="mb-3">
                      <p className="font-semibold text-blue-300">Jour {idx + 1}</p>
                      <ul className="list-disc list-inside text-gray-300 ml-2">
                        {(day.tasks || []).map((t: string, i: number) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(result.tips) && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">💡 Conseils</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {result.tips.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
