export class Input {
  constructor(onAction, onBlur) {
    this.keys = new Set();
    this.drag = null;
    this.lookX = 0;
    this.lookY = 0;
    this.zoom = 0;
    const actions = {
      KeyC: "camera",
      KeyR: "reset",
      KeyF: "auto",
      KeyH: "lights",
      KeyP: "pause",
      Escape: "pause",
      KeyM: "sound",
      KeyU: "ui",
    };
    addEventListener("keydown", (e) => {
      if (
        /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) ||
        e.target.isContentEditable
      )
        return;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat && actions[e.code]) onAction(actions[e.code]);
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("blur", () => {
      this.clear();
      onBlur();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.clear();
        onBlur();
      }
    });
    const canvas = document.querySelector("#world");
    canvas.addEventListener("pointerdown", (e) => {
      this.drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!this.drag) return;
      this.lookX += (e.clientX - this.drag.x) * 0.006;
      this.lookY += (e.clientY - this.drag.y) * 0.004;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
    });
    canvas.addEventListener("pointerup", () => {
      this.drag = null;
    });
    canvas.addEventListener("pointercancel", () => {
      this.drag = null;
    });
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.zoom += e.deltaY * 0.008;
      },
      { passive: false },
    );
  }
  clear() {
    this.keys.clear();
    this.drag = null;
  }
  read() {
    const k = this.keys;
    let throttle = +(k.has("KeyW") || k.has("ArrowUp")),
      brake = +(k.has("KeyS") || k.has("ArrowDown"));
    let steer =
      +(k.has("KeyA") || k.has("ArrowLeft")) -
      +(k.has("KeyD") || k.has("ArrowRight"));
    let handbrake = k.has("Space"),
      boost = k.has("ShiftLeft") || k.has("ShiftRight");
    const pad = navigator.getGamepads?.()?.find((p) => p?.connected);
    if (pad) {
      steer = Math.abs(pad.axes[0]) > 0.12 ? -pad.axes[0] : steer;
      throttle = Math.max(throttle, pad.buttons[7]?.value || 0);
      brake = Math.max(brake, pad.buttons[6]?.value || 0);
      handbrake ||= pad.buttons[0]?.pressed;
    }
    return { throttle, brake, steer, handbrake, boost };
  }
  consumeLook() {
    const v = { x: this.lookX, y: this.lookY, zoom: this.zoom };
    this.lookX = 0;
    this.lookY = 0;
    this.zoom = 0;
    return v;
  }
}
