import vscode from 'vscode';
import { buildRow } from '../utils/build-row.js';
import { findTableRange } from '../utils/find-table-range.js';
import { getColumnAlign } from '../utils/get-column-align.js';
import { getRankingColumn } from '../utils/get-ranking-column.js';
import { getTableLines } from '../utils/get-table-lines.js';
import { padSpaces } from '../utils/pad-spaces.js';
import { parseRow } from '../utils/parse-row.js';
import { replaceTable } from '../utils/replace-table.js';
import { type Ranking } from '../utils/types.js';

export async function moveRanking(direction: number) {
	const editor = vscode.window.activeTextEditor;
	if(!editor) {
		return;
	}

	const document = editor.document;
	const position = editor.selection.active;
	const line = position.line;

	const tableRange = findTableRange(document, line);
	if(!tableRange) {
		return;
	}

	const tableLines = getTableLines(document, tableRange);

	const firstDataRow = 2;
	const lastDataRow = tableLines.length - 1;
	const currentRow = line - tableRange.start.line;

	if(currentRow < firstDataRow || currentRow > lastDataRow) {
		return;
	}

	const rankingCol = getRankingColumn(tableLines, currentRow, position);
	if(!rankingCol || rankingCol < 1) {
		await vscode.window.showWarningMessage('No ranking column found under cursor.');

		return;
	}

	const align = getColumnAlign(tableLines, rankingCol);

	let setRanking = false;
	let currentRanking: Ranking | null = null;

	// Build list of current rankings (excluding the selected row)
	const rankings: Ranking[] = [];
	for(let i = firstDataRow; i <= lastDataRow; i++) {
		const cells = parseRow(tableLines[i]);
		const cellValue = cells[rankingCol];
		const match = /^\s*(\d+)(.*?)\s*$/.exec(cellValue);

		if(match) {
			const value = Number.parseInt(match[1], 10);

			if(i === currentRow) {
				currentRanking = { index: i, value, leftover: match[2], cells };

				rankings.push(currentRanking);
			}
			else {
				rankings.push({ index: i, value, leftover: match[2], cells });
			}
		}
		else {
			if(i === currentRow && cellValue.trim().length === 0) {
				setRanking = true;
				currentRanking = { index: i, value: -1, leftover: '', cells };

				rankings.push(currentRanking);
			}
		}
	}

	if(!currentRanking) {
		return;
	}

	if(setRanking) {
		const cellValue = currentRanking.cells[rankingCol];

		if(direction === 1) {
			currentRanking.value = rankings.length;
		}
		else {
			currentRanking.value = 1;

			for(const row of rankings) {
				if(row.index === currentRow) {
					continue;
				}

				const cellValue = row.cells[rankingCol];

				row.value += 1;
				row.cells[rankingCol] = padSpaces(`${row.value}${row.leftover}`, cellValue, align);

				tableLines[row.index] = buildRow(row.cells);
			}
		}

		currentRanking.cells[rankingCol] = padSpaces(`${currentRanking.value}${currentRanking.leftover}`, cellValue, align);

		tableLines[currentRanking.index] = buildRow(currentRanking.cells);
	}
	else {
		if(direction === 1) {
			currentRanking.value = Math.min(rankings.length, currentRanking.value + 1);
		}
		else {
			currentRanking.value = Math.max(1, currentRanking.value - 1);
		}

		currentRanking.cells[rankingCol] = padSpaces(`${currentRanking.value}${currentRanking.leftover}`, currentRanking.cells[rankingCol], align);

		tableLines[currentRanking.index] = buildRow(currentRanking.cells);

		for(const row of rankings) {
			if(row.index === currentRow) {
				continue;
			}

			if(row.value === currentRanking.value) {
				const cellValue = row.cells[rankingCol];

				row.value -= direction;

				row.cells[rankingCol] = padSpaces(`${row.value}${row.leftover}`, cellValue, align);

				tableLines[row.index] = buildRow(row.cells);
			}
		}
	}

	await replaceTable(editor, tableRange, tableLines);
}
