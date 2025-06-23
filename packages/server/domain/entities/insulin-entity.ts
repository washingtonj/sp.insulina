import { type WithoutMethods } from "utils/ts-utils";

export class InsulinEntity {
  code!: string;
  name!: string;
  availableIn!: "AMPOLA" | "CANETA" | "REFILL";
  variant!: "NPH" | "REGULAR";

  constructor(data: WithoutMethods<InsulinEntity>) {
    Object.assign(this, data);
  }
}
