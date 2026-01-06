# 🎓 Outil IA Étudiant

Application web d’assistance aux étudiants intégrant une intelligence artificielle générative.
Le projet permet de produire automatiquement des **résumés**, **fiches de révision**, **plannings de travail** et **quiz interactifs**, avec possibilité d’export en PDF.

Ce projet met en avant l’intégration concrète d’une IA dans une application web moderne, avec des réponses structurées et une interface orientée usage étudiant.

---

## ✨ Fonctionnalités

- Génération de **résumés de cours**
- Création de **fiches de révision structurées**
  - Points clés  
  - Définitions  
  - Formules  
  - Exemples  
  - Erreurs fréquentes  
  - Quiz de révision
- Génération de **planning de révision personnalisé**
- **Quiz IA interactif**
  - Nombre de questions paramétrable
  - QCM (4 choix)
- Import de **cours au format PDF**
- Export des résultats en **PDF**
- Interface moderne, responsive et animée
- Mémoire de session (les résultats restent visibles lors du changement d’onglet)

---

## 🛠️ Technologies utilisées

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Google Gemini API**
- Traitement PDF côté serveur
- Génération de PDF côté client

---

## ⚙️ Installation

### Prérequis

- **Node.js ≥ 18**
- **Clé API Google Gemini**

---

### Étapes

Installer les dépendances :

```bash
npm install

Créer un fichier .env.local à la racine du projet :



GEMINI_API_KEY=VOTRE_CLE_API

Lancer le projet :


npm run dev


Application accessible sur :


http://localhost:3000/



🧑‍🎓 Utilisation





Choisir un mode :
Résumé IA
Fiche IA
Planning IA
Quiz IA

Coller le texte du cours ou importer un PDF
Configurer les options (si disponibles)
Générer le contenu
Exporter en PDF si nécessaire









⚠️ Limites connues





Dépendance aux quotas de l’API Gemini
Pas de système d’authentification utilisateur
Pas de persistance des données après rechargement de la page
Les performances dépendent de la disponibilité de l’API externe




Ces limites ont été acceptées afin de rester dans un cadre pédagogique et garantir la stabilité de l’application.








🤖 Utilisation de l’IA





L’IA est utilisée pour :



La génération de contenus pédagogiques structurés
La création de quiz à partir d’un cours
L’aide à la rédaction et à la reformulation des contenus




Modèle utilisé :



Google Gemini (gemini-2.0-flash)




Des prompts spécifiques ont été conçus afin d’obtenir des réponses structurées directement exploitables par l’interface.








📄 Licence





Projet réalisé dans un cadre pédagogique universitaire.

Utilisation libre à des fins d’apprentissage et de démonstration.

