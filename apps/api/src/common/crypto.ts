import crypto from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function encrypt(text: string): string {
  // Generar clave de 32 bytes usando scrypt a partir del JWT secret
  const key = crypto.scryptSync(env.JWT_ACCESS_SECRET, "settings-salt", 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  // Guardar como iv:tag:contenidoEncriptado
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      return encryptedText; // Retornar tal cual si no tiene formato cifrado
    }
    
    const [ivHex, tagHex, encrypted] = parts;
    const key = crypto.scryptSync(env.JWT_ACCESS_SECRET, "settings-salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    // Si falla el descifrado, retornar texto original (tolerante a fallos)
    return encryptedText;
  }
}
