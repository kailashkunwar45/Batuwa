import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging tailwind classes (or just standard strings/objects)
 * Used for dynamic styling in a clean way.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
