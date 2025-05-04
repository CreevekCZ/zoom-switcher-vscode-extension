# Zoom Switcher

A Visual Studio Code extension that adds a dropdown menu to the status bar for quickly switching between predefined zoom levels.

## Why Zoom Switcher?

Do you frequently switch between multiple monitors with different resolutions? Do you need to adjust your text size for presentations or pair programming? Zoom Switcher makes it effortless to change between your preferred zoom levels with just a click.

## Features

- **One-Click Zoom Adjustment**: Change VS Code's zoom level instantly via status bar
- **Custom Zoom Presets**: Define your own named zoom levels for different scenarios
- **Visible Indicator**: Shows current zoom level in the status bar
- **Fully Customizable**: Position, appearance, and zoom presets can all be configured

## How to Use

1. Look for the zoom indicator in the status bar (displays as a magnifying glass icon with the current zoom level)
2. Click on it to open a dropdown menu of your predefined zoom levels
3. Select a zoom level to immediately apply it

If you change settings and don't see the UI update immediately, you can run the "Zoom Switcher: Refresh Zoom Switcher" command from the command palette (Ctrl+Shift+P or Cmd+Shift+P).

## Extension Settings

This extension contributes the following settings:

* `zoomSwitcher.zoomLevels`: An array of zoom level configurations where each configuration has:
  * `name`: Display name for the zoom level (e.g., "Presentation Mode", "Laptop", "External Monitor")
  * `level`: The zoom level value (e.g., -0.5, 0, 0.5)

* `zoomSwitcher.showZoomValue`: When enabled, shows the numeric zoom value in the status bar (default: true)
* `zoomSwitcher.showProfileName`: When enabled, shows the current zoom profile name in the status bar (default: false)

* `zoomSwitcher.position`: Position of the zoom switcher in the status bar - "left" or "right" (default: "right")

* `zoomSwitcher.priority`: Priority of the status bar item - higher values mean closer to the left/right edge (default: 100)

Default settings provide three zoom levels:
```json
"zoomSwitcher.zoomLevels": [
  {
    "name": "Zoom Out",
    "level": -0.5
  },
  {
    "name": "Default", 
    "level": 0
  },
  {
    "name": "Zoom In",
    "level": 0.5
  }
]
```

## Customizing Zoom Levels

You have two ways to customize zoom levels:

### 1. Using Commands (Recommended)

The extension provides several commands to manage zoom levels:

- **Zoom Switcher: Add New Zoom Level** - Add a new zoom level with a custom name and value
- **Zoom Switcher: Edit Zoom Levels** - Modify, delete, or reorder existing zoom levels
- **Zoom Switcher: View All Zoom Levels** - See a list of all configured zoom levels

To access these commands:
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) to open the Command Palette
2. Type "Zoom Switcher" to see all available commands
3. Select the command you want to use

### 2. Using Settings Editor

Alternatively, you can edit the `settings.json` file directly:

1. Go to Settings (`Ctrl+,` or `Cmd+,` on macOS)
2. Search for "Zoom Switcher"
3. Edit the `zoomSwitcher.zoomLevels` array to add, modify, or remove zoom level configurations

Example configuration:
```json
"zoomSwitcher.zoomLevels": [
  {
    "name": "Small Text",
    "level": -1
  },
  {
    "name": "Default", 
    "level": 0
  },
  {
    "name": "Presentation",
    "level": 2
  }
]
```

## Common Use Cases

- **Multiple Monitors**: Define zoom levels for each monitor you use
- **Presentations**: Create a "Presentation Mode" with larger text
- **Code Reviews**: Add a smaller text size for seeing more code at once
- **Eye Strain**: Quickly switch to a larger zoom level when your eyes are tired

## Release Notes

See the [CHANGELOG](CHANGELOG.md) for details on each release.

## License

MIT
