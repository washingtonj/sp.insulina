import { traceSpan } from "../../telemetry/spans.ts";
import type { PickupRepository } from "../interfaces/pickup-repository.ts";
import { spDayKey, startOfDay } from "./get-availability-series.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

export type PickupBestDay = {
  dayOfMonth: number;
  averageUnits: number;
  samples: number;
};

export type BestDayProfile = Record<string, PickupBestDay>;

type Adapters = {
  pickupRepository: PickupRepository;
};

type Args = {
  days: number;
  now?: Date;
};

/**
 * Para cada unidade, o dia do mês em que o estoque médio é maior —
 * o dia em que ela costuma receber insumos. A escolha do dia é feita na
 * query; aqui só se monta o mapa por uuid.
 */
export async function getBestDayProfile(
  { pickupRepository }: Adapters,
  { days, now = new Date() }: Args,
): Promise<BestDayProfile> {
  return traceSpan("best_day.profile", { "profile.days": days }, async () => {
    const endDate = now;
    const startDate = startOfDay(
      spDayKey(new Date(now.getTime() - (days - 1) * DAY_MS)),
    );

    const rows = await pickupRepository.getBestDayProfile({
      startDate,
      endDate,
    });

    return Object.fromEntries(
      rows.map((row) => [
        row.uuid,
        {
          dayOfMonth: row.dayOfMonth,
          averageUnits: row.averageUnits,
          samples: row.samples,
        },
      ]),
    );
  });
}
