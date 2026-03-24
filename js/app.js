// ===== MAIN APP ROUTER & CONTROLLER =====
let curriculum = null;
let currentLesson = null;
let quizState = {};

// ---- BOOT ----
document.addEventListener('DOMContentLoaded', async () => {
  // Load curriculum
  const res = await fetch('data/curriculum.json');
  curriculum = await res.json();

  // Check profile
  const p = Profile.checkStreak();

  // Update top bar
  Gamification.updateTopBar();

  // Start focus timer
  FocusManager.startSession(() => showBreakScreen());

  // Route to correct screen
  if (!p.assessmentDone) {
    showNameSetup();
  } else {
    showScreen('home-screen');
    renderHome();
  }
});

// ---- SCREEN MANAGEMENT ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo(0,0);
}

// ---- NAME SETUP ----
function showNameSetup() {
  showScreen('setup-screen');
  document.getElementById('setup-screen').innerHTML = `
    <div style="text-align:center;color:white;padding:40px 20px;width:100%;max-width:600px">
      <div style="font-size:100px;margin-bottom:20px">🦊</div>
      <h1 style="font-size:38px;margin-bottom:12px">Welcome, Explorer!</h1>
      <p style="font-size:22px;opacity:0.9;margin-bottom:30px">I'm Foxy, your learning buddy!<br>What's your name?</p>
      <div class="card" style="padding:30px">
        <input id="name-input" type="text" placeholder="Enter your name..."
          style="width:100%;padding:16px;font-size:24px;border-radius:12px;border:3px solid #6C63FF;
          font-family:inherit;text-align:center;outline:none;margin-bottom:20px">
        <button class="btn btn-primary btn-lg" style="width:100%" onclick="saveName()">
          Let's Go! 🚀
        </button>
      </div>
    </div>
  `;
  setTimeout(() => document.getElementById('name-input')?.focus(), 100);
}

function saveName() {
  const name = document.getElementById('name-input')?.value?.trim() || 'Superstar';
  Profile.update({ name: name || 'Superstar' });
  startAssessment();
}

// ---- ASSESSMENT ----
function startAssessment() {
  showScreen('assessment-screen');
  Assessment.start((results) => {
    showAssessmentResult(results);
  });
}

function showAssessmentResult(results) {
  const p = Profile.get();
  const screen = document.getElementById('assessment-screen');
  const weakList = results.weakAreas.length > 0
    ? results.weakAreas.map(w => `<li>📌 We will focus extra on <strong>${w}</strong></li>`).join('')
    : '<li>✅ You are doing great across all areas!</li>';

  screen.innerHTML = `
    <div style="text-align:center;color:white;padding:30px;width:100%;max-width:600px">
      <div style="font-size:80px">🎉</div>
      <h2 style="font-size:34px;margin:10px 0">Amazing, ${p.name}!</h2>
      <p style="font-size:20px;opacity:0.9">I found the perfect starting point for you!</p>
    </div>
    <div class="card" style="max-width:600px">
      <h3 style="font-size:24px;margin-bottom:16px;color:#6C63FF">Your Learning Map 🗺️</h3>
      <div style="background:#F0F4FF;border-radius:12px;padding:16px;margin-bottom:16px">
        <p style="font-size:18px"><strong>Starting Phase:</strong> 
          Phase ${results.startPhase} — "${results.startPhase===1?'Roots':'Sprouts'}"</p>
        <p style="font-size:18px;margin-top:8px"><strong>Reading Score:</strong> 
          ${Math.round(results.readScore*100)}%</p>
        <p style="font-size:18px;margin-top:4px"><strong>Math Score:</strong> 
          ${Math.round(results.mathScore*100)}%</p>
      </div>
      <ul style="font-size:18px;list-style:none;padding:0;margin-bottom:20px;line-height:2">
        ${weakList}
      </ul>
      <p style="font-size:18px;color:#636E72;margin-bottom:20px">
        🔒 Each lesson unlocks after you master the one before it. You will earn stars, badges, and XP as you go!
      </p>
      <button class="btn btn-primary btn-lg" style="width:100%" onclick="goHome()">
        Start My Adventure! 🌟
      </button>
    </div>
  `;
}

// ---- HOME ----
function goHome() {
  showScreen('home-screen');
  renderHome();
  Gamification.updateTopBar();
}

function renderHome() {
  const p = Profile.get();
  document.getElementById('home-name').textContent = p.name;
  document.getElementById('home-phase').textContent = `Phase ${p.currentPhase}`;
  document.getElementById('home-streak').textContent = p.streakDays;
  document.getElementById('home-confidence').textContent = p.confidenceScore + '%';
  document.getElementById('mascot-home').textContent = '🦊';
  // Mascot greeting
  const greetings = [
    `Welcome back, ${p.name}! Ready to learn? 🚀`,
    `You are awesome, ${p.name}! Let's go! ⭐`,
    `I missed you, ${p.name}! Time to explore! 🌟`,
    `Every day you learn, you grow! Let's start! 💪`
  ];
  document.getElementById('mascot-home-msg').textContent = greetings[Math.floor(Math.random()*greetings.length)];
}

// ---- LEARN SCREEN ----
function showLearnScreen(domain) {
  showScreen('learn-screen');
  renderLearnScreen(domain || 'reading');
}

function renderLearnScreen(domain) {
  const p = Profile.get();
  const phase = curriculum.phases.find(ph => ph.id === p.currentPhase) || curriculum.phases[0];
  const lessons = phase.domains[domain] || [];
  const container = document.getElementById('skill-tree-container');
  const phaseHeader = document.getElementById('phase-header');

  phaseHeader.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <span class="phase-badge" style="background:${phase.color};color:white">
          Phase ${phase.id}: ${phase.name}
        </span>
        <p style="font-size:16px;color:#636E72;margin-top:6px">${phase.description}</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="domain-tab ${domain==='reading'?'active':''}" 
          style="background:${domain==='reading'?phase.color:'transparent'};border-color:${phase.color};color:${domain==='reading'?'white':phase.color}"
          onclick="renderLearnScreen('reading')">📚 Reading</button>
        <button class="domain-tab ${domain==='math'?'active':''}"
          style="background:${domain==='math'?phase.color:'transparent'};border-color:${phase.color};color:${domain==='math'?'white':phase.color}"
          onclick="renderLearnScreen('math')">🔢 Math</button>
      </div>
    </div>
  `;

  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'skill-tree';

  lessons.forEach((lesson, idx) => {
    const prog = p.skillProgress[lesson.id];
    const mastered = prog?.mastered || false;
    const inProgress = prog && !mastered;
    const stars = prog?.stars || 0;
    const masteryPct = prog ? Math.min(100, Math.round((prog.attempts.filter(a=>a.accuracy>=0.9).length / 3)*100)) : 0;

    // Locked if previous lesson not mastered
    let locked = false;
    if (idx > 0) {
      const prevLesson = lessons[idx-1];
      const prevProg = p.skillProgress[prevLesson.id];
      locked = !prevProg?.mastered;
    }

    const node = document.createElement('div');
    node.className = `skill-node ${mastered?'mastered':inProgress?'in-progress':''} ${locked?'locked':''}`;
    node.innerHTML = `
      <div class="node-icon">${domain==='reading'?['📖','🔤','🎵','👁️'][idx%4]:['🔢','➕','➖','🔷'][idx%4]}</div>
      <h4>${lesson.title}</h4>
      <div class="node-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
      <div style="font-size:14px;color:#636E72;margin:4px 0">${mastered?'✅ Mastered!':inProgress?'In Progress...':'Not started'}</div>
      <div class="mastery-bar"><div class="mastery-fill" style="width:${masteryPct}%"></div></div>
      <div style="font-size:13px;color:#636E72">${mastered?'100%':masteryPct+'% to mastery'}</div>
    `;
    if (!locked) node.onclick = () => startLesson(lesson, domain);
    grid.appendChild(node);
  });

  container.appendChild(grid);

  // Check if all phase lessons mastered -> suggest phase upgrade
  const allMastered = lessons.every(l => p.skillProgress[l.id]?.mastered);
  if (allMastered && p.currentPhase < curriculum.phases.length) {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:linear-gradient(135deg,#43D9AD,#6C63FF);color:white;border-radius:20px;padding:24px;text-align:center;width:100%;max-width:900px;margin-top:16px;';
    banner.innerHTML = `<h3 style="font-size:26px">🏆 Phase ${p.currentPhase} Complete!</h3>
      <p style="font-size:18px;margin:10px 0">You have mastered ALL skills in this phase. Ready for Phase ${p.currentPhase+1}?</p>
      <button class="btn btn-warning" onclick="unlockNextPhase()">Unlock Phase ${p.currentPhase+1}! 🚀</button>`;
    container.appendChild(banner);
  }
}

function unlockNextPhase() {
  const p = Profile.get();
  const newPhase = Math.min(p.currentPhase + 1, curriculum.phases.length);
  Profile.update({ currentPhase: newPhase });
  Gamification.spawnConfetti(60);
  Gamification.showBadgeToast('phase2_unlock');
  renderLearnScreen('reading');
}

// ---- QUIZ ----
function startLesson(lesson, domain) {
  currentLesson = lesson;
  showScreen('quiz-screen');

  quizState = {
    questions: lesson.questions,
    current: 0,
    correct: 0,
    hintUsed: false,
    answers: [],
    domain
  };

  renderQuizQuestion();
  FocusManager.resetBlock();
}

function renderQuizQuestion() {
  const { questions, current } = quizState;
  const q = questions[current];
  if (!q) { endQuiz(); return; }

  const total = questions.length;
  const pct = (current / total) * 100;

  document.getElementById('quiz-title').textContent = currentLesson.title;
  document.getElementById('quiz-prog-fill').style.width = pct + '%';
  document.getElementById('quiz-count').textContent = `${current+1} / ${total}`;

  const qArea = document.getElementById('quiz-question-area');
  qArea.innerHTML = `
    <div class="question-text">${q.q}</div>
    <div class="options-grid" id="quiz-options"></div>
    <div class="hint-box" id="quiz-hint">💡 ${q.hint}</div>
    <div class="flex-center mt-20">
      <button class="btn btn-warning btn-sm" id="hint-btn" onclick="showQuizHint()">💡 Need a Hint?</button>
    </div>
  `;

  const optDiv = document.getElementById('quiz-options');
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => answerQuiz(i, q);
    optDiv.appendChild(btn);
  });

  // Mascot
  document.getElementById('quiz-mascot').textContent = '🦊';
  const msgs = ['You can do this! 💪','Think carefully! 🧠','Take your time! ⏰','I believe in you! ⭐'];
  document.getElementById('quiz-mascot-msg').textContent = msgs[Math.floor(Math.random()*msgs.length)];
}

function showQuizHint() {
  document.getElementById('quiz-hint')?.classList.add('show');
  document.getElementById('hint-btn').style.opacity = '0.5';
  quizState.hintUsed = true;
}

function answerQuiz(chosen, q) {
  const correct = chosen === q.answer;
  const btns = document.querySelectorAll('#quiz-options .option-btn');
  btns.forEach((b,i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add('correct');
    else if (i === chosen && !correct) b.classList.add('incorrect');
  });

  if (correct) quizState.correct++;
  quizState.answers.push({ correct, hintUsed: quizState.hintUsed });
  quizState.hintUsed = false;

  // Mascot
  const mascot = document.getElementById('quiz-mascot');
  const msg = document.getElementById('quiz-mascot-msg');
  mascot.classList.add(correct ? 'bounce-happy' : 'wiggle-encourage');
  msg.textContent = correct
    ? ['Brilliant! 🌟','Amazing! 🎉','You got it! ⭐','Fantastic! 💫'][Math.floor(Math.random()*4)]
    : ['Great try! 💪','Almost there! 🔄','Keep going! 🌱','Try the next one! 😊'][Math.floor(Math.random()*4)];
  setTimeout(() => mascot.classList.remove('bounce-happy','wiggle-encourage'), 600);

  // Feedback overlay
  Gamification.showFeedback(correct);

  setTimeout(() => {
    quizState.current++;
    renderQuizQuestion();
  }, 1100);
}

function endQuiz() {
  const { correct, questions, domain } = quizState;
  const accuracy = correct / questions.length;
  const { prog, p } = Profile.recordLessonResult(currentLesson.id, accuracy, currentLesson.xp);

  Gamification.checkAutoAwards(p, currentLesson.id);
  Gamification.updateTopBar();

  const screen = document.getElementById('quiz-screen');
  const pct = Math.round(accuracy * 100);
  const stars = prog.stars;
  // Never show below 60% framing
  const displayPct = pct < 60 ? 60 : pct;
  const isMastered = prog.mastered;

  // Motor mission
  const missions = curriculum.motorMissions;
  const mission = missions[Math.floor(Math.random() * missions.length)];

  screen.innerHTML = `
    <div style="text-align:center;color:white;padding:30px;width:100%;max-width:600px">
      <div style="font-size:80px">${pct>=90?'🏆':pct>=80?'🌟':pct>=60?'⭐':'🌱'}</div>
      <h2 style="font-size:34px;margin:10px 0">${pct>=90?'PERFECT!':pct>=80?'Amazing!':pct>=60?'Great work!':'Keep Going!'}</h2>
      <p style="font-size:20px;opacity:0.9">You scored ${displayPct}% on "${currentLesson.title}"</p>
      <div style="font-size:36px;margin:10px 0">${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
    </div>
    <div class="card" style="max-width:600px">
      ${isMastered ? `<div style="background:#F0FFF8;border:2px solid #43D9AD;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
        <p style="font-size:22px;font-weight:800;color:#28A745">✅ SKILL MASTERED! Next lesson unlocked! 🔓</p>
      </div>` : `<div style="background:#FFF9C4;border:2px solid #FFD166;border-radius:12px;padding:16px;margin-bottom:16px">
        <p style="font-size:18px">📈 Mastery progress: Keep practicing to unlock the next skill!</p>
        <p style="font-size:16px;color:#636E72;margin-top:6px">Need ${3 - Math.min(3, prog.attempts.filter(a=>a.accuracy>=0.9).length)} more great scores to master this!</p>
      </div>`}
      <div style="background:#F0F4FF;border-radius:12px;padding:16px;margin-bottom:16px">
        <h4 style="font-size:20px;margin-bottom:8px">🏃 Movement Mission!</h4>
        <p style="font-size:22px">${mission.icon} ${mission.activity}</p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-primary" style="flex:1" onclick="startLesson(currentLesson, '${domain}')">
          🔄 Play Again
        </button>
        <button class="btn btn-success" style="flex:1" onclick="showLearnScreen('${domain}')">
          📚 More Lessons
        </button>
        <button class="btn btn-warning" style="flex:1" onclick="goHome()">
          🏠 Home
        </button>
      </div>
    </div>
  `;
}

// ---- MOTOR SCREEN ----
function showMotorScreen() {
  showScreen('motor-screen');
  const p = Profile.get();
  document.getElementById('motor-content').innerHTML = `
    <h2 class="page-title">Builder's Workshop 🔧</h2>
    <p style="color:white;font-size:18px;opacity:0.9;margin-bottom:20px">Build your hand skills and brain power!</p>
    <div class="motor-grid">
      <div class="motor-card" onclick="showTraceGame('line')">
        <div class="micon">✏️</div>
        <h3>Trace the Path</h3>
        <p style="font-size:16px;color:#636E72">Follow the dotted line!</p>
      </div>
      <div class="motor-card" onclick="showTraceGame('curve')">
        <div class="micon">🌊</div>
        <h3>Wavy Tracer</h3>
        <p style="font-size:16px;color:#636E72">Follow the curvy wave!</p>
      </div>
      <div class="motor-card" onclick="showTraceGame('letter_a')">
        <div class="micon">🔤</div>
        <h3>Letter Sculptor</h3>
        <p style="font-size:16px;color:#636E72">Trace the letter A!</p>
      </div>
      <div class="motor-card" onclick="showDotGame()">
        <div class="micon">🔵</div>
        <h3>Connect the Dots</h3>
        <p style="font-size:16px;color:#636E72">Click dots in order!</p>
      </div>
    </div>
    <button class="btn btn-primary mt-20" onclick="goHome()">🏠 Back to Home</button>
  `;
}

function showTraceGame(type) {
  const names = {line:'Straight Line', curve:'Wavy Line', letter_a:'Letter A'};
  document.getElementById('motor-content').innerHTML = `
    <h2 class="page-title">Trace the ${names[type]}! ✏️</h2>
    <p style="color:white;font-size:18px;opacity:0.9;margin-bottom:16px">Draw along the blue path — stay inside the lines!</p>
    <canvas id="trace-canvas" width="600" height="300" style="max-width:100%"></canvas>
    <div style="width:100%;max-width:600px;margin-top:10px">
      <div style="color:white;font-weight:800;font-size:18px" id="precision-label">Precision: 0%</div>
      <div class="precision-meter"><div class="precision-fill" id="precision-fill" style="width:0%"></div></div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
      <button class="btn btn-warning" onclick="showTraceGame('${type}')">🔄 Try Again</button>
      <button class="btn btn-success" onclick="finishTrace()">✅ Done!</button>
      <button class="btn btn-primary" onclick="showMotorScreen()">◀ Back</button>
    </div>
  `;
  setTimeout(() => MotorEngine.initTrace('trace-canvas', type), 50);
}

function finishTrace() {
  const prec = MotorEngine.getTracePrecision();
  const p = Profile.get();
  p.motorProgress.traceAccuracyHistory.push({ accuracy: prec, date: Date.now() });
  Profile.save(p);
  showMotorScreen();
}

function showDotGame() {
  const p = Profile.get();
  const count = Math.min(12, Math.max(5, Math.floor(p.motorProgress.puzzlePieces / 2)));
  document.getElementById('motor-content').innerHTML = `
    <h2 class="page-title">Connect the Dots! 🔵</h2>
    <p style="color:white;font-size:18px;opacity:0.9;margin-bottom:16px">Click dot number 1, then 2, then 3...</p>
    <canvas id="dot-canvas" width="500" height="400" style="max-width:100%;background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.15)"></canvas>
    <div style="display:flex;gap:12px;margin-top:16px">
      <button class="btn btn-warning" onclick="showDotGame()">🔄 New Puzzle</button>
      <button class="btn btn-primary" onclick="showMotorScreen()">◀ Back</button>
    </div>
  `;
  setTimeout(() => MotorEngine.buildDotCanvas('dot-canvas', count), 50);
}

// ---- BADGES SCREEN ----
function showBadgesScreen() {
  showScreen('badges-screen');
  const p = Profile.get();
  const all = Gamification.getAllBadges();
  const grid = document.getElementById('badge-grid');
  grid.innerHTML = '';
  all.forEach(b => {
    const earned = p.badges.includes(b.id);
    const item = document.createElement('div');
    item.className = `badge-item ${earned ? '' : 'locked'}`;
    item.innerHTML = `<div class="badge-icon">${b.icon}</div>
      <h4>${b.name}</h4><p>${earned ? b.desc : '???'}</p>`;
    grid.appendChild(item);
  });
  document.getElementById('badge-earned-count').textContent = `${p.badges.length} / ${all.length} Earned`;
}

// ---- BREAK SCREEN ----
function showBreakScreen() {
  showScreen('break-screen');
  const activities = [
    {text:'Do 10 jumping jacks!', icon:'⭐'},
    {text:'Wiggle your whole body for 30 seconds!', icon:'🌀'},
    {text:'Crawl like a bear across the room!', icon:'🐻'},
    {text:'Balance on one foot and count to 10!', icon:'🦩'},
    {text:'Do 5 big arm circles each way!', icon:'💪'},
    {text:'March in place and name 5 animals!', icon:'🐘'},
  ];
  const act = activities[Math.floor(Math.random()*activities.length)];
  document.getElementById('break-activity-icon').textContent = act.icon;
  document.getElementById('break-activity-text').textContent = act.text;

  let secs = 120;
  document.getElementById('break-countdown').textContent = '2:00';
  const timer = setInterval(() => {
    secs--;
    const m = Math.floor(secs/60), s = secs%60;
    document.getElementById('break-countdown').textContent = `${m}:${s.toString().padStart(2,'0')}`;
    if (secs <= 0) {
      clearInterval(timer);
      FocusManager.resetBlock();
      goHome();
    }
  }, 1000);
}

// ---- DASHBOARD ----
function showDashboard() {
  showScreen('dashboard-screen');
  const p = Profile.get();
  document.getElementById('dash-name').textContent = p.name + "'s Progress";
  document.getElementById('stat-level').textContent = p.level;
  document.getElementById('stat-sessions').textContent = p.totalSessions;
  document.getElementById('stat-minutes').textContent = p.totalMinutes;
  document.getElementById('stat-streak').textContent = p.streakDays + ' days';
  document.getElementById('stat-confidence').textContent = p.confidenceScore + '%';
  document.getElementById('stat-phase').textContent = 'Phase ' + p.currentPhase;
  document.getElementById('stat-badges').textContent = p.badges.length;
  document.getElementById('stat-focus').textContent = p.focusBlockMinutes + ' min';

  // Skills mastered
  const mastered = Object.values(p.skillProgress).filter(s => s.mastered).length;
  document.getElementById('stat-mastered').textContent = mastered;
}
