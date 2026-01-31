document.addEventListener('DOMContentLoaded', () => {
    // Containers
    const selectionContainer = document.getElementById('mock-selection-container');
    const testArea = document.getElementById('mock-test-area');
    const resultsArea = document.getElementById('mock-results-area');
    const performanceArea = document.getElementById('mock-performance-area');
    const testListArea = document.getElementById('test-list-area');
    const subjectWiseTestListArea = document.getElementById('subject-wise-test-list-area');

    // Elements
    const fullLengthList = document.getElementById('full-length-list');
    const subjectWiseList = document.getElementById('subject-wise-list');
    const quizContainer = document.getElementById('mock-quiz-container');
    const timerDisplay = document.getElementById('time');
    const prevBtn = document.getElementById('prev-question-btn');
    const nextBtn = document.getElementById('next-question-btn');
    const markReviewBtn = document.getElementById('mark-review-btn');
    const submitBtn = document.getElementById('submit-mock-btn');
    const resultsSummary = document.getElementById('results-summary');
    const backToSelectionBtn = document.getElementById('back-to-selection-btn');
    const showPerformanceBtn = document.getElementById('show-performance-btn');
    const performanceHistoryContainer = document.getElementById('performance-history');
    const clearPerformanceBtn = document.getElementById('clear-performance-btn');
    const attemptAnotherBtn = document.getElementById('attempt-another-btn');
    const paletteGrid = document.getElementById('palette-grid');
    const paletteToggleBtn = document.getElementById('palette-toggle-btn');
    const closePaletteBtn = document.getElementById('close-palette-btn');
    const palettePanel = document.getElementById('question-palette-panel');
    const viewFullLengthBtn = document.getElementById('view-full-length-btn');
    const backFromListBtn = document.getElementById('back-from-list-btn');
    const viewSubjectWiseBtn = document.getElementById('view-subject-wise-btn');
    const backFromSubjectListBtn = document.getElementById('back-from-subject-list-btn');

    let allMockTests = {};
    let currentTest = [];
    let currentTestName = '';
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let timerInterval;
    let markedForReview = [];
    let currentTestCorrectMarks = 1;
    let currentTestNegativeMarks = 0;
    let startTime;
    let currentTestRank = null;

    // --- Performance Tracking Logic ---
    const MOCK_PERFORMANCE_KEY = 'eactMockTestPerformance';

    function readMockPerformance() {
        const data = localStorage.getItem(MOCK_PERFORMANCE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveMockPerformance(history) {
        localStorage.setItem(MOCK_PERFORMANCE_KEY, JSON.stringify(history));
    }

    function saveTestResult(result) {
        const history = readMockPerformance();
        const existingAttempt = history.find(item => item.name === result.name);
        
        if (!existingAttempt) {
            history.push(result);
            saveMockPerformance(history);
            return true; // First attempt
        }
        return false; // Reattempt
    }

    // --- Enhance UI (Inject Header and Icons) ---
    if (selectionContainer && !document.querySelector('.mock-welcome-header')) {
        // Create Header
        const header = document.createElement('div');
        header.className = 'mock-welcome-header';
        header.innerHTML = `
            <h1>Mock Test Portal</h1>
            <p>Assess your preparation with our comprehensive Full Length and Subject Wise mock tests.</p>
        `;
        selectionContainer.insertBefore(header, selectionContainer.firstChild);

        // Add Icons and Descriptions to Cards
        const sections = document.querySelectorAll('.mock-type-section');
        const icons = ['📝', '📚', '📊']; // Icons for Full, Subject, Performance
        const descriptions = [
            'Simulate the real exam experience with full-length tests covering all topics.',
            'Focus on specific subjects to strengthen your weak areas.',
            'Track your progress and analyze your performance over time.'
        ];

        sections.forEach((section, index) => {
            if(index < 3) {
                const iconDiv = document.createElement('div');
                iconDiv.className = 'mock-section-icon';
                iconDiv.textContent = icons[index];
                section.insertBefore(iconDiv, section.firstChild);

                const descP = document.createElement('p');
                descP.textContent = descriptions[index];
                // Insert after H3
                const h3 = section.querySelector('h3');
                if(h3) {
                    h3.insertAdjacentElement('afterend', descP);
                }
            }
        });
    }

    // --- 1. Fetch Mock Test Data ---
    fetch('data/mocks.xml')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(data, "application/xml");
            const testNodes = xml.querySelectorAll('test');
            const history = readMockPerformance();
            
            testNodes.forEach(testNode => {
                const testName = testNode.getAttribute('name');
                const testType = testNode.getAttribute('type');
                const isLive = testNode.getAttribute('isLive');

                if (isLive !== 'Yes') return;

                const correctMarksNode = testNode.querySelector('correctMarks');
                const negativeMarksNode = testNode.querySelector('negativeMarks');
                const correctMarks = correctMarksNode ? parseFloat(correctMarksNode.textContent) : 1;
                const negativeMarks = negativeMarksNode ? parseFloat(negativeMarksNode.textContent) : 0;
                const duration = testNode.getAttribute('duration') ? parseInt(testNode.getAttribute('duration')) : 120;

                const questions = [];
                testNode.querySelectorAll('question').forEach(qNode => {
                    questions.push({
                        subject: qNode.querySelector('subject') ? qNode.querySelector('subject').textContent : 'General',
                        text: qNode.querySelector('text').textContent,
                        options: Array.from(qNode.querySelectorAll('option')).map(opt => opt.textContent),
                        answer: qNode.querySelector('answer').textContent
                    });
                });
                allMockTests[testName] = { questions, correctMarks, negativeMarks, duration };

                // Check for previous attempts
                const attempt = history.find(h => h.name === testName);
                let scoreHtml = '';
                let btnText = 'Start';

                if (attempt) {
                    let scoreClass = 'score-average';
                    const p = parseFloat(attempt.percentage);
                    if (p >= 80) scoreClass = 'score-excellent';
                    else if (p >= 60) scoreClass = 'score-good';
                    else if (p < 40) scoreClass = 'score-poor';
                    
                    scoreHtml = `<div class="test-score-badge ${scoreClass}">Score: ${attempt.score}/${attempt.total} (${attempt.percentage}%)</div>`;
                    btnText = 'Retake';
                }

                // Create Test Card
                const card = document.createElement('div');
                card.className = 'test-card-item';
                card.innerHTML = `
                    <div class="test-info">
                        <h4>${testName}</h4>
                        <span class="q-count">${questions.length} Questions</span>
                        ${scoreHtml}
                    </div>
                    <button class="start-test-btn">${btnText}</button>
                `;
                
                card.querySelector('.start-test-btn').addEventListener('click', () => showStartConfirmation(testName));

                if (testType === 'full' && fullLengthList) {
                    fullLengthList.appendChild(card);
                } else if (testType === 'subject' && subjectWiseList) {
                    subjectWiseList.appendChild(card);
                }
            });
        });

    function showStartConfirmation(testName) {
        const testData = allMockTests[testName];
        if (!testData) return;

        let modal = document.getElementById('start-confirmation-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'start-confirmation-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const questionCount = testData.questions.length;
        const duration = testData.duration;

        modal.innerHTML = `
            <div class="confirmation-card">
                <h3>Start Test?</h3>
                <p style="margin-bottom: 15px;">You are about to start:<br><strong>${testName}</strong></p>
                
                <div class="confirmation-stats">
                    <div class="conf-stat-item">
                        <span class="conf-value" style="color: #3b82f6;">${questionCount}</span>
                        <span class="conf-label">Questions</span>
                    </div>
                    <div class="conf-stat-item">
                        <span class="conf-value" style="color: #f59e0b;">${duration}</span>
                        <span class="conf-label">Minutes</span>
                    </div>
                </div>

                <p style="font-size: 0.9rem; color: #6c757d; margin-bottom: 25px;">
                    <i class="fas fa-info-circle"></i> Once started, the timer will begin. Do not refresh the page.
                </p>

                <div class="modal-actions">
                    <button id="cancel-start-btn" class="modal-btn cancel">Cancel</button>
                    <button id="confirm-start-btn" class="modal-btn confirm">Start Test</button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';

        document.getElementById('cancel-start-btn').onclick = () => {
            modal.style.display = 'none';
        };

        document.getElementById('confirm-start-btn').onclick = () => {
            modal.style.display = 'none';
            initializeTest(testName);
        };
    }

    function initializeTest(testName) {
        const testData = allMockTests[testName];
        currentTest = testData.questions;
        currentTestCorrectMarks = testData.correctMarks;
        currentTestNegativeMarks = testData.negativeMarks;
        currentTestName = testName;
        userAnswers = new Array(currentTest.length).fill(null);
        markedForReview = new Array(currentTest.length).fill(false);
        currentQuestionIndex = 0;
        startTime = new Date();
        currentTestRank = null;

        selectionContainer.style.display = 'none';
        resultsArea.style.display = 'none';
        performanceArea.style.display = 'none';
        if (testListArea) testListArea.style.display = 'none';
        if (subjectWiseTestListArea) subjectWiseTestListArea.style.display = 'none';
        testArea.style.display = 'block';

        displayQuestion();
        renderPalette();
        startTimer(testData.duration * 60);
    }

    // --- 3. Display and Navigate Questions ---
    function displayQuestion() {
        const question = currentTest[currentQuestionIndex];
        quizContainer.innerHTML = `
            <div class="question">
                <p class="question-text">${currentQuestionIndex + 1}. ${question.text}</p>
                <div class="options">
                    ${question.options.map((opt, index) => `
                        <label class="mock-option">
                            <input type="radio" name="q${currentQuestionIndex}" value="${opt}" ${userAnswers[currentQuestionIndex] === opt ? 'checked' : ''}>
                            ${opt}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        updateNavButtons();
        
        if (markReviewBtn) {
            markReviewBtn.textContent = markedForReview[currentQuestionIndex] ? 'Unmark Review' : 'Mark for Review';
            markReviewBtn.classList.toggle('active', markedForReview[currentQuestionIndex]);
        }

        updatePalette(); // Update palette status

        // Add event listener for the newly created radio buttons
        document.querySelectorAll(`input[name="q${currentQuestionIndex}"]`).forEach(radio => {
            radio.addEventListener('change', (e) => {
                userAnswers[currentQuestionIndex] = e.target.value;
                updatePalette(); // Update palette when answer changes
            });
        });
    }

    function updateNavButtons() {
        prevBtn.disabled = currentQuestionIndex === 0;
        nextBtn.disabled = currentQuestionIndex === currentTest.length - 1;
    }

    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < currentTest.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    });
    
    if (markReviewBtn) {
        markReviewBtn.addEventListener('click', () => {
            markedForReview[currentQuestionIndex] = !markedForReview[currentQuestionIndex];
            updatePalette();
            displayQuestion(); // To update button text
        });
    }

    // --- Palette Logic ---
    function renderPalette() {
        paletteGrid.innerHTML = '';
        currentTest.forEach((_, index) => {
            const item = document.createElement('div');
            item.className = 'palette-item unattempted';
            item.textContent = index + 1;
            item.dataset.index = index;
            item.addEventListener('click', () => {
                currentQuestionIndex = index;
                displayQuestion();
                // On mobile, maybe close palette after selection? Optional.
                if (window.innerWidth < 992) {
                    palettePanel.classList.remove('active');
                }
            });
            paletteGrid.appendChild(item);
        });
        updatePalette();
    }

    function updatePalette() {
        const items = paletteGrid.querySelectorAll('.palette-item');
        items.forEach((item, index) => {
            item.className = 'palette-item'; // Reset
            
            if (markedForReview[index]) {
                item.classList.add('marked');
            } else if (userAnswers[index] !== null) {
                item.classList.add('attempted');
            } else {
                item.classList.add('unattempted');
            }
            
            if (index === currentQuestionIndex) {
                item.classList.add('current');
            }
        });
    }

    // Palette Toggle Listeners
    if (paletteToggleBtn) paletteToggleBtn.addEventListener('click', () => palettePanel.classList.add('active'));
    if (closePaletteBtn) closePaletteBtn.addEventListener('click', () => palettePanel.classList.remove('active'));

    // --- 4. Timer Logic ---
    function startTimer(duration) {
        let time = duration;
        timerInterval = setInterval(() => {
            const hours = Math.floor(time / 3600);
            const minutes = Math.floor((time % 3600) / 60);
            const seconds = time % 60;

            timerDisplay.textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            if (--time < 0) {
                clearInterval(timerInterval);
                alert('Time is up! The test will be submitted automatically.');
                submitTest();
            }
        }, 1000);
    }

    // --- 5. Submit Test and Show Results ---
    submitBtn.addEventListener('click', () => {
        showSubmitConfirmation();
    });

    function showSubmitConfirmation() {
        const attemptedCount = userAnswers.filter(a => a !== null).length;
        const unattemptedCount = currentTest.length - attemptedCount;

        let modal = document.getElementById('submit-confirmation-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'submit-confirmation-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="confirmation-card">
                <h3>Ready to Submit?</h3>
                <p>Please review your attempt summary before submitting.</p>
                <div class="confirmation-stats">
                    <div class="conf-stat-item">
                        <span class="conf-value attempted">${attemptedCount}</span>
                        <span class="conf-label">Attempted</span>
                    </div>
                    <div class="conf-stat-item">
                        <span class="conf-value unattempted">${unattemptedCount}</span>
                        <span class="conf-label">Unattempted</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="cancel-submit-btn" class="modal-btn cancel">Cancel</button>
                    <button id="confirm-submit-btn" class="modal-btn confirm">Submit Test</button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';

        document.getElementById('cancel-submit-btn').onclick = () => {
            modal.style.display = 'none';
        };

        document.getElementById('confirm-submit-btn').onclick = () => {
            modal.style.display = 'none';
            submitTest();
        };
    }

    function submitTest() {
        clearInterval(timerInterval);
        calculateAndDisplayResults(true);
    }

    function calculateAndDisplayResults(isSubmission) {
        let score = 0;
        let attempted = 0;
        let incorrect = 0;
        let correctCount = 0;
        let subjectStats = {};

        currentTest.forEach((question, index) => {
            const subject = question.subject || 'General';
            if (!subjectStats[subject]) {
                subjectStats[subject] = { total: 0, attempted: 0, correct: 0, incorrect: 0, score: 0 };
            }
            subjectStats[subject].total++;

            if (userAnswers[index] !== null) {
                attempted++;
                subjectStats[subject].attempted++;
                if (userAnswers[index] === question.answer) {
                    score += currentTestCorrectMarks;
                    correctCount++;
                    subjectStats[subject].correct++;
                    subjectStats[subject].score += currentTestCorrectMarks;
                } else {
                    score -= currentTestNegativeMarks;
                    incorrect++;
                    subjectStats[subject].incorrect++;
                    subjectStats[subject].score -= currentTestNegativeMarks;
                }
            }
        });

        // Round score to 2 decimal places
        score = Math.round(score * 100) / 100;

        const totalQuestions = currentTest.length;
        const totalMarks = totalQuestions * currentTestCorrectMarks;
        const unattempted = totalQuestions - attempted;
        const percentage = totalMarks > 0 ? ((score / totalMarks) * 100).toFixed(1) : 0;

        // Calculate or Retrieve Rank
        let rankDisplay = currentTestRank;
        if (isSubmission) {
            const numPercentage = parseFloat(percentage);
            if (numPercentage < 10) {
                rankDisplay = "Invalid Attempt";
            } else {
                // Simulate Global Rank: Higher percentage = Better (lower) rank
                const totalParticipants = 500 + Math.floor(Math.random() * 2500); // Random between 3500-5000
                let rank;
                if (numPercentage >= 90) {
                    rank = 1;
                } else {
                    rank = 1 + Math.floor((totalParticipants * (90 - numPercentage)) / 90);
                }
                rankDisplay = `${rank} / ${totalParticipants}`;
            }
        }

        let isFirstAttempt = false;
        if (isSubmission) {
            // Calculate Time Taken
            let timeTaken = '0m 0s';
            if (startTime) {
                const endTime = new Date();
                const diff = Math.floor((endTime - startTime) / 1000);
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                timeTaken = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
            }

            // Save the result to localStorage
            const result = {
                name: currentTestName,
                score: score,
                attempted: attempted,
                total: totalMarks,
                percentage: percentage,
                date: new Date().toLocaleDateString(),
                timeTaken: timeTaken,
                userAnswers: userAnswers,
                rank: rankDisplay
            };
            isFirstAttempt = saveTestResult(result);
        }

        // Determine score class for styling
        let scoreClass = 'score-poor';
        const numPercentage = parseFloat(percentage);
        if (numPercentage >= 80) scoreClass = 'score-excellent';
        else if (numPercentage >= 60) scoreClass = 'score-good';
        else if (numPercentage >= 40) scoreClass = 'score-average';

        let subjectRows = '';
        for (const subject in subjectStats) {
            const stats = subjectStats[subject];
            stats.score = Math.round(stats.score * 100) / 100;
            
            // Calculate max possible score for this subject and percentage
            const maxSubjectScore = stats.total * currentTestCorrectMarks;
            const scorePercent = maxSubjectScore > 0 ? (stats.score / maxSubjectScore) * 100 : 0;
            const widthPercent = Math.max(0, Math.min(100, scorePercent)); // Clamp between 0 and 100 for width

            // Determine bar color based on performance
            let barColor = '#ef4444'; // Red (Poor)
            if (widthPercent >= 80) barColor = '#22c55e'; // Green (Excellent)
            else if (widthPercent >= 60) barColor = '#3b82f6'; // Blue (Good)
            else if (widthPercent >= 40) barColor = '#f59e0b'; // Orange (Average)

            subjectRows += `
                <tr>
                    <td class="subject-name">${subject}</td>
                    <td>${stats.total}</td>
                    <td>${stats.attempted}</td>
                    <td><span class="text-success">${stats.correct}</span></td>
                    <td><span class="text-danger">${stats.incorrect}</span></td>
                    <td>
                        <div class="subject-score-info">
                            <span class="subject-score-val">${stats.score} <small class="text-muted">/ ${maxSubjectScore}</small></span>
                            <div class="subject-progress-track">
                                <div class="subject-progress-fill" style="width: ${widthPercent}%; background-color: ${barColor};"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }

        let headerTitle = 'Test Result Details';
        let subHeader = '';
        if (isSubmission) {
            headerTitle = isFirstAttempt ? 'Test Submitted Successfully!' : 'Reattempt Completed';
            if (!isFirstAttempt) {
                subHeader = '<p style="color: #6c757d; margin-top: 5px;">(Note: Only the first attempt is recorded in history)</p>';
            }
        }

        resultsSummary.innerHTML = `
            <div class="result-header">
                <h2>${headerTitle}</h2>
                ${subHeader}
                <div class="score-circle ${scoreClass}">
                    <span class="score-text">${score} <small>/ ${totalMarks}</small></span>
                    <span class="score-label">${percentage}%</span>
                </div>
            </div>
            
            <div class="result-analytics-container">
                <div class="chart-wrapper">
                    <canvas id="resultChart"></canvas>
                </div>
                <div class="stat-grid">
                    <div class="stat-card total">
                        <span class="stat-icon">📋</span>
                        <div class="stat-info">
                            <span class="label">Total Questions</span>
                            <span class="value">${totalQuestions}</span>
                        </div>
                    </div>
                    <div class="stat-card attempted">
                        <span class="stat-icon">✏️</span>
                        <div class="stat-info">
                            <span class="label">Attempted</span>
                            <span class="value">${attempted}</span>
                        </div>
                    </div>
                    <div class="stat-card correct">
                        <span class="stat-icon">✅</span>
                        <div class="stat-info">
                            <span class="label">Correct</span>
                            <span class="value">${correctCount}</span>
                        </div>
                    </div>
                    <div class="stat-card incorrect">
                        <span class="stat-icon">❌</span>
                        <div class="stat-info">
                            <span class="label">Incorrect</span>
                            <span class="value">${incorrect}</span>
                        </div>
                    </div>
                     <div class="stat-card unattempted">
                        <span class="stat-icon">⭕</span>
                        <div class="stat-info">
                            <span class="label">Unattempted</span>
                            <span class="value">${unattempted}</span>
                        </div>
                    </div>
                     <div class="stat-card rank">
                        <span class="stat-icon">🏆</span>
                        <div class="stat-info">
                            <span class="label">Global Rank <small>(Simulated and Not Exact)</small></span>
                            <span class="value">${rankDisplay || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="subject-analysis-container">
                <h3>Subject Wise Analysis</h3>
                <div class="subject-table-wrapper">
                    <table class="subject-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Total</th>
                                <th>Attempted</th>
                                <th>Correct</th>
                                <th>Incorrect</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjectRows}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="question-analysis">
                <h3>Question Analysis</h3>
                <div id="question-breakdown"></div>
            </div>
        `;

        selectionContainer.style.display = 'none';
        testArea.style.display = 'none';
        performanceArea.style.display = 'none';
        resultsArea.style.display = 'block';

        renderResultChart(correctCount, incorrect, unattempted);
        renderQuestionBreakdown();
    }

    function renderResultChart(correct, incorrect, unattempted) {
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => renderResultChart(correct, incorrect, unattempted);
            document.head.appendChild(script);
            return;
        }

        const ctx = document.getElementById('resultChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect', 'Unattempted'],
                datasets: [{
                    data: [correct, incorrect, unattempted],
                    backgroundColor: ['#22c55e', '#ef4444', '#94a3b8'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Performance Overview', font: { size: 16 } }
                }
            }
        });
    }

    function renderQuestionBreakdown() {
        const container = document.getElementById('question-breakdown');
        let html = '';
        
        currentTest.forEach((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === q.answer;
            const isSkipped = userAnswer === null;
            
            let statusClass = isSkipped ? 'skipped' : (isCorrect ? 'correct' : 'incorrect');
            let statusIcon = isSkipped ? '⭕' : (isCorrect ? '✅' : '❌');
            
            html += `
                <div class="analysis-item ${statusClass}">
                    <div class="q-num">Q${index + 1}</div>
                    <div class="q-status">${statusIcon}</div>
                    <div class="q-details">
                        <p class="q-text">${q.text}</p>
                        <div class="ans-comparison">
                            <span class="your-ans">Your Answer: <strong>${userAnswer || 'Not Attempted'}</strong></span>
                            <span class="correct-ans">Correct Answer: <strong>${q.answer}</strong></span>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // --- 6. Performance History Logic ---
    function displayMockPerformance() {
        selectionContainer.style.display = 'none';
        testArea.style.display = 'none';
        resultsArea.style.display = 'none';
        performanceArea.style.display = 'block';
        if (testListArea) testListArea.style.display = 'none';
        if (subjectWiseTestListArea) subjectWiseTestListArea.style.display = 'none';

        const history = readMockPerformance();
        performanceHistoryContainer.innerHTML = '';

        if (history.length === 0) {
            performanceHistoryContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3>No Test History Yet</h3>
                    <p>Take a mock test to see your performance analytics here.</p>
                </div>`;
            return;
        }

        // Calculate Stats
        const totalTests = history.length;
        const avgScore = (history.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0) / totalTests).toFixed(1);
        const bestScore = Math.max(...history.map(h => parseFloat(h.percentage)));

        // Summary Section
        let html = `
            <div class="perf-summary-grid">
                <div class="perf-summary-card">
                    <div class="perf-icon">📝</div>
                    <div class="perf-data">
                        <span class="perf-value">${totalTests}</span>
                        <span class="perf-label">Tests Taken</span>
                    </div>
                </div>
                <div class="perf-summary-card">
                    <div class="perf-icon">📈</div>
                    <div class="perf-data">
                        <span class="perf-value">${avgScore}%</span>
                        <span class="perf-label">Avg. Score</span>
                    </div>
                </div>
                <div class="perf-summary-card">
                    <div class="perf-icon">🏆</div>
                    <div class="perf-data">
                        <span class="perf-value">${bestScore}%</span>
                        <span class="perf-label">Best Score</span>
                    </div>
                </div>
            </div>
            <h3 class="history-title">Recent Attempts</h3>
            <div class="history-list">
        `;

        // History Items
        [...history].reverse().forEach((result, index) => {
            let scoreClass = 'text-poor';
            const p = parseFloat(result.percentage);
            if (p >= 80) scoreClass = 'text-excellent';
            else if (p >= 60) scoreClass = 'text-good';
            else if (p >= 40) scoreClass = 'text-average';

            html += `
                <div class="history-card" data-index="${index}" style="cursor: pointer;">
                    <div class="history-header">
                        <span class="test-name">${result.name}</span>
                        <span class="test-date">${result.date}</span>
                    </div>
                    <div class="history-body">
                        <div class="history-stat">
                            <span class="h-label">Score</span>
                            <span class="h-value">${result.score} / ${result.total}</span>
                        </div>
                        <div class="history-stat">
                            <span class="h-label">Percentage</span>
                            <span class="h-value ${scoreClass}">${result.percentage}%</span>
                        </div>
                        <div class="history-stat">
                            <span class="h-label">Attempted</span>
                            <span class="h-value">${result.attempted}</span>
                        </div>
                        <div class="history-stat">
                            <span class="h-label">Time Taken</span>
                            <span class="h-value">${result.timeTaken || 'N/A'}</span>
                        </div>
                        <div class="history-stat">
                            <span class="h-label">Rank <small>(Simulated)</small></span>
                            <span class="h-value">${result.rank || '-'}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        performanceHistoryContainer.innerHTML = html;

        // Add click listeners to history cards
        const cards = performanceHistoryContainer.querySelectorAll('.history-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                const reversedHistory = [...readMockPerformance()].reverse();
                const attempt = reversedHistory[index];
                loadAttemptDetails(attempt);
            });
        });
    }

    function loadAttemptDetails(attempt) {
        if (!allMockTests[attempt.name]) {
            alert('Test data not found. The test might have been removed.');
            return;
        }
        
        const testData = allMockTests[attempt.name];
        currentTest = testData.questions;
        currentTestCorrectMarks = testData.correctMarks;
        currentTestNegativeMarks = testData.negativeMarks;
        currentTestName = attempt.name;
        // Handle legacy data where userAnswers might not be saved
        userAnswers = attempt.userAnswers || new Array(currentTest.length).fill(null);
        currentTestRank = attempt.rank;
        
        calculateAndDisplayResults(false);
    }

    showPerformanceBtn.addEventListener('click', displayMockPerformance);

    clearPerformanceBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your entire mock test history?')) {
            localStorage.removeItem(MOCK_PERFORMANCE_KEY);
            displayMockPerformance(); // Refresh the view
        }
    });

    // Go back to selection from the performance page
    attemptAnotherBtn.addEventListener('click', () => {
        performanceArea.style.display = 'none';
        selectionContainer.style.display = 'grid';
    });

    // View Full Length Tests Button
    if (viewFullLengthBtn) {
        viewFullLengthBtn.addEventListener('click', () => {
            selectionContainer.style.display = 'none';
            if (testListArea) testListArea.style.display = 'block';
        });
    }

    if (backFromListBtn) {
        backFromListBtn.addEventListener('click', () => {
            if (testListArea) testListArea.style.display = 'none';
            selectionContainer.style.display = 'grid';
        });
    }

    // View Subject Wise Tests Button
    if (viewSubjectWiseBtn) {
        viewSubjectWiseBtn.addEventListener('click', () => {
            selectionContainer.style.display = 'none';
            if (subjectWiseTestListArea) subjectWiseTestListArea.style.display = 'block';
        });
    }

    if (backFromSubjectListBtn) {
        backFromSubjectListBtn.addEventListener('click', () => {
            if (subjectWiseTestListArea) subjectWiseTestListArea.style.display = 'none';
            selectionContainer.style.display = 'grid';
        });
    }

    // --- 6. Reset View ---
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', () => {
            resultsArea.style.display = 'none';
            performanceArea.style.display = 'none';
            if (testListArea) testListArea.style.display = 'none';
            if (subjectWiseTestListArea) subjectWiseTestListArea.style.display = 'none';
            selectionContainer.style.display = 'grid';
        });
    }
});
