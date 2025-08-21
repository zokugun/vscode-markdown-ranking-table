import { parseRow } from './parse-row.js';
import { type Align } from './types.js';

export function getColumnAlign(tableLines: string[], rankingCol: number): Align {
	const cells = parseRow(tableLines[1]);
	const separator = cells[rankingCol + 1];
	const match = /\s*(:?)-+(:?)\s*/.exec(separator);

	if(match) {
		if(match[1]) {
			if(match[2]) {
				return 'center';
			}
			else {
				return 'left';
			}
		}
		else if(match[2]) {
			return 'right';
		}
		else {
			return 'default';
		}
	}
	else {
		return 'default';
	}
}
