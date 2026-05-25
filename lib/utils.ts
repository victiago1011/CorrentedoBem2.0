import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskPhone(value: string) {
  if (!value) return ""
  const cleanValue = value.replace(/\D/g, "").slice(0, 11)
  const length = cleanValue.length

  if (length <= 2) {
    return cleanValue
  }
  if (length <= 6) {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`
  }
  if (length <= 10) {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 6)}-${cleanValue.slice(6)}`
  }
  return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7)}`
}

export function maskCurrency(value: string) {
  if (!value) return ""
  
  // Remove check for R$ if already present to avoid doubling
  let cleanValue = value.replace(/\D/g, "")
  
  // Convert to number and format
  const amount = (Number(cleanValue) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
  
  return amount
}

export function ensureExternalLink(url: string) {
  if (!url) return "";
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

export function stripHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/<p>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&nbsp/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}
