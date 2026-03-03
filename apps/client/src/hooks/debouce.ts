import { useCallback, useRef } from "react";

export function useDebounce<T extends unknown[]>(
	fn: (...args: T) => void,
	getKey?: (...args: T) => string,
	delay = 2000,
) {
	const timers = useRef<Map<string, number>>(new Map());
	const timer = useRef<number | undefined>(undefined);

	return useCallback(
		(...args: T) => {
			if (!getKey) {
				clearTimeout(timer.current);
				timer.current = setTimeout(() => fn(...args), delay);
				return;
			}

			const key = getKey(...args);
			clearTimeout(timers.current.get(key));

			const id = setTimeout(() => {
				fn(...args);
				timers.current.delete(key);
			}, delay);

			timers.current.set(key, id);
		},
		[fn, delay, getKey],
	);
}
