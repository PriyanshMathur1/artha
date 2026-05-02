import { clsx, type ClassValue } from 'clsx';

/**
 * Tailwind class joiner. Originally used `tailwind-merge` to dedupe conflicting
 * utilities, but the project doesn't ship that dep and the rest of the codebase
 * uses raw `clsx` everywhere. Keep this thin wrapper so future code that wants
 * conflict-resolution can swap in `tailwind-merge` without changing call sites.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
