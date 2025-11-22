// src/main.tsx
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode> // You can enable StrictMode during development if you want
  <App />
  // </React.StrictMode>
);