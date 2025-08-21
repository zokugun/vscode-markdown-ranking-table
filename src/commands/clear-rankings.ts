import vscode from 'vscode';
import { buildRow } from '../utils/build-row.js';
import { findTableRange } from '../utils/find-table-range.js';
import { getRankingColumn } from '../utils/get-ranking-column.js';
import { getTableLines } from '../utils/get-table-lines.js';
import { parseRow } from '../utils/parse-row.js';
import { replaceTable } from '../utils/replace-table.js';

export async function clearRankings() {
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

	for(let i = firstDataRow; i <= lastDataRow; i++) {
		const cells = parseRow(tableLines[i]);
		const value = cells[rankingCol].trim();

		if(value.length > 0) {
			cells[rankingCol] = cells[rankingCol].replace(value, ' '.repeat(value.length));
		}

		tableLines[i] = buildRow(cells);
	}

	await replaceTable(editor, tableRange, tableLines);
}
