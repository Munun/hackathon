// upload-record.js
// Researcher criteria form -> POST /api/find-candidates
// Expects server to return something like:
// { ok: true, count: 10, candidates: [{ id: "DID: 0x..", score: 92, tags: ["..."] }, ...] }

const form = document.getElementById("criteriaForm");
const messageEl = document.getElementById("message");
const resultsEl = document.getElementById("results");
const resultsListEl = document.getElementById("resultsList");

function showMessage(type, text) {
  messageEl.classList.remove("hidden", "success", "error");
  messageEl.classList.add(type);
  messageEl.textContent = text;
}

function hideMessage() {
  messageEl.classList.add("hidden");
  messageEl.classList.remove("success", "error");
  messageEl.textContent = "";
}

function showResults(candidates = []) {
  resultsListEl.innerHTML = "";

  if (!candidates.length) {
    resultsEl.classList.remove("hidden");
    resultsListEl.innerHTML = `
      <div class="result-card">
        <div class="result-top">
          <div class="result-id">No candidates returned</div>
          <div class="result-score">0%</div>
        </div>
        <div class="result-tags">
          <span class="tag">Try broadening filters</span>
        </div>
      </div>
    `;
    return;
  }

  const cards = candidates.map((c) => {
    const id = c.id || c.user_id || c.did || "DID: anonymized";
    const score = typeof c.score === "number" ? c.score : (typeof c.match_score === "number" ? c.match_score : null);
    const tags = Array.isArray(c.tags) ? c.tags : (Array.isArray(c.match_tags) ? c.match_tags : []);

    return `
      <div class="result-card">
        <div class="result-top">
          <div class="result-id">${escapeHtml(String(id))}</div>
          <div class="result-score">${score !== null ? `${Math.round(score)}%` : "Match"}</div>
        </div>
        <div class="result-tags">
          ${(tags.length ? tags : ["Candidate"]).map(t => `<span class="tag">${escapeHtml(String(t))}</span>`).join("")}
        </div>
      </div>
    `;
  });

  resultsEl.classList.remove("hidden");
  resultsListEl.innerHTML = cards.join("");
}

function hideResults() {
  resultsEl.classList.add("hidden");
  resultsListEl.innerHTML = "";
}

function getMultiSelectValues(selectEl) {
  if (!selectEl) return [];
  return Array.from(selectEl.selectedOptions).map((o) => o.value);
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("reset", () => {
  hideMessage();
  hideResults();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage();
  hideResults();

  const candidateLimit = document.getElementById("candidate_limit").value;
  const ageRange = document.getElementById("age_range").value;
  const gender = document.getElementById("gender").value;
  const ethnicityGroup = document.getElementById("ethnicity_group").value;

  const primaryCondition = document.getElementById("primary_condition").value;
  const conditionSeverity = document.getElementById("condition_severity").value;

  const medicationClass = document.getElementById("medication_class").value;
  const smokingStatus = document.getElementById("smoking_status").value;

  const bmiRange = document.getElementById("bmi_range").value;
  const bpRange = document.getElementById("bp_range").value;
  const hba1cRange = document.getElementById("hba1c_range").value;

  const exclusions = getMultiSelectValues(document.getElementById("exclusion_flags"));
  const studyType = document.getElementById("study_type").value;

  if (!candidateLimit || !ageRange || !primaryCondition) {
    showMessage("error", "Please fill all required fields: number of candidates, age range, and primary condition.");
    return;
  }

  const payload = {
    limit: Number(candidateLimit),
    study_type: studyType,

    demographics: {
      age_range: ageRange,
      gender: gender || "Any",
      ethnicity_group: ethnicityGroup || "Any",
    },

    clinical: {
      primary_condition: primaryCondition,
      severity: conditionSeverity || "Any",
      medication_class: medicationClass || "Any",
      smoking_status: smokingStatus || "Any",
      exclusions,
    },

    metrics: {
      bmi_range: bmiRange || "Any",
      bp_range: bpRange || "Any",
      hba1c_range: hba1cRange || "Any",
    }
  };

  try {
    const res = await fetch("/api/find-candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Try to parse JSON, even on errors (to show nicer messages)
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        `Request failed (${res.status}). Make sure /api/find-candidates exists in server.js.`;
      showMessage("error", msg);
      return;
    }

    const count = typeof data?.count === "number" ? data.count : (Array.isArray(data?.candidates) ? data.candidates.length : 0);
    showMessage("success", `Found ${count} suitable candidate${count === 1 ? "" : "s"}.`);

    if (Array.isArray(data?.candidates)) {
      showResults(data.candidates);
    } else {
      // If backend only returns a count for now
      showResults([]);
    }
  } catch (err) {
    showMessage("error", "Network error. Is your backend running on port 8000?");
  }
});

