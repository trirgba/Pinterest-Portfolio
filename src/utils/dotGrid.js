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
      backgroundImage: 'radial-gradient(circle, rgba(0, 0, 0, 0.16) 1px, transparent 1px)',
      backgroundSize: '10px 10px',
      backgroundPosition: '5px 5px',
      webkitMaskImage: 'radial-gradient(circle at var(--cursor-x, -100%) var(--cursor-y, -100%), black 0px, black 40px, rgba(0, 0, 0, 0.375) 120px)',
      maskImage: 'radial-gradient(circle at var(--cursor-x, -100%) var(--cursor-y, -100%), black 0px, black 40px, rgba(0, 0, 0, 0.375) 120px)',
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
