export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.DL7KPZkO.js",app:"_app/immutable/entry/app.CSD7Ir0U.js",imports:["_app/immutable/entry/start.DL7KPZkO.js","_app/immutable/chunks/9ZVXE-EN.js","_app/immutable/chunks/CANPExQ-.js","_app/immutable/chunks/CYRss8Fr.js","_app/immutable/entry/app.CSD7Ir0U.js","_app/immutable/chunks/CANPExQ-.js","_app/immutable/chunks/Cgx2dca6.js","_app/immutable/chunks/Q7HGMubA.js","_app/immutable/chunks/CYRss8Fr.js","_app/immutable/chunks/CtlOYzeY.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

export const prerendered = new Set([]);

export const base_path = "";
