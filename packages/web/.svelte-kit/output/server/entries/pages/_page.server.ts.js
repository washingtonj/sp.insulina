const BASE_URL = "https://southamerica-east1-mobile-testes.cloudfunctions.net";
const PRE_DEFINED_CORDINATES = {
  address: "Alameda dos Jambos - Recanto Campo Belo, São Paulo - SP",
  latitude: -22.6965292,
  longitude: -46.716467
};
const STATIC_INSULINS = [
  {
    code: "1106400904401002",
    fullName: "INSULINA HUMANA NPH 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML",
    simpleName: "INSULINA HUMANA NPH 100 UI/ML",
    type: "REFILL"
  },
  {
    code: "1106400904401010",
    fullName: "INSULINA HUMANA REGULAR 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML",
    simpleName: "INSULINA HUMANA REGULAR 100 UI/ML",
    type: "REFILL"
  },
  {
    code: "1106400904400910",
    fullName: "INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML",
    simpleName: "INSULINA HUMANA REGULAR 100 UI/ML",
    type: "CANETA"
  },
  {
    code: "1106400904400057",
    fullName: "INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML",
    simpleName: "INSULINA HUMANA REGULAR 100 UI/ML",
    type: "AMPOLA"
  },
  {
    code: "1106400904400901",
    fullName: "INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML",
    simpleName: "INSULINA HUMANA NPH 100 UI/ML",
    type: "CANETA"
  },
  {
    code: "1106400904400049",
    fullName: "INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML",
    simpleName: "INSULINA HUMANA NPH 100 UI/ML",
    type: "AMPOLA"
  }
];
function transformBusinessHours(expediente) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push({
      dayOfWeek: i,
      hours: ["00:00", "00:00"],
      isOpen: false
    });
  }
  if (!expediente) return days;
  if (expediente.includes("De Segunda a Sexta")) {
    const timeMatch = expediente.match(/(\d{2}:\d{2})\s*até\s*(\d{2}:\d{2})/);
    if (timeMatch) {
      const hours = [timeMatch[1], timeMatch[2]];
      for (let i = 1; i <= 5; i++) {
        days[i] = { dayOfWeek: i, hours, isOpen: true };
      }
    }
  }
  if (expediente.includes("Sábado:")) {
    const sabPart = expediente.split("|").find((p) => p.includes("Sábado:")) || "";
    const timeMatch = sabPart.match(/(\d{2}:\d{2})\s*até\s*(\d{2}:\d{2})/);
    if (timeMatch) {
      days[6] = {
        dayOfWeek: 6,
        hours: [timeMatch[1], timeMatch[2]],
        isOpen: true
      };
    }
  }
  if (expediente.includes("Domingo:")) {
    const domPart = expediente.split("|").find((p) => p.includes("Domingo:")) || "";
    const timeMatch = domPart.match(/(\d{2}:\d{2})\s*até\s*(\d{2}:\d{2})/);
    if (timeMatch) {
      days[0] = {
        dayOfWeek: 0,
        hours: [timeMatch[1], timeMatch[2]],
        isOpen: true
      };
    }
  }
  if (expediente.includes("De Segunda a Domingo")) {
    const timeMatch = expediente.match(/(\d{2}:\d{2})\s*até\s*(\d{2}:\d{2})/);
    if (timeMatch) {
      const hours = [timeMatch[1], timeMatch[2]];
      for (let i = 0; i < 7; i++) {
        days[i] = { dayOfWeek: i, hours, isOpen: true };
      }
    }
  }
  return days;
}
const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalize = (str) => removeAccents(str).replace(/\s+/g, " ").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().trim();
const typeHeuristics = {
  CANETA: (name) => name.includes("preenchido"),
  AMPOLA: (name) => name.includes("fam10ml"),
  REFILL: (name) => name.includes("carpule") || name.includes("tubete")
};
function processAvailableInsulins(quantities) {
  return quantities.reduce((acc, item) => {
    const normalizedMedicamento = normalize(item.medicamento);
    const matchedInsulin = findMatchingInsulin(normalizedMedicamento);
    if (matchedInsulin) {
      const level = determineAvailabilityLevel(item.nivelDisponibilidade);
      acc[matchedInsulin.code] = {
        quantity: Number(item.quantidade),
        level
      };
    }
    return acc;
  }, {});
}
function findMatchingInsulin(normalizedMedicamento) {
  return STATIC_INSULINS.find((insulin) => {
    const normalizedInsulinName = normalize(insulin.fullName);
    const normalizedInsulinSimple = normalize(insulin.simpleName);
    const typeHeuristic = typeHeuristics[insulin.type];
    const typeMatch = typeHeuristic ? typeHeuristic(normalizedMedicamento) : false;
    const simpleNameMatch = normalizedMedicamento.includes(normalizedInsulinSimple);
    return (normalizedInsulinName.includes(normalizedMedicamento) || normalizedMedicamento.includes(normalizedInsulinName) || typeMatch) && simpleNameMatch;
  });
}
function determineAvailabilityLevel(nivel) {
  if (nivel === "alto") return 3;
  if (nivel === "baixo") return 1;
  return 2;
}
function createAvailabilityEntities(foundInsulins) {
  return STATIC_INSULINS.map((insulin) => {
    const found = foundInsulins[insulin.code];
    return {
      insulin: {
        code: insulin.code,
        fullName: insulin.fullName,
        simpleName: insulin.simpleName,
        type: insulin.type
      },
      quantity: found ? found.quantity : 0,
      level: found ? found.level : 1
      // Default to lowest level if not found
    };
  });
}
function fromGetAvailability(response) {
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
        longitude: unit.coordenadas.lng
      },
      availability,
      businessHours
    };
  });
  return pickups;
}
async function getAvailability() {
  const request = await fetch(`${BASE_URL}/disponilidadesParaMedicamentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      data: {
        medicamentos: STATIC_INSULINS.map((insulin) => ({
          id: insulin.code,
          name: insulin.fullName
        })),
        coordenadas: {
          lat: PRE_DEFINED_CORDINATES.latitude,
          lng: PRE_DEFINED_CORDINATES.longitude
        },
        endereco: PRE_DEFINED_CORDINATES.address
      }
    })
  });
  const response = await request.json();
  const transformedResponse = fromGetAvailability(response);
  return transformedResponse;
}
const load = async () => {
  return {
    pickups: structuredClone(await getAvailability())
  };
};
export {
  load
};
