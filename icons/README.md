# Icon Assets

This directory contains the SVG and PNG assets for the Toggle Native Tab Bar extension. Each file serves a specific purpose in the extension's UI or documentation.

## Icon Categorization

### 1. Toolbar & Extension Icons
Used by Firefox to display the extension icon in the toolbar and the `about:addons` page.
*   **`icon-visible.svg`**: Shown when the tab bar is visible.
*   **`icon-hidden.svg`**: Shown when the tab bar is hidden.
*   **Technical Note**: These files use the non-standard `context-fill` and `context-stroke` properties. This allows Firefox to automatically color the icons to match the user's browser theme (e.g., black text on light toolbars, white text on dark toolbars). They should **not** contain internal `@media (prefers-color-scheme)` queries as it may conflict with Firefox's native theme engine.

### 2. Browser Tab Favicons
Used as the favicon for the extension's internal pages (Options, Icon Coloring instructions).
*   **`favicon.svg`**: A "smart" SVG that detects the user's system theme.
*   **Technical Note**: Since browser tabs do not support `context-fill`, this file uses a standard CSS `@media (prefers-color-scheme: dark)` query to switch between black and white so it remains visible regardless of the user's theme.

### 3. Documentation Previews
Used strictly for the `README.md` and other markdown documentation.
*   **`icon-*-light.svg`**: Hardcoded black icons for display on light backgrounds.
*   **`icon-*-dark.svg`**: Hardcoded white icons for display on dark backgrounds.
*   **Technical Note**: These are used in HTML `<picture>` tags within the README to provide static previews for users browsing the repository on GitHub.

### 4. AMO Assets
*   **`icon-48.png`**, **`icon-128.png`**, **`icon-512.png`**: High-resolution black icons with a subtle border, explicitly sized for Firefox's Add-ons Manager (`about:addons`) and the AMO marketplace. Using exact sizes ensures Firefox parses them correctly and acts as a cache-buster.
*   **`icon-48-org.png`**, **`icon-128-org.png`**: Original versions of the icons (without the border).

### 5. Design Source Files
*   **`icon-visible2.psd`**: The master Photoshop design file. This is used for generating the high-resolution PNG assets and should be kept as the source of truth for the bitmap icons.

### 6. Legacy Assets
*   **`icon-visible.png`**, **`icon-hidden.png`**: Legacy bitmap versions of the icons. These are kept for backward compatibility or reference but are not used in the current version of the extension.

## Development Rules
1.  **When updating the design**: Apply changes across all SVG versions to ensure consistency.
2.  **Stroke Width**: Maintain a consistent `45px` stroke width for the corner brackets.
3.  **Namespace**: Always include `xmlns:context="http://www.mozilla.org/context-properties"` in the toolbar SVGs.
