const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll('[data-reveal], .bar-stack').forEach((el) => revealObserver.observe(el));

function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  root.style.setProperty('--scroll', progress.toFixed(4));
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

const glow = document.querySelector('.cursor-glow');
if (glow && !reduceMotion) {
  window.addEventListener('pointermove', (event) => {
    glow.style.transform = `translate3d(${event.clientX - glow.offsetWidth / 2}px, ${event.clientY - glow.offsetHeight / 2}px, 0)`;
  });
}

const canvas = document.querySelector('.particle-field');
const context = canvas?.getContext('2d');
let width = 0;
let height = 0;
let particles = [];

function resizeCanvas() {
  if (!canvas || !context) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const count = Math.min(96, Math.max(42, Math.floor(width / 18)));
  particles = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    size: Math.random() * 1.8 + 0.4,
    phase: Math.random() * Math.PI * 2,
    accent: index % 7 === 0,
  }));
}

function drawParticles(time = 0) {
  if (!canvas || !context || reduceMotion) return;
  context.clearRect(0, 0, width, height);
  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.phase += 0.012;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    const alpha = 0.18 + Math.sin(particle.phase + time * 0.0004) * 0.12;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fillStyle = particle.accent ? `rgba(242, 182, 109, ${alpha + 0.08})` : `rgba(131, 247, 216, ${alpha})`;
    context.fill();

    for (let next = index + 1; next < particles.length; next += 1) {
      const other = particles[next];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 115) {
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(other.x, other.y);
        context.strokeStyle = `rgba(131, 247, 216, ${(1 - distance / 115) * 0.11})`;
        context.lineWidth = 1;
        context.stroke();
      }
    }
  });
  requestAnimationFrame(drawParticles);
}

if (canvas && context && !reduceMotion) {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  requestAnimationFrame(drawParticles);
}
