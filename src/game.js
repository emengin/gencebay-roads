import * as THREE from "three";
import { Settings } from "./core/settings.js";
import { Input } from "./core/input.js";
import { Route } from "./world/route.js";
import { World } from "./world/world.js";
import { VehicleModel } from "./vehicles/factory.js";
import { VehiclePhysics } from "./vehicles/physics.js";
import { VEHICLES } from "./vehicles/catalog.js";
import { CameraController, CAMERA_NAMES } from "./render/camera.js";
import { Atmosphere } from "./render/atmosphere.js";
import { AudioManager } from "./audio/audio.js";
import { UI } from "./ui/ui.js";

export class Game {
  constructor() {
    this.settings = new Settings();
    this.phase = "garage";
    this.paused = false;
    this.auto = false;
    this.lights = this.settings.value.time === "night";
    this.elapsed = 0;
    this.accumulator = 0;
    this.saveTime = 0;
    this.fps = 60;
    this.last = 0;
    this.canvas = document.querySelector("#world");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      this.paused = true;
      throw new Error(
        "Grafik programı derlenemedi: " +
          gl.getProgramInfoLog(program) +
          " " +
          gl.getShaderInfoLog(fragment),
      );
    };
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      48,
      innerWidth / innerHeight,
      0.06,
      6000,
    );
    this.cameraController = new CameraController(this.camera);
    this.route = new Route(this.settings.value.seed, this.settings.value.road);
    this.world = new World(this.scene, this.route, this.settings.value);
    this.atmosphere = new Atmosphere(
      this.scene,
      this.renderer,
      this.settings.value,
    );
    this.model = new VehicleModel(
      this.settings.value.vehicle,
      this.settings.value.color,
    );
    this.scene.add(this.model.root);
    this.physics = new VehiclePhysics(this.model.spec, this.route);
    this.input = new Input(
      (action) => this.action(action),
      () => this.onBlur(),
    );
    this.audio = new AudioManager();
    this.ui = new UI(this);
    this.world.update(0, true);
    this.syncModel();
    addEventListener("resize", () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
    addEventListener("pagehide", () => this.settings.save());
    // WebGL context loss is recoverable by reloading; never leave a silent frozen canvas.
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.paused = true;
      this.fail(
        "Grafik bağlantısı kesildi. Diğer ağır sekmeleri kapatıp yeniden deneyin.",
      );
    });
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }
  syncModel() {
    const s = this.physics.state,
      o = this.world.origin;
    this.model.root.position.set(s.x - o.x, s.y, s.z - o.z);
    this.model.root.rotation.set(-s.pitch, s.yaw, s.roll, "YXZ");
    this.model.root.userData = { origin: o, route: this.route };
    this.model.root.updateMatrixWorld(true);
  }
  selectVehicle(index) {
    if (this.phase !== "garage") return;
    this.model.dispose();
    this.settings.value.vehicle = index;
    this.model = new VehicleModel(index, this.settings.value.color);
    this.scene.add(this.model.root);
    this.physics.spec = VEHICLES[index];
    this.physics.reset(0);
    this.syncModel();
    this.cameraController.reset();
    this.ui.sync();
    this.settings.save();
  }
  start() {
    this.audio.start();
    this.physics.state.distance = 0;
    this.physics.reset(0);
    this.auto = false;
    this.phase = "drive";
    this.paused = false;
    this.input.clear();
    this.cameraController.reset();
    this.world.update(0, true);
    this.ui.phase("drive");
    this.ui.driveControls();
    this.settings.diary.trips++;
    this.remember();
    this.ui.toast("İyi yolculuklar. W ile gaz ver · F ile akışa bırak.");
  }
  garage() {
    if (this.phase === "garage") return;
    this.settings.save();
    this.phase = "garage";
    this.paused = false;
    this.auto = false;
    this.physics.state.speed = 0;
    this.physics.reset(0);
    this.world.update(0, true);
    this.syncModel();
    this.input.clear();
    this.cameraController.reset();
    this.ui.phase("garage");
    this.ui.driveControls();
  }
  action(action) {
    if (action === "sound") {
      this.settings.value.muted = !this.settings.value.muted;
      this.audio.start();
      this.ui.sync();
      this.settings.save();
      return;
    }
    if (action === "pause") {
      if (this.phase === "photo") {
        this.closePhoto();
        return;
      }
      if (this.ui.diaryDialog.open) {
        this.ui.diaryDialog.close();
        return;
      }
      if (this.ui.settingsDialog.open) this.ui.settingsDialog.close();
      else this.ui.openSettings();
      return;
    }
    if (this.phase !== "drive" || this.paused) return;
    switch (action) {
      case "camera":
        this.cameraController.cycle();
        this.ui.toast(CAMERA_NAMES[this.cameraController.mode]);
        break;
      case "reset":
        this.physics.reset(
          this.route.nearest(this.physics.state.x, this.physics.state.z).z,
        );
        this.syncModel();
        this.cameraController.reset();
        this.ui.toast("Yeniden yoldasın.");
        break;
      case "auto":
        this.auto = !this.auto;
        this.ui.toast(
          this.auto
            ? "Otomatik sürüş açık. Manzaranın tadını çıkar."
            : "Direksiyon sende.",
        );
        break;
      case "lights":
        this.lights = !this.lights;
        break;
      case "photo":
        this.phase = "photo";
        this.input.clear();
        this.ui.phase("photo");
        this.cameraController.photoDistance = 8;
        this.cameraController.reset();
        break;
      case "ui":
        this.ui.app.classList.toggle("ui-hidden");
        break;
    }
    this.ui.driveControls();
  }
  closePhoto() {
    if (this.phase !== "photo") return;
    this.phase = "drive";
    this.ui.phase("drive");
    this.cameraController.reset();
    this.input.clear();
  }
  savePhoto() {
    this.renderer.render(this.scene, this.camera);
    this.canvas.toBlob((blob) => {
      if (!blob) {
        this.ui.toast("Görüntü kaydedilemedi. Yeniden dene.");
        return;
      }
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download =
        "gencebay-roads-" +
        new Date().toISOString().replace(/[:.]/g, "-") +
        ".png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.ui.toast("Bu an artık senin. PNG kaydedildi.");
    }, "image/png");
  }
  configure(key, value) {
    this.settings.value[key] = value;
    if (["biome", "seed", "road", "quality"].includes(key)) {
      if (key === "seed" || key === "road") {
        this.route = new Route(
          this.settings.value.seed,
          this.settings.value.road,
        );
        this.world.route = this.route;
        this.physics.route = this.route;
        this.physics.reset(0);
      }
      this.world.rebuild(this.physics.state.z);
      this.physics.reset(this.physics.state.z);
      this.syncModel();
      this.cameraController.reset();
    }
    if (["biome", "time", "weather", "quality"].includes(key)) {
      this.atmosphere.configure();
      if (key === "time" && value === "night") this.lights = true;
    }
    if (key === "volume" && value > 0) {
      this.settings.value.muted = false;
      this.audio.start();
    }
    this.remember();
    this.ui.sync();
  }
  remember() {
    const d = this.settings.diary,
      s = this.settings.value;
    d.lastVehicle = this.model.spec.name;
    d.biome = s.biome;
    d.seed = s.seed;
    this.settings.save();
  }
  onBlur() {
    this.settings.save();
    if (this.phase === "drive" && !this.paused) this.ui.openSettings();
  }
  frame(time) {
    const rawDt = this.last ? (time - this.last) / 1000 : 1 / 60,
      dt = Math.min(rawDt, 0.1);
    this.last = time;
    this.elapsed += dt;
    this.fps += (1 / Math.max(rawDt, 0.001) - this.fps) * 0.04;
    const driving = this.phase === "drive" && !this.paused;
    if (driving) {
      const raw = this.input.read();
      if (
        this.auto &&
        (raw.throttle > 0.15 ||
          raw.brake > 0.15 ||
          Math.abs(raw.steer) > 0.15 ||
          raw.handbrake)
      ) {
        this.auto = false;
        this.ui.driveControls();
        this.ui.toast("Direksiyon sende.");
      }
      this.accumulator += dt;
      let moved = 0;
      while (this.accumulator + 1e-10 >= 1 / 90) {
        const input = this.auto
          ? this.physics.autopilot(this.settings.value.cruise)
          : raw;
        const before = this.physics.state.distance;
        this.physics.step(1 / 90, input, this.settings.value.weather);
        moved += this.physics.state.distance - before;
        this.accumulator -= 1 / 90;
      }
      this.settings.diary.total += moved;
      this.settings.diary.longest = Math.max(
        this.settings.diary.longest,
        this.physics.state.distance,
      );
      this.model.animate(this.physics.state, dt, this.route);
    } else this.accumulator = 0;
    const s = this.physics.state;
    // Physical coordinates remain doubles; render coordinates stay close to zero.
    if (
      Math.abs(s.z - this.world.origin.z) > 2048 ||
      Math.abs(s.x - this.world.origin.x) > 2048
    ) {
      const x = Math.round(s.x / 1024) * 1024,
        z = Math.round(s.z / 1024) * 1024,
        dx = x - this.world.origin.x,
        dz = z - this.world.origin.z;
      this.world.setOrigin(x, z);
      this.camera.position.x -= dx;
      this.camera.position.z -= dz;
      if (this.cameraController.lookAt) {
        this.cameraController.lookAt.x -= dx;
        this.cameraController.lookAt.z -= dz;
      }
    }
    this.world.update(s.z, false, s.x);
    this.syncModel();
    this.model.lighting(this.lights, this.atmosphere.night, s.braking);
    if (!this.paused)
      this.cameraController.update(
        dt,
        this.model,
        s,
        this.phase,
        this.input,
        this.settings.value,
        this.camera.aspect,
      );
    this.atmosphere.update(
      this.paused ? 0 : dt,
      this.model.root.position,
      this.camera,
    );
    this.audio.update(dt, s, this.model.spec, this.settings.value, driving);
    this.ui.update(dt, s, this.fps);
    this.renderer.render(this.scene, this.camera);
    if (!this.ready) {
      this.ready = true;
      requestAnimationFrame(() => {
        document.querySelector("#loading").classList.add("ready");
        setTimeout(() => document.querySelector("#loading").remove(), 700);
      });
    }
    this.saveTime += dt;
    if (this.saveTime > 8) {
      this.saveTime = 0;
      this.settings.save();
    }
    requestAnimationFrame(this.frame);
  }
  fail(message) {
    document.querySelector("#error-message").textContent = message;
    document.querySelector("#error").classList.remove("hidden");
  }
}
