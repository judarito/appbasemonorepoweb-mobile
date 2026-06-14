import { useState, useRef, type ChangeEvent } from "react";
import { Camera, X } from "lucide-react";

interface AvatarUploaderProps {
  /** URL actual del avatar (si existe) */
  currentUrl?: string | null;
  /** Callback con el archivo seleccionado */
  onFileSelect: (file: File) => void;
  /** Callback para eliminar el avatar */
  onRemove?: () => void;
  /** Tamaño del avatar en pixels */
  size?: number;
  /** Iniciales para mostrar cuando no hay imagen */
  initials?: string;
}

/**
 * AvatarUploader — Selector de avatar circular con previsualización.
 *
 * @example
 * <AvatarUploader
 *   currentUrl={user.avatarUrl}
 *   onFileSelect={(file) => uploadAvatar(file)}
 *   initials="JR"
 * />
 */
export function AvatarUploader({
  currentUrl,
  onFileSelect,
  onRemove,
  size = 120,
  initials = "?",
}: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mostrar preview local
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    onFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="avatar-uploader" style={{ width: size, height: size }}>
      {displayUrl ? (
        <img
          src={displayUrl}
          alt="Avatar"
          className="avatar-uploader-image"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="avatar-uploader-placeholder"
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          {initials}
        </div>
      )}

      <div className="avatar-uploader-overlay" onClick={() => inputRef.current?.click()}>
        <Camera size={20} />
      </div>

      {onRemove && (currentUrl || preview) && (
        <button className="avatar-uploader-remove" onClick={handleRemove} title="Eliminar avatar">
          <X size={14} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
