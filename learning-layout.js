/* Independent pane sizing; reading text stays within the accessible 14–20px range. */
(() => {
  const observed = new WeakSet();
  const resize = new ResizeObserver(entries => {
    const base = Number.parseFloat(document.documentElement.style.getPropertyValue('--learning-font-size')) || 15;
    for (const { target, contentRect } of entries) {
      if (!contentRect.width) continue;
      const size = [12,15,20].includes(base) ? base : 15;
      target.style.setProperty('--learning-font-size', `${size}px`);
    }
  });
  function scan() {
    document.querySelectorAll('.content, .learning-card, .learning-drawer').forEach(pane => {
      if (!observed.has(pane)) { observed.add(pane); resize.observe(pane); }
    });
  }
  function draggable(pane, handle, changed) {
    handle.title = "Drag to move";
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button,input,textarea,select,a')) return;
      event.preventDefault();
      const rect = pane.getBoundingClientRect(), x = event.clientX, y = event.clientY;
      handle.setPointerCapture(event.pointerId);
      handle.onpointermove = move => {
        pane.style.left = `${Math.max(0,Math.min(innerWidth-rect.width,rect.left+move.clientX-x))}px`;
        pane.style.top = `${Math.max(0,Math.min(innerHeight-48,rect.top+move.clientY-y))}px`;
        pane.style.right = 'auto'; pane.style.bottom = 'auto';
      };
      const end = () => { handle.onpointermove = null; changed?.(); };
      handle.onpointerup = end; handle.onpointercancel = end;
    });
  }
  function resizable(pane) {
    pane.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const r = pane.getBoundingClientRect(), x = event.clientX, y = event.clientY;
      const left = x - r.left < 7, right = r.right - x < 7;
      const top = y - r.top < 7, bottom = r.bottom - y < 7;
      if (!(left || right || top || bottom)) return;
      event.preventDefault(); event.stopPropagation(); pane.setPointerCapture(event.pointerId);
      const move = e => {
        const minWidth = Math.min(240, innerWidth - 16), minHeight = Math.min(180, innerHeight - 16);
        const l = left ? Math.max(8, Math.min(r.right-minWidth, r.left+e.clientX-x)) : r.left;
        const t = top ? Math.max(8, Math.min(r.bottom-minHeight, r.top+e.clientY-y)) : r.top;
        const rr = right ? Math.min(innerWidth-8, Math.max(l+minWidth, r.right+e.clientX-x)) : r.right;
        const b = bottom ? Math.min(innerHeight-8, Math.max(t+minHeight, r.bottom+e.clientY-y)) : r.bottom;
        Object.assign(pane.style, {left:l+'px', top:t+'px', width:(rr-l)+'px', height:(b-t)+'px'});
      };
      const end = () => { pane.removeEventListener('pointermove', move); pane.removeEventListener('pointerup', end); pane.removeEventListener('pointercancel', end); };
      pane.addEventListener('pointermove', move); pane.addEventListener('pointerup', end); pane.addEventListener('pointercancel', end);
    }, true);
  }
  window.ytdLearningLayout = {draggable, resizable};
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    new MutationObserver(() => {
      document.querySelectorAll('.content, .learning-card, .learning-drawer').forEach(pane => { resize.unobserve(pane); resize.observe(pane); });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    scan();
  });
})();
