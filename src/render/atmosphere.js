import * as THREE from "three";
import { qualityPresets } from "../core/settings.js";
import { random } from "../core/math.js";

export class Atmosphere {
  constructor(scene, renderer, settings) {
    this.scene = scene;
    this.renderer = renderer;
    this.settings = settings;
    this.particle = null;
    this.clock = 0;
    this.hemi = new THREE.HemisphereLight("#dae4dd", "#647256", 2.5);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#fff0d1", 3);
    this.sun.castShadow = true;
    const cam = this.sun.shadow.camera;
    Object.assign(cam, {
      left: -50,
      right: 50,
      top: 50,
      bottom: -50,
      near: 1,
      far: 250,
    });
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.mapSize.set(2048, 2048);
    scene.add(this.sun, this.sun.target);
    const skyGeo = new THREE.SphereGeometry(4000, 32, 16);
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color("#90b6bd") },
        bottom: { value: new THREE.Color("#e4dfc5") },
        sun: { value: new THREE.Color("#fff1b8") },
        direction: { value: new THREE.Vector3(-0.7, 0.32, 0.4).normalize() },
        night: { value: 0 },
      },
      vertexShader:
        "varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec3 vDirection; uniform vec3 top; uniform vec3 bottom; uniform vec3 sun; uniform vec3 direction; uniform float night; void main(){vec3 d=normalize(vDirection); float t=smoothstep(-.08,.8,d.y); vec3 color=mix(bottom,top,t); float sd=max(0.,dot(d,direction)); color+=sun*(pow(sd,700.)*1.7+pow(sd,12.)*.16)*(1.-night); gl_FragColor=vec4(color,1.);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }",
    });
    this.sky = new THREE.Mesh(skyGeo, this.skyMaterial);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    scene.add(this.sky);
    // Low-cost drifting cloud islands, rendered as softly lit three-dimensional volumes.
    const cloudGeometry = new THREE.SphereGeometry(1, 9, 6),
      cloudMat = new THREE.MeshLambertMaterial({
        color: "#fff9e9",
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      });
    this.clouds = new THREE.InstancedMesh(cloudGeometry, cloudMat, 70);
    this.clouds.frustumCulled = false;
    const rng = random(3453),
      obj = new THREE.Object3D();
    for (let i = 0; i < 70; i++) {
      obj.position.set(
        (rng() - 0.5) * 2400,
        170 + rng() * 140,
        (rng() - 0.5) * 2700,
      );
      obj.scale.set(70 + rng() * 130, 8 + rng() * 15, 30 + rng() * 70);
      obj.rotation.y = rng() * Math.PI;
      obj.updateMatrix();
      this.clouds.setMatrixAt(i, obj.matrix);
    }
    scene.add(this.clouds);
    const starGeo = new THREE.BufferGeometry(),
      stars = [];
    for (let i = 0; i < 650; i++) {
      const theta = rng() * Math.PI * 2,
        h = 0.15 + rng() * 0.85;
      stars.push(
        Math.cos(theta) * Math.sqrt(1 - h * h) * 2500,
        h * 2500,
        Math.sin(theta) * Math.sqrt(1 - h * h) * 2500,
      );
    }
    starGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(stars, 3),
    );
    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: "#e0e7e3",
        size: 2.5,
        fog: false,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    scene.add(this.stars);
    this.configure();
  }
  configure() {
    const s = this.settings,
      p = qualityPresets[s.quality],
      night = s.time === "night",
      sunset = s.time === "sunset",
      noon = s.time === "noon",
      overcast = s.weather !== "clear";
    this.night = night;
    const top = night
      ? "#10252f"
      : sunset
        ? "#7d9292"
        : overcast
          ? "#8caaae"
          : "#88b0b8";
    const horizon = night
      ? "#283e43"
      : sunset
        ? "#dcb18b"
        : overcast
          ? "#c5d0cb"
          : "#d8ddc9";
    this.skyMaterial.uniforms.top.value.set(top);
    this.skyMaterial.uniforms.bottom.value.set(horizon);
    this.skyMaterial.uniforms.night.value = night ? 1 : 0;
    this.skyMaterial.uniforms.direction.value
      .set(-0.7, noon ? 0.9 : sunset ? 0.12 : 0.34, 0.6)
      .normalize();
    this.scene.fog = new THREE.Fog(
      horizon,
      s.weather === "fog" ? 25 : 100,
      s.weather === "fog" ? 220 : s.weather === "rain" ? p.fog * 0.65 : p.fog,
    );
    this.hemi.color.set(night ? "#7d9cbe" : sunset ? "#e6c6a4" : "#e0ece4");
    this.hemi.groundColor.set(s.biome === "snow" ? "#bdc9c5" : "#6a7554");
    this.hemi.intensity = night ? 0.55 : overcast ? 2.1 : 2.5;
    this.sun.color.set(night ? "#b8cce2" : sunset ? "#ffbb74" : "#fff0d6");
    this.sun.intensity = night ? 0.2 : overcast ? 1.1 : sunset ? 2.4 : 3;
    this.renderer.toneMappingExposure = night ? 0.88 : 1.0;
    this.renderer.shadowMap.enabled = p.shadow > 0;
    this.sun.castShadow = p.shadow > 0;
    if (p.shadow) {
      this.sun.shadow.mapSize.set(p.shadow, p.shadow);
      if (this.sun.shadow.map) {
        this.sun.shadow.map.dispose();
        this.sun.shadow.map = null;
      }
    }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, p.pixelRatio));
    this.renderer.setSize(innerWidth, innerHeight);
    this.clouds.material.opacity = night ? 0.06 : overcast ? 0.44 : 0.21;
    this.stars.material.opacity = night ? 0.85 : 0;
    this.createParticles(p.particles);
  }
  createParticles(count) {
    if (this.particle) {
      this.scene.remove(this.particle);
      this.particle.geometry.dispose();
      this.particle.material.dispose();
      this.particle = null;
    }
    const weather = this.settings.weather;
    if (weather !== "rain" && weather !== "snow") return;
    const rain = weather === "rain",
      rng = random(7876),
      positions = new Float32Array(count * (rain ? 6 : 3));
    for (let i = 0; i < count; i++) {
      const x = (rng() - 0.5) * 110,
        y = rng() * 65,
        z = (rng() - 0.5) * 110,
        o = i * (rain ? 6 : 3);
      positions[o] = x;
      positions[o + 1] = y;
      positions[o + 2] = z;
      if (rain) {
        positions[o + 3] = x + 0.12;
        positions[o + 4] = y - 1.6;
        positions[o + 5] = z;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = rain
      ? new THREE.LineBasicMaterial({
          color: "#bbd6db",
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        })
      : new THREE.PointsMaterial({
          color: "#f1f5f0",
          size: 0.17,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        });
    this.particle = rain
      ? new THREE.LineSegments(geo, mat)
      : new THREE.Points(geo, mat);
    this.particle.frustumCulled = false;
    this.particle.userData.rain = rain;
    this.scene.add(this.particle);
  }
  update(dt, player, camera) {
    this.clock += dt;
    this.sky.position.copy(camera.position);
    this.stars.position.copy(camera.position);
    this.clouds.position.set(
      player.x + Math.sin(this.clock * 0.003) * 80,
      0,
      player.z,
    );
    this.sun.position.set(
      player.x - 65,
      player.y + (this.settings.time === "noon" ? 140 : 70),
      player.z + 50,
    );
    this.sun.target.position.copy(player);
    this.sun.target.updateMatrixWorld();
    if (this.particle) {
      const a = this.particle.geometry.attributes.position,
        rain = this.particle.userData.rain,
        stride = rain ? 2 : 1;
      this.particle.position.set(player.x, player.y, player.z);
      for (let i = 0; i < a.count; i += stride) {
        let y = a.getY(i) - dt * (rain ? 37 : 3.2);
        if (y < -5) y += 70;
        const x =
          a.getX(i) + dt * (rain ? 1.8 : Math.sin(this.clock + i) * 0.45);
        a.setXY(i, x > 55 ? -55 : x, y);
        if (rain) a.setXYZ(i + 1, a.getX(i) + 0.12, y - 1.6, a.getZ(i));
      }
      a.needsUpdate = true;
    }
  }
}
