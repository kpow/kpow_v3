import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a random image path from the random_defaults directory
 * to be used as a fallback when no image is available
 */
export function getRandomDefaultImage(): string {
  const imageCount = 7;
  const randomNumber = Math.floor(Math.random() * imageCount) + 1;
  return `/random_defaults/psdflt${randomNumber}.png`;
}