import { env } from '$env/dynamic/public';

const DEPLOYED_API_URL = 'https://sp-insulina-server.wwnjr.workers.dev';

export const API_URL = env.PUBLIC_API_URL ?? DEPLOYED_API_URL;
