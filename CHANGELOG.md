# Change Log

All notable changes to the "zoom-switcher" extension will be documented in this file.

## [0.0.4] - 2025-05-05

### Added
- Cycle functionality for navigating through zoom levels:
  - `Zoom Switcher: Cycle to Next Zoom Level` command to move to the next zoom level
  - `Zoom Switcher: Cycle to Previous Zoom Level` command to move to the previous zoom level
  - Optional status bar clicking behavior to cycle through zoom levels
    - Left-click to cycle forward
    - Standard selection menu when clicking behavior is disabled (default)
- New setting `enableStatusBarClickCycling` to toggle click cycling behavior (default: false)
- Keybinding slots for cycle commands that users can customize

## [0.0.3] - 2025-05-04

### Changed
- Enhanced status bar display with two separate configuration options:
  - `showZoomValue`: Toggle display of numeric zoom level (default: true)
  - `showProfileName`: Toggle display of zoom profile name (default: false)
- Removed `showCurrentZoomLevel` setting in favor of more granular controls
- Improved status bar text formatting when showing both zoom value and profile name

## [0.0.2] - 2025-04-29

### Added
- Status bar item that displays the current zoom level
- Dropdown menu for selecting predefined zoom levels
- Configuration options for customizing zoom levels
- Configuration option to show/hide current zoom level in status bar
- Configuration option to position the zoom switcher on the left or right side of the status bar
- Configuration option to set the priority of the status bar item
- Commands for managing zoom levels:
  - "Zoom Switcher: Add New Zoom Level" - Add a new zoom level with custom name and value
  - "Zoom Switcher: Edit Zoom Levels" - Modify, delete, or reorder existing zoom levels
  - "Zoom Switcher: View All Zoom Levels" - View a list of all configured zoom levels
- Improved UI for managing zoom levels through commands

## [0.0.1] - 2025-04-28
- Initial release with basic zoom switching functionality