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
		client: {start:"_app/immutable/entry/start.PvwM_N9Q.js",app:"_app/immutable/entry/app.BKymYJEh.js",imports:["_app/immutable/entry/start.PvwM_N9Q.js","_app/immutable/chunks/CRiyLjJv.js","_app/immutable/chunks/j7zHUx7l.js","_app/immutable/chunks/DtTjHsJG.js","_app/immutable/entry/app.BKymYJEh.js","_app/immutable/chunks/j7zHUx7l.js","_app/immutable/chunks/CBgmeM0U.js","_app/immutable/chunks/BFnhx1wm.js","_app/immutable/chunks/DtTjHsJG.js","_app/immutable/chunks/DyfUXjt_.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
