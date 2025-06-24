import { PickupService } from "domain/interfaces/pickup-service";
import { STATIC_INSULINS, PRE_DEFINED_CORDINATES, BASE_URL } from "./consts";
import { fromGetAvailability } from "./transform";

export class ESaudeService implements PickupService {
  async getPickupsAvailabilities() {
    const request = await fetch(`${BASE_URL}/disponilidadesParaMedicamentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
