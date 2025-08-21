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

export async function normalizeRankings() {
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

	// Build list of current rankings (excluding the selected row)
	const rankings: Ranking[] = [];

	for(let i = firstDataRow; i <= lastDataRow; i++) {
		const cells = parseRow(tableLines[i]);
		const cellValue = cells[rankingCol];
		const match = /^\s*(\d+)(.*?)\s*$/.exec(cellValue);

		if(match) {
			const value = Number.parseInt(match[1], 10);

			rankings.push({ index: i, value, leftover: match[2], cells });
		}
	}

	rankings.sort((a, b) => a.value - b.value);

	for(const [ranking, row] of rankings.entries()) {
		row.value = ranking + 1;
		row.cells[rankingCol] = padSpaces(`${row.value}${row.leftover}`, row.cells[rankingCol], align);

		tableLines[row.index] = buildRow(row.cells);
	}

	await replaceTable(editor, tableRange, tableLines);
}
