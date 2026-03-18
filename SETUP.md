# Data Visualization Project

A modern web application for data visualization using React and TypeScript.

## Project Structure

```
├── src/               # React + TypeScript source code
│   ├── assets/        # Static assets (images, icons, etc.)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html         # HTML entry point
├── package.json       # Project dependencies and scripts
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
└── tsconfig.node.json # TypeScript configuration for Vite
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

```bash
npm run dev
```

This will start:
- **Frontend Dev Server**: http://localhost:5173 (with auto-reload)

### 3. Production Build

```bash
npm run build
```

Creates an optimized build in `dist/`.

### 4. Preview Production Build

```bash
npm run preview
```

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Data**: Static data bundled with the frontend
- **Assets**: Store images, icons, and other static files in `src/assets/`
- **Features**:
  - Component-based UI
  - Type-safe development
  - Fast development server with HMR

## Static Data

Data is defined directly in `src/App.tsx` and bundled with the application. To modify or add data:

1. Edit the `sampleData` object in [App.tsx](src/App.tsx)
2. Update components to display the desired data structure

## Managing Assets

Place static assets (images, fonts, icons, etc.) in `src/assets/`:

```
src/assets/
├── images/
├── icons/
└── data/    # For any static JSON files
```

Reference them in your components:

```typescript
import logo from '../assets/images/logo.png'
```

## Development Workflow

### Adding New Components
Create React components in `src/` and use them in `App.tsx`.

### Adding Static Assets
1. Place files in `src/assets/`
2. Import and use them in your components

### Building for Production
The `npm run build` command bundles the entire application into `dist/`.

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically use the next available port. Check the terminal output for the correct URL.

### Changes Not Appearing
- Make sure you've saved your files
- Check the browser console for errors
- Refresh the page (Ctrl+Shift+R for hard refresh)

## Next Steps

1. **Add data visualization**: Integrate a charting library (D3.js, Recharts, Chart.js)
2. **Create React components**: Build reusable visualization components
3. **Add static assets**: Store images and data files in `src/assets/`
4. **Enhance styling**: Customize CSS and add responsive designs
5. **Deploy**: Build and deploy the `dist/` folder to any static hosting service

---

Happy coding! 🚀
