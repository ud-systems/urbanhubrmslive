import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Wrap in a try-catch to handle any DOM resolution issues
try {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error("Error rendering app:", error);
  // Fallback rendering
  root.render(<div>Error loading application. Please refresh the page.</div>);
}
