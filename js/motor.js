// ===== MOTOR SKILLS ENGINE =====
const MotorEngine = (() => {

  // ---- TRACING GAME ----
  let traceCanvas, traceCtx;
  let isDrawing = false;
  let tracePath = [];
  let traceHits = 0, traceMisses = 0;
  let traceWidth = 30;

  function buildTracePath(type) {
    const W = traceCanvas.width, H = traceCanvas.height;
    if (type === 'line') {
      return Array.from({length:60}, (_,i) => ({ x: 60 + (W-120)*(i/59), y: H/2 }));
    }
    if (type === 'curve') {
      return Array.from({length:80}, (_,i) => {
        const t = i/79;
        return { x: 60 + (W-120)*t, y: H/2 + Math.sin(t*Math.PI*2)*80 };
      });
    }
    if (type === 'letter_a') {
      const pts = [];
      const cx = W/2, cy = H/2+40, size = 100;
      for(let i=0;i<=40;i++) pts.push({ x: cx - size*(1-i/40), y: cy - size*2*(i/40) });
      for(let i=0;i<=40;i++) pts.push({ x: cx + size*(i/40), y: cy - size*2*(1-i/40) });
      return pts;
    }
    return Array.from({length:60}, (_,i) => ({ x: 60 + (W-120)*(i/59), y: H/2 }));
  }

  function drawTraceGuide(path, width) {
    traceCtx.clearRect(0, 0, traceCanvas.width, traceCanvas.height);
    traceCtx.save();
    traceCtx.strokeStyle = '#E0E7FF';
    traceCtx.lineWidth = width * 2;
    traceCtx.lineCap = 'round';
    traceCtx.lineJoin = 'round';
    traceCtx.beginPath();
    path.forEach((pt, i) => i === 0 ? traceCtx.moveTo(pt.x, pt.y) : traceCtx.lineTo(pt.x, pt.y));
    traceCtx.stroke();
    // Dashed center line
    traceCtx.strokeStyle = '#B0B8FF';
    traceCtx.lineWidth = 2;
    traceCtx.setLineDash([8,6]);
    traceCtx.beginPath();
    path.forEach((pt, i) => i === 0 ? traceCtx.moveTo(pt.x, pt.y) : traceCtx.lineTo(pt.x, pt.y));
    traceCtx.stroke();
    traceCtx.setLineDash([]);
    // Start dot
    traceCtx.fillStyle = '#43D9AD';
    traceCtx.beginPath();
    traceCtx.arc(path[0].x, path[0].y, 12, 0, Math.PI*2);
    traceCtx.fill();
    // End dot
    traceCtx.fillStyle = '#FF6584';
    traceCtx.beginPath();
    traceCtx.arc(path[path.length-1].x, path[path.length-1].y, 12, 0, Math.PI*2);
    traceCtx.fill();
    traceCtx.restore();
  }

  function distFromPath(x, y, path) {
    return Math.min(...path.map(p => Math.hypot(p.x-x, p.y-y)));
  }

  function initTrace(canvasId, type) {
    traceCanvas = document.getElementById(canvasId);
    if (!traceCanvas) return;
    traceCtx = traceCanvas.getContext('2d');
    const p = Profile.get();
    traceWidth = p.motorProgress.traceWidth;
    traceHits = 0; traceMisses = 0;
    tracePath = buildTracePath(type);
    drawTraceGuide(tracePath, traceWidth);

    const getPos = (e) => {
      const rect = traceCanvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: (src.clientX - rect.left) * (traceCanvas.width/rect.width),
               y: (src.clientY - rect.top) * (traceCanvas.height/rect.height) };
    };

    const onStart = (e) => { e.preventDefault(); isDrawing = true; };
    const onEnd = () => { isDrawing = false; };
    const onMove = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const {x,y} = getPos(e);
      const dist = distFromPath(x, y, tracePath);
      const onTrack = dist < traceWidth;
      traceCtx.beginPath();
      traceCtx.arc(x, y, 6, 0, Math.PI*2);
      traceCtx.fillStyle = onTrack ? 'rgba(67,217,173,0.7)' : 'rgba(255,101,132,0.5)';
      traceCtx.fill();
      if (onTrack) traceHits++; else traceMisses++;
      updatePrecision();
    };

    traceCanvas.addEventListener('mousedown', onStart);
    traceCanvas.addEventListener('mouseup', onEnd);
    traceCanvas.addEventListener('mousemove', onMove);
    traceCanvas.addEventListener('touchstart', onStart, {passive:false});
    traceCanvas.addEventListener('touchend', onEnd);
    traceCanvas.addEventListener('touchmove', onMove, {passive:false});
  }

  function updatePrecision() {
    const total = traceHits + traceMisses;
    if (total === 0) return;
    const pct = Math.round((traceHits / total) * 100);
    const fill = document.getElementById('precision-fill');
    const label = document.getElementById('precision-label');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = `Precision: ${pct}%`;
  }

  function getTracePrecision() {
    const total = traceHits + traceMisses;
    return total === 0 ? 0 : traceHits / total;
  }

  // ---- DOT-TO-DOT ----
  function buildDotCanvas(canvasId, count) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    // Generate dots in a simple shape
    const dots = [];
    const shapes = ['star','circle','house'];
    const shape = shapes[Math.floor(Math.random()*shapes.length)];
    for(let i=0;i<count;i++) {
      const angle = (i/count)*Math.PI*2 - Math.PI/2;
      const r = shape === 'circle' ? 120 :
                shape === 'star' ? (i%2===0?130:60) : 110;
      dots.push({ x: W/2 + r*Math.cos(angle), y: H/2 + r*Math.sin(angle), num: i+1 });
    }
    let nextDot = 1;
    let lastConnected = null;

    function draw() {
      ctx.clearRect(0,0,W,H);
      // Draw completed lines
      if (lastConnected !== null) {
        ctx.strokeStyle = '#6C63FF'; ctx.lineWidth = 3; ctx.lineCap='round';
        ctx.beginPath();
        for(let i=0;i<lastConnected;i++) {
          i===0 ? ctx.moveTo(dots[i].x,dots[i].y) : ctx.lineTo(dots[i].x,dots[i].y);
        }
        ctx.stroke();
      }
      // Draw dots
      dots.forEach(d => {
        const done = d.num < nextDot;
        ctx.beginPath();
        ctx.arc(d.x, d.y, done?10:14, 0, Math.PI*2);
        ctx.fillStyle = done ? '#43D9AD' : d.num===nextDot ? '#FFD166' : '#E0E7FF';
        ctx.fill();
        ctx.strokeStyle = done?'#28A745':'#6C63FF'; ctx.lineWidth=2;
        ctx.stroke();
        ctx.fillStyle = '#2D3436'; ctx.font = 'bold 14px Nunito,sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(d.num, d.x, d.y);
      });
    }

    draw();
    canvas.addEventListener('click', (e) => {
      if (nextDot > count) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX-rect.left)*(W/rect.width);
      const my = (e.clientY-rect.top)*(H/rect.height);
      const target = dots[nextDot-1];
      if (Math.hypot(mx-target.x, my-target.y) < 30) {
        lastConnected = nextDot;
        nextDot++;
        draw();
        if (nextDot > count) {
          ctx.fillStyle='rgba(255,255,255,0.8)';
          ctx.fillRect(W/2-100,H/2-30,200,60);
          ctx.fillStyle='#6C63FF'; ctx.font='bold 24px Nunito,sans-serif';
          ctx.textAlign='center'; ctx.fillText('🎉 Amazing!', W/2, H/2+8);
          Profile.awardBadge('motor_hero');
        }
      }
    });
  }

  return { initTrace, buildDotCanvas, getTracePrecision };
})();
