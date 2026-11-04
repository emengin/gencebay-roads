import { VEHICLES, COLORS } from "../vehicles/catalog.js";
import { BIOMES } from "../world/world.js";
import { CAMERA_NAMES } from "../render/camera.js";

const $ = (selector) => document.querySelector(selector);
export class UI {
  constructor(game) {
    this.game = game;
    this.settings = game.settings.value;
    this.lastSpeed = -1;
    this.timer = 0;
    this.app = $("#app");
    this.settingsDialog = $("#settings-dialog");
    this.diaryDialog = $("#diary-dialog");
    const bind = (id, fn) => $(id).addEventListener("click", fn);
    bind(".brand", (e) => {
      e.preventDefault();
      game.garage();
    });
    bind("#vehicle-prev", () =>
      game.selectVehicle((this.settings.vehicle + 4) % 5),
    );
    bind("#vehicle-next", () =>
      game.selectVehicle((this.settings.vehicle + 1) % 5),
    );
    for (const color of COLORS) {
      const b = document.createElement("button");
      b.className = "swatch";
      b.style.background = color.hex;
      b.title = color.name;
      b.setAttribute("aria-label", color.name);
      b.dataset.color = color.hex;
      b.onclick = () => {
        this.settings.color = color.hex;
        game.model.color(color.hex);
        this.sync();
        game.settings.save();
      };
      $("#colors").append(b);
    }
    $("#biomes").addEventListener("click", (e) => {
      const b = e.target.closest("[data-biome]");
      if (b) game.configure("biome", b.dataset.biome);
    });
    bind("#start", () => game.start());
    bind("#settings-open", () => this.openSettings());
    bind("#resume", () => this.settingsDialog.close());
    bind("#garage-return", () => {
      this.settingsDialog.close();
      game.garage();
    });
    for (const id of [
      "auto",
      "camera",
      "lights",
      "reset",
      "photo",
      "pause",
      "sound",
    ])
      bind("#" + id, () => game.action(id));
    bind("#diary-open", () => this.openDiary());
    bind("#photo-save", () => game.savePhoto());
    bind("#photo-close", () => game.closePhoto());
    bind("#seed-apply", () => {
      const seed = $("#seed").value.trim() || "GENCEBAY34";
      game.configure("seed", seed);
      this.toast("Aynı kod, aynı yollar. Dünya yeniden hazır.");
    });
    for (const key of ["environment", "time", "weather", "road", "quality"])
      $("#" + key).addEventListener("change", (e) =>
        game.configure(key === "environment" ? "biome" : key, e.target.value),
      );
    for (const key of ["volume", "sensitivity", "cruise"])
      $("#" + key).addEventListener("input", (e) => {
        const value = Number(e.target.value);
        game.configure(key, key === "cruise" ? value : value / 100);
      });
    $("#show-fps").addEventListener("change", (e) =>
      game.configure("showFps", e.target.checked),
    );
    for (const dialog of [this.settingsDialog, this.diaryDialog]) {
      dialog.addEventListener("close", () => {
        game.paused = false;
        game.input?.clear();
      });
      dialog.addEventListener("cancel", (e) => {
        e.preventDefault();
        dialog.close();
      });
    }
    this.sync();
  }
  sync() {
    const s = this.settings,
      v = VEHICLES[s.vehicle];
    $("#vehicle-name").textContent = v.name;
    $("#vehicle-tagline").textContent = v.tagline;
    $("#vehicle-trait").textContent = v.trait;
    $("#vehicle-index").textContent = `0${s.vehicle + 1} — 05`;
    document.querySelectorAll(".swatch").forEach((b) => {
      b.classList.toggle("selected", b.dataset.color === s.color);
      b.setAttribute("aria-pressed", b.dataset.color === s.color);
    });
    document.querySelectorAll("[data-biome]").forEach((b) => {
      b.classList.toggle("selected", b.dataset.biome === s.biome);
      b.setAttribute("aria-pressed", b.dataset.biome === s.biome);
    });
    $("#scene-name").textContent = BIOMES[s.biome].scene;
    $("#route-name").textContent = BIOMES[s.biome].name.toLocaleUpperCase("tr");
    document
      .querySelectorAll(".seed-label")
      .forEach((e) => (e.textContent = s.seed));
    for (const k of ["time", "weather", "road", "quality", "seed"])
      $("#" + k).value = s[k];
    $("#environment").value = s.biome;
    $("#volume").value = s.volume * 100;
    $("#sensitivity").value = s.sensitivity * 100;
    $("#cruise").value = s.cruise;
    $("#cruise-output").value = s.cruise + " km/sa";
    $("#show-fps").checked = s.showFps;
    $("#fps").classList.toggle("hidden", !s.showFps);
    $("#sound").textContent = s.muted ? "♩" : "♪";
    $("#sound").setAttribute("aria-label", s.muted ? "Sesi aç" : "Sesi kapat");
    $("#sound").classList.toggle("active", !s.muted);
    this.driveControls();
  }
  phase(phase) {
    this.app.classList.toggle("garage", phase === "garage");
    this.app.classList.toggle("driving", phase === "drive");
    this.app.classList.remove("ui-hidden");
    $("#garage-ui").classList.toggle("hidden", phase !== "garage");
    $("#hud").classList.toggle("hidden", phase !== "drive");
    $("#photo-ui").classList.toggle("hidden", phase !== "photo");
    $(".topbar").classList.toggle("hidden", phase === "photo");
    $("#help-strip").classList.toggle("hidden", phase === "photo");
  }
  driveControls() {
    const g = this.game;
    $("#auto").classList.toggle("active", g.auto);
    $("#auto").setAttribute("aria-pressed", !!g.auto);
    $("#lights").classList.toggle("active", g.lights);
    $("#lights").setAttribute("aria-pressed", !!g.lights);
    $("#camera-label").textContent =
      CAMERA_NAMES[g.cameraController?.mode || 0];
  }
  openSettings() {
    if (this.game.phase === "photo") this.game.closePhoto();
    this.game.paused = true;
    this.game.input.clear();
    if (!this.settingsDialog.open) this.settingsDialog.showModal();
  }
  openDiary() {
    const d = this.game.settings.diary;
    const area = $("#diary-content");
    area.replaceChildren();
    const stats = document.createElement("div");
    stats.className = "diary-stats";
    for (const [name, value] of [
      ["TOPLAM YOL", (d.total / 1000).toFixed(2)],
      ["EN UZUN YOLCULUK", (d.longest / 1000).toFixed(2)],
    ]) {
      const div = document.createElement("div"),
        small = document.createElement("small"),
        strong = document.createElement("strong"),
        unit = document.createElement("span");
      small.textContent = name;
      strong.textContent = value + " ";
      unit.textContent = "km";
      strong.append(unit);
      div.append(small, strong);
      stats.append(div);
    }
    area.append(stats);
    for (const [name, value] of [
      ["Yolculuk sayısı", d.trips],
      ["Son yol arkadaşın", d.lastVehicle],
      ["Son manzara", BIOMES[d.biome]?.name || "Yeşil tepeler"],
      ["Son dünya kodu", d.seed],
    ]) {
      const row = document.createElement("div");
      row.className = "diary-row";
      const label = document.createElement("span"),
        v = document.createElement("b");
      label.textContent = name;
      v.textContent = String(value);
      row.append(label, v);
      area.append(row);
    }
    this.diaryDialog.showModal();
  }
  toast(message) {
    clearTimeout(this.toastTimer);
    $("#toast").textContent = message;
    $("#toast").classList.add("visible");
    this.toastTimer = setTimeout(
      () => $("#toast").classList.remove("visible"),
      3000,
    );
  }
  update(dt, state, fps) {
    this.timer += dt;
    if (this.timer < 0.1) return;
    this.timer = 0;
    const speed = Math.round(Math.abs(state.speed) * 3.6);
    if (speed !== this.lastSpeed) {
      $("#speed").textContent = speed;
      $("#speed-arc").style.strokeDashoffset =
        305 * (1 - Math.min(speed / 230, 1));
      this.lastSpeed = speed;
    }
    $("#distance").firstChild.textContent =
      (state.distance / 1000).toFixed(2) + " ";
    $("#gear").textContent =
      state.speed < -0.2
        ? "R"
        : state.speed < 0.4
          ? "N"
          : "D" + Math.min(6, Math.floor(speed / 35) + 1);
    $("#drive-status").textContent = this.game.auto
      ? "Otomatik sürüş · " + this.settings.cruise + " km/sa"
      : state.offroad
        ? "Yolun dışı da yolculuğa dahil."
        : "Yol senin.";
    $("#surface").textContent = state.offroad
      ? "ARAZİ · " + (this.game.model.spec.offroad ? "4 × 4" : "DÜŞÜK TUTUŞ")
      : this.settings.road === "dirt"
        ? "TOPRAK · SAKİN DEVAM"
        : "ASFALT · İYİ YOLCULUKLAR";
    if (this.settings.showFps)
      $("#fps").textContent =
        Math.round(fps) +
        " FPS · " +
        (this.game.world.chunks.size + this.game.world.extensions.size) +
        " parça";
  }
}
