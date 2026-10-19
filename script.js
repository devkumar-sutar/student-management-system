
const API_URL = "http://localhost:8085/api/students";

const studentForm = document.getElementById("studentForm");
const studentId = document.getElementById("studentId");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const courseInput = document.getElementById("course");
const studentTableBody = document.getElementById("studentTableBody");
const message = document.getElementById("message");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

const searchInput = document.getElementById("searchInput");
const totalStudents = document.getElementById("totalStudents");
const totalCourses = document.getElementById("totalCourses");
const filteredStudents = document.getElementById("filteredStudents");
const emptyMessage = document.getElementById("emptyMessage");

let allStudents = [];

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#dc2626" : "#15803d";
}

function updateDashboard(students, visibleCount) {
    totalStudents.textContent = students.length;

    const courses = new Set(
        students
            .map(student => (student.course || "").trim().toLowerCase())
            .filter(course => course !== "")
    );

    totalCourses.textContent = courses.size;
    filteredStudents.textContent = visibleCount;
}

function renderStudents() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filtered = allStudents.filter(student => {
        return [
            student.name,
            student.email,
            student.course
        ].some(value =>
            (value || "").toLowerCase().includes(searchTerm)
        );
    });

    studentTableBody.replaceChildren();

    filteredStudents.textContent = filtered.length;
    emptyMessage.hidden = filtered.length !== 0;

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = searchTerm
            ? "No matching students found."
            : "No students found.";

        row.appendChild(cell);
        studentTableBody.appendChild(row);
    }

    filtered.forEach(student => {
        const row = document.createElement("tr");

        [student.id, student.name, student.email, student.course]
            .forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.type = "button";
        editButton.className = "edit-btn";
        editButton.addEventListener("click", () => editStudent(student));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", () => deleteStudent(student.id));

        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);
        studentTableBody.appendChild(row);
    });

    updateDashboard(allStudents, filtered.length);
}

async function loadStudents() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Unable to load students: ${response.status}`);
        }

        allStudents = await response.json();
        renderStudents();

    } catch (error) {
        showMessage(
            "Could not load students. Check whether the backend is running.",
            true
        );
        console.error(error);
    }
}

searchInput.addEventListener("input", renderStudents);

studentForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const student = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        course: courseInput.value.trim()
    };

    if (!student.name || !student.email || !student.course) {
        showMessage("Please fill in all fields.", true);
        return;
    }

    if (!emailInput.checkValidity()) {
        showMessage("Please enter a valid email address.", true);
        emailInput.focus();
        return;
    }

    const isEditing = studentId.value !== "";
    const url = isEditing ? `${API_URL}/${studentId.value}` : API_URL;

    try {
        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(student)
        });

        if (!response.ok) {
            let errorMessage = `Request failed: ${response.status}`;

            try {
                const errorData = await response.json();

                if (errorData.messages) {
                    errorMessage = Object.values(errorData.messages).join(" ");
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch {
                // Keep the default error message.
            }

            throw new Error(errorMessage);
        }

        studentForm.reset();
        resetForm();

        showMessage(
            isEditing
                ? "Student updated successfully!"
                : "Student added successfully!"
        );

        await loadStudents();

    } catch (error) {
        showMessage(error.message || "Could not save student.", true);
        console.error(error);
    }
});

function editStudent(student) {
    studentId.value = student.id;
    nameInput.value = student.name ?? "";
    emailInput.value = student.email ?? "";
    courseInput.value = student.course ?? "";

    formTitle.textContent = "Edit Student";
    submitBtn.textContent = "Update Student";
    cancelBtn.hidden = false;

    nameInput.focus();
}

function resetForm() {
    studentId.value = "";
    formTitle.textContent = "Add Student";
    submitBtn.textContent = "Add Student";
    cancelBtn.hidden = true;
}

cancelBtn.addEventListener("click", function() {
    studentForm.reset();
    resetForm();
    showMessage("");
});

async function deleteStudent(id) {
    if (!confirm(`Are you sure you want to delete student ID ${id}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error(`Delete failed: ${response.status}`);
        }

        showMessage("Student deleted successfully!");
        await loadStudents();

    } catch (error) {
        showMessage("Could not delete student.", true);
        console.error(error);
    }
}

loadStudents();
