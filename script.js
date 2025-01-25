// past quarter select
document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("past-classes-quarter");

    // Ensure the element exists
    if (!select) {
        console.error("Element with id 'past-classes-quarter' not found!");
        return;
    }

    const startYear = 2019; // Start from Fall 2019
    const currentYear = new Date().getFullYear(); //get current
    const quarters = ["Fall", "Winter", "Spring", "Summer"];

    for (let year = startYear; year <= currentYear; year++) {
        quarters.forEach((quarter) => {
            if (year === startYear && quarter !== "Fall") return;
            const option = document.createElement("option");
            option.value = `${quarter} ${year}`; //used when user selects option
            option.textContent = `${quarter} ${year}`;
            select.appendChild(option);
        });
    }
    
    console.log("Quarters successfully populated in the dropdown!");

    // Add functionality to filter and display past classes
    // replace this part with mySQL
    const pastClassesData = {
        "Fall 2024": ["ICS 31", "ICS 32", "Soc Sci 3"],
        "Spring 2024": ["ICS 33", "Math 2B", "Physics 7D"],
        "Winter 2024": ["ICS 45C", "Stats 7", "Bio Sci 97"],
    };

    const classSearchInput = document.getElementById("past-classes");
    const pastClassesList = document.getElementById("past-classes-list");
    let selectedQuarter = ""; // Track the currently selected quarter

    // Handle quarter selection
    select.addEventListener("change", (e) => {
        selectedQuarter = e.target.value;
        updateClassList(""); // Reset the list when the quarter changes
    });

    // Handle class search input
    classSearchInput.addEventListener("input", (e) => {
        const searchText = e.target.value.toLowerCase();
        updateClassList(searchText);
    });

    // Function to update the displayed class list
    function updateClassList(searchText) {
        // Clear the list
        pastClassesList.innerHTML = "";

        // If no quarter is selected, do nothing
        if (!selectedQuarter || !pastClassesData[selectedQuarter]) return;

        // Filter classes for the selected quarter
        const filteredClasses = pastClassesData[selectedQuarter].filter((className) =>
            className.toLowerCase().includes(searchText)
        );

        // Display the filtered classes
        filteredClasses.forEach((className) => {
            const classBadge = document.createElement("span");
            classBadge.className = "class-badge";
            classBadge.textContent = className;
            pastClassesList.appendChild(classBadge);
        });

        // If no matches are found, show a "No Results" message
        if (filteredClasses.length === 0) {
            const noResults = document.createElement("p");
            noResults.textContent = "No matching classes found.";
            pastClassesList.appendChild(noResults);
        }
    }
});

//multiple day selection
document.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById('day-selec');

    const choices = new Choices(element, {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: "Select days",
        searchEnabled: false,
        itemSelectText: "",
    });
});

// handling form submission
document.querySelector('.submit-btn').addEventListener('click', (e) => {
    e.preventDefault();

    const major = document.getElementById('major');
    //const days = document.getElementById('day-selec');
    const timeStart = document.getElementById('time-start');
    const timeEnd = document.getElementById('time-end');

    const days = Array.from(daySelect.selectedOptions).map(option => option.value);
    
    const pastClasses = Array.from(document.getElementById('past-classes').selectedOptions)
    .map(option => option.value);

    if (!major || !days || !timeStart || !timeEnd || pastClasses.length() === 0) {
        alert("Please fill in all fields, including past classes!");
        return;
    }

    // Data for further processing
    console.log("Majors: ", major);
    console.log("Days: ", days);
    console.log("Time Range: ", timeStart, "to", timeEnd);
    console.log("Past Classes: ", pastClasses);

    // Example: Display collected data on the page (backend part)
    const recommendationsDiv = document.getElementById('recommendations');
    recommendationsDiv.innerHTML = `
    <h4>Submitted Data</h4>
    <p><strong>Major:</strong> ${major}</p>
    <p><strong>Days:</strong> ${days}</p>
    <p><strong>Time Range:</strong> ${timeStart} to ${timeEnd}</p>
    <p><strong>Past Classes:</strong> ${pastClasses.join(", ")}</p>
    `;
});

