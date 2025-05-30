/// <reference types="vite/client" />

// Define missing interface for window.navigator.standalone
interface Navigator {
  standalone?: boolean;
}