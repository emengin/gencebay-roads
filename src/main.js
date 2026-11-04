import "./style.css";
import { Game } from "./game.js";

function showError(error) {
  console.error(error);
  document.querySelector("#loading")?.classList.add("hidden");
  document.querySelector("#error-message").textContent =
    "Oyun başlatılamadı: " +
    (error?.message || error) +
    ". Güncel Chrome, Edge veya Firefox ve WebGL 2 desteği gerekir. Oyunu file:// yerine yerel başlatma betiğiyle açın.";
  document.querySelector("#error").classList.remove("hidden");
}
addEventListener("error", (event) => showError(event.error || event.message));
addEventListener("unhandledrejection", (event) => showError(event.reason));
try {
  new Game();
} catch (error) {
  showError(error);
}
