document.addEventListener('DOMContentLoaded', function() {
    // Get the sections where the content will be displayed
    const coursesSection = document.getElementById('courses-section');
    const jobsSection = document.getElementById('jobs-section');
    const admissionsSection = document.getElementById('admissions-section');

    // Function to fetch and display updates from an XML file
    function loadUpdates() {
        fetch("updates.xml")
            .then(response => {
                if (!response.ok) throw new Error("Failed to load updates XML");
                return response.text();
            })
            .then(data => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, "application/xml");
                const updates = xmlDoc.getElementsByTagName("update");
                const ul = document.getElementById("update-list");

                ul.innerHTML = ""; // Clear previous list

                for (let i = 0; i < updates.length; i++) {
                    const textNode = updates[i].getElementsByTagName("text")[0];
                    const urlNode = updates[i].getElementsByTagName("url")[0];

                    if (textNode && urlNode) {
                        const text = textNode.childNodes[0].nodeValue;
                        const url = urlNode.childNodes[0].nodeValue;

                        const li = document.createElement("li");
                        const a = document.createElement("a");
                        a.href = url;
                        a.innerText = text;
                        li.appendChild(a);
                        ul.appendChild(li);
                    } else {
                        console.error("Invalid update format in XML at index " + i);
                    }
                }
            })
            .catch(error => console.error(error));
    }

    // Function to fetch and display content from an XML file (for courses, jobs, and admissions)
    function fetchXMLContent(xmlFile, sectionId, gridId) {
        fetch(xmlFile)
            .then(response => {
                if (!response.ok) throw new Error("Failed to load " + xmlFile);
                return response.text();
            })
            .then(data => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, "application/xml");

                const section = document.getElementById(sectionId);
                const grid = document.getElementById(gridId);

                const items = xmlDoc.getElementsByTagName("item");

                grid.innerHTML = ""; // Clear existing content

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];

                    const title = item.getElementsByTagName("title")[0].textContent;
                    const description = item.getElementsByTagName("description")[0].textContent;
                    const link = item.getElementsByTagName("link")[0].textContent;
                    const image = item.getElementsByTagName("image")[0].textContent;
                    const progress = item.getElementsByTagName("progress")[0].textContent;

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
                    a.textContent = "Apply Now";

                    card.appendChild(img);
                    card.appendChild(h4);
                    card.appendChild(p);
                    card.appendChild(a);

                    grid.appendChild(card);
                }
            })
            .catch(error => console.error(error));
    }

    // Check if the courses section exists and fetch content
    if (coursesSection) {
        const coursesGrid = coursesSection.getElementsByClassName('job-grid')[0];
        // Fetch and display content for courses
        fetchXMLContent("courses.xml", "courses-section", "courses-grid");
    }

    // Check if the jobs section exists and fetch content
    if (jobsSection) {
        const jobsGrid = jobsSection.getElementsByClassName('job-grid')[0];
        // Fetch and display content for jobs
        fetchXMLContent("jobs.xml", "jobs-section", "jobs-grid");
    }

    // Check if the admissions section exists and fetch content
    if (admissionsSection) {
        const admissionsGrid = admissionsSection.getElementsByClassName('job-grid')[0];
        // Fetch and display content for admissions
        fetchXMLContent("admissions.xml", "admissions-section", "admissions-grid");
    }

    // Fetch updates and display them
    loadUpdates(); // Load the updates XML
});
