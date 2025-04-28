import * as vscode from 'vscode';

// Interface for zoom level configuration
export interface ZoomLevel {
    name: string;
    level: number;
}

// Register commands to manage zoom levels
export function registerSettingsCommands(context: vscode.ExtensionContext): void {
    // Command to add a new zoom level
    const addZoomLevelCommand = vscode.commands.registerCommand('zoom-switcher.addZoomLevel', async () => {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter a name for the zoom level',
            placeHolder: 'e.g., Presentation Mode'
        });

        if (!name) { return; } // User cancelled

        const levelStr = await vscode.window.showInputBox({
            prompt: 'Enter the zoom level value',
            placeHolder: 'e.g., 1.5',
            validateInput: input => {
                return isNaN(Number(input)) ? 'Please enter a valid number' : null;
            }
        });

        if (!levelStr) { return; } // User cancelled

        const level = Number(levelStr);

        // Get current zoom levels
        const config = vscode.workspace.getConfiguration('zoomSwitcher');
        const zoomLevels = config.get<ZoomLevel[]>('zoomLevels') || [];

        // Add new zoom level
        zoomLevels.push({ name, level });

        // Save updated zoom levels
        await config.update('zoomLevels', zoomLevels, vscode.ConfigurationTarget.Global);
        vscode.commands.executeCommand('zoom-switcher.refreshZoom');
        vscode.window.showInformationMessage(`Added zoom level: ${name} (${level})`);
    });

    // Command to edit zoom levels
    const editZoomLevelsCommand = vscode.commands.registerCommand('zoom-switcher.editZoomLevels', async () => {
        const config = vscode.workspace.getConfiguration('zoomSwitcher');
        const zoomLevels = config.get<ZoomLevel[]>('zoomLevels') || [];

        if (zoomLevels.length === 0) {
            vscode.window.showInformationMessage('No zoom levels defined yet. Add one first.');
            return;
        }

        // Let user select a zoom level to edit
        const selected = await vscode.window.showQuickPick(
            zoomLevels.map((zl, index) => ({
                label: zl.name,
                description: `Zoom: ${zl.level}`,
                index
            })),
            { placeHolder: 'Select a zoom level to edit' }
        );

        if (!selected) { return; } // User cancelled

        // Show submenu for what to do
        const action = await vscode.window.showQuickPick(
            [
                { label: 'Edit Name', value: 'name' },
                { label: 'Edit Zoom Level', value: 'level' },
                { label: 'Delete', value: 'delete' },
                { label: 'Move Up', value: 'up', disabled: selected.index === 0 },
                { label: 'Move Down', value: 'down', disabled: selected.index === zoomLevels.length - 1 }
            ].filter(item => !('disabled' in item && item.disabled)),
            { placeHolder: 'What would you like to do?' }
        );

        if (!action) { return; } // User cancelled

        switch (action.value) {
            case 'name':
                const newName = await vscode.window.showInputBox({
                    prompt: 'Enter new name for the zoom level',
                    value: zoomLevels[selected.index].name
                });
                if (newName) {
                    zoomLevels[selected.index].name = newName;
                }
                break;

            case 'level':
                const newLevelStr = await vscode.window.showInputBox({
                    prompt: 'Enter new zoom level value',
                    value: String(zoomLevels[selected.index].level),
                    validateInput: input => {
                        return isNaN(Number(input)) ? 'Please enter a valid number' : null;
                    }
                });
                if (newLevelStr) {
                    zoomLevels[selected.index].level = Number(newLevelStr);
                }
                break;

            case 'delete':
                const confirmed = await vscode.window.showWarningMessage(
                    `Are you sure you want to delete the zoom level "${zoomLevels[selected.index].name}"?`,
                    { modal: true },
                    'Delete'
                );
                if (confirmed === 'Delete') {
                    zoomLevels.splice(selected.index, 1);
                }
                break;

            case 'up':
                const temp1 = zoomLevels[selected.index];
                zoomLevels[selected.index] = zoomLevels[selected.index - 1];
                zoomLevels[selected.index - 1] = temp1;
                break;

            case 'down':
                const temp2 = zoomLevels[selected.index];
                zoomLevels[selected.index] = zoomLevels[selected.index + 1];
                zoomLevels[selected.index + 1] = temp2;
                break;
        }

        // Save updated zoom levels
        await config.update('zoomLevels', zoomLevels, vscode.ConfigurationTarget.Global);
        vscode.commands.executeCommand('zoom-switcher.refreshZoom');
        vscode.window.showInformationMessage('Zoom levels updated successfully');
    });

    // Command to view all configured zoom levels
    const viewZoomLevelsCommand = vscode.commands.registerCommand('zoom-switcher.viewZoomLevels', async () => {
        const config = vscode.workspace.getConfiguration('zoomSwitcher');
        const zoomLevels = config.get<ZoomLevel[]>('zoomLevels') || [];

        if (zoomLevels.length === 0) {
            vscode.window.showInformationMessage('No zoom levels defined yet. Add one first.');
            return;
        }

        // Create a formatted string with all zoom levels
        const zoomLevelsStr = zoomLevels.map((zl, index) => {
            return `${index + 1}. ${zl.name}: ${zl.level}`;
        }).join('\n');

        // Show information message with all zoom levels
        vscode.window.showInformationMessage('Configured Zoom Levels', {
            modal: true,
            detail: zoomLevelsStr
        });
    });

    // Add commands to subscriptions
    context.subscriptions.push(addZoomLevelCommand);
    context.subscriptions.push(editZoomLevelsCommand);
    context.subscriptions.push(viewZoomLevelsCommand);
}
