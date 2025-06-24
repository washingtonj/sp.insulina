import { PickupEntity } from "domain/entities";
import { WithoutMethods } from "utils/ts-utils";

export interface PickupDTO
  extends WithoutMethods<Omit<PickupEntity, "businessHours">> {
  tags: string[];
  is24HoursOpen: boolean;
  isWeekendOpen: boolean;
}

/**
 * Returns tags for the pickup's business hours.
 * - "Aberto 24h" if open 24 hours.
 * - "Seg a Sex das 09:00 às 18:00" if open same hours Mon-Fri.
 * - "Sábado das 10:00 às 16:00" etc. for weekends or other groups.
 */
function getBusinessHourTags(pickup: PickupEntity): string[] {
  if (pickup.is24Hours()) return ["Aberto 24h"];

  const dayNames = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  const shortDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  function formatTimeRange(hours: [string, string]) {
    return `das ${hours[0]} às ${hours[1]}`;
  }

  // Group days by identical hours, ignoring days with empty or invalid ranges
  const groups: Record<string, number[]> = {};
  pickup.businessHours.forEach((bh) => {
    // Ignore days with no hours or invalid ranges (e.g., 00:00 às 00:00)
    if (!bh.hours || bh.hours.length !== 2 || bh.hours[0] === bh.hours[1]) {
      return;
    }
    const key = bh.hours.join("-");
    if (!groups[key]) groups[key] = [];
    groups[key].push(bh.dayOfWeek);
  });

  const tags: string[] = [];
  Object.entries(groups).forEach(([key, days]) => {
    const [open, close] = key.split("-");
    days.sort((a, b) => a - b);

    // Monday to Friday
    const isMonToFri = days.length === 5 && days[0] === 1 && days[4] === 5;
    // Saturday only
    const isSaturday = days.length === 1 && days[0] === 6;
    // Monday to Saturday
    const isMonToSat = days.length === 6 && days[0] === 1 && days[5] === 6;

    if (isMonToSat) {
      // Split into two tags: Seg a Sex and Sábado
      tags.push(`Seg a Sex ${formatTimeRange([open, close])}`);
      tags.push(`Sábado ${formatTimeRange([open, close])}`);
    } else if (isMonToFri) {
      tags.push(`Seg a Sex ${formatTimeRange([open, close])}`);
    } else if (isSaturday) {
      tags.push(`Sábado ${formatTimeRange([open, close])}`);
    } else if (days.length === 1) {
      // Single day (not Saturday)
      tags.push(`${dayNames[days[0]]} ${formatTimeRange([open, close])}`);
    } else if (days.length > 1) {
      // Range or list
      if (days[days.length - 1] - days[0] === days.length - 1) {
        // Consecutive days
        tags.push(
          `${shortDayNames[days[0]]} a ${shortDayNames[days[days.length - 1]]} ${formatTimeRange([open, close])}`,
        );
      } else {
        // Non-consecutive days
        tags.push(
          `${days.map((d) => shortDayNames[d]).join(", ")} ${formatTimeRange([open, close])}`,
        );
      }
    }
  });

  return tags;
}

/**
 * Converts a PickupEntity to a PickupDTO.
 * This function transforms the PickupEntity by adding tags, checking if it's open 24 hours,
 * and checking if it's open on weekends.
 *
 * @param pickup - The PickupEntity to convert.
 * @returns A PickupDTO with additional properties.
 */
export function fromPickupEntityToDTO(pickup: PickupEntity): PickupDTO {
  return {
    id: pickup.id,
    address: pickup.address,
    availability: pickup.availability,
    name: pickup.name,
    tags: getBusinessHourTags(pickup),
    is24HoursOpen: pickup.is24Hours(),
    isWeekendOpen: pickup.isWeekendOpen(),
  };
}
