"use strict";

const STORAGE_KEY = "mdp-field-manual-v1";

const defaultState = {
  profile: {
    name: "",
    role: "Account Executive",
    market: "California",
    problem: "",
    solution: "",
    impact: "",
    validation: ""
  },
  checks: {},
  connections: [],
  reps: 0,
  scores: {}
};

const state = loadState();
let activeScript = "intro30";
let timerId = null;
let timerRemaining = 30;
let pressureTimerId = null;
let currentScenarioIndex = 0;
let mediaRecorder = null;
let recordedChunks = [];
let recordingStream = null;
let scriptFontSize = 30;

const scriptMeta = {
  intro15: { label: "15-SECOND INTRO", seconds: 15 },
  intro30: { label: "30-SECOND INTRO", seconds: 30 },
  story60: { label: "60-SECOND STORY", seconds: 60 },
  innovation: { label: "INNOVATION ANSWER", seconds: 60 },
  mattBridge: { label: "MATT COOK BRIDGE", seconds: 35 }
};

const scenarios = [
  {
    audience: "SENIOR LEADER",
    seconds: 45,
    context: "You have just been introduced during a break. The leader is warm but moving quickly.",
    prompt: "Tell me about yourself.",
    structure: ["Role and market", "Repeated proof: five years of execution", "Distinctive proof: Quote Quick", "Purpose: learning to scale through people"],
    watch: "Do not turn this into a résumé recital. One sentence per proof point."
  },
  {
    audience: "BUSINESS EXECUTIVE",
    seconds: 60,
    context: "Your Innovation Summit win comes up naturally in conversation.",
    prompt: "What did Gen AI Quote Quick actually accomplish?",
    structure: ["Name the field problem in plain language", "Explain what you built without leading with the stack", "Give the honest result or strongest evidence", "State the business and leadership lesson"],
    watch: "Never invent a metric. If the value was a validated concept or lesson, say exactly that."
  },
  {
    audience: "MDP FACILITATOR",
    seconds: 45,
    context: "The facilitator asks what you want from the program.",
    prompt: "What are you hoping to get from MDP?",
    structure: ["Acknowledge the move from individual performance to broader impact", "Name one leadership capability to build", "Name how customers or teams benefit", "End with openness to feedback"],
    watch: "Avoid answering with a title you want. Answer with the scope and impact you are preparing to own."
  },
  {
    audience: "SALES LEADER",
    seconds: 45,
    context: "A leader respects your results but challenges your management readiness.",
    prompt: "Being a strong seller is not the same as leading people. Why are you ready?",
    structure: ["Agree with the premise", "Separate personal output from creating conditions for others", "Give one influence or coaching example", "Name what you still need to learn"],
    watch: "Do not claim management experience you do not have. Show leadership before title and honest learning agility."
  },
  {
    audience: "MATT COOK",
    seconds: 45,
    context: "The new Mid-Markets leader asks for a field perspective.",
    prompt: "What seller friction should I understand first?",
    structure: ["Describe one specific friction point", "Explain customer or seller impact", "Share the signal—not a complaint", "Offer a small test or learning question"],
    watch: "Be candid without sounding cynical. Bring signal plus a constructive next move."
  },
  {
    audience: "PEER PARTICIPANT",
    seconds: 30,
    context: "A peer asks what makes you different from other high-performing sellers.",
    prompt: "What is your edge?",
    structure: ["Execution is the baseline", "Your edge is noticing repeatable friction", "You turn insight into practical action", "You want to help others benefit too"],
    watch: "Confidence is welcome. Comparison and one-upmanship are not."
  },
  {
    audience: "EXECUTIVE",
    seconds: 45,
    context: "An executive asks about your ambition directly.",
    prompt: "What do you want to do next at AT&T?",
    structure: ["Name the kind of problems and scope you want", "Connect it to customers, teams, and growth", "Show readiness to earn it", "Ask what capability matters most"],
    watch: "Be ambitious without asking this person to hand you a job in the hallway."
  },
  {
    audience: "SHELLEY GOODMAN",
    seconds: 30,
    context: "You have a brief chance to speak with Shelley after her retirement announcement.",
    prompt: "What would you say—and ask?",
    structure: ["Congratulate her with restraint", "Acknowledge the impact of a 37-year career", "Ask one forward-looking leadership question", "Thank her and release the conversation"],
    watch: "Do not make the transition gossip or compare her with the incoming leader."
  },
  {
    audience: "SENIOR LEADER",
    seconds: 60,
    context: "A leader tests your self-awareness.",
    prompt: "What leadership habit do you need to change?",
    structure: ["Name a real habit, not a disguised strength", "Explain its impact", "Describe the practice you are using", "Say how you will know it changed"],
    watch: "A strong option is learning to create clarity and ownership for others instead of personally rescuing every outcome—but use it only if true."
  },
  {
    audience: "NETWORKING CIRCLE",
    seconds: 20,
    context: "Three people are already talking when you approach.",
    prompt: "Join the conversation without hijacking it.",
    structure: ["Listen for a beat", "Ask permission or build on the current topic", "Offer one short relevant point", "Return the floor with a question"],
    watch: "Your goal is entry and contribution, not immediate differentiation."
  }
];

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...structuredClone(defaultState),
      ...stored,
      profile: { ...defaultState.profile, ...(stored?.profile || {}) },
      checks: stored?.checks || {},
      connections: Array.isArray(stored?.connections) ? stored.connections : [],
      scores: stored?.scores || {}
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  })[character]);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

function navigate(screenName, updateHash = true) {
  document.querySelectorAll("[data-screen]").forEach((screen) => {
    const isActive = screen.dataset.screen === screenName;
    screen.hidden = !isActive;
    screen.classList.toggle("active", isActive);
  });
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === screenName);
  });
  if (updateHash) history.replaceState(null, "", `#${screenName}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("mainContent").focus({ preventScroll: true });
}

function profileValue(key, fallback) {
  const value = state.profile[key]?.trim();
  return value || fallback;
}

function roleWithArticle(role) {
  const article = /^[aeiou]/i.test(role.trim()) ? "an" : "a";
  return `${article} ${role}`;
}

function buildScripts() {
  const name = profileValue("name", "[your name]");
  const role = profileValue("role", "Account Executive");
  const market = profileValue("market", "California");
  const problem = profileValue("problem", "[the specific field problem you saw]");
  const solution = profileValue("solution", "[what you built or changed]");
  const impact = profileValue("impact", "[the honest result, evidence, or lesson]");
  const validation = profileValue("validation", "[what still needs to be proven before scale]");
  const describedRole = roleWithArticle(role);

  return {
    intro15: {
      text: `Hi, I’m ${name}, ${describedRole} in ${market}. I’m a consistent performer who also builds—Gen AI Quote Quick won the 2024 AT&T Innovation Summit. I’m at MDP to learn how to scale that impact through people and the business.`,
      coach: "Land three signals only: operator → builder → multiplier. Do not rush the final sentence."
    },
    intro30: {
      text: `Hi, I’m ${name}, ${describedRole} in ${market}. Over five years at AT&T, I’ve built a track record of consistently exceeding my goals. What differentiates me is that I don’t just work around friction—I look for ways to remove it. In 2024, that led me to build Gen AI Quote Quick, which won the AT&T Innovation Summit. I’m at MDP to strengthen how I turn frontline insight and disciplined execution into broader impact for customers and teams.`,
      coach: "Recommended default. Sound conversational: pause after your performance proof, then let the innovation be evidence—not the headline."
    },
    story60: {
      text: `I’m ${name}, ${describedRole} serving ${market}. For five years at AT&T, I’ve consistently exceeded my goals and earned multiple awards, but the pattern I’m most proud of is how I respond when I see repeatable friction. In 2024, I focused on ${problem}. I ${solution}. That work became Gen AI Quote Quick and won the AT&T Innovation Summit. The strongest result was ${impact}. The experience taught me that innovation is not about showing off technology—it is about understanding the work, earning adoption, and translating an idea into measurable business value. I’m at MDP because I want to apply that same discipline at a broader level and learn how to create the conditions for other people to perform at their best.`,
      coach: "Before using this version, replace every bracketed field. Keep the result honest. If no measured impact exists, state what was validated and what you learned."
    },
    innovation: {
      text: `Gen AI Quote Quick started with ${problem}. I ${solution}. It went on to win the 2024 AT&T Innovation Summit, but the award is not the part I lead with. The business lesson was ${impact}. Before recommending broader use, I would want to validate ${validation}. It reinforced a leadership approach I want to keep building: stay close to the work, define the problem clearly, involve the people who will use the solution, and measure whether the change actually makes their job or the customer experience better.`,
      coach: "Use Problem → Action → Evidence → What remains unproven → Leadership lesson. Do not explain the code unless the listener asks."
    },
    mattBridge: {
      text: `Matt, welcome back to AT&T. As you return to Mid-Markets, what field behavior do you think most separates a strong individual seller from someone ready to lead and scale a team? I ask because I’ve built a strong performance record and also worked on field-led innovation through Gen AI Quote Quick. I’m trying to become more intentional about turning those instincts into impact through other people—not only through my own results.`,
      coach: "Ask the question first. Use the Quote Quick bridge only if the conversation creates room. A clean question is stronger than a compressed pitch."
    }
  };
}

function renderScript(name = activeScript) {
  activeScript = name;
  const scripts = buildScripts();
  const selected = scripts[name];
  document.getElementById("scriptText").textContent = selected.text;
  document.getElementById("scriptCoach").textContent = selected.coach;
  document.getElementById("scriptLabel").textContent = scriptMeta[name].label;
  document.querySelectorAll(".script-tab").forEach((tab) => {
    const isActive = tab.dataset.script === name;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  timerRemaining = scriptMeta[name].seconds;
  clearInterval(timerId);
  timerId = null;
  renderTimer();
}

function fillProfileForm() {
  const form = document.getElementById("profileForm");
  Object.entries(state.profile).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
}

function updatePersonalizedText() {
  const name = profileValue("name", "[your name]");
  const role = profileValue("role", "Account Executive");
  const market = profileValue("market", "California");
  document.getElementById("quickOpening").textContent = `“I’m ${name}, ${roleWithArticle(role)} in ${market}. I’ve spent five years building a strong performance record, and I’m especially interested in turning field friction into scalable improvements.”`;
  renderScript(activeScript);
}

function renderTimer() {
  const display = document.getElementById("timerDisplay");
  display.textContent = formatSeconds(timerRemaining);
  display.classList.toggle("urgent", timerRemaining > 0 && timerRemaining <= 5);
  display.classList.toggle("done", timerRemaining === 0);
}

function formatSeconds(total) {
  const minutes = Math.floor(total / 60).toString().padStart(2, "0");
  const seconds = Math.max(0, total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function startMainTimer() {
  if (timerId) return;
  if (timerRemaining === 0) timerRemaining = scriptMeta[activeScript].seconds;
  renderTimer();
  timerId = setInterval(() => {
    timerRemaining -= 1;
    renderTimer();
    if (timerRemaining <= 0) {
      clearInterval(timerId);
      timerId = null;
      showToast("Time. Finish the sentence, then stop.");
    }
  }, 1000);
}

function resetMainTimer() {
  clearInterval(timerId);
  timerId = null;
  timerRemaining = scriptMeta[activeScript].seconds;
  renderTimer();
}

async function startRecording() {
  const status = document.getElementById("recordStatus");
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    status.textContent = "Audio recording is not supported in this browser.";
    return;
  }
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(recordingStream);
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const playback = document.getElementById("recordingPlayback");
      if (playback.src) URL.revokeObjectURL(playback.src);
      playback.src = URL.createObjectURL(blob);
      playback.hidden = false;
      status.textContent = "Recording ready for private playback. Refreshing the page removes it.";
      recordingStream?.getTracks().forEach((track) => track.stop());
      recordingStream = null;
    });
    mediaRecorder.start();
    document.getElementById("recordButton").disabled = true;
    document.getElementById("stopRecord").disabled = false;
    status.textContent = "Recording… speak naturally.";
  } catch (error) {
    status.textContent = error?.name === "NotAllowedError"
      ? "Microphone permission was not granted. You can still use the timer and model tracks."
      : "The microphone could not start. Try a current browser on localhost.";
  }
}

function stopRecording() {
  if (mediaRecorder?.state === "recording") mediaRecorder.stop();
  document.getElementById("recordButton").disabled = false;
  document.getElementById("stopRecord").disabled = true;
}

function renderChecks() {
  document.querySelectorAll("[data-check]").forEach((input) => {
    input.checked = Boolean(state.checks[input.dataset.check]);
  });
  const missionKeys = ["mission-5", "mission-3", "mission-1"];
  const complete = missionKeys.filter((key) => state.checks[key]).length;
  const percent = Math.round((complete / missionKeys.length) * 100);
  const ring = document.querySelector(".progress-ring");
  ring.style.setProperty("--progress", `${percent}%`);
  document.getElementById("missionProgress").textContent = `${percent}%`;
}

function renderScenario() {
  clearInterval(pressureTimerId);
  pressureTimerId = null;
  const scenario = scenarios[currentScenarioIndex];
  document.getElementById("scenarioAudience").textContent = scenario.audience;
  document.getElementById("scenarioTime").textContent = `${scenario.seconds} seconds`;
  document.getElementById("scenarioContext").textContent = scenario.context;
  document.getElementById("scenarioPrompt").textContent = scenario.prompt;
  const pressureTimer = document.getElementById("pressureTimer");
  pressureTimer.dataset.remaining = String(scenario.seconds);
  pressureTimer.textContent = formatSeconds(scenario.seconds);
  pressureTimer.className = "pressure-timer";
  document.getElementById("coachPanel").className = "panel coach-panel";
  document.getElementById("coachPanel").innerHTML = `<span class="eyebrow">COACHING LOCKED</span><h2>Finish your answer first.</h2><p>The goal is not a perfect answer. It is a clear, commercial answer with one useful point.</p>`;
  document.querySelectorAll("[data-score]").forEach((button) => button.classList.remove("selected"));
}

function startPressureTimer() {
  const element = document.getElementById("pressureTimer");
  if (pressureTimerId) return;
  let remaining = Number(element.dataset.remaining);
  if (remaining <= 0) remaining = scenarios[currentScenarioIndex].seconds;
  element.dataset.remaining = String(remaining);
  element.textContent = formatSeconds(remaining);
  pressureTimerId = setInterval(() => {
    remaining -= 1;
    element.dataset.remaining = String(remaining);
    element.textContent = formatSeconds(remaining);
    element.classList.toggle("urgent", remaining > 0 && remaining <= 5);
    if (remaining <= 0) {
      clearInterval(pressureTimerId);
      pressureTimerId = null;
      element.classList.add("done");
      showToast("Time. Land one sentence and stop.");
    }
  }, 1000);
}

function revealScenarioCoach() {
  const scenario = scenarios[currentScenarioIndex];
  const panel = document.getElementById("coachPanel");
  panel.classList.add("revealed");
  panel.innerHTML = `
    <span class="eyebrow">DIRECTOR’S FRAME</span>
    <h2>Build the answer in four moves.</h2>
    <ol>${scenario.structure.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    <p><b>Watch:</b> ${escapeHtml(scenario.watch)}</p>`;
  state.reps += 1;
  document.getElementById("repCount").textContent = String(state.reps);
  saveState();
}

function nextScenario() {
  let next = currentScenarioIndex;
  while (next === currentScenarioIndex && scenarios.length > 1) {
    next = Math.floor(Math.random() * scenarios.length);
  }
  currentScenarioIndex = next;
  renderScenario();
}

function renderConnections() {
  const list = document.getElementById("connectionList");
  const count = state.connections.length;
  document.getElementById("connectionCount").textContent = `${count} captured`;
  if (!count) {
    list.innerHTML = `<div class="connection-empty"><b>No conversations captured yet.</b><br>After a useful exchange, save the insight and your next action here.</div>`;
    return;
  }
  list.innerHTML = state.connections.map((connection) => `
    <article class="connection-item">
      <div>
        <h3>${escapeHtml(connection.person)}${connection.role ? `<span class="connection-role">${escapeHtml(connection.role)}</span>` : ""}</h3>
        <p>${escapeHtml(connection.insight)}</p>
        ${connection.action ? `<small><b>Next action:</b> ${escapeHtml(connection.action)}${connection.followUp ? ` · by ${escapeHtml(connection.followUp)}` : ""}</small>` : ""}
      </div>
      <button type="button" data-delete-connection="${escapeHtml(connection.id)}" aria-label="Delete note for ${escapeHtml(connection.person)}">×</button>
    </article>`).join("");
}

function exportConnections() {
  const lines = [
    "# AT&T MDP Connection Log",
    "",
    `Exported: ${new Date().toLocaleString()}`,
    ""
  ];
  if (!state.connections.length) lines.push("No conversations captured yet.");
  state.connections.forEach((connection, index) => {
    lines.push(`## ${index + 1}. ${connection.person}${connection.role ? ` — ${connection.role}` : ""}`);
    lines.push(`- Insight: ${connection.insight}`);
    if (connection.action) lines.push(`- Next action: ${connection.action}`);
    if (connection.followUp) lines.push(`- Follow up by: ${connection.followUp}`);
    lines.push("");
  });
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "MDP-Connection-Log.md";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  showToast("Connection log exported.");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied.");
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast("Copied.");
  }
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => copyText(document.getElementById(button.dataset.copyTarget).textContent));
  });

  document.querySelectorAll("[data-copy-text]").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copyText));
  });

  document.querySelectorAll("[data-check]").forEach((input) => {
    input.addEventListener("change", () => {
      state.checks[input.dataset.check] = input.checked;
      saveState();
      renderChecks();
    });
  });

  document.getElementById("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.profile = Object.fromEntries(data.entries());
    saveState();
    updatePersonalizedText();
    showToast("Scripts updated locally.");
  });

  document.getElementById("resetProfile").addEventListener("click", () => {
    state.profile = structuredClone(defaultState.profile);
    saveState();
    fillProfileForm();
    updatePersonalizedText();
    showToast("Personal fields reset.");
  });

  document.querySelectorAll(".script-tab").forEach((tab) => {
    tab.addEventListener("click", () => renderScript(tab.dataset.script));
  });

  document.getElementById("fontUp").addEventListener("click", () => {
    scriptFontSize = Math.min(42, scriptFontSize + 2);
    document.getElementById("scriptText").style.setProperty("--script-size", `${scriptFontSize}px`);
  });
  document.getElementById("fontDown").addEventListener("click", () => {
    scriptFontSize = Math.max(20, scriptFontSize - 2);
    document.getElementById("scriptText").style.setProperty("--script-size", `${scriptFontSize}px`);
  });

  document.getElementById("startTimer").addEventListener("click", startMainTimer);
  document.getElementById("resetTimer").addEventListener("click", resetMainTimer);
  document.getElementById("recordButton").addEventListener("click", startRecording);
  document.getElementById("stopRecord").addEventListener("click", stopRecording);

  document.getElementById("startScenario").addEventListener("click", startPressureTimer);
  document.getElementById("revealCoach").addEventListener("click", revealScenarioCoach);
  document.getElementById("nextScenario").addEventListener("click", nextScenario);
  document.querySelectorAll("[data-score]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("selected");
      state.scores[button.dataset.score] = (state.scores[button.dataset.score] || 0) + (button.classList.contains("selected") ? 1 : 0);
      saveState();
    });
  });

  document.getElementById("connectionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    state.connections.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      person: data.person.trim(),
      role: data.role.trim(),
      insight: data.insight.trim(),
      action: data.action.trim(),
      followUp: data.followUp
    });
    saveState();
    event.currentTarget.reset();
    renderConnections();
    showToast("Conversation captured.");
  });

  document.getElementById("connectionList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-connection]");
    if (!button) return;
    state.connections = state.connections.filter((item) => item.id !== button.dataset.deleteConnection);
    saveState();
    renderConnections();
    showToast("Note removed.");
  });

  document.getElementById("exportNotes").addEventListener("click", exportConnections);
  document.getElementById("printQuickCard").addEventListener("click", () => window.print());

  window.addEventListener("hashchange", () => {
    const target = location.hash.slice(1);
    if (document.querySelector(`[data-screen="${CSS.escape(target)}"]`)) navigate(target, false);
  });
}

function init() {
  fillProfileForm();
  updatePersonalizedText();
  renderChecks();
  renderConnections();
  document.getElementById("repCount").textContent = String(state.reps);
  currentScenarioIndex = Math.floor(Math.random() * scenarios.length);
  renderScenario();
  bindEvents();
  const hashScreen = location.hash.slice(1);
  if (hashScreen && document.querySelector(`[data-screen="${CSS.escape(hashScreen)}"]`)) navigate(hashScreen, false);
}

document.addEventListener("DOMContentLoaded", init);
