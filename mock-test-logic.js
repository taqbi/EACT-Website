document.addEventListener('DOMContentLoaded', () => {
    // Containers
    const selectionContainer = document.getElementById('mock-selection-container');
    const testArea = document.getElementById('mock-test-area');
    const resultsArea = document.getElementById('mock-results-area');
    const performanceArea = document.getElementById('mock-performance-area');

    // Elements
    const fullLengthSelect = document.getElementById('full-length-select');
    const subjectWiseSelect = document.getElementById('subject-wise-select');
    const startFullLengthBtn = document.getElementById('start-full-length-btn');
    const startSubjectWiseBtn = document.getElementById('start-subject-wise-btn');
    const quizContainer = document.getElementById('mock-quiz-container');
    const timerDisplay = document.getElementById('time');
    const prevBtn = document.getElementById('prev-question-btn');
    const nextBtn = document.getElementById('next-question-btn');
    const submitBtn = document.getElementById('submit-mock-btn');
    const resultsSummary = document.getElementById('results-summary');
    const backToSelectionBtn = document.getElementById('back-to-selection-btn');
    const showPerformanceBtn = document.getElementById('show-performance-btn');
    const performanceHistoryContainer = document.getElementById('performance-history');
    const clearPerformanceBtn = document.getElementById('clear-performance-btn');
    const attemptAnotherBtn = document.getElementById('attempt-another-btn');

    let allMockTests = {};
    let currentTest = [];
    let currentTestName = '';
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let timerInterval;

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
        history.push(result);
        saveMockPerformance(history);
    }

    // --- 1. Fetch Mock Test Data ---
    fetch('mocks.xml')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(data, "application/xml");
            const testNodes = xml.querySelectorAll('test');
            
            fullLengthSelect.innerHTML = '<option value="">-- Select a Test --</option>';
            subjectWiseSelect.innerHTML = '<option value="">-- Select a Test --</option>';

            testNodes.forEach(testNode => {
                const testName = testNode.getAttribute('name');
                const testType = testNode.getAttribute('type');
                const questions = [];
                testNode.querySelectorAll('question').forEach(qNode => {
                    questions.push({
                        text: qNode.querySelector('text').textContent,
                        options: Array.from(qNode.querySelectorAll('option')).map(opt => opt.textContent),
                        answer: qNode.querySelector('answer').textContent
                    });
                });
                allMockTests[testName] = questions;

                if (testType === 'full') {
                    fullLengthSelect.innerHTML += `<option value="${testName}">${testName}</option>`;
                } else if (testType === 'subject') {
                    subjectWiseSelect.innerHTML += `<option value="${testName}">${testName}</option>`;
                }
            });
        });

    // --- 2. Start the Test ---
    if (startFullLengthBtn) {
        startFullLengthBtn.addEventListener('click', () => {
            const selectedTestName = fullLengthSelect.value;
            if (!selectedTestName) {
                alert('Please select a mock test to begin.');
                return;
            }
            initializeTest(selectedTestName);
        });
    }

    if (startSubjectWiseBtn) {
        startSubjectWiseBtn.addEventListener('click', () => {
            const selectedTestName = subjectWiseSelect.value;
            if (!selectedTestName) {
                alert('Please select a mock test to begin.');
                return;
            }
            initializeTest(selectedTestName);
        });
    }

    function initializeTest(testName) {
        currentTest = allMockTests[testName];
        currentTestName = testName;
        userAnswers = new Array(currentTest.length).fill(null);
        currentQuestionIndex = 0;

        selectionContainer.style.display = 'none';
        resultsArea.style.display = 'none';
        performanceArea.style.display = 'none';
        testArea.style.display = 'block';

        displayQuestion();
        startTimer(120 * 60); // 120 minutes in seconds
    }

    // --- 3. Display and Navigate Questions ---
    function displayQuestion() {
        const question = currentTest[currentQuestionIndex];
        quizContainer.innerHTML = `
            <div class="question">
                <p>${currentQuestionIndex + 1}. ${question.text}</p>
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

        // Add event listener for the newly created radio buttons
        document.querySelectorAll(`input[name="q${currentQuestionIndex}"]`).forEach(radio => {
            radio.addEventListener('change', (e) => {
                userAnswers[currentQuestionIndex] = e.target.value;
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
        if (confirm('Are you sure you want to submit the test?')) {
            submitTest();
        }
    });

    function submitTest() {
        clearInterval(timerInterval);
        let score = 0;
        let attempted = 0;

        currentTest.forEach((question, index) => {
            if (userAnswers[index] !== null) {
                attempted++;
                if (userAnswers[index] === question.answer) {
                    score++;
                }
            }
        });

        const totalQuestions = currentTest.length;
        const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(1) : 0;

        // Save the result to localStorage
        const result = {
            name: currentTestName,
            score: score,
            attempted: attempted,
            total: totalQuestions,
            percentage: percentage,
            date: new Date().toLocaleDateString()
        };
        saveTestResult(result);

        resultsSummary.innerHTML = `
            <div class="stat-boxes">
                <div class="stat-box"><span class="stat-label">Total Questions</span><span class="stat-value">${totalQuestions}</span></div>
                <div class="stat-box"><span class="stat-label">Attempted</span><span class="stat-value">${attempted}</span></div>
                <div class="stat-box"><span class="stat-label">Correct</span><span class="stat-value">${score}</span></div>
                <div class="stat-box"><span class="stat-label">Final Score</span><span class="stat-value">${percentage}%</span></div>
            </div>
        `;

        testArea.style.display = 'none';
        resultsArea.style.display = 'block';
    }

    // --- 6. Performance History Logic ---
    function displayMockPerformance() {
        selectionContainer.style.display = 'none';
        testArea.style.display = 'none';
        resultsArea.style.display = 'none';
        performanceArea.style.display = 'block';

        const history = readMockPerformance();
        performanceHistoryContainer.innerHTML = '';

        if (history.length === 0) {
            performanceHistoryContainer.innerHTML = '<p>You have not completed any mock tests yet.</p>';
            return;
        }

        history.reverse().forEach(result => {
            performanceHistoryContainer.innerHTML += `
                <div class="history-item">
                    <strong>${result.name}</strong>
                    <div class="stat-boxes">
                        <div class="stat-box"><span class="stat-label">Score</span><span class="stat-value">${result.score}/${result.total}</span></div>
                        <div class="stat-box"><span class="stat-label">Accuracy</span><span class="stat-value">${result.percentage}%</span></div>
                        <div class="stat-box"><span class="stat-label">Date</span><span class="stat-value">${result.date}</span></div>
                    </div>
                </div>
            `;
        });
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
        selectionContainer.style.display = 'block';
    });

    // --- 6. Reset View ---
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', () => {
            resultsArea.style.display = 'none';
            performanceArea.style.display = 'none';
            selectionContainer.style.display = 'block';
        });
    }
});
