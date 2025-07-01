import {
  InsulinEntity,
  AvailabilityEntity,
  PickupEntity,
} from "domain/entities";
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

function inferAvailableIn(name: string): "AMPOLA" | "CANETA" | "REFILL" {
  const n = name.toUpperCase();
  if (n.includes("CARPULE") || n.includes("TUBETE")) return "REFILL";
  if (n.includes("PREENCHIDO")) return "CANETA";
  return "AMPOLA";
}

function inferVariant(name: string): "NPH" | "REGULAR" {
  const n = name.toUpperCase();
  if (n.includes("NPH")) return "NPH";
  return "REGULAR";
}

function findMatchingInsulin(
  normalizedMedicamento: string,
): InsulinEntity | undefined {
  return STATIC_INSULINS.map((insulin) => {
    const availableIn = inferAvailableIn(insulin.name);
    const variant = inferVariant(insulin.name);
    const normalizedInsulinName = normalize(insulin.name);
    const normalizedSimple = normalize(`${variant} ${availableIn}`);
    if (
      normalizedMedicamento.includes(normalizedInsulinName) ||
      normalizedInsulinName.includes(normalizedMedicamento) ||
      normalizedMedicamento.includes(normalizedSimple)
    ) {
      return new InsulinEntity({
        code: insulin.code,
        name: insulin.name,
        availableIn,
        variant,
      });
    }
    return undefined;
  }).find(Boolean);
}

function determineAvailabilityLevel(nivel: string): 1 | 2 | 3 {
  if (nivel === "alto") return 3;
  if (nivel === "baixo") return 1;
  return 2;
}

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

function createAvailabilityEntities(
  foundInsulins: Record<string, { quantity: number; level: 1 | 2 | 3 }>,
): AvailabilityEntity[] {
  return STATIC_INSULINS.map((insulin) => {
    const found = foundInsulins[insulin.code];
    return new AvailabilityEntity({
      insulin: new InsulinEntity({
        code: insulin.code,
        name: insulin.name,
        availableIn: inferAvailableIn(insulin.name),
        variant: inferVariant(insulin.name),
      }),
      quantity: found ? found.quantity : 0,
      level: found ? found.level : 1,
    });
  });
}

export function fromGetAvailability(response: any): PickupEntity[] {
  const disponibilidade = response?.result?.disponibilidade;

  if (!Array.isArray(disponibilidade)) return [];

  return disponibilidade.map((unit) => {
    const foundInsulins = processAvailableInsulins(unit.quantidades || []);
    const availability = createAvailabilityEntities(foundInsulins);
    const businessHours = transformBusinessHours(unit.expediente);

    return new PickupEntity({
      name: unit.unidade,
      address: {
        address: unit.endereco,
        latitude: unit.coordenadas.lat,
        longitude: unit.coordenadas.lng,
      },
      availability,
      businessHours,
    });
  });
}
