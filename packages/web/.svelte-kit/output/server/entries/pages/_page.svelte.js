import "clsx";
import { d as spread_attributes, p as push, h as head, f as bind_props, c as pop, j as hasContext, g as getContext, e as escape_html, k as copy_payload, l as assign_payload } from "../../chunks/index.js";
function Icon_insulin_refill($$payload, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  $$payload.out += `<svg${spread_attributes(
    {
      ...props,
      version: "1.0",
      preserveAspectRatio: "xMidYMid meet",
      viewBox: "270.46 285.11 482.14 451.32"
    },
    null,
    void 0,
    void 0,
    3
  )}><g transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)" stroke="none"><path d="M4793 7375 c-548 -71 -1037 -307 -1408 -679 -331 -333 -544 -746 -626 -1213 -15 -89 -3 -139 41 -177 66 -55 152 -52 206 7 26 28 34 49 44 108 55 340 172 613 375 874 328 422 878 721 1444 786 150 17 454 7 606 -20 481 -85 867 -281 1186 -601 90 -92 259 -303 259 -325 0 -7 -40 -5 -117 7 -198 29 -313 34 -351 14 -100 -52 -94 -201 11 -245 27 -12 172 -35 406 -65 354 -46 365 -47 407 -31 71 27 79 47 134 322 28 136 66 320 86 409 42 185 41 219 -10 270 -78 78 -204 56 -246 -43 -5 -11 -27 -108 -50 -214 -22 -106 -42 -194 -44 -196 -2 -2 -36 41 -77 94 -40 54 -132 157 -204 228 -407 408 -897 634 -1504 695 -138 14 -442 11 -568 -5z"></path><path d="M4510 6542 c-19 -9 -45 -32 -57 -51 -22 -33 -23 -42 -23 -248 0 -235 3 -248 60 -297 24 -19 43 -26 76 -26 l44 0 0 -37 c0 -76 -19 -113 -99 -197 -90 -94 -113 -131 -135 -207 -15 -50 -16 -137 -14 -770 l3 -714 33 -67 c40 -81 110 -148 190 -180 57 -23 59 -23 532 -23 l475 0 67 33 c82 40 157 119 190 200 l23 57 3 693 c2 604 1 702 -13 755 -21 84 -53 133 -145 232 -82 86 -88 99 -92 175 l-3 45 45 5 c56 7 85 25 113 70 20 32 22 50 25 215 3 110 -1 200 -7 231 -13 55 -46 95 -94 113 -19 7 -219 11 -595 11 -520 0 -570 -1 -602 -18z m1018 -314 l3 -48 -415 0 -416 0 0 50 0 50 413 -2 412 -3 3 -47z m-168 -366 c0 -64 25 -157 57 -212 15 -25 63 -82 107 -128 l81 -83 5 -221 5 -220 -22 -9 c-13 -5 -61 -14 -108 -21 -129 -18 -199 -4 -360 77 -166 83 -230 99 -355 92 -52 -4 -108 -9 -123 -13 l-28 -7 3 155 3 155 87 91 c107 113 144 182 160 305 l12 87 238 0 238 0 0 -48z m-463 -1008 c26 -9 85 -38 132 -64 109 -62 202 -90 317 -97 73 -5 189 5 259 21 4 0 6 -145 5 -322 -1 -344 -4 -367 -49 -392 -13 -6 -172 -10 -445 -10 l-426 0 -32 29 -33 29 -3 396 -3 395 48 15 c64 20 172 20 230 0z"></path><path d="M7295 5115 c-52 -27 -67 -59 -81 -174 -53 -419 -235 -792 -544 -1115 -330 -345 -734 -557 -1206 -633 -153 -25 -518 -24 -659 1 -476 85 -833 267 -1168 595 -147 143 -355 412 -324 419 8 2 105 -9 216 -23 202 -25 203 -25 246 -6 78 35 108 124 63 190 -40 59 -68 69 -279 96 -107 13 -259 33 -339 45 -205 28 -241 27 -283 -10 -19 -16 -39 -42 -46 -57 -6 -16 -52 -208 -102 -428 -96 -420 -100 -453 -62 -504 37 -48 71 -66 128 -66 62 0 100 22 128 76 10 19 37 127 60 241 l42 207 90 -117 c174 -227 442 -470 685 -622 109 -68 319 -170 435 -210 135 -47 343 -98 500 -121 166 -26 483 -31 635 -11 548 72 1021 302 1400 682 331 330 560 743 645 1161 36 183 42 266 20 312 -10 21 -31 47 -48 59 -38 27 -112 34 -152 13z"></path></g></svg>`;
}
function logo($$payload) {
  $$payload.out += `<div class="flex items-center">`;
  Icon_insulin_refill($$payload, { class: "h-6 w-8" });
  $$payload.out += `<!----> <span class="mx-3 h-6 border-l border-black"></span> <h1 class="flex flex-col items-start text-2xl font-bold"><div class="flex items-center"><span>sp.</span> <span class="text-gray-500">insulina</span></div></h1></div>`;
}
function App_navbar($$payload) {
  $$payload.out += `<div class="flex h-14 w-fit items-center rounded-lg border border-gray-300 bg-white px-4 shadow-xl">`;
  logo($$payload);
  $$payload.out += `<!----></div>`;
}
function App_map($$payload, $$props) {
  push();
  let {
    pickups,
    focusedPickupId = void 0,
    sidebarWidth
  } = $$props;
  head($$payload, ($$payload2) => {
    $$payload2.out += `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/> <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""><\/script>`;
  });
  $$payload.out += `<div id="map" class="svelte-10chpr2"></div>`;
  bind_props($$props, { focusedPickupId });
  pop();
}
let contextKey = Symbol("phosphor-svelte");
function getIconContext() {
  if (hasContext(contextKey)) {
    return getContext(contextKey);
  }
  return {};
}
function Funnel($$payload, $$props) {
  push();
  const ctx = getIconContext();
  let { children, $$slots, $$events, ...props } = $$props;
  let weight = props.weight ?? ctx.weight ?? "regular";
  let color = props.color ?? ctx.color ?? "currentColor";
  let size = props.size ?? ctx.size ?? "1em";
  let mirrored = props.mirrored ?? ctx.mirrored ?? false;
  function svgAttr(obj) {
    let { weight: weight2, color: color2, size: size2, mirrored: mirrored2, ...attrs } = obj;
    return attrs;
  }
  $$payload.out += `<svg${spread_attributes(
    {
      xmlns: "http://www.w3.org/2000/svg",
      role: "img",
      width: size,
      height: size,
      fill: color,
      transform: mirrored ? "scale(-1, 1)" : void 0,
      viewBox: "0 0 256 256",
      ...svgAttr(ctx),
      ...svgAttr(props)
    },
    null,
    void 0,
    void 0,
    3
  )}>`;
  if (children) {
    $$payload.out += "<!--[-->";
    children($$payload);
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--><rect width="256" height="256" fill="none"></rect>`;
  if (weight === "bold") {
    $$payload.out += "<!--[-->";
    $$payload.out += `<path d="M234.29,47.91A20,20,0,0,0,216,36H40A20,20,0,0,0,25.2,69.45l.12.14L92,140.75V216a20,20,0,0,0,31.1,16.64l32-21.33A20,20,0,0,0,164,194.66V140.75l66.67-71.16.12-.14A20,20,0,0,0,234.29,47.91Zm-91,79.89A12,12,0,0,0,140,136v56.52l-24,16V136a12,12,0,0,0-3.25-8.2L49.23,60H206.77Z"></path>`;
  } else if (weight === "duotone") {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<path d="M221.9,61.38,152,136v58.65a8,8,0,0,1-3.56,6.66l-32,21.33A8,8,0,0,1,104,216V136L34.1,61.38A8,8,0,0,1,40,48H216A8,8,0,0,1,221.9,61.38Z" opacity="0.2"></path><path d="M230.6,49.53A15.81,15.81,0,0,0,216,40H40A16,16,0,0,0,28.19,66.76l.08.09L96,139.17V216a16,16,0,0,0,24.87,13.32l32-21.34A16,16,0,0,0,160,194.66V139.17l67.74-72.32.08-.09A15.8,15.8,0,0,0,230.6,49.53ZM40,56h0Zm106.18,74.58A8,8,0,0,0,144,136v58.66L112,216V136a8,8,0,0,0-2.16-5.47L40,56H216Z"></path>`;
  } else if (weight === "fill") {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<path d="M227.81,66.76l-.08.09L160,139.17v55.49A16,16,0,0,1,152.87,208l-32,21.34A16,16,0,0,1,96,216V139.17L28.27,66.85l-.08-.09A16,16,0,0,1,40,40H216a16,16,0,0,1,11.84,26.76Z"></path>`;
  } else if (weight === "light") {
    $$payload.out += "<!--[3-->";
    $$payload.out += `<path d="M228.77,50.34A13.8,13.8,0,0,0,216,42H40A14,14,0,0,0,29.67,65.42l.06.07L98,138.38V216a14,14,0,0,0,21.77,11.64l32-21.33A14,14,0,0,0,158,194.66V138.38l68.33-73A13.82,13.82,0,0,0,228.77,50.34Zm-11.26,6.94L147.62,131.9A6,6,0,0,0,146,136v58.66a2,2,0,0,1-.89,1.67l-32,21.33A2,2,0,0,1,110,216V136a6,6,0,0,0-1.62-4.1L38.53,57.32A2,2,0,0,1,40,54H216a1.9,1.9,0,0,1,1.83,1.19A1.86,1.86,0,0,1,217.51,57.28Z"></path>`;
  } else if (weight === "regular") {
    $$payload.out += "<!--[4-->";
    $$payload.out += `<path d="M230.6,49.53A15.81,15.81,0,0,0,216,40H40A16,16,0,0,0,28.19,66.76l.08.09L96,139.17V216a16,16,0,0,0,24.87,13.32l32-21.34A16,16,0,0,0,160,194.66V139.17l67.74-72.32.08-.09A15.8,15.8,0,0,0,230.6,49.53ZM40,56h0Zm106.18,74.58A8,8,0,0,0,144,136v58.66L112,216V136a8,8,0,0,0-2.16-5.47L40,56H216Z"></path>`;
  } else if (weight === "thin") {
    $$payload.out += "<!--[5-->";
    $$payload.out += `<path d="M227,51.15A11.85,11.85,0,0,0,216,44H40a12,12,0,0,0-8.88,20.07l.05.05L100,137.59V216a12,12,0,0,0,18.66,10l32-21.33a12,12,0,0,0,5.35-10V137.59l68.86-73.52A11.85,11.85,0,0,0,227,51.15Zm-8,7.5-69.9,74.62A4,4,0,0,0,148,136v58.65a4,4,0,0,1-1.78,3.33l-32,21.33A4,4,0,0,1,108,216V136a4,4,0,0,0-1.08-2.74L37.05,58.67A4,4,0,0,1,40,52H216a4,4,0,0,1,3,6.65Z"></path>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `${escape_html((console.error('Unsupported icon weight. Choose from "thin", "light", "regular", "bold", "fill", or "duotone".'), ""))}`;
  }
  $$payload.out += `<!--]--></svg>`;
  pop();
}
function App_filter_btn($$payload, $$props) {
  $$payload.out += `<button class="z-0 h-14 w-fit cursor-pointer rounded-xl border border-gray-300 bg-white px-4 shadow-lg">`;
  Funnel($$payload, { size: 18, weight: "fill" });
  $$payload.out += `<!----></button>`;
}
const userState = { location: {} };
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (x) => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function filterByInsulinCodes(data, insulinCodes) {
  if (!insulinCodes || insulinCodes.length === 0) return data;
  return data.filter(
    (item) => insulinCodes.every(
      (code) => item.availability.some((q) => q.insulin.code === code && q.quantity > 0)
    )
  );
}
function applyFiltersAndDistance(data, options) {
  let filtered = [...data];
  if (options.requestedInsulins && options.requestedInsulins.length > 0) {
    const insulinCodes = options.requestedInsulins.map((insulin) => insulin.code);
    filtered = filterByInsulinCodes(filtered, insulinCodes);
  }
  if (options.userLocation) {
    filtered = filtered.map((pickup) => ({
      ...pickup,
      address: {
        ...pickup.address,
        distance: haversineDistanceKm(
          options.userLocation.latitude,
          options.userLocation.longitude,
          pickup.address.latitude,
          pickup.address.longitude
        )
      }
    }));
  }
  if (options.userLocation) {
    filtered = filtered.sort((a, b) => {
      const da = a.address.distance;
      const db = b.address.distance;
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  }
  return filtered;
}
function applySorters(data, requestedInsulins = []) {
  return [...data].sort((a, b) => {
    const getInsulinScore = (availability, requestedCodes2 = []) => {
      const relevantAvailability = requestedCodes2.length > 0 ? availability.filter((a2) => requestedCodes2.includes(a2.insulin.code)) : availability;
      if (relevantAvailability.length === 0) return 0;
      const totalQuantity = relevantAvailability.reduce((acc, q) => acc + q.quantity, 0);
      const level3Count = relevantAvailability.filter((q) => q.level === 3).length;
      const maxLevel = Math.max(...relevantAvailability.map((q) => q.level));
      const level3Score = Math.min(level3Count / 2, 1) * 40;
      const coverageScore = requestedCodes2.length > 0 ? relevantAvailability.length / requestedCodes2.length * 20 : 20;
      const levelScore = maxLevel / 3 * 20;
      const quantityScore = Math.min(totalQuantity / 20, 1) * 20;
      return level3Score + coverageScore + levelScore + quantityScore;
    };
    const requestedCodes = requestedInsulins.map((insulin) => insulin.code);
    const aInsulinScore = getInsulinScore(a.availability, requestedCodes);
    const bInsulinScore = getInsulinScore(b.availability, requestedCodes);
    if (a.address.distance != null && b.address.distance != null) {
      const getDistanceScore = (distance) => Math.max(0, 100 - distance * 2);
      const aDistanceScore = getDistanceScore(a.address.distance);
      const bDistanceScore = getDistanceScore(b.address.distance);
      const aScore = aDistanceScore * 0.2 + aInsulinScore * 0.8;
      const bScore = bDistanceScore * 0.2 + bInsulinScore * 0.8;
      return bScore - aScore;
    }
    return bInsulinScore - aInsulinScore;
  });
}
function _page($$payload, $$props) {
  push();
  let pickups = [];
  let insulinTypes = [];
  let focusedPickupId = "";
  let requestedInsulins = insulinTypes.length ? Array.from(new Map(pickups.flatMap((pickup) => pickup.availability).filter((a) => insulinTypes.includes(a.insulin.type)).map((a) => [a.insulin.code, a.insulin])).values()) : [];
  let userLocation = userState.location.data ?? null;
  let filteredPickups = applySorters(
    applyFiltersAndDistance(pickups, {
      requestedInsulins,
      userLocation
    }),
    requestedInsulins
  );
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    App_map($$payload2, {
      pickups: filteredPickups.map((pickup) => ({
        id: pickup.id,
        name: pickup.name,
        address: pickup.address.address,
        latitude: pickup.address.latitude,
        longitude: pickup.address.longitude
      })),
      get focusedPickupId() {
        return focusedPickupId;
      },
      set focusedPickupId($$value) {
        focusedPickupId = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> <div class="pointer-events-none absolute top-0 left-0 z-10 flex h-screen w-screen flex-col justify-between gap-4 overflow-hidden p-2 lg:justify-normal lg:p-4 xl:p-6 [&amp;>*]:pointer-events-auto"><div class="flex items-center gap-2">`;
    App_navbar($$payload2);
    $$payload2.out += `<!----> `;
    {
      $$payload2.out += "<!--[-->";
      App_filter_btn($$payload2);
    }
    $$payload2.out += `<!--]--></div> <div class="flex h-[40%] flex-col gap-2 overflow-hidden lg:h-full lg:max-w-1/4">`;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <div class="scrollbar-none h-full overflow-y-scroll rounded-2xl border border-gray-300 bg-white shadow-xl"><div class="p-4">`;
    {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<p class="text-sm text-gray-400">Carregando pontos de retirada...</p>`;
    }
    $$payload2.out += `<!--]--></div></div></div></div>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
export {
  _page as default
};
