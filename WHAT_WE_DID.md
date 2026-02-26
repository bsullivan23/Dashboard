# Dashboard Project - What We Did

This log tracks the features and modifications made to the personal dashboard.

## Recent Updates (Current Session)

### 1. Title & Expressive Typography
- Added a prominent `Dashboard` title element at the top of the screen.
- Imported the `Sacramento` Google Font to give the main title a cursive, expressive, and notebook-style aesthetic (`--font-expressive`).
- Shrunk and repositioned the running clock and date seamlessly beneath the new title.
- Smoothed out the overall design by adopting `24px` border-radiuses on all cards/modals instead of harsh sharp corners.

### 2. Drag and Drop Functionality
- Implemented robust HTML5 drag and drop capabilities for the dashboard.
- Users can now click and drag categories around to reorder them visually.
- Users can grab individual links and swap their order within a category, or drag them entirely into a different category box to reorganize.
- Added subtle dot-matrix "drag handle" icons to the left of category titles and links. These icons gently fade in on hover (and turn solid when hovered directly) to keep the default interface clean.

### 3. Light / Dark Mode System
- Added a dedicated theme toggle button (a sun/moon icon) hovering in the top right corner.
- Engineered dark mode variables (`data-theme="dark"`) that intelligently invert the color palette to a deep charcoal, while toning down the bright pastel category backgrounds so they don't strain the eyes.
- Programmed the site to inherently default to checking the user's OS-level system preferences (`prefers-color-scheme: dark`) to set the initial mode.
- Connected the theme toggle to the browser's `localStorage` so the user's choice is permanently remembered across sessions.

### 4. Botanical "Sticker" Additions
- Added custom imagery designed to resemble physical notebook stickers placed over the UI.
- **Top Left:** A massive lavender sprig was placed extending over the top left side of the dashboard. `overflow-x: hidden` was applied so it doesn't cause frustrating horizontal scrolling.
- **Top Right:** A raspberry illustration was positioned tucked inwards to add warmth to the upper right quadrant of the layout.
- **Bottom Right:** A purple moth illustration was positioned drifting across the bottom right corner of the page.
- Adjusted image blending parameters (`drop-shadow`, `opacity`) to increase visibility. In Dark Mode, a bright, pure white glow explicitly highlights the sticker edges against the black background using dual-layered `drop-shadows`.
- Layered the stickers behind main interaction zones (`z-index: 1`, `pointer-events: none`) so that buttons beneath them can still be reliably clicked without interruption.

### 5. Optional Link Descriptions
- Added an optional description text field to the 'Add / Edit Link' modal form.
- The description renders cleanly as smaller, dimmer text (`var(--text-muted)`) directly beneath the primary link name.
- Linked the data structure into `localStorage` so descriptions can be retrieved upon reloading.
- Applied CSS flexbox column spacing to properly align titles and descriptions without vertically displacing the favicon icon.
