import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.BpRMKIHN.js","_app/immutable/chunks/Q7HGMubA.js","_app/immutable/chunks/CANPExQ-.js","_app/immutable/chunks/CtlOYzeY.js","_app/immutable/chunks/Cgx2dca6.js","_app/immutable/chunks/kljrEgok.js","_app/immutable/chunks/CYRss8Fr.js"];
export const stylesheets = ["_app/immutable/assets/2.CV-KWLNP.css"];
export const fonts = [];
