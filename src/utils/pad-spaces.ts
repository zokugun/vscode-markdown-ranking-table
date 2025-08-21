import { type Align } from './types.js';

export function padSpaces(newValue: string, oldValue: string, align: Align): string {
	if(align === 'center') {
		const length = oldValue.length - newValue.length;
		const left = Math.floor(length / 2);
		const right = Math.ceil(length / 2);

		return `${' '.repeat(left)}${newValue}${' '.repeat(right)}`;
	}
	else if(align === 'right') {
		return `${' '.repeat(oldValue.length - 1 - newValue.length)}${newValue} `;
	}
	else {
		return ` ${newValue}${' '.repeat(oldValue.length - 1 - newValue.length)}`;
	}
}
