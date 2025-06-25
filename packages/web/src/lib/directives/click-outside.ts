export function clickOutside(
	node: HTMLElement,
	{ active = true, callback }: { active?: boolean; callback: (event: MouseEvent) => void }
) {
	const handleClick = (event: MouseEvent) => {
		if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
			callback(event);
		}
	};

	if (active) {
		document.addEventListener('click', handleClick, true);
	}

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
