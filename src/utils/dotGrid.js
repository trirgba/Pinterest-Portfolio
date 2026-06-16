export function initDotGrid() {
  const setup = () => {
    if (document.getElementById('dot-cursor-layer')) return;

    // Inject CSS để đảm bảo mọi nội dung chính nằm trên dot layer và cấu hình layer giả cho hiệu ứng glow
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
      
      #dot-cursor-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-image: radial-gradient(circle, rgba(0, 0, 0, 0.16) 0.5px, transparent 0.5px);
        background-size: 10px 10px;
        background-position: 5px 5px;
      }

      #dot-cursor-layer::after {
        content: "";
        position: absolute;
        inset: 0;
        background-image: radial-gradient(circle, rgba(0, 0, 0, 0.4) 0.5px, transparent 0.5px);
        background-size: 10px 10px;
        background-position: 5px 5px;
        -webkit-mask-image: radial-gradient(circle at var(--cursor-x, -100%) var(--cursor-y, -100%), black 0px, black 40px, transparent 120px);
        mask-image: radial-gradient(circle at var(--cursor-x, -100%) var(--cursor-y, -100%), black 0px, black 40px, transparent 120px);
        opacity: 0;
        transition: opacity 1.6s ease;
      }

      #dot-cursor-layer.is-moving::after {
        opacity: 1;
        transition: opacity 0.1s ease;
      }
    `;
    document.head.appendChild(style);

    const dotLayer = document.createElement('div');
    dotLayer.id = 'dot-cursor-layer';
    
    // Chèn vào đầu body để nằm dưới cùng trong DOM
    document.body.prepend(dotLayer);

    let moveTimeout;
    document.addEventListener('mousemove', (e) => {
      dotLayer.style.setProperty('--cursor-x', `${e.clientX}px`);
      dotLayer.style.setProperty('--cursor-y', `${e.clientY}px`);
      
      if (!dotLayer.classList.contains('is-moving')) {
        dotLayer.classList.add('is-moving');
      }
      
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        dotLayer.classList.remove('is-moving');
      }, 100);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}
