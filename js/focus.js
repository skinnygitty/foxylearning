// ===== FOCUS & ATTENTION MANAGER =====
const FocusManager = (() => {
  let sessionStart = null;
  let blockTimer = null;
  let focusSeconds = 0;
  let totalFocusSeconds = 0;
  let onBreakNeeded = null;
  let ringEl = null;
  let totalBlockSeconds = 0;

  function startSession(onBreak) {
    onBreakNeeded = onBreak;
    sessionStart = Date.now();
    const p = Profile.get();
    totalBlockSeconds = p.focusBlockMinutes * 60;
    focusSeconds = 0;
    updateRing();
    clearInterval(blockTimer);
    blockTimer = setInterval(tick, 1000);
  }

  function tick() {
    focusSeconds++;
    totalFocusSeconds++;
    updateRing();
    if (focusSeconds >= totalBlockSeconds) {
      clearInterval(blockTimer);
      if (onBreakNeeded) onBreakNeeded();
    }
  }

  function updateRing() {
    const circle = document.getElementById('focus-prog');
    if (!circle) return;
    const pct = focusSeconds / totalBlockSeconds;
    const dashOffset = 88 * (1 - pct);
    circle.style.strokeDashoffset = dashOffset;
    // Color warning: yellow -> orange -> red as time runs out
    if (pct > 0.85) circle.style.stroke = '#FF6584';
    else if (pct > 0.6) circle.style.stroke = '#FF9F43';
    else circle.style.stroke = '#FFD166';
  }

  function resetBlock() {
    const p = Profile.get();
    totalBlockSeconds = p.focusBlockMinutes * 60;
    focusSeconds = 0;
    updateRing();
    clearInterval(blockTimer);
    blockTimer = setInterval(tick, 1000);
  }

  function stopSession() {
    clearInterval(blockTimer);
    const minutes = Math.floor((Date.now() - (sessionStart || Date.now())) / 60000);
    const p = Profile.get();
    p.totalMinutes += minutes;
    Profile.save(p);
  }

  function getSessionMinutes() {
    if (!sessionStart) return 0;
    return Math.floor((Date.now() - sessionStart) / 60000);
  }

  return { startSession, stopSession, resetBlock, getSessionMinutes };
})();
