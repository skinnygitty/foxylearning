// ===== LEARNER PROFILE MANAGER =====
const Profile = (() => {
  const KEY = 'learnerProfile_v1';

  const defaults = {
    name: 'Superstar',
    age: 6,
    currentPhase: 1,
    xp: 0,
    level: 1,
    xpToNext: 100,
    streakDays: 0,
    lastSessionDate: null,
    totalSessions: 0,
    totalMinutes: 0,
    focusBlockMinutes: 8,
    confidenceScore: 50,
    badges: [],
    skillProgress: {},   // { lessonId: { attempts:[], mastered:false, stars:0 } }
    motorProgress: {
      traceWidth: 30,
      mazeSpeed: 'slow',
      puzzlePieces: 4,
      traceAccuracyHistory: []
    },
    assessmentDone: false,
    assessmentResults: {},
    settings: { soundOn: true, animationsOn: true }
  };

  function load() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return Object.assign({}, defaults, JSON.parse(saved));
    } catch(e) {}
    return Object.assign({}, defaults);
  }

  function save(profile) {
    localStorage.setItem(KEY, JSON.stringify(profile));
  }

  function get() { return load(); }

  function update(changes) {
    const p = load();
    Object.assign(p, changes);
    save(p);
    return p;
  }

  function addXP(amount) {
    const p = load();
    p.xp += amount;
    while (p.xp >= p.xpToNext) {
      p.xp -= p.xpToNext;
      p.level += 1;
      p.xpToNext = Math.floor(p.xpToNext * 1.4);
    }
    save(p);
    return p;
  }

  function recordLessonResult(lessonId, accuracy, xp) {
    const p = load();
    if (!p.skillProgress[lessonId]) {
      p.skillProgress[lessonId] = { attempts: [], mastered: false, stars: 0 };
    }
    const prog = p.skillProgress[lessonId];
    prog.attempts.push({ accuracy, date: Date.now() });
    if (prog.attempts.length > 10) prog.attempts = prog.attempts.slice(-10);

    // Mastery: 90% across last 3 attempts
    const last3 = prog.attempts.slice(-3);
    if (last3.length === 3 && last3.every(a => a.accuracy >= 0.90)) {
      prog.mastered = true;
    }

    // Stars: 1 = 60%+, 2 = 80%+, 3 = 90%+
    const stars = accuracy >= 0.90 ? 3 : accuracy >= 0.80 ? 2 : accuracy >= 0.60 ? 1 : 0;
    if (stars > prog.stars) prog.stars = stars;

    // Confidence: rises with high accuracy
    if (accuracy >= 0.80) p.confidenceScore = Math.min(100, p.confidenceScore + 3);
    else if (accuracy < 0.60) p.confidenceScore = Math.max(10, p.confidenceScore - 1);

    // XP
    p.xp += xp;
    while (p.xp >= p.xpToNext) {
      p.xp -= p.xpToNext;
      p.level += 1;
      p.xpToNext = Math.floor(p.xpToNext * 1.4);
    }

    // Focus block evolution: increase by 1 min every 5 sessions
    p.totalSessions += 1;
    if (p.totalSessions % 5 === 0 && p.focusBlockMinutes < 25) {
      p.focusBlockMinutes += 1;
    }

    // Motor progression
    if (prog.mastered) {
      const streak = prog.attempts.filter(a => a.accuracy >= 0.90).length;
      if (streak >= 5) p.motorProgress.traceWidth = Math.max(8, p.motorProgress.traceWidth - 2);
      if (streak >= 8 && p.motorProgress.puzzlePieces < 36) p.motorProgress.puzzlePieces += 4;
    }

    save(p);
    return { prog, p };
  }

  function checkStreak() {
    const p = load();
    const today = new Date().toDateString();
    const last = p.lastSessionDate;
    if (last === today) return p;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    p.streakDays = (last === yesterday) ? p.streakDays + 1 : 1;
    p.lastSessionDate = today;
    save(p);
    return p;
  }

  function awardBadge(badgeId) {
    const p = load();
    if (!p.badges.includes(badgeId)) {
      p.badges.push(badgeId);
      save(p);
      return true;
    }
    return false;
  }

  function reset() { localStorage.removeItem(KEY); }

  return { get, update, save, addXP, recordLessonResult, checkStreak, awardBadge, reset };
})();
