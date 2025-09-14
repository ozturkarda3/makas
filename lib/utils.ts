import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize Turkish mobile phone numbers to 10 digits (e.g., 5XXXXXXXXX)
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D+/g, '')
  if (digits.length === 12 && digits.startsWith('90')) {
    return digits.slice(-10)
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(-10)
  }
  if (digits.length === 10 && digits.startsWith('5')) {
    return digits
  }
  return digits
}
