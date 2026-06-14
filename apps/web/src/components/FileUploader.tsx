import { useState, useRef, type ChangeEvent } from "react";
import { Upload, X, File, AlertCircle } from "lucide-react";

interface FileUploaderProps {
  /** Callback cuando se selecciona un archivo */
  onFileSelect: (file: File) => void;
  /** Tipos MIME aceptados */
  accept?: string;
  /** Tamaño máximo en bytes */
  maxSize?: number;
  /** Label del campo */
  label?: string;
  /** Archivo actualmente seleccionado */
  currentFile?: { name: string; size: number } | null;
  /** Callback para limpiar archivo */
  onClear?: () => void;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * FileUploader — Cargador de archivos con arrastrar y soltar.
 *
 * @example
 * <FileUploader
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024}
 *   onFileSelect={(file) => console.log(file)}
 * />
 */
export function FileUploader({
  onFileSelect,
  accept,
  maxSize = 10 * 1024 * 1024,
  label = "Subir archivo",
  currentFile,
  onClear,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setError(null);

    if (maxSize && file.size > maxSize) {
      setError(`El archivo excede el tamaño máximo de ${formatSize(maxSize)}.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  return (
    <div className="file-uploader">
      <div
        className={`file-uploader-dropzone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {currentFile ? (
          <div className="file-uploader-preview">
            <File size={24} />
            <div className="file-uploader-info">
              <span className="file-uploader-name">{currentFile.name}</span>
              <span className="file-uploader-size">{formatSize(currentFile.size)}</span>
            </div>
            {onClear && (
              <button
                className="file-uploader-remove"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                title="Eliminar archivo"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <>
            <Upload size={24} />
            <span className="file-uploader-label">{label}</span>
            <span className="file-uploader-hint">
              Arrastra un archivo aquí o haz clic para seleccionar
            </span>
            {accept && <span className="file-uploader-types">Formatos: {accept}</span>}
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
      />
      {error && (
        <div className="file-uploader-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
