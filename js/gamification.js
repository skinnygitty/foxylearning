// ===== GAMIFICATION ENGINE =====
const Gamification = (() => {

  const BADGES = [
    { id: 'first_lesson', icon: '🌟', name: 'First Star!', desc: 'Completed your very first lesson' },
    { id: 'streak_3', icon: '🔥', name: '3-Day Streak!', desc: 'Played 3 days in a row' },
    { id: 'streak_7', icon: '🚀', name: 'Week Warrior!', desc: 'Played 7 days in a row' },
    { id: 'math_master', icon: '🧮', name: 'Math Wizard', desc: 'Mastered 3 math skills' },
    { id: 'reading_star', icon: '📚', name: 'Reading Star', desc: 'Mastered 3 reading skills' },
    { id: 'perfect_score', icon: '💎', name: 'Diamond Round', desc: 'Got 100% on a lesson!' },
    { id: 'motor_hero', icon: '🎨', name: 'Builder Hero', desc: 'Completed 5 motor activities' },
    { id: 'phase2_unlock', icon: '🌿', name: 'Sprout!', desc: 'Reached Phase 2: Sprouts' },
    { id: 'confidence_80', icon: '💪', name: 'Super Confident!', desc: 'Confidence score reached 80!' },
    { id: 'level_5', icon: '👑', name: 'Level 5 Champ', desc: 'Reached Level 5' },
    { id: 'level_10', icon: '🏆', name: 'Level 10 Legend', desc: 'Reached Level 10' },
    { id: 'focus_master', icon: '🧘', name: 'Focus Master', desc: 'Completed 10 full focus sessions' },
  ];

  function getBadgeById(id) { return BADGES.find(b => b.id === id); }
  function getAllBadges() { return BADGES; }

  function updateTopBar() {
    const p = Profile.get();
    const pct = (p.xp / p.xpToNext) * 100;
    const xpBar = document.getElementById('xp-bar');
    const xpLabel = document.getElementById('xp-label');
    if (xpBar) xpBar.style.width = pct + '%';
    if (xpLabel) xpLabel.textContent = `⭐ Lv ${p.level}  |  ${p.xp}/${p.xpToNext} XP`;
  }

  function showBadgeToast(badgeId) {
    const b = getBadgeById(badgeId);
    if (!b) return;
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
      background:#fff;border-radius:20px;padding:16px 28px;box-shadow:0 8px 32px rgba(0,0,0,0.2);
      z-index:1000;display:flex;align-items:center;gap:12px;font-family:inherit;
      animation:popIn 0.5s ease;font-size:18px;font-weight:800;border:3px solid #6C63FF;`;
    toast.innerHTML = `<span style="font-size:36px">${b.icon}</span>
      <div><div style="color:#6C63FF">NEW BADGE UNLOCKED!</div>
      <div>${b.name}</div></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function spawnConfetti(count = 40) {
    const colors = ['#FF6584','#6C63FF','#FFD166','#43D9AD','#FF9F43','#54A0FF'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `left:${Math.random()*100}vw;top:-10px;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        animation-delay:${Math.random()*0.5}s;
        animation-duration:${1+Math.random()*1}s;
        transform:rotate(${Math.random()*360}deg)`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }
  }

  function showFeedback(correct) {
    const overlay = document.getElementById('feedback-overlay');
    const text = document.getElementById('feedback-text');
    if (!overlay || !text) return;
    text.textContent = correct ? ['🎉','⭐','🌟','🎊','✨'][Math.floor(Math.random()*5)] : '🔄';
    overlay.style.display = 'flex';
    if (correct) spawnConfetti(20);
    setTimeout(() => { overlay.style.display = 'none'; }, 700);
  }

  function checkAutoAwards(profile, lessonId) {
    const mastered = Object.values(profile.skillProgress).filter(s => s.mastered);
    const mathMastered = Object.keys(profile.skillProgress).filter(k => k.startsWith('m') && profile.skillProgress[k].mastered);
    const readMastered = Object.keys(profile.skillProgress).filter(k => k.startsWith('r') && profile.skillProgress[k].mastered);

    if (Object.keys(profile.skillProgress).length === 1 && Profile.awardBadge('first_lesson')) showBadgeToast('first_lesson');
    if (mathMastered.length >= 3 && Profile.awardBadge('math_master')) showBadgeToast('math_master');
    if (readMastered.length >= 3 && Profile.awardBadge('reading_star')) showBadgeToast('reading_star');
    if (profile.level >= 5 && Profile.awardBadge('level_5')) showBadgeToast('level_5');
    if (profile.level >= 10 && Profile.awardBadge('level_10')) showBadgeToast('level_10');
    if (profile.confidenceScore >= 80 && Profile.awardBadge('confidence_80')) showBadgeToast('confidence_80');
    if (profile.streakDays >= 3 && Profile.awardBadge('streak_3')) showBadgeToast('streak_3');
    if (profile.streakDays >= 7 && Profile.awardBadge('streak_7')) showBadgeToast('streak_7');
  }

  return { getAllBadges, getBadgeById, updateTopBar, showBadgeToast, spawnConfetti, showFeedback, checkAutoAwards };
})();
