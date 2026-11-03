/**
 * GAMEVERSE - Cinematic Intro Engine
 * Created By Shiv Yogi | Crystal-Particle Formation Animation
 */

class IntroEngine {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.canvas = document.getElementById('intro-particle-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationFrame = null;
    this.startTime = 0;
    this.duration = 4400; // Natural 4.4s opening sequence
    this.width = 0;
    this.height = 0;
  }

  start() {
    if (!this.canvas || !this.ctx) {
      if (this.onComplete) this.onComplete();
      return;
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.startTime = performance.now();

    // Trigger DOM typography reveals
    setTimeout(() => {
      const gvTitle = document.querySelector('.intro-title-gameverse');
      if (gvTitle) gvTitle.classList.add('visible');
    }, 600);

    setTimeout(() => {
      const creator = document.querySelector('.intro-creator-wrap');
      const bar = document.querySelector('.intro-loader-bar');
      const prog = document.querySelector('.intro-loader-progress');
      if (creator) creator.classList.add('visible');
      if (bar) bar.classList.add('visible');
      if (prog) prog.style.width = '100%';
    }, 1200);

    // Audio chime if enabled
    setTimeout(() => {
      if (window.audioManager) window.audioManager.playSelect();
    }, 1400);

    // Smooth blur transition to completion
    setTimeout(() => {
      const introEl = document.getElementById('cinematic-intro');
      if (introEl) introEl.classList.add('fade-out');

      setTimeout(() => {
        this.destroy();
        if (this.onComplete) this.onComplete();
      }, 800);
    }, 3800);

    this.render();
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    const count = Math.min(220, Math.floor((this.width * this.height) / 5000));
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (let i = 0; i < count; i++) {
      // Shards spawn randomly around periphery
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.max(this.width, this.height) * 0.8 + 100;
      
      // Target crystal constellation point
      const targetAngle = (i / count) * Math.PI * 2;
      const targetRadius = (i % 3 === 0 ? 140 : (i % 3 === 1 ? 95 : 50)) + (Math.sin(i) * 20);

      this.particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        targetX: centerX + Math.cos(targetAngle) * targetRadius,
        targetY: centerY + Math.sin(targetAngle) * targetRadius,
        vx: 0,
        vy: 0,
        size: Math.random() * 3 + 1.5,
        color: i % 2 === 0 ? '#00f0ff' : (i % 4 === 0 ? '#ffffff' : '#ff007f'),
        alpha: Math.random() * 0.7 + 0.3,
        shimmerSpeed: Math.random() * 0.05 + 0.02
      });
    }
  }

  render() {
    if (!this.ctx) return;
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(1, elapsed / 2800); // converge over 2.8s

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Easing curve for convergence
    const ease = 1 - Math.pow(1 - progress, 3);

    // Draw connecting crystal facets
    this.ctx.lineWidth = 0.8;
    for (let i = 0; i < this.particles.length; i += 3) {
      const p1 = this.particles[i];
      const p2 = this.particles[(i + 1) % this.particles.length];
      if (p1 && p2 && progress > 0.4) {
        const lineAlpha = (progress - 0.4) * 0.35;
        this.ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.currentX || p1.x, p1.currentY || p1.y);
        this.ctx.lineTo(p2.currentX || p2.x, p2.currentY || p2.y);
        this.ctx.stroke();
      }
    }

    // Draw particles
    for (const p of this.particles) {
      // Lerp position toward target
      const curX = p.x + (p.targetX - p.x) * ease;
      const curY = p.y + (p.targetY - p.y) * ease;
      p.currentX = curX;
      p.currentY = curY;

      // Shimmer
      const pulse = Math.sin(elapsed * p.shimmerSpeed) * 0.2 + 0.8;

      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 10 * pulse;
      this.ctx.globalAlpha = p.alpha * pulse;

      this.ctx.beginPath();
      // Crystal diamond shape
      this.ctx.moveTo(curX, curY - p.size);
      this.ctx.lineTo(curX + p.size, curY);
      this.ctx.lineTo(curX, curY + p.size);
      this.ctx.lineTo(curX - p.size, curY);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;

    this.animationFrame = requestAnimationFrame(() => this.render());
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    const introEl = document.getElementById('cinematic-intro');
    if (introEl) introEl.remove();
  }
}

window.IntroEngine = IntroEngine;
