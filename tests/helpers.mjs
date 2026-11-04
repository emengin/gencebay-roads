export function canvasDocument() {
  const calls = [];
  const context = {
    fillRect() {},
    strokeRect() {},
    beginPath() {},
    arc() {},
    fill() {},
    fillText(text, ...args) {
      calls.push({ text, args });
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
  };
  globalThis.document = {
    createElement(name) {
      if (name !== "canvas") throw new Error("Unexpected element " + name);
      return {
        width: 0,
        height: 0,
        getContext() {
          return context;
        },
      };
    },
  };
  return calls;
}
