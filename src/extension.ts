import * as vscode from 'vscode';
import { registerSettingsCommands, ZoomLevel } from './settingsManager';

// Extension settings interface
interface ZoomSwitcherSettings {
	zoomLevels: ZoomLevel[];
	showZoomValue: boolean;
	showProfileName: boolean;
	enableStatusBarClickCycling: boolean;
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
			enableStatusBarClickCycling: config.get<boolean>('enableStatusBarClickCycling') ?? false,
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
	updateStatusBarCommand();
	updateStatusBar();
	zoomStatusBarItem.show();
	
	// Function to update status bar command based on click cycling settings
	function updateStatusBarCommand(): void {
		if (settings.enableStatusBarClickCycling) {
			// Set the command to cycle forward on click
			zoomStatusBarItem.command = 'zoom-switcher.cycleForward';
			zoomStatusBarItem.tooltip = 'Left-click: Next Zoom Level (use context menu for more options)';
		} else {
			zoomStatusBarItem.command = 'zoom-switcher.selectZoom';
			zoomStatusBarItem.tooltip = 'Select Zoom Level';
		}
	}

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

	// Function to cycle to the next or previous zoom level
	async function cycleZoomLevel(direction: 'forward' | 'backward'): Promise<void> {
		// Refresh settings in case they changed
		settings = getSettings();

		if (settings.zoomLevels.length === 0) {
			vscode.window.showInformationMessage('No zoom levels defined');
			return;
		}

		const config = vscode.workspace.getConfiguration('window');
		const currentZoomLevel = config.get('zoomLevel', 0);

		// Find the current index
		const currentIndex = settings.zoomLevels.findIndex(zl => zl.level === currentZoomLevel);
		
		// Calculate the next index based on direction
		let nextIndex: number;
		if (currentIndex === -1) {
			// Current zoom level is not in the list, find the closest one based on direction
			if (direction === 'forward') {
				// Find the next zoom level higher than the current
				const nextHigher = settings.zoomLevels.filter(zl => zl.level > currentZoomLevel)
					.sort((a, b) => a.level - b.level)[0];
				
				nextIndex = nextHigher ? 
					settings.zoomLevels.indexOf(nextHigher) : 
					0; // Wrap to the beginning if none found
			} else {
				// Find the next zoom level lower than the current
				const nextLower = [...settings.zoomLevels]
					.filter(zl => zl.level < currentZoomLevel)
					.sort((a, b) => b.level - a.level)[0];
				
				nextIndex = nextLower ? 
					settings.zoomLevels.indexOf(nextLower) : 
					settings.zoomLevels.length - 1; // Wrap to the end if none found
			}
		} else {
			// Current zoom level is in the list, simply increment or decrement
			if (direction === 'forward') {
				nextIndex = (currentIndex + 1) % settings.zoomLevels.length;
			} else {
				nextIndex = (currentIndex - 1 + settings.zoomLevels.length) % settings.zoomLevels.length;
			}
		}

		// Get the next zoom level
		const nextZoom = settings.zoomLevels[nextIndex];
		
		try {
			await config.update('zoomLevel', nextZoom.level, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage(`Zoom level set to: ${nextZoom.name} (${nextZoom.level})`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to set zoom level: ${error}`);
		}
	}

	// Register commands to cycle zoom level
	const cycleForwardCommand = vscode.commands.registerCommand('zoom-switcher.cycleForward', () => {
		cycleZoomLevel('forward');
	});

	const cycleBackwardCommand = vscode.commands.registerCommand('zoom-switcher.cycleBackward', () => {
		cycleZoomLevel('backward');
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

					// Update command based on click cycling setting
					updateStatusBarCommand();

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
					// Check if clickCycling setting changed
					if (oldSettings.enableStatusBarClickCycling !== settings.enableStatusBarClickCycling) {
						// Update the command and tooltip for the status bar item
						updateStatusBarCommand();
					}
					
					// Update the display based on current settings
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
	context.subscriptions.push(cycleForwardCommand);
	context.subscriptions.push(cycleBackwardCommand);
	context.subscriptions.push(cycleForwardCommand);
	context.subscriptions.push(cycleBackwardCommand);
}

// This method is called when your extension is deactivated
export function deactivate(): void {}
