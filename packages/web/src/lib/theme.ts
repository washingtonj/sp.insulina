export type Theme = 'dark' | 'light';

const THEME_COLOR: Record<Theme, string> = {
	dark: '#0a0a0a',
	light: '#f2f2f7'
};

export function readTheme(): Theme {
	if (typeof document === 'undefined') return 'dark';

	return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
	document.documentElement.dataset.theme = theme;
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
	localStorage.setItem('theme', theme);
}
