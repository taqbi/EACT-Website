document.addEventListener('DOMContentLoaded', () => {
    const categoryContainer = document.getElementById('category-container');
    const filterContainer = document.getElementById('filter-container');
    const quizContainer = document.getElementById('quiz-container');
    const scoreContainer = document.getElementById('score-container');
    const filterSelect = document.getElementById('filter-select');
    const filterLabel = document.getElementById('filter-label');

    let allQuestions = [];
    let currentQuestions = [];
    let score = 0;
    let attempted = 0;

    // Fetch and parse XML data
    fetch('mcqs.xml')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(data, "application/xml");
            const questionNodes = xml.querySelectorAll('question');
            questionNodes.forEach(node => {
                const options = Array.from(node.querySelectorAll('option')).map(opt => opt.textContent);
                // Shuffle options for randomness
                options.sort(() => Math.random() - 0.5);
                allQuestions.push({
                    category: node.getAttribute('category'),
                    type: node.getAttribute('type'),
                    name: node.getAttribute('name'),
                    text: node.querySelector('text').textContent,
                    topic: node.querySelector('topic')?.textContent || 'General',
                    options: options,
                    answer: node.querySelector('answer').textContent
                });
            });
        })
        .catch(error => {
            console.error('Error fetching or parsing XML:', error);
            quizContainer.innerHTML = '<p>Error loading questions. Please try again later.</p>';
        });

    // Event listener for main category buttons (PYQ, Practice, Mock)
    categoryContainer.addEventListener('click', (e) => {
        // Use .closest('button') to ensure the click is registered even if the icon is clicked
        const button = e.target.closest('button');
        if (button) {
            const category = button.dataset.category;
            const type = button.dataset.type;

            // Reset view
            resetQuizView();

            if (category === 'mock') {
                // Mock tests can be handled separately
                quizContainer.innerHTML = '<p>Mock tests are coming soon!</p>';
                return;
            }

            // Populate and show the filter dropdown
            populateFilter(category, type);
            filterContainer.style.display = 'block';
        }
    });

    // Populate filter dropdown based on selections
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

    // Event listener for the filter dropdown
    filterSelect.addEventListener('change', (e) => {
        const selectedName = e.target.value;
        if (!selectedName) {
            resetQuizView();
            return;
        }

        const category = e.target.dataset.category;
        const type = e.target.dataset.type;

        currentQuestions = allQuestions.filter(q => q.category === category && q.type === type && q.name === selectedName);
        displayQuestions();
    });

    // Display the filtered questions
    function displayQuestions() {
        resetQuizState();
        quizContainer.innerHTML = '';
        currentQuestions.forEach((q, index) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'question';
            questionEl.innerHTML = `
                <div class="question-topic">${q.topic}</div>
                <p>${index + 1}. ${q.text}</p>
                <div class="options" data-question-index="${index}">
                    ${q.options.map(opt => `<button class="option-btn">${opt}</button>`).join('')}
                </div>
            `;
            quizContainer.appendChild(questionEl);
        });
        scoreContainer.style.display = 'block';
    }

    // Handle clicking an answer option
    quizContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('option-btn')) {
            const optionsDiv = e.target.parentElement;
            const questionIndex = optionsDiv.dataset.questionIndex;
            const question = currentQuestions[questionIndex];

            // Prevent re-answering
            if (optionsDiv.classList.contains('answered')) return;

            optionsDiv.classList.add('answered');
            attempted++;

            const selectedAnswer = e.target.textContent;
            if (selectedAnswer === question.answer) {
                score++;
                e.target.classList.add('correct');
            } else {
                e.target.classList.add('incorrect');
                // Highlight the correct answer
                Array.from(optionsDiv.children).forEach(btn => {
                    if (btn.textContent === question.answer) {
                        btn.classList.add('correct');
                    }
                });
            }
            updateScore();
        }
    });

    function updateScore() {
        const percentage = attempted > 0 ? ((score / attempted) * 100).toFixed(1) : 0;
        document.getElementById('attempted-count').textContent = attempted;
        document.getElementById('correct-percentage').textContent = percentage;
    }

    function resetQuizView() {
        filterContainer.style.display = 'none';
        quizContainer.innerHTML = '';
        scoreContainer.style.display = 'none';
        resetQuizState();
    }

    function resetQuizState() {
        currentQuestions = [];
        score = 0;
        attempted = 0;
        updateScore();
    }
});