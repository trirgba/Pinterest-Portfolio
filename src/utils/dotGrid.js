export function initDotGrid() {
  const setup = () => {
    if (document.getElementById('dot-cursor-layer')) return;

    // Inject CSS để đảm bảo mọi nội dung chính nằm trên dot layer
    const style = document.createElement('style');
    style.textContent = `
      body > header,
      body > main,
      body > footer,
      body > .admin-content,
      body > .container {
        position: relative;
        z-index: 1;
      }
    `;
    document.head.appendChild(style);

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
      opacity: '0.4',
    });
    // Chèn vào đầu body để nằm dưới cùng trong DOM
    document.body.prepend(dotLayer);

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
