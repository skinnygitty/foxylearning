// ===== DIAGNOSTIC ASSESSMENT ENGINE =====
const Assessment = (() => {
  // Diagnostic questions covering K -> Grade 1 -> Grade 2 skills
  const questions = [
    // READING - Kindergarten
    { id:'ar1', domain:'reading', grade:0, q:'Which letter makes the sound "aah" like in APPLE? 🍎', options:['B','A','T','P'], answer:1, hint:'Think of the letter at the start of APPLE!'},
    { id:'ar2', domain:'reading', grade:0, q:'What sound does the letter S make?', options:['sss','buh','mmm','fff'], answer:0, hint:'Like the sound a snake makes... ssss!'},
    { id:'ar3', domain:'reading', grade:1, q:'What word does C-A-T spell?', options:['cut','coat','cat','cot'], answer:2, hint:'It is a fluffy animal that says meow!'},
    { id:'ar4', domain:'reading', grade:1, q:'Which sight word says THEY?', options:['the','then','they','there'], answer:2, hint:'T-H-E-Y — four letters!'},
    { id:'ar5', domain:'reading', grade:2, q:'What does "The dog ran fast" mean?', options:['The dog was sleeping','The dog moved quickly','The dog ate food','The dog was sad'], answer:1, hint:'RAN means moving — and FAST means quickly!'},
    // MATH - Kindergarten
    { id:'am1', domain:'math', grade:0, q:'How many 🌟🌟🌟🌟?', options:['3','4','5','6'], answer:1, hint:'Count each star: one, two, three, four!'},
    { id:'am2', domain:'math', grade:0, q:'What number comes after 7?', options:['6','8','9','10'], answer:1, hint:'7, then...?'},
    { id:'am3', domain:'math', grade:1, q:'3 + 4 = ?', options:['6','7','8','9'], answer:1, hint:'Start at 4 and count up 3!'},
    { id:'am4', domain:'math', grade:1, q:'10 - 3 = ?', options:['6','7','8','9'], answer:1, hint:'Start at 10 and count back 3!'},
    { id:'am5', domain:'math', grade:2, q:'Which number is in the TENS place in 37?', options:['7','3','37','0'], answer:1, hint:'37 = 3 tens and 7 ones!'},
    // MOTOR / FOCUS
    { id:'af1', domain:'focus', grade:0, q:'If I say: "Clap TWO times, then stomp ONCE" — how many total movements?', options:['1','2','3','4'], answer:2, hint:'Clap clap... stomp. Count them all!'},
    { id:'af2', domain:'focus', grade:1, q:'What comes next in this pattern? 🔴🔵🔴🔵🔴 ?', options:['🔴','🔵','🟢','🟡'], answer:1, hint:'Look at the repeating pattern — red, blue, red, blue...'},
  ];

  let current = 0;
  let results = {};
  let onComplete = null;

  function start(callback) {
    onComplete = callback;
    current = 0;
    results = { reading: { correct:0, total:0, maxGrade:-1 }, math: { correct:0, total:0, maxGrade:-1 }, focus: { correct:0, total:0 } };
    renderQuestion();
  }

  function renderQuestion() {
    const q = questions[current];
    if (!q) { finish(); return; }

    const screen = document.getElementById('assessment-screen');
    screen.innerHTML = `
      <div class="assessment-header">
        <div id="mascot-wrap"><div id="mascot">🦊</div><div id="mascot-msg">Let's find out what you know! 🎯</div></div>
        <h2 class="page-title">Quick Discovery Quiz</h2>
        <p style="color:white;opacity:0.9">Question ${current+1} of ${questions.length}</p>
      </div>
      <div class="card question-card">
        <div class="progress-dots">
          ${questions.map((_,i) => `<div class="progress-dot ${i<current?'done':i===current?'current':''}"></div>`).join('')}
        </div>
        <div class="question-text">${q.q}</div>
        <div class="options-grid" id="options"></div>
        <div class="hint-box" id="hint-box">💡 ${q.hint}</div>
        <div class="flex-center mt-20">
          <button class="btn btn-warning btn-sm" onclick="document.getElementById('hint-box').classList.add('show')">💡 Need a Hint?</button>
        </div>
      </div>
    `;

    const optDiv = document.getElementById('options');
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.onclick = () => selectAnswer(i, q);
      optDiv.appendChild(btn);
    });
  }

  function selectAnswer(chosen, q) {
    const correct = chosen === q.answer;
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach((b,i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add('correct');
      else if (i === chosen && !correct) b.classList.add('incorrect');
    });

    // Record result
    const domain = q.domain === 'focus' ? 'focus' : q.domain;
    if (results[domain]) {
      results[domain].total++;
      if (correct) {
        results[domain].correct++;
        if (q.grade > (results[domain].maxGrade || -1)) results[domain].maxGrade = q.grade;
      }
    }

    // Mascot reaction
    const mascot = document.getElementById('mascot');
    const msg = document.getElementById('mascot-msg');
    if (mascot) {
      mascot.classList.add(correct ? 'bounce-happy' : 'wiggle-encourage');
      if (msg) msg.textContent = correct
        ? ['Amazing! 🌟','You rock! ⭐','Brilliant! 🎉','Wow! 💫'][Math.floor(Math.random()*4)]
        : ['Great try! Keep going! 💪','Almost! 🔄','You\'re learning! 🌱','Try again next time! 😊'][Math.floor(Math.random()*4)];
      setTimeout(() => mascot.classList.remove('bounce-happy','wiggle-encourage'), 600);
    }

    setTimeout(() => { current++; renderQuestion(); }, 1200);
  }

  function finish() {
    // Determine starting phase
    const readScore = results.reading.total > 0 ? results.reading.correct / results.reading.total : 0;
    const mathScore = results.math.total > 0 ? results.math.correct / results.math.total : 0;
    const overallGrade = Math.round((results.reading.maxGrade + results.math.maxGrade) / 2);

    let startPhase = 1;
    if (readScore >= 0.8 && mathScore >= 0.8 && overallGrade >= 1) startPhase = 2;
    else if (readScore < 0.4 || mathScore < 0.4) startPhase = 1;

    // Identify weak areas
    const weakAreas = [];
    if (readScore < 0.7) weakAreas.push('reading');
    if (mathScore < 0.7) weakAreas.push('math');

    const assessmentResults = { readScore, mathScore, startPhase, weakAreas, rawResults: results };

    Profile.update({ assessmentDone: true, assessmentResults, currentPhase: startPhase });

    if (onComplete) onComplete(assessmentResults);
  }

  return { start };
})();
