document.addEventListener("DOMContentLoaded", function () {

    // Function to fetch and display updates from an XML file
    function loadUpdates() {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "updates.xml", true); // Path to the XML file
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                // Parse the XML
                const xmlDoc = xhr.responseXML;
                const updates = xmlDoc.getElementsByTagName("update");
                const ul = document.getElementById("update-list");
                
                // Clear previous list
                ul.innerHTML = "";

                // Loop through the updates and append to the UL
                for (let i = 0; i < updates.length; i++) {
                    const textNode = updates[i].getElementsByTagName("text")[0];
                    const urlNode = updates[i].getElementsByTagName("url")[0];

                    // Check if both text and URL exist before creating elements
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
            } else if (xhr.readyState === 4 && xhr.status !== 200) {
                console.error("Failed to load XML: Status " + xhr.status);
            }
        };
        xhr.send();
    }

    // Function to fetch and display content from an XML file (for courses, jobs, and admissions)
    function fetchXMLContent(xmlFile, sectionId, gridId) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", xmlFile, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const xmlDoc = xhr.responseXML;
                const section = document.getElementById(sectionId);
                const grid = document.getElementById(gridId);
                
                const items = xmlDoc.getElementsByTagName("item");
                
                // Clear existing content
                grid.innerHTML = "";

                // Loop through XML items and append to the grid
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    
                    const title = item.getElementsByTagName("title")[0].textContent;
                    const description = item.getElementsByTagName("description")[0].textContent;
                    const link = item.getElementsByTagName("link")[0].textContent;
                    const image = item.getElementsByTagName("image")[0].textContent;
                    const progress = item.getElementsByTagName("progress")[0].textContent;

                    // Create a new job-card (for courses, jobs, or admissions)
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
            } else if (xhr.readyState === 4 && xhr.status !== 200) {
                console.error("Failed to load XML: Status " + xhr.status);
            }
        };
        xhr.send();
    }

    // Fetch updates, courses, jobs, and admissions XMLs
    loadUpdates(); // Load the updates XML
    fetchXMLContent("courses.xml", "courses-section", "courses-grid");
    fetchXMLContent("jobs.xml", "jobs-section", "jobs-grid");
    fetchXMLContent("admissions.xml", "admissions-section", "admissions-grid");

});
