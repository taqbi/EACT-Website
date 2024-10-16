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
