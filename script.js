const $ = (id) => document.getElementById(id);

let currentSettings = null;
let currentFeedbackKey = null;

const packageProfiles = {
  basic: {
    general: 166, redDot: 160, scope2: 150,
    scope4: 138, sniper: 82, freeLook: 125, button: 47
  },
  premium: {
    general: 171, redDot: 166, scope2: 155,
    scope4: 144, sniper: 85, freeLook: 130, button: 48
  },
  pro: {
    general: 176, redDot: 171, scope2: 160,
    scope4: 148, sniper: 88, freeLook: 135, button: 49
  },
  ultimate: {
    general: 181, redDot: 176, scope2: 165,
    scope4: 152, sniper: 91, freeLook: 140, button: 50
  }
};

const styleAdjustments = {
  balanced: {},

  drag: {
    general: 3,
    redDot: 3,
    scope2: 1
  },

  freestyle: {
    general: 4,
    redDot: 3,
    scope2: 1
  },

  brazilian: {
    general: 7,
    redDot: 5,
    scope2: 3,
    scope4: 2
  },

  precision: {
    general: -4,
    redDot: -3,
    scope2: -2,
    scope4: 1,
    sniper: 3
  }
};
  

// Conservative model-family starting adjustments.
// These are estimates, not laboratory measurements.
const modelProfiles = [
  { match: /spark 9t/i, general: 1, redDot: 1 },
  { match: /spark 7/i, general: -1, redDot: -1 },
  { match: /pop 8|pop 9|pop 10/i, general: -2, redDot: -1 },
  { match: /smart 3|smart 8|smart hd/i, general: -2, redDot: -2 },
  { match: /hot 10|hot 20i|hot 17/i, general: -1, redDot: -1 },
  { match: /redmi a2|redmi a7/i, general: -2, redDot: -1 },
  { match: /redmi 14c|redmi 15c/i, general: 0, redDot: 0 },
  { match: /galaxy a07|galaxy a06|galaxy a04/i, general: -1, redDot: -1 },
  { match: /galaxy a12|galaxy a14/i, general: -1, redDot: 0 },
  { match: /iphone 7|iphone 11/i, general: 1, redDot: 1 },
  { match: /iphone 17/i, general: 2, redDot: 1 }
];

function clamp(value, min = 0, max = 200) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function getModelAdjustment(model) {
  const profile = modelProfiles.find(item => item.match.test(model));
  return profile || { general: 0, redDot: 0 };
}

function getFeedbackKey(brand, model, ram, performance, pack, style) {
  return [
    brand.toLowerCase(),
    model.toLowerCase().trim(),
    ram,
    performance,
    pack,
    style
  ].join("|");
}

function getSavedFeedback(key) {
  try {
    return JSON.parse(localStorage.getItem("hsl_feedback_" + key)) || {
      general: 0,
      redDot: 0,
      scope2: 0
    };
  } catch {
    return { general: 0, redDot: 0, scope2: 0 };
  }
}

function generateSettings() {
  const brand = $("brand").value.trim();
  const model = $("model").value.trim();
  const ram = Number($("ram").value);
  const performance = $("performance").value;
  const pack = $("package").value;
  const style = $("style").value;
  const experience = $("experience").value;

  if (!brand || !model || !ram || !performance || !pack || !style) {
    alert("Please complete all device and sensitivity options.");
    return;
  }

  if (!$("followConfirm").checked) {
    alert("Please visit the ZENKAI EMPIRE channel and confirm before generating.");
    return;
  }

  const base = { ...packageProfiles[pack] };
  const modelAdj = getModelAdjustment(model);
  const styleAdj = styleAdjustments[style] || {};
  const feedbackKey = getFeedbackKey(
    brand, model, ram, performance, pack, style
  );
  const feedback = getSavedFeedback(feedbackKey);

  // Device family adjustment
  base.general += modelAdj.general;
  base.redDot += modelAdj.redDot;

  // RAM adjustment
  if (ram <= 3) {
    base.general -= 2;
    base.redDot -= 1;
    base.scope2 -= 1;
  } else if (ram >= 8) {
    base.general += 1;
    base.redDot += 1;
  }

  // User-reported game performance adjustment
  if (performance === "low") {
    base.general -= 3;
    base.redDot -= 2;
    base.scope2 -= 2;
    base.scope4 -= 1;
  } else if (performance === "high") {
    base.general += 2;
    base.redDot += 1;
    base.scope2 += 1;
  }

  // Experience adjustment
  if (experience === "beginner") {
    base.general -= 2;
    base.redDot -= 2;
  } else if (experience === "advanced") {
    base.general += 1;
    base.redDot += 1;
  }

  // Playing style adjustment
  Object.keys(styleAdj).forEach(key => {
    base[key] = (base[key] || 0) + styleAdj[key];
  });

  // Saved feedback for this exact device and selection
  base.general += feedback.general;
  base.redDot += feedback.redDot;
  base.scope2 += feedback.scope2;

  // Keep all values within Free Fire's sensitivity range
  Object.keys(base).forEach(key => {
    if (key === "button") {
      base[key] = clamp(base[key], 1, 100);
    } else {
      base[key] = clamp(base[key], 0, 200);
    }
  });

  currentSettings = base;
  currentFeedbackKey = feedbackKey;

  $("deviceResult").textContent =
    `${brand} ${model} | ${ram} GB RAM | ${performance} performance | ` +
    `${pack.toUpperCase()} | ${style.toUpperCase()}`;

  $("general").textContent = base.general;
  $("redDot").textContent = base.redDot;
  $("scope2").textContent = base.scope2;
  $("scope4").textContent = base.scope4;
  $("sniper").textContent = base.sniper;
  $("freeLook").textContent = base.freeLook;
  $("buttonSize").textContent = base.button + "%";

  $("tips").textContent =
    "Start with these settings in Training Mode. Test your drag control, " +
    "then make small changes if your aim feels too fast or too slow. " +
    "Give yourself time to build muscle memory.";

  $("feedbackMessage").textContent = "";
  $("result").hidden = false;
  $("result").scrollIntoView({ behavior: "smooth", block: "start" });
}

function saveFeedback(type) {
  if (!currentSettings || !currentFeedbackKey) {
    alert("Generate your sensitivity first.");
    return;
  }

  const feedback = getSavedFeedback(currentFeedbackKey);

  if (type === "low") {
    feedback.general = clamp(feedback.general + 2, -10, 10);
    feedback.redDot = clamp(feedback.redDot + 2, -10, 10);
    feedback.scope2 = clamp(feedback.scope2 + 1, -10, 10);
  } else if (type === "high") {
    feedback.general = clamp(feedback.general - 2, -10, 10);
    feedback.redDot = clamp(feedback.redDot - 2, -10, 10);
    feedback.scope2 = clamp(feedback.scope2 - 1, -10, 10);
  } else {
    feedback.general = 0;
    feedback.redDot = 0;
    feedback.scope2 = 0;
  }

  try {
    localStorage.setItem(
      "hsl_feedback_" + currentFeedbackKey,
      JSON.stringify(feedback)
    );
    $("feedbackMessage").textContent =
      "Feedback saved for this device and selection. Generate again to apply it.";
  } catch {
    $("feedbackMessage").textContent =
      "Your browser could not save feedback.";
  }
}

function copySettings() {
  if (!currentSettings) return;

  const s = currentSettings;
  const text = [
    "HYBRID SENSI LAB",
    "Free Fire Sensitivity",
    "",
    `General: ${s.general}`,
    `Red Dot: ${s.redDot}`,
    `2x Scope: ${s.scope2}`,
    `4x Scope: ${s.scope4}`,
    `Sniper Scope: ${s.sniper}`,
    `Free Look: ${s.freeLook}`,
    `Fire Button Size: ${s.button}%`,
    "",
    "Test in Training Mode and adjust to your comfort.",
    "generated by HYBRID SENSI LAB"
  ].join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => alert("Settings copied!"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  document.body.appendChild(area);
  area.select();

  try {
    document.execCommand("copy");
    alert("Settings copied!");
  } catch {
    alert("Copy was not available. Please copy the settings manually.");
  }

  area.remove();
}

function init() {
  $("generateBtn").addEventListener("click", generateSettings);
  $("copyBtn").addEventListener("click", copySettings);

  document.querySelectorAll(".feedback-btn").forEach(button => {
    button.addEventListener("click", () => {
      saveFeedback(button.dataset.feedback);
    });
  });
}

init();





