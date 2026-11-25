import type { WithoutMethods } from "../../utils/ts-utils.ts";

export type InsulinType = "AMPOLA" | "CANETA" | "REFILL";
export type InsulinVariant = "NPH" | "REGULAR";

export class InsulinEntity {
  code!: string;
  name!: string;
  type!: InsulinType;
  variant!: InsulinVariant;

  constructor(data: WithoutMethods<InsulinEntity>) {
    Object.assign(this, data);
  }
}
