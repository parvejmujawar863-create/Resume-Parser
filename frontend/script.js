
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resume-form");
    const fileInput = document.getElementById("resume-file");
    const uploadZone = document.getElementById("upload-zone");
    const uploadTitle = document.getElementById("upload-title");
    const uploadDescription = document.getElementById("upload-description");
    const uploadIcon = document.getElementById("upload-icon");
    const jobDescription = document.getElementById("job-description");
    const characterCount = document.getElementById("character-count");
    const analyzeButton = document.getElementById("analyze-button");
    const formMessage = document.getElementById("form-message");

    const API_URL = "http://127.0.0.1:5000/api/analyze";
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

    let selectedFile = null;

    // Create the results area without changing index.html.
    const results = document.createElement("section");
    results.id = "analysis-results";
    results.hidden = true;
    results.style.cssText = `
        margin-top: 24px;
        padding: 24px;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #ffffff;
        color: #25243a;
        overflow-wrap: anywhere;
    `;

    form.insertAdjacentElement("afterend", results);

    function showMessage(message, type = "info") {
        formMessage.textContent = message;
        formMessage.hidden = false;
        formMessage.dataset.type = type;
    }

    function clearMessage() {
        formMessage.textContent = "";
        formMessage.hidden = true;
        delete formMessage.dataset.type;
    }

    function getExtension(filename) {
        const dotIndex = filename.lastIndexOf(".");
        return dotIndex >= 0
            ? filename.slice(dotIndex).toLowerCase()
            : "";
    }

    function formatFileSize(bytes) {
        return bytes < 1024 * 1024
            ? `${(bytes / 1024).toFixed(1)} KB`
            : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function resetFileDisplay() {
        selectedFile = null;
        fileInput.value = "";
        uploadTitle.textContent = "Drop your resume here";
        uploadDescription.innerHTML =
            'or <span class="browse-text">browse files</span> from your device';

        uploadIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.7"
                 stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
                <path d="M12 16V4m-5 5 5-5 5 5"/>
                <path d="M20 16.5v3A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5v-3"/>
            </svg>
        `;
    }

    function validateFile(file) {
        if (!file) return "Please select a resume file first.";

        if (!ALLOWED_EXTENSIONS.includes(getExtension(file.name))) {
            return "Please select a PDF, DOCX, or TXT file.";
        }

        if (file.size === 0) return "The selected file is empty.";

        if (file.size > MAX_FILE_SIZE) {
            return "File is larger than 5 MB. Please choose a smaller file.";
        }

        return "";
    }

    function handleFileSelection(file) {
        clearMessage();

        const error = validateFile(file);

        if (error) {
            resetFileDisplay();
            showMessage(error, "error");
            return;
        }

        selectedFile = file;
        fileInput.value = "";

        uploadTitle.textContent = file.name;
        uploadDescription.textContent =
            `${formatFileSize(file.size)} · Ready to analyze`;

        uploadIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
                <path d="M5 12.5 9.5 17 19 7.5"/>
            </svg>
        `;

        showMessage(`Resume selected: ${file.name}`, "success");
    }

    fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (file) handleFileSelection(file);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
        uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            uploadZone.classList.add("drag-over");
        });
    });

    ["dragleave", "dragend"].forEach((eventName) => {
        uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            uploadZone.classList.remove("drag-over");
        });
    });

    uploadZone.addEventListener("drop", (event) => {
        event.preventDefault();
        uploadZone.classList.remove("drag-over");

        const file = event.dataTransfer?.files?.[0];

        if (file) {
            handleFileSelection(file);
        } else {
            showMessage("Please drop a valid resume file.", "error");
        }
    });

    jobDescription.addEventListener("input", () => {
        characterCount.textContent =
            `${jobDescription.value.length} / 15000`;
    });

    characterCount.textContent =
        `${jobDescription.value.length} / 15000`;

    function addHeading(text) {
        const heading = document.createElement("h3");
        heading.textContent = text;
        heading.style.cssText = "margin:22px 0 10px;font-size:17px;";
        results.appendChild(heading);
    }

    function addText(text) {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        paragraph.style.cssText =
            "margin:8px 0;color:#5b5b70;line-height:1.6;";
        results.appendChild(paragraph);
    }

    function addSkills(title, skills) {
        addHeading(title);

        if (!skills || skills.length === 0) {
            addText("No matching keywords found.");
            return;
        }

        const list = document.createElement("div");
        list.style.cssText =
            "display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;";

        skills.forEach((skill) => {
            const chip = document.createElement("span");
            chip.textContent = skill;
            chip.style.cssText = `
                padding:7px 11px;
                border-radius:20px;
                background:#f0edff;
                color:#5141a5;
                font-size:13px;
            `;
            list.appendChild(chip);
        });

        results.appendChild(list);
    }

    function displayResults(data) {
        results.replaceChildren();
        results.hidden = false;

        const heading = document.createElement("h2");
        heading.textContent = "Resume Analysis Results";
        heading.style.cssText = "margin:0 0 12px;font-size:23px;";
        results.appendChild(heading);

        addText(`File: ${data.filename}`);
        addText(`Extracted characters: ${data.character_count}`);
        addText(`Skills detected: ${data.skills_count}`);

        const score = document.createElement("div");
        score.style.cssText = `
            margin-top:18px;padding:18px;border-radius:14px;
            background:#f5f2ff;text-align:center;
        `;

        const scoreLabel = document.createElement("div");
        scoreLabel.textContent = "Job keyword match";
        scoreLabel.style.cssText = "font-size:14px;color:#5b5b70;";

        const scoreValue = document.createElement("div");
        scoreValue.style.cssText =
            "font-size:36px;font-weight:700;margin-top:5px;color:#5141a5;";
        scoreValue.textContent = data.match_score === null
            ? "N/A"
            : `${data.match_score}%`;

        score.append(scoreLabel, scoreValue);
        results.appendChild(score);

        addSkills("Skills found in your resume", data.skills);
        addSkills("Matched job skills", data.matched_skills);
        addSkills("Skills not detected in your resume", data.missing_skills);

        addText(data.message);

        results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();

        const error = validateFile(selectedFile);

        if (error) {
            showMessage(error, "error");
            uploadZone.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
            return;
        }

        const description = jobDescription.value.trim();

        if (description.length > 15000) {
            showMessage("Job description must be 15,000 characters or less.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("resume", selectedFile);
        formData.append("job_description", description);

        analyzeButton.disabled = true;
        const originalButtonText = analyzeButton.textContent;
        analyzeButton.textContent = "Analyzing...";
        results.hidden = true;

        showMessage("Uploading and analyzing your resume. Please wait...", "info");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Resume analysis failed.");
            }

            displayResults(data);
            showMessage("Resume analysis completed successfully.", "success");

        } catch (error) {
            console.error("Resume analysis error:", error);

            showMessage(
                error.message.includes("Failed to fetch")
                    ? "Cannot reach the backend. Check that the Flask server is running at http://127.0.0.1:5000."
                    : error.message,
                "error"
            );

        } finally {
            analyzeButton.disabled = false;
            analyzeButton.textContent = originalButtonText;
        }
    });
});
