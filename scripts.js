document.addEventListener('DOMContentLoaded', function() {

    console.log("JS file is loaded and executed.");

// Fetch and Display XML Updates
function loadUpdates() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "updates.xml", true); // Path to the XML file
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Parse XML
            var xmlDoc = xhr.responseXML;
            var updates = xmlDoc.getElementsByTagName("update");
            var ul = document.getElementById("update-list");
            
            // Clear previous list
            ul.innerHTML = "";
            
            // Loop through the updates and append to the UL
            for (var i = 0; i < updates.length; i++) {
                var text = updates[i].getElementsByTagName("text")[0].childNodes[0].nodeValue;
                var url = updates[i].getElementsByTagName("url")[0].childNodes[0].nodeValue;

                var li = document.createElement("li");
                var a = document.createElement("a");
                a.href = url;
                a.innerText = text;
                li.appendChild(a);
                ul.appendChild(li);
            }
        } else if (xhr.readyState == 4 && xhr.status != 200) {
            console.error("Failed to load XML: Status " + xhr.status);
        }
    };
    xhr.send();
}
// Call the function when the page loads

window.onload = loadUpdates;  








    // Get the sections where the content will be displayed
    const coursesSection = document.getElementById('courses-section');
    const jobsSection = document.getElementById('jobs-section');
    const admissionsSection = document.getElementById('admissions-section');

    // Function to fetch and display content from an XML file (for courses, jobs, and admissions)
    function fetchXMLContent(xmlFile, sectionId, gridId) {
        fetch(xmlFile)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to load " + xmlFile + ": " + response.statusText);
                }
                return response.text();
            })
            .then(data => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, "application/xml");

                // Check if XML parsing failed
             if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
             console.error("Error parsing XML:", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
                return;
                }


                const section = document.getElementById(sectionId);
                const grid = document.getElementById(gridId);
                console.error(grid);
                if (!grid) {
                    console.error("Grid element with ID " + gridId + " not found in section " + sectionId);
                    return;
                }

                const items = xmlDoc.getElementsByTagName("item");
                console.log("Items read:");
                console.log(items[0]);
                if (items.length === 0) {
                    console.error("No items found in " + xmlFile);
                   return;
                }

                grid.innerHTML = ""; // Clear existing content
                

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    console.log("Item is");
                    console.log(item);
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
    console.log("Before Courses Section");
    // Check if the courses section exists and fetch content
    if (coursesSection) {
        console.log("Inside Courses Section");
        const coursesGrid = coursesSection.getElementsByClassName('job-grid')[0];
        if (coursesGrid) {
            fetchXMLContent("courses.xml", "courses-section", "courses-grid");
        } else {
            console.error("Courses grid not found.");
        }
    }

    // Check if the jobs section exists and fetch content
    if (jobsSection) {
        const jobsGrid = jobsSection.getElementsByClassName('job-grid')[0];
        if (jobsGrid) {
            fetchXMLContent("jobs.xml", "jobs-section", "jobs-grid");
        } else {
            console.error("Jobs grid not found.");
        }
    }

    // Check if the admissions section exists and fetch content
    if (admissionsSection) {
        const admissionsGrid = admissionsSection.getElementsByClassName('job-grid')[0];
        if (admissionsGrid) {
            fetchXMLContent("admissions.xml", "admissions-section", "admissions-grid");
        } else {
            console.error("Admissions grid not found.");
        }
    }
});
