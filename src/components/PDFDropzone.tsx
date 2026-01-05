import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export function PDFDropzone({ onFileSelected }: { onFileSelected: (file: File) => void }) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1
  });

  return (
    <div
      {...getRootProps()}
      className={`border border-dashed rounded-xl p-6 cursor-pointer transition
      ${isDragActive ? "border-blue-400 bg-blue-900/20" : "border-gray-500/40 bg-slate-800/40"}
      hover:border-blue-400`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center text-gray-300">
        <span className="text-3xl mb-2">📄</span>

        <p className="font-medium">
          {isDragActive ? "Dépose ton PDF ici..." : "Dépose un PDF ou clique pour choisir"}
        </p>

        <p className="text-sm text-gray-400">PDF uniquement</p>
      </div>
    </div>
  );
}
