// ============================================================================
// BCA STORE — CLIENT-SIDE EVALUATION ENGINE & TEST MANAGER
// Includes auto-save, interactive question palette, fullscreen monitoring,
// detailed analytics dashboard, and dynamic standings ranking.
// ============================================================================

const studentPhotoCache = {};

function loadAndRenderLeaderboardAvatar(userId, initText, elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;

  if (studentPhotoCache[userId] !== undefined) {
    if (studentPhotoCache[userId]) {
      container.innerHTML = `<img src="${studentPhotoCache[userId]}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;
    } else {
      container.innerHTML = initText;
    }
    return;
  }

  if (typeof firebase !== 'undefined' && firebase.database && userId) {
    firebase.database().ref(`students/${userId}/photo`).once('value').then(snapshot => {
      const photo = snapshot.val() || '';
      studentPhotoCache[userId] = photo;
      if (photo) {
        container.innerHTML = `<img src="${photo}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;
      } else {
        container.innerHTML = initText;
      }
    }).catch(() => {
      studentPhotoCache[userId] = '';
      container.innerHTML = initText;
    });
  } else {
    studentPhotoCache[userId] = '';
    container.innerHTML = initText;
  }
}

const TestEngine = {
  activeTest: null,
  currentQuestionIndex: 0,
  answers: {},
  states: {}, // Tracks states: 'not_visited', 'visited' (Not Answered), 'answered', 'marked'
  startTime: null,
  violations: 0,
  isTestActive: false,
  studentData: null,
  timerInterval: null,

  // --- NLP Evaluation Engine (Long Answers) ---
  NLP: {
    stopWords: new Set(['the', 'is', 'at', 'which', 'and', 'on', 'a', 'an', 'in', 'of', 'to', 'for', 'with', 'it', 'as', 'by', 'are', 'that', 'this', 'can', 'be']),
    
    tokenize(text) {
      if(!text) return [];
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // remove punctuation
        .split(/\s+/)
        .filter(w => w.length > 2 && !this.stopWords.has(w));
    },

    evaluate(studentAnswer, idealAnswer, keywords, maxMarks) {
      const studentTokens = this.tokenize(studentAnswer);
      const idealTokens = this.tokenize(idealAnswer);
      
      const studentSet = new Set(studentTokens);
      const idealSet = new Set(idealTokens);

      let kwFound = 0;
      let coveredKeywords = [];
      let missingKeywords = [];
      
      keywords.forEach(kw => {
        const parts = kw.toLowerCase().split(' ');
        const found = parts.every(p => studentAnswer.toLowerCase().includes(p));
        if (found) {
          kwFound++;
          coveredKeywords.push(kw);
        } else {
          missingKeywords.push(kw);
        }
      });

      const kwScore = keywords.length > 0 ? (kwFound / keywords.length) * 0.5 : 0;

      let overlap = 0;
      idealSet.forEach(t => {
        if (studentSet.has(t)) overlap++;
      });
      
      const overlapScore = idealSet.size > 0 ? (overlap / idealSet.size) * 0.4 : 0;

      const idealLen = idealAnswer.length;
      const studLen = studentAnswer.length;
      let lengthScore = 0.1;
      if (studLen < idealLen * 0.3) lengthScore = 0.02;
      else if (studLen < idealLen * 0.6) lengthScore = 0.06;
      else if (studLen > idealLen * 1.5) lengthScore = 0.08;

      let accuracy = kwScore + overlapScore + lengthScore;
      
      if (keywords.length === 0) {
          accuracy = (overlapScore * 2.2) + lengthScore;
      }

      accuracy = Math.min(1, Math.max(0, accuracy));
      
      let suggestion = "Excellent answer!";
      if (accuracy < 0.5) suggestion = "Try to explain the core concepts in more detail.";
      else if (accuracy < 0.8 && missingKeywords.length > 0) suggestion = "You missed some key technical terms. Focus on those next time.";

      return {
        accuracyPercent: Math.round(accuracy * 100),
        marksAwarded: Math.round(accuracy * maxMarks * 10) / 10,
        coveredPoints: coveredKeywords,
        missingPoints: missingKeywords,
        suggestion: suggestion
      };
    }
  },

  // --- Test Flow Management ---
  initTest(testData) {
    this.activeTest = testData;
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.states = {};
    this.violations = 0;
    this.isTestActive = true;
    this.startTime = Date.now();

    // Recover progress if it exists in localStorage
    const recoveryKey = `test_progress_${testData.testId}`;
    const savedProgress = localStorage.getItem(recoveryKey);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        this.answers = parsed.answers || {};
        this.states = parsed.states || {};
        this.currentQuestionIndex = parsed.currentQuestionIndex || 0;
        this.startTime = parsed.startTime || Date.now();
        this.violations = parsed.violations || 0;
        console.log("⚡ Restored test progress from auto-save.");
      } catch (err) {
        console.error("Failed to restore saved progress:", err);
      }
    }

    // Initialize state mapping
    if (this.activeTest.type === 'quiz') {
      this.activeTest.questions.forEach((_, idx) => {
        if (!this.states[idx]) {
          this.states[idx] = 'not_visited';
        }
      });
    }

    this.renderQuestion();
    this.startAntiCheat();
    this.startTimer();
  },

  // Render question card
  renderQuestion() {
    if (!this.activeTest) return;

    const testArea = document.getElementById('testContentArea');
    
    // Set current question state to visited if not answered/marked
    if (this.activeTest.type === 'quiz') {
      const currentState = this.states[this.currentQuestionIndex];
      if (currentState !== 'answered' && currentState !== 'marked') {
        this.states[this.currentQuestionIndex] = 'visited';
      }
      this.autoSaveProgress();
      this.renderPalette();
    }

    if (this.activeTest.type === 'long_answer') {
        const qData = this.activeTest.questionData;
        testArea.innerHTML = `
          <div class="animate-in">
            <div class="q-card-header">
                <span class="q-number-title">Subjective Question</span>
                <span class="q-marks-tag">${qData.marks} Marks</span>
            </div>
            <div class="q-text-body">${qData.question}</div>
            <textarea id="longAnsInput" class="test-la-input" oninput="TestEngine.handleLAInput(this.value)" placeholder="Type your answer here... Minimum 50 words recommended for professional AI evaluation."></textarea>
          </div>
        `;
        
        if (this.answers['q1']) {
            document.getElementById('longAnsInput').value = this.answers['q1'];
        }

        document.getElementById('btnNext').style.display = 'none';
        document.getElementById('btnPrev').style.display = 'none';
        document.getElementById('btnMarkReview').style.display = 'none';
        document.getElementById('btnClearResp').style.display = 'none';
        document.getElementById('btnSubmit').style.display = 'block';

        // Hide palette header in sidebar for subjective
        document.getElementById('paletteHeader').style.display = 'none';
        document.getElementById('paletteButtonsContainer').style.display = 'none';

    } else if (this.activeTest.type === 'quiz') {
        const q = this.activeTest.questions[this.currentQuestionIndex];
        const isAnswered = this.answers[this.currentQuestionIndex] !== undefined;

        let optsHtml = '';
        q.options.forEach((opt, idx) => {
            const isSelected = this.answers[this.currentQuestionIndex] === idx;
            let statusClass = isSelected ? 'selected' : '';

            optsHtml += `
              <div class="exam-option-item ${statusClass}" onclick="TestEngine.selectOption(${idx})">
                <span class="option-badge">${String.fromCharCode(65+idx)}</span>
                <span class="option-text">${opt}</span>
              </div>
            `;
        });

        testArea.innerHTML = `
          <div class="animate-in">
            <div class="q-card-header">
                <span class="q-number-title">Question ${this.currentQuestionIndex + 1} of ${this.activeTest.questions.length}</span>
                <span class="q-marks-tag">+1.00 Mark</span>
            </div>
            <div class="q-text-body">${q.question}</div>
            <div class="exam-options-list">
              ${optsHtml}
            </div>
          </div>
        `;

        // Update footer buttons
        document.getElementById('btnPrev').disabled = this.currentQuestionIndex === 0;
        document.getElementById('btnNext').style.display = this.currentQuestionIndex < this.activeTest.questions.length - 1 ? 'block' : 'none';
        document.getElementById('btnSubmit').style.display = this.currentQuestionIndex === this.activeTest.questions.length - 1 ? 'block' : 'none';
    }
  },

  handleLAInput(val) {
    this.answers['q1'] = val;
    this.autoSaveProgress();
  },

  selectOption(idx) {
    if (!this.isTestActive) return;
    
    this.answers[this.currentQuestionIndex] = idx;
    this.states[this.currentQuestionIndex] = 'answered';
    
    this.renderQuestion();
  },

  clearResponse() {
    if (!this.isTestActive) return;
    if (this.answers[this.currentQuestionIndex] !== undefined) {
      delete this.answers[this.currentQuestionIndex];
      this.states[this.currentQuestionIndex] = 'visited';
      this.renderQuestion();
    }
  },

  markForReview() {
    if (!this.isTestActive) return;
    this.states[this.currentQuestionIndex] = 'marked';
    this.nextQuestion();
  },

  nextQuestion() {
    if (this.currentQuestionIndex < this.activeTest.questions.length - 1) {
        this.currentQuestionIndex++;
        this.renderQuestion();
    }
  },

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.renderQuestion();
    }
  },

  jumpToQuestion(idx) {
    if (!this.isTestActive) return;
    this.currentQuestionIndex = idx;
    this.renderQuestion();
    
    // Close sidebar drawer on mobile after jumping
    const sidebar = document.getElementById('examSidebar');
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  },

  // Save temporary status to restore on reload
  autoSaveProgress() {
    const recoveryKey = `test_progress_${this.activeTest.testId}`;
    const payload = {
      answers: this.answers,
      states: this.states,
      currentQuestionIndex: this.currentQuestionIndex,
      startTime: this.startTime,
      violations: this.violations
    };
    localStorage.setItem(recoveryKey, JSON.stringify(payload));
  },

  clearSavedProgress() {
    const recoveryKey = `test_progress_${this.activeTest.testId}`;
    localStorage.removeItem(recoveryKey);
  },

  // Render palette grid
  renderPalette() {
    const container = document.getElementById('paletteButtonsContainer');
    if (!container) return;

    let html = '';
    let answeredCount = 0;
    let notAnsweredCount = 0;
    let markedCount = 0;
    let notVisitedCount = 0;

    this.activeTest.questions.forEach((_, idx) => {
      const state = this.states[idx] || 'not_visited';
      
      if (state === 'answered') answeredCount++;
      else if (state === 'visited') notAnsweredCount++;
      else if (state === 'marked') markedCount++;
      else notVisitedCount++;

      const activeClass = idx === this.currentQuestionIndex ? 'active' : '';

      html += `<button class="palette-btn ${state} ${activeClass}" onclick="TestEngine.jumpToQuestion(${idx})">${idx + 1}</button>`;
    });

    container.innerHTML = html;

    // Update legend statistics
    document.getElementById('legendAnsCount').textContent = answeredCount;
    document.getElementById('legendNotAnsCount').textContent = notAnsweredCount;
    document.getElementById('legendMarkCount').textContent = markedCount;
    document.getElementById('legendNotVisitCount').textContent = notVisitedCount;
  },

  // Submit test
  submitTest() {
    if(!confirm("Are you sure you want to finish and submit your exam?")) return;
    
    this.isTestActive = false;
    this.stopAntiCheat();
    this.clearSavedProgress();
    
    // Clear timer
    clearInterval(this.timerInterval);

    // Calculate time taken
    const timeTakenSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const min = Math.floor(timeTakenSeconds / 60);
    const sec = timeTakenSeconds % 60;
    const timeTakenStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;

    // Hide workspace header & workspace layout
    document.getElementById('testHeader').style.display = 'none';
    document.getElementById('testArena').style.display = 'none';
    
    // Show results
    document.getElementById('testResultsView').style.display = 'block';

    if (this.activeTest.type === 'quiz') {
        let correctCount = 0;
        let incorrectCount = 0;
        let unattemptedCount = 0;
        const totalQuestions = this.activeTest.questions.length;

        this.activeTest.questions.forEach((q, idx) => {
            const answer = this.answers[idx];
            if (answer === undefined) {
                unattemptedCount++;
            } else if (answer === q.correctAnswer) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        });

        const percentage = Math.round((correctCount / totalQuestions) * 100);
        const accuracy = (correctCount + incorrectCount) > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0;

        let performance = "Needs Revision 📚";
        let perfBadgeClass = "needs-rev";
        if (percentage >= 90) { performance = "Outstanding / Elite 🌟"; perfBadgeClass = "outstanding"; }
        else if (percentage >= 75) { performance = "Excellent 👍"; perfBadgeClass = "excellent"; }
        else if (percentage >= 50) { performance = "Average / Good 🙂"; perfBadgeClass = "average"; }

        // Sync to firebase
        this.saveResultToFirebase({
            score: correctCount,
            maxScore: totalQuestions,
            percentage: percentage,
            accuracy: accuracy,
            correct: correctCount,
            incorrect: incorrectCount,
            unattempted: unattemptedCount,
            timeTakenStr: timeTakenStr,
            timeTakenSeconds: timeTakenSeconds,
            performance: performance,
            type: 'mcq'
        });

        // Set UI values
        document.getElementById('resPercentage').textContent = `${percentage}%`;
        document.getElementById('resSugg').textContent = performance === "Outstanding / Elite 🌟" ? "Stellar work! Perfect understanding." : (percentage >= 75 ? "Great job! A very solid result." : "Review concepts to boost your score.");
        
        const badge = document.getElementById('performanceLevelBadge');
        badge.textContent = performance.split(' ')[0];
        badge.className = `performance-badge ${perfBadgeClass}`;

        // SVG progress ring offset (circumference = 377)
        const offset = 377 - (377 * percentage) / 100;
        document.getElementById('scoreRadialCircle').style.strokeDashoffset = offset;

        document.getElementById('statScore').textContent = `${correctCount} / ${totalQuestions}`;
        document.getElementById('statAccuracy').textContent = `${accuracy}%`;
        document.getElementById('statCorrect').textContent = correctCount;
        document.getElementById('statIncorrect').textContent = incorrectCount;
        document.getElementById('statUnattempted').textContent = unattemptedCount;
        document.getElementById('statTimeTaken').textContent = timeTakenStr;
        document.getElementById('statViolations').textContent = `${this.violations} / 3`;

        // Render solution details review
        this.renderSolutionReview();
        this.loadLeaderboard(); // Start rankings fetch

    } else {
        // Subjective evaluation
        const qData = this.activeTest.questionData;
        const studAns = this.answers['q1'] || "";

        let result = { accuracyPercent: 0, marksAwarded: 0, coveredPoints: [], missingPoints: [], suggestion: "Answer empty or too short." };
        if (studAns.trim().length >= 10) {
            result = this.NLP.evaluate(studAns, qData.idealAnswer, qData.keywords, qData.marks);
        }

        const percentage = Math.round((result.marksAwarded / qData.marks) * 100);

        let performance = "Needs Revision 📚";
        let perfBadgeClass = "needs-rev";
        if (percentage >= 90) { performance = "Outstanding / Elite 🌟"; perfBadgeClass = "outstanding"; }
        else if (percentage >= 75) { performance = "Excellent 👍"; perfBadgeClass = "excellent"; }
        else if (percentage >= 50) { performance = "Average / Good 🙂"; perfBadgeClass = "average"; }

        // Sync to firebase
        this.saveResultToFirebase({
            score: result.marksAwarded,
            maxScore: qData.marks,
            percentage: percentage,
            accuracy: result.accuracyPercent,
            correct: result.marksAwarded >= (qData.marks * 0.5) ? 1 : 0,
            incorrect: result.marksAwarded < (qData.marks * 0.5) ? 1 : 0,
            unattempted: studAns.trim() === "" ? 1 : 0,
            timeTakenStr: timeTakenStr,
            timeTakenSeconds: timeTakenSeconds,
            performance: performance,
            type: 'long_answer'
        });

        // Set UI values
        document.getElementById('resPercentage').textContent = `${percentage}%`;
        document.getElementById('resSugg').textContent = result.suggestion;

        const badge = document.getElementById('performanceLevelBadge');
        badge.textContent = performance.split(' ')[0];
        badge.className = `performance-badge ${perfBadgeClass}`;

        const offset = 377 - (377 * percentage) / 100;
        document.getElementById('scoreRadialCircle').style.strokeDashoffset = offset;

        document.getElementById('statScore').textContent = `${result.marksAwarded} / ${qData.marks}`;
        document.getElementById('statAccuracy').textContent = `${result.accuracyPercent}%`;
        document.getElementById('statCorrect').textContent = result.marksAwarded >= (qData.marks * 0.5) ? '1' : '0';
        document.getElementById('statIncorrect').textContent = result.marksAwarded < (qData.marks * 0.5) ? '1' : '0';
        document.getElementById('statUnattempted').textContent = studAns.trim() === "" ? '1' : '0';
        document.getElementById('statTimeTaken').textContent = timeTakenStr;
        document.getElementById('statViolations').textContent = `${this.violations} / 3`;

        // Render subjective breakdown solutions reviews
        let html = `
          <div class="solution-q-card animate-in">
              <div class="solution-q-head">
                  <div class="solution-q-text">Subjective Evaluation breakdown</div>
                  <span class="correctness-badge ${result.marksAwarded >= (qData.marks * 0.5) ? 'correct' : 'incorrect'}">
                      Marks: ${result.marksAwarded} / ${qData.marks}
                  </span>
              </div>
              <div style="font-size:0.95rem; margin-bottom:16px; color:#fff; font-style:italic;">"${studAns || 'No Answer Provided'}"</div>
              
              <div class="res-la-eval-grid">
                  <div class="res-la-box good">
                      <h5>✅ Covered Concepts</h5>
                      <ul>
        `;
        if (result.coveredPoints.length > 0) {
            result.coveredPoints.forEach(p => html += `<li>${p}</li>`);
        } else {
            html += `<li style="color:var(--exam-muted);">No key points detected.</li>`;
        }
        html += `
                      </ul>
                  </div>
                  <div class="res-la-box bad">
                      <h5>❌ Missing Key Terms</h5>
                      <ul>
        `;
        if (result.missingPoints.length > 0) {
            result.missingPoints.forEach(p => html += `<li>${p}</li>`);
        } else {
            html += `<li style="color:var(--exam-muted);">All key terms included!</li>`;
        }
        html += `
                      </ul>
                  </div>
              </div>
              
              <div class="solution-explanation-block" style="margin-top:20px;">
                  <h5>Ideal Academic Reference Answer</h5>
                  <p>${qData.idealAnswer}</p>
              </div>
          </div>
        `;
        
        document.getElementById('solutionsListArea').innerHTML = html;
        this.loadLeaderboard();
    }
  },

  // Solution review UI rendering
  renderSolutionReview() {
    const list = document.getElementById('solutionsListArea');
    if (!list || !this.activeTest) return;

    let html = '';
    this.activeTest.questions.forEach((q, idx) => {
        const studentAns = this.answers[idx];
        const isCorrect = studentAns === q.correctAnswer;
        
        let statusText = 'Correct';
        let badgeClass = 'correct';
        if (studentAns === undefined) {
            statusText = 'Unattempted';
            badgeClass = 'unattempted';
        } else if (!isCorrect) {
            statusText = 'Incorrect';
            badgeClass = 'incorrect';
        }

        let optsHtml = '';
        q.options.forEach((opt, oIdx) => {
            let itemClass = '';
            if (oIdx === q.correctAnswer) {
                itemClass = 'correct';
            } else if (studentAns === oIdx) {
                itemClass = 'selected-wrong';
            }

            optsHtml += `
              <div class="review-opt-item ${itemClass}">
                <span class="review-badge">${String.fromCharCode(65+oIdx)}</span>
                <span>${opt}</span>
              </div>
            `;
        });

        // Concept analysis default explanation
        const explanation = q.explanation || `Concept: ${this.activeTest.subjectName || this.activeTest.subject}. The correct option is ${String.fromCharCode(65 + q.correctAnswer)}. Review unit chapters to verify details on why this choice is correct.`;

        html += `
          <div class="solution-q-card animate-in" style="animation-delay: ${idx * 0.05}s">
              <div class="solution-q-head">
                  <div class="solution-q-text">Q${idx + 1}: ${q.question}</div>
                  <span class="correctness-badge ${badgeClass}">${statusText}</span>
              </div>
              <div class="review-opts-grid">
                  ${optsHtml}
              </div>
              <div class="solution-explanation-block">
                  <h5>💡 Concept Analysis</h5>
                  <p>${explanation}</p>
              </div>
          </div>
        `;
    });

    list.innerHTML = html;
  },

  // Save to Firebase database
  saveResultToFirebase(resultSummary) {
      if (!window.db || !this.studentData || !this.activeTest) return;

      const studentId = localStorage.getItem('student_id') || this.studentData.roll;
      const resultRef = db.ref(`test_results/${this.activeTest.semester}/${this.activeTest.subject}/${this.activeTest.testId}/${studentId}`);
      
      const payload = {
          student: this.studentData,
          testTitle: this.activeTest.title,
          summary: resultSummary,
          timestamp: Date.now(),
          violations: this.violations
      };

      resultRef.set(payload)
          .then(() => console.log("Result synced to database successfully."))
          .catch(err => {
              console.error("Firebase sync error, retrying...", err);
              setTimeout(() => resultRef.set(payload), 4000);
          });
  },

  // Fetch rankings and compute current rank
  loadLeaderboard() {
      const listArea = document.getElementById('leaderboardListArea');
      if (!listArea || !this.activeTest) return;

      const path = `test_results/${this.activeTest.semester}/${this.activeTest.subject}/${this.activeTest.testId}`;
      const currentStudentId = localStorage.getItem('student_id') || this.studentData?.roll;

      db.ref(path).on('value', snap => {
          if (!snap.exists()) {
              listArea.innerHTML = '<div style="text-align:center; padding:20px; color:var(--exam-muted);">No records found. Be the first to secure a place!</div>';
              return;
          }

          const records = [];
          snap.forEach(stud => {
              records.push({
                  key: stud.key,
                  ...stud.val()
              });
          });

          // Sort descending by score, ascending by duration
          records.sort((a, b) => {
              if (b.summary.score !== a.summary.score) {
                  return b.summary.score - a.summary.score;
              }
              return (a.summary.timeTakenSeconds || 99999) - (b.summary.timeTakenSeconds || 99999);
          });

          // Compute rankings HTML
          let html = '';
          let currentRank = 0;
          const totalCandidates = records.length;

          records.forEach((record, index) => {
              const isMe = record.key === currentStudentId;
              const rank = index + 1;
              
              if (isMe) {
                  currentRank = rank;
              }

              const init = (record.student.name || '?')[0].toUpperCase();

              html += `
                <div class="leaderboard-row ${isMe ? 'me' : ''}">
                    <div class="leaderboard-rank-col">
                        <div class="rank-number-box">${rank}</div>
                        <div class="leaderboard-avatar-box" id="leaderboard-avatar-${record.key}-${rank}" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; overflow: hidden; margin-right: 12px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.15); color: #fff;">
                            ${init}
                        </div>
                        <div class="leaderboard-student-meta">
                            <span>${record.student.name} ${isMe ? '(You)' : ''}</span>
                            <span>Roll: ${record.student.roll} | Class: ${record.student.class}</span>
                        </div>
                    </div>
                    <div class="leaderboard-score-col">
                        <span>${record.summary.score} <span style="font-size:0.7rem; color:var(--exam-muted);">pts</span></span>
                        <span>⏱️ ${record.summary.timeTakenStr || record.summary.timeTaken || '--:--'} (${record.summary.accuracy}%)</span>
                    </div>
                </div>
              `;
          });

          listArea.innerHTML = html;

          // Asynchronously load student profile photos
          records.forEach((record, index) => {
              const rank = index + 1;
              const init = (record.student.name || '?')[0].toUpperCase();
              loadAndRenderLeaderboardAvatar(record.key, init, `leaderboard-avatar-${record.key}-${rank}`);
          });

          // Update rank statistics on dashboard
          if (currentRank > 0) {
              document.getElementById('statRank').textContent = `#${currentRank} / ${totalCandidates}`;
          } else {
              document.getElementById('statRank').textContent = `-- / ${totalCandidates}`;
          }
      });
  },

  // --- Anti-Cheat Engine ---
  startAntiCheat() {
      this.visibilityHandler = () => {
          if (document.hidden && this.isTestActive) {
              this.violations++;
              this.showCheatWarning();
          }
      };
      
      this.copyHandler = (e) => {
          if(this.isTestActive) {
              e.preventDefault();
              this.violations++;
              this.showCheatWarning("Clipboard copying is disabled during examinations.");
          }
      };

      document.addEventListener('visibilitychange', this.visibilityHandler);
      document.addEventListener('copy', this.copyHandler);
      document.addEventListener('paste', this.copyHandler);
  },

  stopAntiCheat() {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      document.removeEventListener('copy', this.copyHandler);
      document.removeEventListener('paste', this.copyHandler);
  },

  showCheatWarning(msg = "Tab switching detected!") {
      const warn = document.getElementById('cheatWarning');
      document.getElementById('cheatMsg').textContent = `${msg} (Warning ${this.violations}/3)`;
      warn.classList.add('show');
      
      if(this.violations >= 3) {
          setTimeout(() => {
              warn.classList.remove('show');
              alert("Examination Auto-Submitted due to multiple anti-cheat violations.");
              this.submitTest();
          }, 1200);
      } else {
          setTimeout(() => warn.classList.remove('show'), 3000);
      }
      this.autoSaveProgress();
  },

  // --- Timer Countdown ---
  startTimer() {
      const totalSeconds = this.activeTest.timeLimit ? this.activeTest.timeLimit * 60 : (this.activeTest.type === 'quiz' ? this.activeTest.questions.length * 60 : 600);
      
      // Calculate remaining time relative to startTime
      const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      let timeLimit = Math.max(0, totalSeconds - elapsedSeconds);
      
      const timerEl = document.getElementById('testTimer');
      const timerBox = document.getElementById('timerBox');
      
      const updateTimerDisplay = (secondsLeft) => {
          const h = Math.floor(secondsLeft / 3600);
          const m = Math.floor((secondsLeft % 3600) / 60);
          const s = secondsLeft % 60;
          
          timerEl.textContent = `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

          const percent = (secondsLeft / totalSeconds) * 100;
          if (percent < 15) {
              timerBox.className = 'eh-timer-box urgent';
          } else if (percent < 40) {
              timerBox.className = 'eh-timer-box warning';
          } else {
              timerBox.className = 'eh-timer-box';
          }
      };

      updateTimerDisplay(timeLimit);

      this.timerInterval = setInterval(() => {
          if(!this.isTestActive) {
              clearInterval(this.timerInterval);
              return;
          }
          
          timeLimit--;
          if (timeLimit <= 0) {
              clearInterval(this.timerInterval);
              updateTimerDisplay(0);
              alert("Time limit reached! Auto-submitting your examination.");
              this.submitTest();
              return;
          }

          updateTimerDisplay(timeLimit);
      }, 1000);
  }
};
