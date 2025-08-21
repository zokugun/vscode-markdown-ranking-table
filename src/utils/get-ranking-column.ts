import { type Position } from 'vscode';
import { parseRow } from './parse-row.js';

export function getRankingColumn(tableLines: string[], currentRow: number, position: Position): number {
	const headerCells = parseRow(tableLines[0]);
	const rankingColIndices = getRankingColIndices(headerCells);

	// Determine which ranking column we're in
	const thisLineText = tableLines[currentRow];
	let rankingCol = getRankingColumnAtPosition(position, headerCells, thisLineText);

	if(rankingCol === -1 || !rankingColIndices.includes(rankingCol)) {
		rankingCol = rankingColIndices[0];
	}

	return rankingCol;
}

function getRankingColIndices(headerCells: string[]): number[] { // {{{
	// All columns except the first one are considered ranking columns
	if(headerCells.length > 1) {
		return Array.from({ length: headerCells.length - 1 }, (_, i) => i + 1);
	}
	else {
		return [];
	}
} // }}}

function getRankingColumnAtPosition(position: Position, headerCells: string[], lineText: string): number { // {{{
	let pipeCount = -1;
	for(let i = 0; i < position.character && i < lineText.length; i++) {
		if(lineText[i] === '|') {
			pipeCount++;
		}
	}

	if(pipeCount <= 0) {
		return -1;
	}

	if(pipeCount >= headerCells.length) {
		return -1;
	}

	return pipeCount;
} // }}}
