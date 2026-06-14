export function initDotGrid() {
  const setup = () => {
    if (document.getElementById('dot-cursor-layer')) return;
    const dotLayer = document.createElement('div');
    dotLayer.id = 'dot-cursor-layer';
    Object.assign(dotLayer.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '0',
      backgroundImage: 'radial-gradient(circle, rgb(0, 0, 0) 0.8px, transparent 0.8px)',
      backgroundSize: '10px 10px',
      backgroundPosition: '5px 5px',
      webkitMaskImage: 'radial-gradient(120px circle at var(--cursor-x, -100%) var(--cursor-y, -100%), black, transparent)',
      maskImage: 'radial-gradient(120px circle at var(--cursor-x, -100%) var(--cursor-y, -100%), black, transparent)',
      opacity: '0.4', // Chỉnh độ đậm của dot
    });
    document.body.appendChild(dotLayer);

    document.addEventListener('mousemove', (e) => {
      dotLayer.style.setProperty('--cursor-x', `${e.clientX}px`);
      dotLayer.style.setProperty('--cursor-y', `${e.clientY}px`);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}
