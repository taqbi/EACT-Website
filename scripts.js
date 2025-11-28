document.addEventListener('DOMContentLoaded', function () {
    console.log("JS file is loaded and executed.");

    // Sidebar toggle logic
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar') || document.getElementById('layout-menu');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Automatically collapse sidebar on mobile, expand on desktop
    if (sidebar) {
        function setSidebarState() {
            if (window.innerWidth >= 992) {
                sidebar.classList.remove('collapsed');
            } else {
                sidebar.classList.add('collapsed');
            }
        }

        setSidebarState(); // initial check
        window.addEventListener('resize', setSidebarState); // update on resize
    }

    // Load updates on page load
    const updateList = document.getElementById("update-list");
    if (updateList) {
    // Check for data-show-all attribute
    const showAll = updateList.getAttribute("data-show-all") === "true";
    loadUpdates(showAll);
  }

    function loadUpdates(showAll = false) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "updates.xml", true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var xmlDoc = xhr.responseXML;
                var updates = xmlDoc.getElementsByTagName("update");
                var ul = document.getElementById("update-list");
                if (!ul) return; // Safety check if update-list not found on this page
                ul.innerHTML = "";
    
                var limit = showAll ? updates.length : 5;
    
                for (var i = 0; i < limit; i++) {
                    var text = updates[i].getElementsByTagName("text")[0].textContent;
                    var url = updates[i].getElementsByTagName("url")[0].textContent;
                    var date = updates[i].getElementsByTagName("date")[0].textContent;
    
                    var li = document.createElement("li");
                    var a = document.createElement("a");
                    a.href = url;
                    a.innerText = text;
    
                    var spanDate = document.createElement("span");
                    spanDate.classList.add("update-date");
                    spanDate.textContent = date;
    
                    li.appendChild(a);
                    li.appendChild(spanDate);
                    ul.appendChild(li);
                }
            } else if (xhr.readyState === 4) {
                console.error("Failed to load XML: Status " + xhr.status);
            }
        };
        xhr.send();
    }
    

    function fetchXMLContent(xmlFile, sectionId, gridId) {
        fetch(xmlFile)
            .then(response => {
                if (!response.ok) throw new Error("Failed to load " + xmlFile);
                return response.text();
            })
            .then(data => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, "application/xml");

                if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                    console.error("XML Parse Error in " + xmlFile);
                    return;
                }

                const grid = document.getElementById(gridId);
                if (!grid) {
                    console.error("Grid " + gridId + " not found.");
                    return;
                }

                const items = xmlDoc.getElementsByTagName("item");
                grid.innerHTML = "";

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const title = item.getElementsByTagName("title")[0]?.textContent || "No Title";
                    const description = item.getElementsByTagName("description")[0]?.textContent || "No Description";
                    const link = item.getElementsByTagName("link")[0]?.textContent || "#";
                    const image = item.getElementsByTagName("image")[0]?.textContent || "default.jpg";

                    const card = document.createElement("div");
                    card.classList.add("job-card");

                    const img = document.createElement("img");
                    img.src = image;
                    img.alt = "Job Icon";
                    img.classList.add("job-icon");

                    const h4 = document.createElement("h4");
                    h4.textContent = title;

                    const p = document.createElement("p");
                    p.textContent = description;

                    const a = document.createElement("a");
                    a.href = link;
                    a.classList.add("apply-btn");
                    a.textContent = "View";

                    card.appendChild(img);
                    card.appendChild(h4);
                    card.appendChild(p);
                    card.appendChild(a);

                    grid.appendChild(card);
                }
            })
            .catch(error => console.error("Error loading XML:", error));
    }

    const sections = [
        { id: 'courses-section', file: 'courses.xml', grid: 'courses-grid' },
        { id: 'jobs-section', file: 'jobs.xml', grid: 'jobs-grid' },
        { id: 'admissions-section', file: 'admissions.xml', grid: 'admissions-grid' }
    ];

    sections.forEach(({ id, file, grid }) => {
        const section = document.getElementById(id);
        // More robust check: Only run if the specific grid within the section exists.
        if (section && document.getElementById(grid)) { 
            fetchXMLContent(file, id, grid); // Corrected function call
        } 
    });
    // ✨ Start typing animation
    // Only run the typing animation if the element exists on the page
    if (document.getElementById("typed-text")) {
        startTypingAnimation();
    }
    function startTypingAnimation() {
        const textArray = ["GK ", "Computer ", "Aptitude ", "Reasoning ", "Maths ", "English "];
        const typedText = document.getElementById("typed-text");
        if (!typedText) {
            console.warn("Typed text span not found.");
            return;
        }

        let arrayIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let delay = 200;

        function type() {
            const currentText = textArray[arrayIndex];

            if (isDeleting) {
                typedText.textContent = currentText.substring(0, charIndex--);
            } else {
                typedText.textContent = currentText.substring(0, charIndex++);
            }

            if (!isDeleting && charIndex === currentText.length) {
                isDeleting = true;
                delay = 500; // pause before deleting
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                arrayIndex = (arrayIndex + 1) % textArray.length;
                delay = 200;
            } else {
                delay = isDeleting ? 50 : 100;
            }

            setTimeout(type, delay);
        }

        type();
    }

    // =========================================================
    // ✅ MCQs and PYQs Logic
    // =========================================================
    const categoryContainer = document.getElementById('category-container');

    // Only run this code if we are on the MCQs page
    if (categoryContainer) {
        const filterContainer = document.getElementById('filter-container');
    const newFilterContainer = document.getElementById('new-filter-container');
    const quizContainer = document.getElementById('quiz-container');
    const scoreContainer = document.getElementById('score-container');
    const examFilter = document.getElementById('exam-filter');
    const subjectFilter = document.getElementById('subject-filter');
    const progressContainer = document.getElementById('progress-container');
    const showProgressBtn = document.getElementById('show-progress-btn');
    const pyqModeToggleContainer = document.getElementById('pyq-mode-toggle-container');
    
    let allQuestions = [];
    let sessionAnswers = {}; // To store answers for the current session
    let activeCategory = ''; // To store the currently active category (pyq or practice)
    let currentQuestions = [];
        let score = 0;
    let attempted = 0;

    // --- Progress Tracking Logic ---
    const PROGRESS_KEY = 'eactQuizProgress';

    // Function to create a simple unique ID from question text
    function getQuestionId(questionText) {
            let hash = 0;
        for (let i = 0; i < questionText.length; i++) {
            const char = questionText.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
            return 'q_' + Math.abs(hash);
    }

    function readProgress() {
        const data = localStorage.getItem(PROGRESS_KEY);
        // New structure with attemptedQuestions object
        let progress = data ? JSON.parse(data) : { scores: { exam: {}, subject: {} }, attemptedQuestions: {} };
        // Migration for old structure if it exists
        if (progress.attemptedQuestionIds) {
            delete progress.attemptedQuestionIds;
        }
        return progress;
    }

    function saveProgress(progressData) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressData));
    }

    function updateProgress(quizName, quizType, isCorrect, questionId) {
            const progress = readProgress();
        if (!progress.scores[quizType]) progress.scores[quizType] = {};
        if (!progress.scores[quizType][quizName]) progress.scores[quizType][quizName] = { correct: 0, attempted: 0 };
        progress.scores[quizType][quizName].attempted++;
        if (isCorrect) {
            progress.scores[quizType][quizName].correct++;
        }
            if (!progress.attemptedQuestions[quizName]) progress.attemptedQuestions[quizName] = [];
        if (!progress.attemptedQuestions[quizName].includes(questionId)) {
            progress.attemptedQuestions[quizName].push(questionId);
        }
            saveProgress(progress);
        }


    // Fetch and parse XML data
    // This logic should only run AFTER the questions are loaded.
    fetch('mcqs.xml')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(data, "application/xml");
            const questionNodes = xml.querySelectorAll('question');
            questionNodes.forEach(node => {
                const options = Array.from(node.querySelectorAll('option')).map(opt => opt.textContent);
                options.sort(() => Math.random() - 0.5);
                allQuestions.push({
                    category: node.getAttribute('category'),
                    exam: node.getAttribute('exam'),
                    subject: node.getAttribute('subject'),
                    text: node.querySelector('text').textContent,
                    id: getQuestionId(node.querySelector('text').textContent), // Add unique ID
                    topic: node.querySelector('topic')?.textContent || 'General',
                    options: options,
                    answer: node.querySelector('answer').textContent,
                    explanation: node.querySelector('explanation')?.textContent || 'No explanation available.'
                });
            });

            // NOW that allQuestions is populated, set up the event listeners.
            setupEventListeners();
        })
        .catch(error => {
                console.error('Error fetching or parsing XML:', error);
            if (quizContainer) {
                quizContainer.innerHTML = '<p>Error loading questions. Please try again later.</p>';
            }
        });

    function setupEventListeners() {
            // A single, powerful event listener for the entire category container
        document.querySelectorAll('.category-group h3').forEach(heading => {
            heading.addEventListener('click', (e) => {
                const group = e.target.closest('.category-group');
                const category = group.querySelector('.category-filters')?.dataset.category;

                if (category) { // This is a PYQ or Practice heading
                    activeCategory = category;
                    resetQuizView();
                    populateExamFilter();
                    populateSubjectFilter(); // Initial population
                    newFilterContainer.style.display = 'grid';
                    newFilterContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (group.querySelector('#show-progress-btn')) { // This is the Progress heading
                    resetQuizView();
                    displayProgress();
                    progressContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (group.querySelector('[data-category="mock"]')) { // This is the Mock Test heading
                    window.location.href = 'mock-tests.html';
                }
            });
        });

            // --- New Dependent Dropdown Logic ---

        examFilter.addEventListener('change', () => {
            const selectedExam = examFilter.value;
            populateSubjectFilter(); // Repopulate subjects based on selected exam

            // If a valid exam option is selected (including "All Exams"), show the toggle.
            if (selectedExam) {
                pyqModeToggleContainer.style.display = 'flex'; // Show toggle for a specific exam
                document.getElementById('pyq-mode-toggle').checked = true;
                handleToggleChange();
            } else {
                // If the placeholder is selected, hide everything.
                resetQuizView();
            }
        });

        const toggle = document.getElementById('pyq-mode-toggle');
        toggle.addEventListener('change', handleToggleChange);

        function handleToggleChange() {
            const isRandom = toggle.checked;
            const labels = pyqModeToggleContainer.querySelectorAll('.toggle-label');

            if (isRandom) {
                labels[0].classList.remove('active');
                labels[1].classList.add('active');
                subjectFilter.parentElement.style.display = 'none'; // Hide subject dropdown in Random mode
                // Set subject to 'all' internally and filter
                subjectFilter.value = 'all';
                filterAndDisplayQuestions(true); // Pass true to shuffle
            } else {
                labels[1].classList.remove('active');
                labels[0].classList.add('active');
                subjectFilter.parentElement.style.display = 'block'; // Show subject dropdown
                subjectFilter.value = 'all';
                quizContainer.innerHTML = '';
                scoreContainer.style.display = 'none';
            }
        }

        // This listener needs to be here to correctly trigger filtering
        subjectFilter.addEventListener('change', () => {
            filterAndDisplayQuestions();
        });

            function populateExamFilter() {
            const exams = [...new Set(allQuestions.filter(q => q.category === activeCategory).map(q => q.exam))];
            examFilter.innerHTML = '<option value="" disabled selected>-- Select Exam --</option>';
            examFilter.innerHTML += '<option value="all">All Exams</option>';
            exams.forEach(exam => {
                examFilter.innerHTML += `<option value="${exam}">${exam}</option>`;
            });
        }

            function populateSubjectFilter() {
            const selectedExam = examFilter.value;
            let subjects;

            if (selectedExam === 'all') {
                // Show all subjects for the active category
                subjects = [...new Set(allQuestions.filter(q => q.category === activeCategory).map(q => q.subject))];
            } else {
                // Show only subjects related to the selected exam
                subjects = [...new Set(allQuestions.filter(q => q.category === activeCategory && q.exam === selectedExam).map(q => q.subject))];
            }

            subjectFilter.innerHTML = '<option value="" disabled selected>-- Select Subject --</option>';
            subjects.forEach(subject => {
                subjectFilter.innerHTML += `<option value="${subject}">${subject}</option>`;
            });
        }

        // Add listener for the "Clear All My Attempts" button in the progress section
        const clearProgressBtn = document.getElementById('clear-progress-btn');
        if (clearProgressBtn) {
            clearProgressBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all your progress? This cannot be undone.')) {
                    localStorage.removeItem(PROGRESS_KEY);
                    displayProgress(); // Refresh the display to show it's empty
                }
            });
        }

        function filterAndDisplayQuestions(shuffle = false) {
            const selectedExam = examFilter.value;
            const selectedSubject = subjectFilter.value;

            console.log(`Filtering for: Category=${activeCategory}, Exam=${selectedExam}, Subject=${selectedSubject}`);

            currentQuestions = allQuestions.filter(q => {
                const categoryMatch = q.category === activeCategory;
                const examMatch = (selectedExam === 'all' || !selectedExam) || (q.exam === selectedExam);
                const subjectMatch = (selectedSubject === 'all') || (q.subject === selectedSubject);
                return categoryMatch && examMatch && subjectMatch;
            });

            if (shuffle) {
                currentQuestions.sort(() => Math.random() - 0.5);
            }

            console.log(`Found ${currentQuestions.length} questions.`);
            // Determine quizType for progress tracking. Prioritize subject if specific.
            const quizType = selectedSubject !== 'all' ? 'subject' : 'exam';
            displayQuestions(quizType);
        }
    }

    function displayProgress() {
            // First, remove any existing overall performance section to prevent duplication
        const existingOverall = document.querySelector('.overall-performance');
        if (existingOverall) {
            existingOverall.remove();
        }

        const progress = readProgress();
        const statsContainer = document.getElementById('progress-stats');
        statsContainer.innerHTML = `
            <div class="progress-category">
                <h3>Exam Wise</h3>
                <div id="progress-exam"></div>
            </div>
            <div class="progress-category">
                <h3>Subject Wise</h3>
                <div id="progress-subject"></div>
            </div>
        `;

            const examContainer = document.getElementById('progress-exam');
        const subjectContainer = document.getElementById('progress-subject');

        let overallAttempted = 0;
        let overallCorrect = 0;

        let hasExamScores = false;
        for (const name in progress.scores.exam) {
            hasExamScores = true;
            const { correct, attempted } = progress.scores.exam[name];
            const incorrect = attempted - correct;
            const percentage = attempted > 0 ? ((correct / attempted) * 100).toFixed(1) : 0;
            overallAttempted += attempted;
            overallCorrect += correct;

            examContainer.innerHTML += `
                <p>
                    <strong>${name}</strong>
                    <div class="stat-boxes">
                        <div class="stat-box"><span class="stat-label">Attempted</span><span class="stat-value">${attempted}</span></div>
                        <div class="stat-box"><span class="stat-label">Correct</span><span class="stat-value">${correct}</span></div>
                        <div class="stat-box"><span class="stat-label">Incorrect</span><span class="stat-value">${incorrect}</span></div>
                        <div class="stat-box"><span class="stat-label">Accuracy</span><span class="stat-value">${percentage}%</span></div>
                    </div>
                </p>`;
        }

        let hasSubjectScores = false;
        for (const name in progress.scores.subject) {
            hasSubjectScores = true;
            const { correct, attempted } = progress.scores.subject[name];
            const incorrect = attempted - correct;
            const percentage = attempted > 0 ? ((correct / attempted) * 100).toFixed(1) : 0;
            overallAttempted += attempted;
            overallCorrect += correct;

            subjectContainer.innerHTML += `
                <p>
                    <strong>${name}</strong>
                    <div class="stat-boxes">
                        <div class="stat-box"><span class="stat-label">Attempted</span><span class="stat-value">${attempted}</span></div>
                        <div class="stat-box"><span class="stat-label">Correct</span><span class="stat-value">${correct}</span></div>
                        <div class="stat-box"><span class="stat-label">Incorrect</span><span class="stat-value">${incorrect}</span></div>
                        <div class="stat-box"><span class="stat-label">Accuracy</span><span class="stat-value">${percentage}%</span></div>
                    </div>
                </p>`;
        }

        if (!hasExamScores && !hasSubjectScores) {
            statsContainer.innerHTML = '<p>You have not attempted any questions yet.</p>';
        } else {
                // Add Overall Performance section
            const overallIncorrect = overallAttempted - overallCorrect;
            const overallPercentage = overallAttempted > 0 ? ((overallCorrect / overallAttempted) * 100).toFixed(1) : 0;
            const overallHtml = `
                <div class="overall-performance progress-category">
                    <h3>Overall Performance</h3>
                    <div class="stat-boxes">
                        <div class="stat-box"><span class="stat-label">Total Attempted</span><span class="stat-value">${overallAttempted}</span></div>
                        <div class="stat-box"><span class="stat-label">Total Correct</span><span class="stat-value">${overallCorrect}</span></div>
                        <div class="stat-box"><span class="stat-label">Total Incorrect</span><span class="stat-value">${overallIncorrect}</span></div>
                        <div class="stat-box"><span class="stat-label">Overall Accuracy</span><span class="stat-value">${overallPercentage}%</span></div>
                    </div>
                </div>`;
            statsContainer.insertAdjacentHTML('afterend', overallHtml);
            }
        progressContainer.style.display = 'block';
    }
    
        function populateFilter(category, type) {

        // New logic: Filter based on the 'type' (exam or subject) and get unique names
        const filterNames = [...new Set(allQuestions.filter(q => q.category === category).map(q => q[type]))];

        filterNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            filterSelect.appendChild(option);
        });
    }


    function displayQuestions(quizType) {
            // Reset score and attempted count for the new set of questions
        score = 0;
        attempted = 0;
        sessionAnswers = {}; // Clear answers for the new session
        quizContainer.innerHTML = ''; // Clear previous content

        const quizName = subjectFilter.value !== 'all' ? subjectFilter.value : (examFilter.value !== 'all' ? examFilter.value : 'General');

            // Add the "Clear Attempts" button for this specific quiz
        if (quizName) {
            const clearButton = document.createElement('button');
            clearButton.textContent = `Clear My Attempts for "${quizName}"`;
            clearButton.className = 'clear-quiz-attempts-btn';
            clearButton.onclick = () => {
                if (confirm(`Are you sure you want to clear your attempts for "${quizName}"? This will also reset your score for this section.`)) {
                    const progress = readProgress();
                    // Remove attempts and scores for this specific quiz
                    if (progress.attemptedQuestions[quizName]) {
                        delete progress.attemptedQuestions[quizName];
                    }
                    saveProgress(progress);
                    // Re-filter the questions before re-displaying
                        filterAndDisplayQuestions();
                    // Re-display the questions to reflect the change
                    displayQuestions(quizType);
                }
            };
            quizContainer.appendChild(clearButton);
        }

        currentQuestions.forEach((q, index) => {
            const progress = readProgress();
            const questionEl = document.createElement('div');
            questionEl.className = 'question';

            const isAttempted = progress.attemptedQuestions[quizName]?.includes(q.id);

            if (isAttempted) {
                questionEl.classList.add('already-attempted');
            }

            questionEl.innerHTML = `
                <div class="question-topic">${q.topic}</div>
                <p>${index + 1}. ${q.text}</p>
                <div class="options ${isAttempted ? 'disabled-quiz' : ''}" data-question-index="${index}" data-subject-name="${q.subject}" data-exam-name="${q.exam}" data-quiz-type="${quizType}">
                    ${q.options.map(opt => `<button class="option-btn">${opt}</button>`).join('')}
                </div>
                <div class="solution-wrapper" style="display: none;">
                    <div class="correct-answer-text">Correct Answer: ${q.answer}</div>
                    <div class="explanation">${q.explanation}</div>
                </div>
            `;
            quizContainer.appendChild(questionEl);
        });
        scoreContainer.style.display = 'block';
    }

    if (quizContainer) {
        quizContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-btn')) {
                const optionsDiv = e.target.parentElement;
                const questionIndex = optionsDiv.dataset.questionIndex;
                const question = currentQuestions[questionIndex];
                const subjectName = optionsDiv.dataset.subjectName; // This remains for progress tracking by subject
                const quizType = optionsDiv.dataset.quizType;
    
                    // Prevent clicking on disabled questions
                if (optionsDiv.classList.contains('disabled-quiz')) return;

                if (optionsDiv.classList.contains('answered')) return;

                    optionsDiv.classList.add('answered');
                    attempted++;

                const selectedAnswer = e.target.textContent;
                const isCorrect = selectedAnswer === question.answer;

                // Store the user's answer for this session
                sessionAnswers[question.id] = selectedAnswer;

                    if (isCorrect) {
                    score++;
                    e.target.classList.add('correct');
                } else {
                    e.target.classList.add('incorrect');
                    Array.from(optionsDiv.children).forEach(btn => {
                        if (btn.textContent === question.answer) {
                            btn.classList.add('correct');
                        }
                    });
                }

                    // Create and append the "View Solution" button for this question
                const solutionButton = document.createElement('button');
                solutionButton.textContent = 'View Solution';
                solutionButton.className = 'solution-toggle-btn';
                solutionButton.onclick = (e) => {
                    const questionEl = e.target.closest('.question');
                    const solutionWrapper = questionEl.querySelector('.solution-wrapper');
                    solutionWrapper.style.display = solutionWrapper.style.display === 'block' ? 'none' : 'block';
                    // If the solution is now visible, tell MathJax to render the math in it
                    if (solutionWrapper.style.display === 'block') {
                        MathJax.typesetPromise([solutionWrapper]);
                    }
                    e.target.textContent = solutionWrapper.style.display === 'block' ? 'Hide Solution' : 'View Solution';
                };
                // Insert the button after the options div
                optionsDiv.insertAdjacentElement('afterend', solutionButton);
    
                    // Determine the correct name for progress tracking (either exam name or subject name)
                const progressName = quizType === 'exam' ? question.exam : question.subject;

                // Save progress to localStorage
                updateProgress(progressName, quizType, isCorrect, question.id);

                    updateScore();
            }
        });
    }

    function updateScore() {
        const incorrect = attempted - score;
        const percentage = attempted > 0 ? ((score / attempted) * 100).toFixed(1) : 0;
        document.getElementById('attempted-count').textContent = attempted;
        document.getElementById('correct-count').textContent = score;
        document.getElementById('incorrect-count').textContent = incorrect;
        document.getElementById('accuracy-percentage').textContent = `${percentage}%`;
    }

    function resetQuizView() {
        quizContainer.innerHTML = '';
        scoreContainer.style.display = 'none';
        newFilterContainer.style.display = 'none';
        pyqModeToggleContainer.style.display = 'none';
        progressContainer.style.display = 'none';
        resetQuizState();
    }

    function resetQuizState() {
        currentQuestions = [];
        score = 0;
        attempted = 0;
        updateScore();
    }
    } // This closes the 'if (categoryContainer)' block
    } 
);