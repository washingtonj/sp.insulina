import type { InsulinEntity } from "domain/entities/insulin";
import type { AddressEntity } from "domain/entities/address";

export const BASE_URL =
  "https://southamerica-east1-mobile-testes.cloudfunctions.net";

export const PRE_DEFINED_CORDINATES: AddressEntity = {
  address: "Alameda dos Jambos - Recanto Campo Belo, São Paulo - SP",
  latitude: -22.6965292,
  longitude: -46.716467,
};

export const STATIC_INSULINS: InsulinEntity[] = [
  {
    code: "1106400904401002",
    name: "INSULINA HUMANA NPH 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML",
    simpleName: "INSULINA HUMANA NPH 100 UI/ML",
    type: "REFILL",
  },
  {
    code: "1106400904401010",
    name: "INSULINA HUMANA REGULAR 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML",
    simpleName: "INSULINA HUMANA REGULAR 100 UI/ML",
    type: "REFILL",
  },
  {
    code: "1106400904400910",
    name: "INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML",
    simpleName: "INSULINA HUMANA REGULAR 100 UI/ML",
    type: "CANETA",
  },
  {
    code: "1106400904400057",
    name: "INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML",
    simpleName: "INSULINA HUMANA REGULAR 100 UI/ML",
    type: "AMPOLA",
  },
  {
    code: "1106400904400901",
    name: "INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML",
    simpleName: "INSULINA HUMANA NPH 100 UI/ML",
    type: "CANETA",
  },
  {
    code: "1106400904400049",
    name: "INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML",
    simpleName: "INSULINA HUMANA NPH 100 UI/ML",
    type: "AMPOLA",
  },
];
