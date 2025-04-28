// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { registerSettingsCommands, ZoomLevel } from './settingsManager';

// Extension settings interface
interface ZoomSwitcherSettings {
	zoomLevels: ZoomLevel[];
	showCurrentZoomLevel: boolean;
	position: 'left' | 'right';
	priority: number;
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Zoom Switcher extension is now active!');

	// Register settings management commands
	registerSettingsCommands(context);

	// Get extension settings
	function getSettings(): ZoomSwitcherSettings {
		const config = vscode.workspace.getConfiguration('zoomSwitcher');
		return {
			zoomLevels: config.get<ZoomLevel[]>('zoomLevels') || [
				{ name: 'Zoom Out', level: -0.5 },
				{ name: 'Default', level: 0 },
				{ name: 'Zoom In', level: 0.5 }
			],
			showCurrentZoomLevel: config.get<boolean>('showCurrentZoomLevel') ?? true,
			position: config.get<'left' | 'right'>('position') || 'right',
			priority: config.get<number>('priority') ?? 100
		};
	}

	// Create status bar item
	let settings = getSettings();
	let zoomStatusBarItem = vscode.window.createStatusBarItem(
		settings.position === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right,
		settings.priority
	);
	
	zoomStatusBarItem.command = 'zoom-switcher.selectZoom';
	zoomStatusBarItem.tooltip = 'Select Zoom Level';
	zoomStatusBarItem.show();

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

	// Function to update status bar with current zoom level
	function updateStatusBar() {
		// Refresh settings to ensure we have the latest
		settings = getSettings();
		
		const config = vscode.workspace.getConfiguration('window');
		const currentZoomLevel = config.get('zoomLevel', 0);
		
		if (settings.showCurrentZoomLevel) {
			zoomStatusBarItem.text = `$(zoom-in) ${currentZoomLevel}`;
		} else {
			zoomStatusBarItem.text = '$(zoom-in)';
		}
	}

	// Update status bar on activation
	updateStatusBar();

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('window.zoomLevel')) {
				updateStatusBar();
			}
			
			if (e.affectsConfiguration('zoomSwitcher')) {
				// Reload settings
				const oldSettings = {...settings};
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
					
					if (settings.showCurrentZoomLevel) {
						newStatusBarItem.text = `$(zoom-in) ${currentZoomLevel}`;
					} else {
						newStatusBarItem.text = '$(zoom-in)';
					}
					
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
export function deactivate() {}
