// Texto plano del cierre para compartir. Lógica pura: no usa APIs nativas ni
// inventa cifras que no estén en el cierre.

import type { DayClosing } from '@/lib/day-closing-types';

export function buildDayClosingText(closing: DayClosing): string {
  // La fecha completa evita que "Cierre de hoy" quede ambiguo al compartirlo.
  const parts: string[] = [
    closing.dateLabel ? `${closing.headline}\nFecha: ${closing.dateLabel}` : closing.headline,
  ];

  for (const section of closing.sections) {
    const lines = section.lines.map((line) => {
      const note = line.note ? ` (${line.note})` : '';
      return `${line.label}: ${line.value}${note}`;
    });
    parts.push([section.title, ...lines].join('\n'));
  }

  if (closing.warnings.length > 0) {
    parts.push(['Notas', ...closing.warnings.map((warning) => `• ${warning}`)].join('\n'));
  }

  return parts.join('\n\n');
}
