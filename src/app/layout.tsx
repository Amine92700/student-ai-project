import "./globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Outil IA Étudiant",
  description: "Résumé, Fiche, Planning avec PDF"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
