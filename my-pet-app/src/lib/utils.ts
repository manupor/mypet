import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSpeciesEmoji(species: string): string {
  const emojis: Record<string, string> = {
    dog: '🐕',
    cat: '🐱',
    bird: '🐦',
    rabbit: '🐰',
    hamster: '🐹',
    fish: '🐟',
    reptile: '🦎',
    other: '🐾',
  };
  return emojis[species] || '🐾';
}

export function getSpeciesLabel(species: string): string {
  const labels: Record<string, string> = {
    dog: 'Perro',
    cat: 'Gato',
    bird: 'Ave',
    rabbit: 'Conejo',
    hamster: 'Hámster',
    fish: 'Pez',
    reptile: 'Reptil',
    other: 'Otro',
  };
  return labels[species] || species;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

export function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  
  if (years === 0) {
    return `${months} meses`;
  } else if (years === 1 && months < 0) {
    return `${12 + months} meses`;
  } else if (months < 0) {
    return `${years - 1} años`;
  }
  return `${years} años`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
