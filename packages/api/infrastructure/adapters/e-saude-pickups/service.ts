import type { PickupService } from "../../../domain/interfaces/pickup-service.ts";
import { STATIC_INSULINS, PRE_DEFINED_CORDINATES, BASE_URL } from "./consts.ts";
import { fromGetAvailability } from "./transform.ts";

export class ESaudeService implements PickupService {
  async getPickupsAvailabilities() {
    const request = await fetch(`${BASE_URL}/disponilidadesParaMedicamentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        data: {
          medicamentos: STATIC_INSULINS.map((insulin) => ({
            id: insulin.code,
            name: insulin.name,
          })),
          coordenadas: {
            lat: PRE_DEFINED_CORDINATES.latitude,
            lng: PRE_DEFINED_CORDINATES.longitude,
          },
          endereco: PRE_DEFINED_CORDINATES.address,
        },
      }),
    });

    const response = await request.json();
    const transformedResponse = fromGetAvailability(response);

    return transformedResponse;
  }
}
