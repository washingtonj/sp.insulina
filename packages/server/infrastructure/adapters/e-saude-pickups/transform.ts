import type { InsulinEntity } from "domain/entities/insulin";
import type { AvailabilityEntity } from "domain/entities/availability";
import type { PickupEntity } from "domain/entities/pickup";
import { STATIC_INSULINS } from "./consts";
import { transformBusinessHours } from "./transform-business-hours";

const removeAccents = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalize = (str: string) =>
  removeAccents(str)
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .trim();

const typeHeuristics: Record<string, (name: string) => boolean> = {
  CANETA: (name) => name.includes("preenchido"),
  AMPOLA: (name) => name.includes("fam10ml"),
  REFILL: (name) => name.includes("carpule") || name.includes("tubete"),
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function processAvailableInsulins(
  quantities: any[],
): Record<string, { quantity: number; level: 1 | 2 | 3 }> {
  return quantities.reduce((acc: any, item: any) => {
    const normalizedMedicamento = normalize(item.medicamento);
    const matchedInsulin = findMatchingInsulin(normalizedMedicamento);

    if (matchedInsulin) {
      const level = determineAvailabilityLevel(item.nivelDisponibilidade);
      acc[matchedInsulin.code] = {
        quantity: Number(item.quantidade),
        level,
      };
    }
    return acc;
  }, {});
}

function findMatchingInsulin(
  normalizedMedicamento: string,
): InsulinEntity | undefined {
  return STATIC_INSULINS.find((insulin) => {
    const normalizedInsulinName = normalize(insulin.name);
    const normalizedInsulinSimple = normalize(insulin.simpleName);
    const typeHeuristic = typeHeuristics[insulin.type];

    const typeMatch = typeHeuristic
      ? typeHeuristic(normalizedMedicamento)
      : false;
    const simpleNameMatch = normalizedMedicamento.includes(
      normalizedInsulinSimple,
    );

    return (
      (normalizedInsulinName.includes(normalizedMedicamento) ||
        normalizedMedicamento.includes(normalizedInsulinName) ||
        typeMatch) &&
      simpleNameMatch
    );
  });
}

function determineAvailabilityLevel(nivel: string): 1 | 2 | 3 {
  if (nivel === "alto") return 3;
  if (nivel === "baixo") return 1;
  return 2; // Default medium level
}

function createAvailabilityEntities(
  foundInsulins: Record<string, { quantity: number; level: 1 | 2 | 3 }>,
): AvailabilityEntity[] {
  return STATIC_INSULINS.map((insulin) => {
    const found = foundInsulins[insulin.code];
    return {
      insulin: {
        code: insulin.code,
        name: insulin.name,
        simpleName: insulin.simpleName,
        type: insulin.type,
      },
      quantity: found ? found.quantity : 0,
      level: found ? found.level : 1, // Default to lowest level if not found
    };
  });
}

export function fromGetAvailability(response: any): PickupEntity[] {
  const disponibilidade = response?.result?.disponibilidade;

  if (!Array.isArray(disponibilidade)) {
    return [];
  }

  const pickups = disponibilidade.map((unit) => {
    const foundInsulins = processAvailableInsulins(unit.quantidades || []);
    const availability = createAvailabilityEntities(foundInsulins);

    const businessHours = transformBusinessHours(unit.expediente || "");

    return {
      name: unit.unidade,
      address: {
        address: unit.endereco,
        latitude: unit.coordenadas.lat,
        longitude: unit.coordenadas.lng,
      },
      availability,
      businessHours,
    };
  });

  return pickups;
}
