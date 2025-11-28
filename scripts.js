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
});

// =========================================================
// ✅ MCQs and PYQs Logic
// =========================================================
const categoryContainer = document.getElementById('category-container');

// Only run this code if we are on the MCQs page
if (categoryContainer) {
    const filterContainer = document.getElementById('filter-container');
    const quizContainer = document.getElementById('quiz-container');
    const scoreContainer = document.getElementById('score-container');
    const filterSelect = document.getElementById('filter-select');
    const filterLabel = document.getElementById('filter-label');
    const progressContainer = document.getElementById('progress-container');
    const showProgressBtn = document.getElementById('show-progress-btn');

    let allQuestions = [];
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
        // New structure with exam/subject types
        return data ? JSON.parse(data) : { scores: { exam: {}, subject: {} }, attemptedQuestionIds: [] };
    }

    function saveProgress(progressData) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressData));
    }

    function updateProgress(subjectName, quizType, isCorrect, questionId) {
        const progress = readProgress();
        if (!progress.scores[quizType][subjectName]) {
            progress.scores[quizType][subjectName] = { correct: 0, attempted: 0 };
        }
        progress.scores[quizType][subjectName].attempted++;
        if (isCorrect) {
            progress.scores[quizType][subjectName].correct++;
        }
        if (!progress.attemptedQuestionIds.includes(questionId)) {
            progress.attemptedQuestionIds.push(questionId);
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
                    type: node.getAttribute('type'),
                    name: node.getAttribute('name'),
                    text: node.querySelector('text').textContent,
                    id: getQuestionId(node.querySelector('text').textContent), // Add unique ID
                    topic: node.querySelector('topic')?.textContent || 'General',
                    options: options,
                    answer: node.querySelector('answer').textContent
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
        categoryContainer.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            // If the progress button was clicked, do nothing here. Its specific handler will take care of it.
            if (button && button.id === 'show-progress-btn') return;

            if (button) {
                const category = button.dataset.category;
                const type = button.dataset.type;

                resetQuizView();

                if (category === 'mock') {
                    // Simply redirect to the mock tests page.
                    window.location.href = 'mock-tests.html';
                    return;
                }

                populateFilter(category, type);
                filterContainer.style.display = 'block';

                // Automatically scroll down to the new dropdown menu
                filterContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // This listener MUST be inside setupEventListeners to be correctly scoped.
        filterSelect.addEventListener('change', (e) => {
            const selectedName = e.target.value;
            if (!selectedName) {
                resetQuizView();
                return;
            }

            const category = filterSelect.dataset.category;
            const type = filterSelect.dataset.type;

            console.log("Dropdown selected. Values are:");
            console.log("Category:", category);
            console.log("Type:", type);
            console.log("Selected Name:", selectedName);

            currentQuestions = allQuestions.filter(q => q.category === category && q.type === type && q.name === selectedName);
            console.log("Found " + currentQuestions.length + " questions after filtering.");
            
            displayQuestions(type); // Pass the type to displayQuestions
        });

        showProgressBtn.addEventListener('click', () => {
            resetQuizView(); // Hide any active quiz
            displayProgress();
        });

        document.getElementById('clear-progress-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all your progress? This cannot be undone.')) {
                localStorage.removeItem(PROGRESS_KEY);
                displayProgress(); // Refresh the display to show it's empty
            }
        });
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
        filterLabel.textContent = `Select ${type === 'exam' ? 'Exam' : 'Subject'}:`;
        filterSelect.innerHTML = `<option value="">-- Select --</option>`;
        filterSelect.dataset.category = category;
        filterSelect.dataset.type = type;

        const filterNames = [...new Set(allQuestions
            .filter(q => q.category === category && q.type === type)
            .map(q => q.name))];

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
        quizContainer.innerHTML = '';
        currentQuestions.forEach((q, index) => {
            const progress = readProgress();
            const questionEl = document.createElement('div');
            questionEl.className = 'question';

            if (progress.attemptedQuestionIds.includes(q.id)) {
                questionEl.classList.add('already-attempted');
            }

            questionEl.innerHTML = `
                <div class="question-topic">${q.topic}</div>
                <p>${index + 1}. ${q.text}</p>
                <div class="options" data-question-index="${index}" data-subject-name="${q.name}" data-quiz-type="${quizType}">
                    ${q.options.map(opt => `<button class="option-btn">${opt}</button>`).join('')}
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
                const subjectName = optionsDiv.dataset.subjectName;
                const quizType = optionsDiv.dataset.quizType;

                if (optionsDiv.classList.contains('answered')) return;

                optionsDiv.classList.add('answered');
                attempted++;

                const selectedAnswer = e.target.textContent;
                const isCorrect = selectedAnswer === question.answer;

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
                // Save progress to localStorage
                updateProgress(subjectName, quizType, isCorrect, question.id);

                updateScore();
            }
        });
    }

    function updateScore() {
        const percentage = attempted > 0 ? ((score / attempted) * 100).toFixed(1) : 0;
        document.getElementById('attempted-count').textContent = attempted;
        document.getElementById('correct-percentage').textContent = percentage;
    }

    function resetQuizView() {
        filterContainer.style.display = 'none';
        quizContainer.innerHTML = '';
        scoreContainer.style.display = 'none';
        progressContainer.style.display = 'none';
        resetQuizState();
    }

    function resetQuizState() {
        currentQuestions = [];
        score = 0;
        attempted = 0;
        updateScore();
    }
}
