import vscode from 'vscode';
import pkg from '../package.json';
import { clearRankings } from './commands/clear-rankings.js';
import { moveRanking } from './commands/move-ranking.js';
import { normalizeRankings } from './commands/normalize-rankings.js';
import { setRanking } from './commands/set-ranking.js';
import { ContextServiceManager } from './context/context-service-manager.js';

const CONFIG_KEY = 'markdownRankingTable';
const VERSION_KEY = 'version';

async function showWhatsNewMessage(version: string) { // {{{
	const actions: vscode.MessageItem[] = [{
		title: 'Homepage',
	}, {
		title: 'Release Notes',
	}];

	const result = await vscode.window.showInformationMessage(
		`Markdown Ranking Table has been updated to v${version} — check out what's new!`,
		...actions,
	);

	if(result !== null) {
		if(result === actions[0]) {
			await vscode.commands.executeCommand(
				'vscode.open',
				vscode.Uri.parse(`${pkg.homepage}`),
			);
		}
		else if(result === actions[1]) {
			await vscode.commands.executeCommand(
				'vscode.open',
				vscode.Uri.parse(`${pkg.homepage}/blob/master/CHANGELOG.md`),
			);
		}
	}
} // }}}

export async function activate(context: vscode.ExtensionContext): Promise<void> { // {{{
	const previousVersion = context.globalState.get<string>(VERSION_KEY);
	const currentVersion = pkg.version;

	const config = vscode.workspace.getConfiguration(CONFIG_KEY);

	if(previousVersion === undefined || currentVersion !== previousVersion) {
		void context.globalState.update(VERSION_KEY, currentVersion);

		const notification = config.get<string>('notification');

		if(previousVersion === undefined) {
			// don't show notification on install
		}
		else if(notification === 'major') {
			if(currentVersion.split('.')[0] > previousVersion.split('.')[0]) {
				void showWhatsNewMessage(currentVersion);
			}
		}
		else if(notification === 'minor') {
			if(currentVersion.split('.')[0] > previousVersion.split('.')[0] || (currentVersion.split('.')[0] === previousVersion.split('.')[0] && currentVersion.split('.')[1] > previousVersion.split('.')[1])) {
				void showWhatsNewMessage(currentVersion);
			}
		}
		else if(notification !== 'none') {
			void showWhatsNewMessage(currentVersion);
		}
	}

	const contextServiceManager = new ContextServiceManager();

	contextServiceManager.activate(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('markdownRankingTable.clearRankings', async () => clearRankings()),
		vscode.commands.registerCommand('markdownRankingTable.moveRankingUp', async () => moveRanking(-1)),
		vscode.commands.registerCommand('markdownRankingTable.moveRankingDown', async () => moveRanking(1)),
		vscode.commands.registerCommand('markdownRankingTable.normalizeRankings', async () => normalizeRankings()),
		vscode.commands.registerCommand('markdownRankingTable.setRanking', async () => setRanking()),
	);
} // }}}
