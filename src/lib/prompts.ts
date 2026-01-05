export const fichePrompt = (subject: string, text: string) => `
Tu es un expert académique. Transforme le sujet suivant en fiche de révision complète, claire, structurée et pédagogique.

Sujet : "${subject}"

Cours fourni :
${text}

Produit un JSON strict, valide et uniquement JSON, au format suivant :

{
  "title": "",
  "introduction": "",
  "key_points": [],
  "definitions": [],
  "formulas": [],
  "properties": [],
  "examples": [],
  "common_mistakes": [],
  "exercises": [],
  "quiz": [],
  "summary": []
}

RÈGLES :
- Remplis chaque champ, même si les données sont partielles.
- Aucune phrase hors du JSON final.
- "key_points" : 10 à 20 points.
- "definitions" : au moins 5 termes utiles.
- "formulas" : formules essentielles (mathématiques si nécessaire).
- "examples" : exemples d’application concrets.
- "common_mistakes" : erreurs typiques des étudiants.
- "exercises" : au moins 3 exercices + réponses.
- "quiz" : 5 questions / réponses simples.
- "summary" : 5 à 7 points synthétiques.

Réponds uniquement avec le JSON, pas d’explication, pas d’intro.
`;


export const resumePrompt = (text: string) => `
Tu es un expert en pédagogie. Résume le contenu suivant de manière claire, dense et bien organisée :

${text}

Produit strictement ce JSON :

{
  "title": "",
  "summary": [],
  "key_points": []
}

RÈGLES :
- "summary" : 5 à 12 phrases complètes, utiles et fluides.
- "key_points" : 8 à 15 points clés.
- Aucun texte en dehors du JSON.
`;


export const planningPrompt = (
  subjects: string,
  days: number,
  minutes: number,
  goal: string
) => `
Tu es un coach académique expert. Génère un planning de révision réaliste, optimisé et clair.

Matières : ${subjects}
Jours disponibles : ${days}
Minutes par jour : ${minutes}
Objectif : ${goal}

Respecte obligatoirement ce JSON strict :

{
  "title": "",
  "overview": "",
  "days": [],
  "tips": []
}

RÈGLES :
- "days" doit contenir exactement ${days} jours.
- Chaque jour contient un objet :
  {
    "day": "",
    "slots": [
      { "time": "", "task": "" }
    ]
  }
- 3 à 6 créneaux max par jour.
- "tips" : au moins 5 conseils utiles.
- ZÉRO texte hors JSON (pas d’explication, pas d’intro).
`;
