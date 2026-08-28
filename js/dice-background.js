/**
 * THREE.JS 3D ROTATING DICE BACKGROUND & INTERACTIVE ROLLER
 * 3 con xúc xắc 3D phát sáng đỏ ruby - viền vàng kim xoay tự do trong không gian
 */

class DiceBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.diceGroup = null;
    this.diceMeshes = [];
    this.particles = null;
    this.isRolling = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      console.error('Three.js is not loaded');
      return;
    }

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const width = window.innerWidth || 1200;
    const height = window.innerHeight || 800;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 16);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // 4. Lighting
    this.setupLights();

    // 5. Create 3D Dice
    this.setupDice();

    // 6. Particle Field
    this.setupParticles();

    // 7. Event Listeners
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // 8. Animation Loop
    this.animate();
  }

  setupLights() {
    // Hemisphere light for soft global illumination
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1a243b, 1.8);
    this.scene.add(hemiLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    // Golden key light
    const dirLight1 = new THREE.DirectionalLight(0xffdf00, 2.5);
    dirLight1.position.set(12, 18, 15);
    this.scene.add(dirLight1);

    // Cyan fill light
    const dirLight2 = new THREE.DirectionalLight(0x00f2fe, 2.0);
    dirLight2.position.set(-15, -10, 12);
    this.scene.add(dirLight2);

    // Ruby point light
    const pointLight = new THREE.PointLight(0xff0055, 3.5, 40);
    pointLight.position.set(0, 4, 8);
    this.scene.add(pointLight);
  }

  createDiceFaceTexture(number) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Nền đỏ Ruby bóng bẩy
    const bgGradient = ctx.createRadialGradient(size/2, size/2, 20, size/2, size/2, size * 0.7);
    bgGradient.addColorStop(0, '#ff2a4b');
    bgGradient.addColorStop(0.5, '#d90429');
    bgGradient.addColorStop(1, '#6b0012');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, size, size);

    // Khung viền kim loại vàng rực rỡ
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 24;
    ctx.strokeRect(12, 12, size - 24, size - 24);

    // Viền sáng bóng bên trong
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 6;
    ctx.strokeRect(32, 32, size - 64, size - 64);

    // Góc vát bo tròn nhẹ
    ctx.fillStyle = '#ffd700';
    const cornerSize = 40;
    ctx.fillRect(0, 0, cornerSize, 8);
    ctx.fillRect(0, 0, 8, cornerSize);
    ctx.fillRect(size - cornerSize, 0, cornerSize, 8);
    ctx.fillRect(size - 8, 0, 8, cornerSize);

    // Vẽ chấm tròn xúc xắc (Pips)
    const dotRadius = 38;
    const center = size / 2;
    const left = size / 3.4;
    const right = size - left;
    const top = size / 3.4;
    const bottom = size - top;

    const drawPip = (x, y, isGold = false) => {
      ctx.save();
      // Hiệu ứng đổ bóng và ánh sáng 3D trên từng chấm
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;

      const pipGrad = ctx.createRadialGradient(x - 8, y - 8, 4, x, y, dotRadius);
      if (isGold) {
        pipGrad.addColorStop(0, '#fffbe6');
        pipGrad.addColorStop(0.4, '#ffd700');
        pipGrad.addColorStop(1, '#b38600');
      } else {
        pipGrad.addColorStop(0, '#ffffff');
        pipGrad.addColorStop(0.7, '#f1f5f9');
        pipGrad.addColorStop(1, '#cbd5e1');
      }

      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = pipGrad;
      ctx.fill();

      // Viền kim loại mỏng quanh chấm
      ctx.strokeStyle = isGold ? '#ffe066' : '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    };

    switch (number) {
      case 1:
        // Chấm số 1 ở giữa to và màu vàng tài lộc
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 30;
        const centerPipGrad = ctx.createRadialGradient(center - 12, center - 12, 6, center, center, dotRadius * 1.7);
        centerPipGrad.addColorStop(0, '#ffffff');
        centerPipGrad.addColorStop(0.3, '#fff066');
        centerPipGrad.addColorStop(0.7, '#ffd700');
        centerPipGrad.addColorStop(1, '#b38600');
        ctx.beginPath();
        ctx.arc(center, center, dotRadius * 1.7, 0, Math.PI * 2);
        ctx.fillStyle = centerPipGrad;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
        break;
      case 2:
        drawPip(left, top);
        drawPip(right, bottom);
        break;
      case 3:
        drawPip(left, top);
        drawPip(center, center, true);
        drawPip(right, bottom);
        break;
      case 4:
        drawPip(left, top, true);
        drawPip(right, top);
        drawPip(left, bottom);
        drawPip(right, bottom, true);
        break;
      case 5:
        drawPip(left, top);
        drawPip(right, top);
        drawPip(center, center, true);
        drawPip(left, bottom);
        drawPip(right, bottom);
        break;
      case 6:
        drawPip(left, top);
        drawPip(right, top);
        drawPip(left, center);
        drawPip(right, center);
        drawPip(left, bottom);
        drawPip(right, bottom);
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  }

  setupDice() {
    this.diceGroup = new THREE.Group();

    // 6 mặt: Right (+X), Left (-X), Top (+Y), Bottom (-Y), Front (+Z), Back (-Z)
    // Quy tắc xúc xắc đối lập: 1 đối diện 6, 2 đối diện 5, 3 đối diện 4
    const materials = [
      new THREE.MeshStandardMaterial({ map: this.createDiceFaceTexture(1), roughness: 0.15, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceFaceTexture(6), roughness: 0.15, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceFaceTexture(2), roughness: 0.15, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceFaceTexture(5), roughness: 0.15, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceFaceTexture(3), roughness: 0.15, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceFaceTexture(4), roughness: 0.15, metalness: 0.2 }),
    ];

    const diceSize = 3.2;
    const geometry = new THREE.BoxGeometry(diceSize, diceSize, diceSize);

    // Vị trí 3 con xúc xắc trong không gian (Bên trái, Chính diện lơ lửng, Bên phải)
    const diceConfigs = [
      {
        pos: new THREE.Vector3(-6.0, 2.5, -1.0),
        rot: new THREE.Euler(0.7, 0.9, 0.4),
        rotSpeed: { x: 0.009, y: 0.013, z: 0.007 },
        floatOffset: 0
      },
      {
        pos: new THREE.Vector3(0, -1.5, 2.8),
        rot: new THREE.Euler(1.1, -0.5, 0.9),
        rotSpeed: { x: -0.011, y: 0.010, z: 0.012 },
        floatOffset: Math.PI / 2.5
      },
      {
        pos: new THREE.Vector3(6.0, 2.8, -0.5),
        rot: new THREE.Euler(-0.6, 1.3, -0.8),
        rotSpeed: { x: 0.012, y: -0.008, z: 0.010 },
        floatOffset: Math.PI * 0.8
      }
    ];

    diceConfigs.forEach((cfg) => {
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.position.copy(cfg.pos);
      mesh.rotation.copy(cfg.rot);

      this.diceMeshes.push({
        mesh: mesh,
        basePos: cfg.pos.clone(),
        rotSpeed: cfg.rotSpeed,
        floatOffset: cfg.floatOffset
      });

      this.diceGroup.add(mesh);
    });

    this.scene.add(this.diceGroup);
  }

  setupParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0xffd700), // Gold
      new THREE.Color(0x00f2fe), // Cyan
      new THREE.Color(0xff2a6d), // Pink Red
      new THREE.Color(0xffffff)  // White
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 55;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;

      const clr = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = clr.r;
      colors[i * 3 + 1] = clr.g;
      colors[i * 3 + 2] = clr.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    const gradient = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,215,0,0.85)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    pCtx.fillStyle = gradient;
    pCtx.fillRect(0, 0, 32, 32);

    const pTexture = new THREE.CanvasTexture(pCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.65,
      map: pTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  onMouseMove(e) {
    this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  rollDice(onCompleteCallback) {
    if (this.isRolling) return;
    this.isRolling = true;

    // Sinh ngẫu nhiên 3 số từ 1 đến 6
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    const results = [d1, d2, d3];

    // Góc quay chính diện ứng với 6 mặt:
    // 1 (+X): y = -PI/2
    // 6 (-X): y = PI/2
    // 2 (+Y): x = PI/2
    // 5 (-Y): x = -PI/2
    // 3 (+Z): x = 0, y = 0
    // 4 (-Z): y = PI
    const faceRotations = {
      1: { x: 0, y: -Math.PI / 2, z: 0 },
      6: { x: 0, y: Math.PI / 2, z: 0 },
      2: { x: Math.PI / 2, y: 0, z: 0 },
      5: { x: -Math.PI / 2, y: 0, z: 0 },
      3: { x: 0, y: 0, z: 0 },
      4: { x: 0, y: Math.PI, z: 0 }
    };

    const startTime = performance.now();
    const duration = 1800; // 1.8 giây

    const initialRotations = this.diceMeshes.map(d => ({
      x: d.mesh.rotation.x,
      y: d.mesh.rotation.y,
      z: d.mesh.rotation.z
    }));

    const rollStep = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic Ease Out

      this.diceMeshes.forEach((d, idx) => {
        const targetFace = faceRotations[results[idx]];
        const fullSpins = 4 * Math.PI * (1 - ease);

        d.mesh.rotation.x = initialRotations[idx].x + (targetFace.x - initialRotations[idx].x) * ease + fullSpins * (idx === 1 ? -1.2 : 1.2);
        d.mesh.rotation.y = initialRotations[idx].y + (targetFace.y - initialRotations[idx].y) * ease + fullSpins * 1.5;
        d.mesh.rotation.z = initialRotations[idx].z + (targetFace.z - initialRotations[idx].z) * ease + fullSpins * 0.9;

        // Nhảy nảy bồng bềnh
        const bounce = Math.sin(progress * Math.PI * 3.5) * (1 - progress) * 2.5;
        d.mesh.position.y = d.basePos.y + bounce;
      });

      if (progress < 1) {
        requestAnimationFrame(rollStep);
      } else {
        this.diceMeshes.forEach((d, idx) => {
          const targetFace = faceRotations[results[idx]];
          d.mesh.rotation.set(targetFace.x, targetFace.y, targetFace.z);
          d.mesh.position.copy(d.basePos);
        });
        this.isRolling = false;
        if (typeof onCompleteCallback === 'function') {
          onCompleteCallback(results);
        }
      }
    };

    requestAnimationFrame(rollStep);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;

    // Mouse parallax
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    if (this.diceGroup && !this.isRolling) {
      this.diceGroup.rotation.y = this.mouseX * 0.3;
      this.diceGroup.rotation.x = -this.mouseY * 0.2;

      this.diceMeshes.forEach((d) => {
        d.mesh.rotation.x += d.rotSpeed.x;
        d.mesh.rotation.y += d.rotSpeed.y;
        d.mesh.rotation.z += d.rotSpeed.z;

        d.mesh.position.y = d.basePos.y + Math.sin(time * 1.8 + d.floatOffset) * 0.45;
        d.mesh.position.x = d.basePos.x + Math.cos(time * 1.4 + d.floatOffset) * 0.25;
      });
    }

    if (this.particles) {
      this.particles.rotation.y = time * 0.035;
      this.particles.rotation.x = time * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.DiceBackground = DiceBackground;
