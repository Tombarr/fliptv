import { getItem, setItem } from '../compat/storage';

const ObjectFit = ['contain', 'cover', 'fill'];

export function getObjectFit(): string {
	return getItem('o') || ObjectFit[0];
}

export function nextObjectFit(): string {
	const idx = ObjectFit.indexOf(getObjectFit());
	const len = ObjectFit.length;

	const nextFit = ObjectFit[((idx === len - 1) ? 0 : idx + 1)];
	setItem('o', nextFit);

	return nextFit;
}
