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
    function setSidebarState() {
        if (window.innerWidth >= 992) {
            sidebar.classList.remove('collapsed');
        } else {
            sidebar.classList.add('collapsed');
        }
    }

    setSidebarState(); // initial check
    window.addEventListener('resize', setSidebarState); // update on resize

    // Load updates on page load
    loadUpdates();

    function loadUpdates() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "updates.xml", true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var xmlDoc = xhr.responseXML;
                var updates = xmlDoc.getElementsByTagName("update");
                var ul = document.getElementById("update-list");
                ul.innerHTML = "";

                for (var i = 0; i < updates.length; i++) {
                    var text = updates[i].getElementsByTagName("text")[0].textContent;
                    var url = updates[i].getElementsByTagName("url")[0].textContent;
                    var date = updates[i].getElementsByTagName("date")[0].textContent;

                    var li = document.createElement("li");
                    var a = document.createElement("a");
                    a.href = url;
                    a.innerText = text;

                    var spanDate = document.createElement("span");
                    spanDate.classList.add("update-date");
                    spanDate.textContent = "Date: " + date;

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
        if (section && section.getElementsByClassName('job-grid')[0]) {
            fetchXMLContent(file, id, grid);
        } else {
            console.error(`Section or grid not found for ${id}`);
        }
    });

    // ✨ Start typing animation
    startTypingAnimation();

    function startTypingAnimation() {
        const textArray = ["GK", "Computer", "Aptitude", "Reasoning", "Maths", "English"];
        const typedText = document.getElementById("typed-text");
        if (!typedText) {
            console.warn("Typed text span not found.");
            return;
        }

        let arrayIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let delay = 100;

        function type() {
            const currentText = textArray[arrayIndex];

            if (isDeleting) {
                typedText.textContent = currentText.substring(0, charIndex--);
            } else {
                typedText.textContent = currentText.substring(0, charIndex++);
            }

            if (!isDeleting && charIndex === currentText.length) {
                isDeleting = true;
                delay = 1000; // pause before deleting
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
