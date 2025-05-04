import * as vscode from 'vscode';
import { registerSettingsCommands, ZoomLevel } from './settingsManager';

// Extension settings interface
interface ZoomSwitcherSettings {
	zoomLevels: ZoomLevel[];
	showZoomValue: boolean;
	showProfileName: boolean;
	position: 'left' | 'right';
	priority: number;
	statusBarIcon: string;
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Zoom Switcher extension is now active!');

	// Get extension settings
	function getSettings(): ZoomSwitcherSettings {
		const config = vscode.workspace.getConfiguration('zoomSwitcher');
		return {
			zoomLevels: config.get<ZoomLevel[]>('zoomLevels') || [
				{ name: 'Zoom Out', level: -0.5 },
				{ name: 'Default', level: 0 },
				{ name: 'Zoom In', level: 0.5 }
			],
			showZoomValue: config.get<boolean>('showZoomValue') ?? true,
			showProfileName: config.get<boolean>('showProfileName') ?? false,
			position: config.get<'left' | 'right'>('position') || 'right',
			priority: config.get<number>('priority') ?? 100,
			statusBarIcon: config.get<string>('statusBarIcon') || 'zoom-in'
		};
	}

	// Initialize settings and create status bar item
	const initialSettings = getSettings();
	let settings = initialSettings;
	let zoomStatusBarItem = vscode.window.createStatusBarItem(
		settings.position === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right,
		settings.priority
	);

	// Function to update status bar with current zoom level
	function updateStatusBar(): void {
		const config = vscode.workspace.getConfiguration('window');
		const currentZoomLevel = config.get('zoomLevel', 0);

		// Find the current profile name based on zoom level
		const currentProfile = settings.zoomLevels.find(zl => zl.level === currentZoomLevel);
		const profileName = currentProfile?.name || '';

		// Build status bar text based on settings
		let statusText = `$(${settings.statusBarIcon})`;
		
		if (settings.showZoomValue || settings.showProfileName) {
			statusText += ' ';
			
			if (settings.showProfileName && profileName) {
				statusText += profileName;
				if (settings.showZoomValue) {
					statusText += ' ';
				}
			}
			
			if (settings.showZoomValue) {
				statusText += `${currentZoomLevel}`;
			}
		}

		zoomStatusBarItem.text = statusText;
	}

	// Initialize status bar item
	zoomStatusBarItem.command = 'zoom-switcher.selectZoom';
	zoomStatusBarItem.tooltip = 'Select Zoom Level';
	updateStatusBar();
	zoomStatusBarItem.show();

	// Register settings management commands
	registerSettingsCommands(context);

	// Register the command to select zoom level
	const selectZoomCommand = vscode.commands.registerCommand('zoom-switcher.selectZoom', async () => {
		// Refresh settings in case they changed
		settings = getSettings();

		// Create quick pick items from zoom levels
		const quickPickItems = settings.zoomLevels.map(zoomLevel => ({
			label: zoomLevel.name,
			description: `Zoom level: ${zoomLevel.level}`,
			level: zoomLevel.level
		}));

		const selectedZoom = await vscode.window.showQuickPick(quickPickItems, {
			placeHolder: 'Select a zoom level'
		});

		if (selectedZoom) {
			try {
				// Get the current configuration
				const currentConfig = vscode.workspace.getConfiguration('window');
				// Update the zoom level
				await currentConfig.update('zoomLevel', selectedZoom.level, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Zoom level set to: ${selectedZoom.label} (${selectedZoom.level})`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to set zoom level: ${error}`);
			}
		}
	});

	// Register command to manually refresh zoom settings
	const refreshZoomCommand = vscode.commands.registerCommand('zoom-switcher.refreshZoom', async () => {
		// Force reload settings
		settings = getSettings();
		updateStatusBar();

		// Apply current zoom level to accurately reflect all settings
		const windowConfig = vscode.workspace.getConfiguration('window');
		const currentZoomLevel = windowConfig.get('zoomLevel', 0);

		try {
			await windowConfig.update('zoomLevel', currentZoomLevel, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('Zoom Switcher refreshed');
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to refresh zoom: ${error}`);
		}
	});

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('window.zoomLevel')) {
				updateStatusBar();
			}

			if (e.affectsConfiguration('zoomSwitcher')) {
				// Reload settings
				const oldSettings = { ...settings };
				settings = getSettings();

				// Handle position or priority change
				if (oldSettings.position !== settings.position || oldSettings.priority !== settings.priority) {
					// Need to recreate the status bar item
					const oldStatusBarItem = zoomStatusBarItem;

					// Create new status bar item with updated position/priority
					const newStatusBarItem = vscode.window.createStatusBarItem(
						settings.position === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right,
						settings.priority
					);

					newStatusBarItem.command = 'zoom-switcher.selectZoom';
					newStatusBarItem.tooltip = 'Select Zoom Level';

					// Update current text
					const config = vscode.workspace.getConfiguration('window');
					const currentZoomLevel = config.get('zoomLevel', 0);

					// Find the current profile name based on zoom level
					const currentProfile = settings.zoomLevels.find(zl => zl.level === currentZoomLevel);
					const profileName = currentProfile?.name || '';

					// Build status bar text based on settings
					let statusText = `$(${settings.statusBarIcon})`;
					
					if (settings.showZoomValue || settings.showProfileName) {
						statusText += ' ';
						
						if (settings.showProfileName && profileName) {
							statusText += profileName;
							if (settings.showZoomValue) {
								statusText += ' ';
							}
						}
						
						if (settings.showZoomValue) {
							statusText += `${currentZoomLevel}`;
						}
					}

					newStatusBarItem.text = statusText;

					// Show new and hide old
					newStatusBarItem.show();
					oldStatusBarItem.dispose();

					// Replace reference
					zoomStatusBarItem = newStatusBarItem;

					// Add to subscriptions
					context.subscriptions.push(newStatusBarItem);
				} else {
					// Just update the display based on current settings
					updateStatusBar();
				}

				// Apply current zoom level to accurately reflect settings changes immediately
				const windowConfig = vscode.workspace.getConfiguration('window');
				const currentZoomLevel = windowConfig.get('zoomLevel', 0);
				windowConfig.update('zoomLevel', currentZoomLevel, vscode.ConfigurationTarget.Global)
					.then(() => {
						// Force update UI after slight delay to ensure changes are applied
						setTimeout(() => {
							updateStatusBar();
						}, 100);
					});
			}
		})
	);

	// Add disposables to context
	context.subscriptions.push(zoomStatusBarItem);
	context.subscriptions.push(selectZoomCommand);
	context.subscriptions.push(refreshZoomCommand);
}

// This method is called when your extension is deactivated
export function deactivate(): void {}
