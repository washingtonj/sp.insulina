import type { BusinessHourEntity, DayOfWeek } from "domain/entities";

/**
 * Transform business hours from API format to structured format
 */
export function transformBusinessHours(
  expediente: string,
): BusinessHourEntity[] {
  // Initialize empty days array
  const days: BusinessHourEntity[] = [];
  for (let i = 0; i < 7; i++) {
    days.push({
      dayOfWeek: i as DayOfWeek,
      hours: ["00:00", "00:00"],
    });
  }

  // If input is empty, return default (all closed)
  if (!expediente) return days;

  // Process different day patterns
  // 1. "De Segunda a Sexta: 07:00 até 19:00."
  if (expediente.includes("De Segunda a Sexta")) {
    const timeMatch = expediente.match(/(\d{2}:\d{2})\s*até\s*(\d{2}:\d{2})/);
    if (timeMatch) {
      const hours: [string, string] = [timeMatch[1], timeMatch[2]];
      // Set weekdays (1-5) to open
      for (let i = 1; i <= 5; i++) {
        days[i] = { dayOfWeek: i as DayOfWeek, hours };
      }
    }
  }

  // 2. "Sábado: 00:00 até 23:59." (either standalone or part of multi-schedule)
  if (expediente.includes("Sábado:")) {
    const sabPart =
      expediente.split("|").find((p) => p.includes("Sábado:")) || "";
    const timeMatch = sabPart.match(/(\d{2}:\d{2})\s*até\s*(\d{2}:\d{2})/);
    if (timeMatch) {
      days[6] = {
        dayOfWeek: 6,
        hours: [timeMatch[1], timeMatch[2]],
      };
    }
  }

  // 3. "Domingo: 00:00 até 23:59." (either standalone or part of multi-schedule)
  if (expediente.includes("Domingo:")) {
    const domPart =
      expediente.split("|").find((p) => p.includes("Domingo:")) || "";
    const timeMatch = domPart.match(/(\d{2}:\d{2})\s*até\s*(\d{2}:\d{2})/);
    if (timeMatch) {
      days[0] = {
        dayOfWeek: 0,
        hours: [timeMatch[1], timeMatch[2]],
      };
    }
  }

  // 4. "De Segunda a Domingo: 00:00 até 23:59." (24h, all days)
  if (expediente.includes("De Segunda a Domingo")) {
    const timeMatch = expediente.match(/(\d{2}:\d{2})\s*até\s*(\d{2}:\d{2})/);
    if (timeMatch) {
      const hours: [string, string] = [timeMatch[1], timeMatch[2]];
      // Set all days to open
      for (let i = 0; i < 7; i++) {
        days[i] = { dayOfWeek: i as DayOfWeek, hours };
      }
    }
  }

  return days;
}
