/**
 * FitCalc 2.0 - Main Application Logic
 * Refactored to include Targets, Reasons, Real Data, and Meal Tabs.
 */

// --- Constants & Config ---
const MULTIPLIERS = {
  MALE_BMR_CONSTANT: 5,
  FEMALE_BMR_CONSTANT: -161,
  LBS_TO_KG: 0.453592,
  INCHES_TO_CM: 2.54,
};

// --- State Management ---
const state = {
  isMetric: true,
  userStats: null,
  fitnessScore: 0,
  scoreReasons: [],
  realDataChartInstance: null,
  bmiChartInstance: null,
  macros: { p: 0, c: 0, f: 0, cals: 0 },
  mealPlans: [], // Array of 3 strings for days
};

// --- DOM Elements ---
const ui = {
  form: document.getElementById("fitnessForm"),
  unitToggle: document.getElementById("unitToggle"),
  metricLabel: document.getElementById("metricLabel"),
  imperialLabel: document.querySelector(".toggle-label:first-child"),
  unitHeightSpans: document.querySelectorAll(".unit-height"),
  unitWeightSpans: document.querySelectorAll(".unit-weight"),
  heightInput: document.getElementById("height"),
  weightInput: document.getElementById("weight"),
  muscleInput: document.getElementById("muscle"),
  resultsSection: document.getElementById("resultsSection"),

  // Score & Gauge
  gaugePath: document.getElementById("gaugePath"),
  scoreValue: document.getElementById("scoreValue"),
  scoreStatus: document.getElementById("scoreStatus"),
  scoreReasonsList: document.getElementById("scoreReasonsList"),

  // Metrics & Charts
  metricsTableBody: document.getElementById("metricsTableBody"),
  chartCtx: document.getElementById("realDataChart").getContext("2d"),
  bmiChartCtx: document.getElementById("bmiChart").getContext("2d"),

  // Macros & Suggestions
  macroContainer: document.getElementById("macroContainer"),
  mealTabs: document.getElementById("mealTabs"),
  mealText: document.getElementById("mealText"),
  exerciseText: document.getElementById("exerciseText"),
};

// --- Initialization ---
function loadSavedData() {
  const savedData = localStorage.getItem("fitcalc_userdata");
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      if (data.isMetric !== undefined) {
        ui.unitToggle.checked = data.isMetric;
        state.isMetric = data.isMetric;
        if (state.isMetric) {
          ui.metricLabel.classList.add("is-active");
          ui.imperialLabel.classList.remove("is-active");
          updateUnitLabels("cm", "kg");
        } else {
          ui.imperialLabel.classList.add("is-active");
          ui.metricLabel.classList.remove("is-active");
          updateUnitLabels("in", "lbs");
        }
      }
      if (data.gender) document.getElementById("gender").value = data.gender;
      if (data.age) document.getElementById("age").value = data.age;
      if (data.goal) document.getElementById("goal").value = data.goal;
      if (data.activity)
        document.getElementById("activity").value = data.activity;
      if (data.rawHeight)
        document.getElementById("height").value = data.rawHeight;
      if (data.rawWeight)
        document.getElementById("weight").value = data.rawWeight;
      if (data.bodyFat) document.getElementById("bodyfat").value = data.bodyFat;
      if (data.rawMuscle)
        document.getElementById("muscle").value = data.rawMuscle;
    } catch (e) {
      console.error("Error loading saved data", e);
    }
  }
}

function init() {
  loadSavedData();
  setupEventListeners();
}

function setupEventListeners() {
  ui.unitToggle.addEventListener("change", handleUnitToggle);
  ui.form.addEventListener("submit", handleFormSubmit);

  // Tab Listeners
  if (ui.mealTabs) {
    ui.mealTabs.addEventListener("click", (e) => {
      if (e.target.classList.contains("tab-btn")) {
        // Remove active from all
        ui.mealTabs
          .querySelectorAll(".tab-btn")
          .forEach((btn) => btn.classList.remove("is-active"));
        // Add active to clicked
        e.target.classList.add("is-active");
        // Update content
        const dayIndex = parseInt(e.target.getAttribute("data-day"), 10);
        ui.mealText.innerHTML = state.mealPlans[dayIndex];
      }
    });
  }
}

// --- UI Handlers ---
function handleUnitToggle(e) {
  state.isMetric = e.target.checked;

  if (state.isMetric) {
    ui.metricLabel.classList.add("is-active");
    ui.imperialLabel.classList.remove("is-active");
    updateUnitLabels("cm", "kg");
    convertInputValues(true);
  } else {
    ui.imperialLabel.classList.add("is-active");
    ui.metricLabel.classList.remove("is-active");
    updateUnitLabels("in", "lbs");
    convertInputValues(false);
  }
}

function updateUnitLabels(heightUnit, weightUnit) {
  ui.unitHeightSpans.forEach((span) => (span.textContent = heightUnit));
  ui.unitWeightSpans.forEach((span) => (span.textContent = weightUnit));
}

function convertInputValues(toMetric) {
  const inputsToConvert = [ui.heightInput, ui.weightInput, ui.muscleInput];

  inputsToConvert.forEach((input) => {
    if (!input.value) return;
    let val = parseFloat(input.value);
    if (isNaN(val)) return;

    if (toMetric) {
      if (input === ui.heightInput) val = val * MULTIPLIERS.INCHES_TO_CM;
      else val = val * MULTIPLIERS.LBS_TO_KG;
    } else {
      if (input === ui.heightInput) val = val / MULTIPLIERS.INCHES_TO_CM;
      else val = val / MULTIPLIERS.LBS_TO_KG;
    }
    input.value = val.toFixed(1);
  });
}

function handleFormSubmit(e) {
  e.preventDefault();

  // Save data to localStorage
  const dataToSave = {
    isMetric: ui.unitToggle.checked,
    gender: document.getElementById("gender").value,
    age: document.getElementById("age").value,
    goal: document.getElementById("goal").value,
    activity: document.getElementById("activity").value,
    rawHeight: document.getElementById("height").value,
    rawWeight: document.getElementById("weight").value,
    bodyFat: document.getElementById("bodyfat").value,
    rawMuscle: document.getElementById("muscle").value,
  };
  localStorage.setItem("fitcalc_userdata", JSON.stringify(dataToSave));

  gatherFormData();
  calculateMetrics();
  calculateFitnessScore();
  updateDashboard();
}

// --- Core Logic & Calculations ---
function gatherFormData() {
  let weight = parseFloat(ui.weightInput.value);
  let height = parseFloat(ui.heightInput.value);
  let muscle = parseFloat(ui.muscleInput.value);

  if (!state.isMetric) {
    weight = weight * MULTIPLIERS.LBS_TO_KG;
    height = height * MULTIPLIERS.INCHES_TO_CM;
    muscle = muscle * MULTIPLIERS.LBS_TO_KG;
  }

  state.userStats = {
    gender: document.getElementById("gender").value,
    age: parseInt(document.getElementById("age").value, 10),
    goal: document.getElementById("goal").value,
    activity: parseFloat(document.getElementById("activity").value),
    weight: weight,
    height: height,
    bodyFat: parseFloat(document.getElementById("bodyfat").value),
    muscle: muscle,
    bmi: 0,
    ffmi: 0,
    bmr: 0,
    tdee: 0,
    targetCalories: 0,
  };
}

function calculateMetrics() {
  const stats = state.userStats;
  const heightInMeters = stats.height / 100;

  // BMI
  stats.bmi = stats.weight / (heightInMeters * heightInMeters);

  // FFMI
  const fatMass = stats.weight * (stats.bodyFat / 100);
  const ffm = stats.weight - fatMass;
  const rawFfmi = ffm / (heightInMeters * heightInMeters);
  stats.ffmi = rawFfmi + 6.1 * (1.8 - heightInMeters); // Normalized

  // BMR & TDEE
  let baseBMR = 10 * stats.weight + 6.25 * stats.height - 5 * stats.age;
  stats.bmr = stats.gender === "male" ? baseBMR + 5 : baseBMR - 161;
  stats.tdee = stats.bmr * stats.activity;

  // Calories
  if (stats.goal === "lose") stats.targetCalories = stats.tdee - 500;
  else if (stats.goal === "build") stats.targetCalories = stats.tdee + 300;
  else stats.targetCalories = stats.tdee;
}

function calculateFitnessScore() {
  const stats = state.userStats;
  state.scoreReasons = [];
  let score = 50;

  // 1. Evaluate Body Fat
  let bfScore = 0;
  if (stats.gender === "male") {
    if (stats.bodyFat < 8) {
      bfScore = 15;
      state.scoreReasons.push({
        text: "Body fat is critically low.",
        type: "neg",
      });
    } else if (stats.bodyFat <= 15) {
      bfScore = 40;
      state.scoreReasons.push({
        text: `Excellent body fat percentage (${stats.bodyFat}%).`,
        type: "pos",
      });
    } else if (stats.bodyFat <= 20) {
      bfScore = 25;
      state.scoreReasons.push({
        text: `Good, healthy body fat levels.`,
        type: "neu",
      });
    } else {
      bfScore = 5;
      state.scoreReasons.push({
        text: `Body fat is above optimal ranges.`,
        type: "neg",
      });
    }
  } else {
    if (stats.bodyFat < 15) {
      bfScore = 15;
      state.scoreReasons.push({
        text: "Body fat is critically low.",
        type: "neg",
      });
    } else if (stats.bodyFat <= 24) {
      bfScore = 40;
      state.scoreReasons.push({
        text: `Excellent body fat percentage (${stats.bodyFat}%).`,
        type: "pos",
      });
    } else if (stats.bodyFat <= 30) {
      bfScore = 25;
      state.scoreReasons.push({
        text: `Good, healthy body fat levels.`,
        type: "neu",
      });
    } else {
      bfScore = 5;
      state.scoreReasons.push({
        text: `Body fat is above optimal ranges.`,
        type: "neg",
      });
    }
  }

  // 2. Evaluate FFMI (Muscle Mass)
  let muscleScore = 0;
  if (stats.gender === "male") {
    if (stats.ffmi < 18) {
      muscleScore = 10;
      state.scoreReasons.push({
        text: `Low muscle mass (FFMI ${stats.ffmi.toFixed(1)}).`,
        type: "neg",
      });
    } else if (stats.ffmi < 20) {
      muscleScore = 25;
      state.scoreReasons.push({
        text: `Average muscle development.`,
        type: "neu",
      });
    } else if (stats.ffmi < 22) {
      muscleScore = 40;
      state.scoreReasons.push({
        text: `Great muscle mass (FFMI ${stats.ffmi.toFixed(1)}).`,
        type: "pos",
      });
    } else {
      muscleScore = 50;
      state.scoreReasons.push({
        text: `Elite muscle development!`,
        type: "pos",
      });
    }
  } else {
    if (stats.ffmi < 15) {
      muscleScore = 10;
      state.scoreReasons.push({
        text: `Low muscle mass (FFMI ${stats.ffmi.toFixed(1)}).`,
        type: "neg",
      });
    } else if (stats.ffmi < 17) {
      muscleScore = 25;
      state.scoreReasons.push({
        text: `Average muscle development.`,
        type: "neu",
      });
    } else if (stats.ffmi < 19) {
      muscleScore = 40;
      state.scoreReasons.push({
        text: `Great muscle mass (FFMI ${stats.ffmi.toFixed(1)}).`,
        type: "pos",
      });
    } else {
      muscleScore = 50;
      state.scoreReasons.push({
        text: `Elite muscle development!`,
        type: "pos",
      });
    }
  }

  // 3. BMI check for extremes
  if (stats.bmi < 18.5) {
    score -= 10;
    state.scoreReasons.push({
      text: "BMI indicates you are underweight.",
      type: "neg",
    });
  } else if (stats.bmi > 30 && stats.ffmi < 22) {
    // Allow high BMI if highly muscular
    score -= 10;
    state.scoreReasons.push({
      text: "BMI is high without corresponding high muscle mass.",
      type: "neg",
    });
  }

  score = bfScore + muscleScore;
  state.fitnessScore = Math.min(Math.max(Math.round(score), 0), 100);
}

// --- Dashboard Rendering ---
function updateDashboard() {
  ui.resultsSection.classList.remove("is-hidden");
  ui.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

  renderGaugeAndReasons();
  renderBMIChart();
  renderTargetsTable();
  renderRealDataChart();
  calculateAndRenderMacros();
  renderMealsAndExercise();
}

function renderGaugeAndReasons() {
  const score = state.fitnessScore;

  // Animate Gauge Number
  let currentVal = 0;
  const interval = setInterval(() => {
    if (currentVal >= score) {
      clearInterval(interval);
      ui.scoreValue.textContent = score;
    } else {
      currentVal++;
      ui.scoreValue.textContent = currentVal;
    }
  }, 15);

  // SVG Gauge Math (Length is 125.6 for this semi-circle arc)
  const maxOffset = 125.6;
  const targetOffset = maxOffset - (score / 100) * maxOffset;

  // Status color
  let color, statusText;
  if (score < 40) {
    color = "var(--status-low)";
    statusText = "Needs Work";
  } else if (score < 70) {
    color = "var(--status-mid)";
    statusText = "Average";
  } else if (score < 90) {
    color = "var(--status-high)";
    statusText = "Excellent";
  } else {
    color = "var(--status-elite)";
    statusText = "Elite";
  }

  ui.gaugePath.style.strokeDashoffset = targetOffset;
  ui.gaugePath.style.stroke = color;
  ui.scoreValue.style.color = color;
  ui.scoreStatus.textContent = statusText;
  ui.scoreStatus.style.color = color;

  // Render Reasons
  ui.scoreReasonsList.innerHTML = state.scoreReasons
    .map((r) => {
      const symbol = r.type === "pos" ? "↑" : r.type === "neg" ? "↓" : "•";
      return `<li><span class="reason-${r.type}">${symbol}</span> ${r.text}</li>`;
    })
    .join("");
}

function renderBMIChart() {
  const stats = state.userStats;
  const bmi = stats.bmi;

  if (state.bmiChartInstance) {
    state.bmiChartInstance.destroy();
  }

  const minWeightKg = 40;
  const maxWeightKg = 150;
  const minHeightCm = 140;
  const maxHeightCm = 210;

  const bmiZonesPlugin = {
    id: "bmiZones",
    beforeDraw(chart) {
      const {
        ctx,
        chartArea: { top, bottom, left, right },
        scales: { x, y },
      } = chart;

      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.clip();

      const numSegments = 50;
      const heightStep = (y.max - y.min) / numSegments;

      const drawZone = (bmiLimit1, bmiLimit2, color) => {
        ctx.beginPath();

        for (let i = 0; i <= numSegments; i++) {
          const h = y.min + i * heightStep;
          const h_cm = state.isMetric ? h : h * MULTIPLIERS.INCHES_TO_CM;
          const h_m = h_cm / 100;

          let w1_kg = bmiLimit1 === 0 ? 0 : bmiLimit1 * h_m * h_m;
          let w1 = state.isMetric ? w1_kg : w1_kg / MULTIPLIERS.LBS_TO_KG;

          let xPos = x.getPixelForValue(w1);
          let yPos = y.getPixelForValue(h);

          if (i === 0) ctx.moveTo(xPos, yPos);
          else ctx.lineTo(xPos, yPos);
        }

        for (let i = numSegments; i >= 0; i--) {
          const h = y.min + i * heightStep;
          const h_cm = state.isMetric ? h : h * MULTIPLIERS.INCHES_TO_CM;
          const h_m = h_cm / 100;

          let w2_kg = bmiLimit2 === Infinity ? 500 : bmiLimit2 * h_m * h_m;
          let w2 = state.isMetric ? w2_kg : w2_kg / MULTIPLIERS.LBS_TO_KG;

          let xPos = x.getPixelForValue(w2);
          let yPos = y.getPixelForValue(h);

          ctx.lineTo(xPos, yPos);
        }

        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };

      drawZone(0, 18.5, "rgba(52, 152, 219, 0.4)");
      drawZone(18.5, 25, "rgba(46, 204, 113, 0.4)");
      drawZone(25, 30, "rgba(241, 196, 15, 0.4)");
      drawZone(30, Infinity, "rgba(231, 76, 60, 0.4)");

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "10px sans-serif";

      const contourBMIs = [15, 18.5, 20, 25, 30, 35, 40];
      for (let targetBMI of contourBMIs) {
        ctx.beginPath();
        let lastX, lastY;
        for (let i = 0; i <= numSegments; i++) {
          const h = y.min + i * heightStep;
          const h_cm = state.isMetric ? h : h * MULTIPLIERS.INCHES_TO_CM;
          const h_m = h_cm / 100;

          let w_kg = targetBMI * h_m * h_m;
          let w = state.isMetric ? w_kg : w_kg / MULTIPLIERS.LBS_TO_KG;

          let xPos = x.getPixelForValue(w);
          let yPos = y.getPixelForValue(h);

          if (i === 0) ctx.moveTo(xPos, yPos);
          else ctx.lineTo(xPos, yPos);

          if (i === Math.floor(numSegments * 0.8)) {
            lastX = xPos;
            lastY = yPos;
          }
        }
        ctx.stroke();

        if (lastX > left && lastX < right && lastY > top && lastY < bottom) {
          ctx.fillText(targetBMI, lastX + 2, lastY - 2);
        }
      }

      ctx.restore();
    },
  };

  const xLabel = state.isMetric ? "Weight (kg)" : "Weight (lbs)";
  const yLabel = state.isMetric ? "Height (cm)" : "Height (in)";

  state.bmiChartInstance = new Chart(ui.bmiChartCtx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "You",
          data: [
            {
              x: state.isMetric
                ? stats.weight
                : stats.weight / MULTIPLIERS.LBS_TO_KG,
              y: state.isMetric
                ? stats.height
                : stats.height / MULTIPLIERS.INCHES_TO_CM,
            },
          ],
          backgroundColor: "#ffffff",
          borderColor: "#000000",
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          title: {
            display: true,
            text: xLabel,
            color: "#9ba1a6",
          },
          min: state.isMetric ? 40 : 90,
          max: state.isMetric ? 150 : 330,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#9ba1a6" },
        },
        y: {
          title: {
            display: true,
            text: yLabel,
            color: "#9ba1a6",
          },
          min: state.isMetric ? 140 : 55,
          max: state.isMetric ? 210 : 83,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#9ba1a6" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `You: ${context.parsed.x.toFixed(1)} ${state.isMetric ? "kg" : "lbs"}, ${context.parsed.y.toFixed(1)} ${state.isMetric ? "cm" : "in"} (BMI: ${bmi.toFixed(1)})`;
            },
          },
        },
      },
    },
    plugins: [bmiZonesPlugin],
  });
}

function renderTargetsTable() {
  const stats = state.userStats;
  const heightM = stats.height / 100;

  // Calculate Ideals
  const idealBMI = 22.5;
  const idealWeightKg = idealBMI * (heightM * heightM);
  const idealBF = stats.gender === "male" ? "12 - 15%" : "22 - 25%";
  const idealFFMI = stats.gender === "male" ? "20 - 22" : "17 - 19";

  // Format helper
  const fmt = (val, unit) => {
    if (state.isMetric) return `${val.toFixed(1)} ${unit}`;
    return unit === "kg"
      ? `${(val / MULTIPLIERS.LBS_TO_KG).toFixed(1)} lbs`
      : val;
  };

  ui.metricsTableBody.innerHTML = `
          <tr>
              <td>Weight</td>
              <td>${fmt(stats.weight, "kg")}</td>
              <td>~ ${fmt(idealWeightKg, "kg")}</td>
          </tr>
          <tr>
              <td>Body Fat</td>
              <td>${stats.bodyFat.toFixed(1)}%</td>
              <td>${idealBF}</td>
          </tr>
          <tr>
              <td>Muscle (FFMI)</td>
              <td>${stats.ffmi.toFixed(1)}</td>
              <td>${idealFFMI}</td>
          </tr>
          <tr>
              <td>BMI</td>
              <td>${stats.bmi.toFixed(1)}</td>
              <td>21.0 - 24.0</td>
          </tr>
      `;
}

function renderRealDataChart() {
  const stats = state.userStats;
  const heightM = stats.height / 100;
  const idealWeightKg = 22.5 * (heightM * heightM);

  // Real Data for Chart
  let targetBF = stats.gender === "male" ? 13.5 : 23.5;
  let targetFFMI = stats.gender === "male" ? 21 : 18;

  const currentData = [stats.weight, stats.bodyFat, stats.ffmi, stats.bmi];

  const targetData = [idealWeightKg, targetBF, targetFFMI, 22.5];

  if (state.realDataChartInstance) state.realDataChartInstance.destroy();

  state.realDataChartInstance = new Chart(ui.chartCtx, {
    type: "bar",
    data: {
      labels: [
        "Weight (" + (state.isMetric ? "kg" : "lbs") + ")",
        "Body Fat %",
        "Muscle (FFMI)",
        "BMI",
      ],
      datasets: [
        {
          label: "Current",
          data: state.isMetric
            ? currentData
            : [
                currentData[0] / MULTIPLIERS.LBS_TO_KG,
                currentData[1],
                currentData[2],
                currentData[3],
              ],
          backgroundColor: "#00d2ff",
          borderRadius: 4,
        },
        {
          label: "Target",
          data: state.isMetric
            ? targetData
            : [
                targetData[0] / MULTIPLIERS.LBS_TO_KG,
                targetData[1],
                targetData[2],
                targetData[3],
              ],
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          ticks: { color: "#9ba1a6" },
        },
        x: {
          grid: { display: false },
          ticks: { color: "#9ba1a6", font: { size: 11 } },
        },
      },
      plugins: {
        legend: { position: "top", labels: { color: "#f0f2f5", boxWidth: 12 } },
        tooltip: {
          callbacks: {
            label: function (context) {
              let val = context.parsed.y.toFixed(1);
              let label = context.dataset.label + ": " + val;
              if (context.dataIndex === 0)
                label += state.isMetric ? " kg" : " lbs";
              if (context.dataIndex === 1) label += "%";
              return label;
            },
          },
        },
      },
    },
  });
}

function calculateAndRenderMacros() {
  const stats = state.userStats;
  const cals = Math.round(stats.targetCalories);

  let proteinPct, carbPct, fatPct;
  if (stats.goal === "lose") {
    proteinPct = 0.4;
    carbPct = 0.3;
    fatPct = 0.3;
  } else if (stats.goal === "build") {
    proteinPct = 0.3;
    carbPct = 0.5;
    fatPct = 0.2;
  } else {
    proteinPct = 0.3;
    carbPct = 0.4;
    fatPct = 0.3;
  }

  const pGrams = Math.round((cals * proteinPct) / 4);
  const cGrams = Math.round((cals * carbPct) / 4);
  const fGrams = Math.round((cals * fatPct) / 9);

  // Calculate Equivalents
  // Protein: Chicken breast (100g = ~31g protein), Eggs (1 large = ~6g)
  const chickenAmt = Math.round((pGrams / 31) * 100);
  const eggsAmt = Math.round(pGrams / 6);

  // Carbs: Cooked white rice (100g = ~28g carbs), Oats (100g = ~66g carbs)
  const riceAmt = Math.round((cGrams / 28) * 100);
  const oatsAmt = Math.round((cGrams / 66) * 100);

  // Fats: Almonds (100g = ~50g fat), Olive oil (1 tbsp = ~14g fat)
  const almondsAmt = Math.round((fGrams / 50) * 100);
  const oilAmt = Math.round(fGrams / 14);

  ui.macroContainer.innerHTML = `
        <div class="macro-header">Target Daily Intake: <span>${cals}</span> kcal</div>
        <div class="macro-grid">
            <div class="macro-box">
                <h4><span class="protein-title">Protein</span> <span class="grams">${pGrams}g</span></h4>
                <div style="font-size:0.75rem; color:var(--text-secondary)">Daily equivalent choices:</div>
                <ul class="food-list">
                    <li>~${chickenAmt}g of Chicken Breast</li>
                    <li>OR ~${eggsAmt} Large Eggs</li>
                    <li>OR ~${(pGrams / 25).toFixed(1)} Scoops Whey</li>
                </ul>
            </div>
            <div class="macro-box">
                <h4><span class="carb-title">Carbs</span> <span class="grams">${cGrams}g</span></h4>
                <div style="font-size:0.75rem; color:var(--text-secondary)">Daily equivalent choices:</div>
                <ul class="food-list">
                    <li>~${riceAmt}g of Cooked Rice</li>
                    <li>OR ~${oatsAmt}g of Raw Oats</li>
                    <li>OR ~${(cGrams / 25).toFixed(1)} Medium Bananas</li>
                </ul>
            </div>
            <div class="macro-box">
                <h4><span class="fat-title">Fats</span> <span class="grams">${fGrams}g</span></h4>
                <div style="font-size:0.75rem; color:var(--text-secondary)">Daily equivalent choices:</div>
                <ul class="food-list">
                    <li>~${almondsAmt}g of Almonds</li>
                    <li>OR ~${oilAmt} Tbsp Olive Oil</li>
                    <li>OR ~${(fGrams / 15).toFixed(1)} Whole Avocados</li>
                </ul>
            </div>
        </div>
    `;
}

function renderMealsAndExercise() {
  const stats = state.userStats;

  // Generate 3 Days of Meals
  if (stats.goal === "lose") {
    state.mealPlans = [
      `<strong>Breakfast:</strong> 3 Egg white scramble with spinach, tomatoes, and 1 slice whole wheat toast.\n<strong>Lunch:</strong> Grilled chicken salad with lots of greens, cucumbers, and a light vinaigrette.\n<strong>Dinner:</strong> Baked white fish (cod/tilapia) with steamed broccoli and small side of quinoa.\n<strong>Snack:</strong> 1 cup Greek yogurt.`,
      `<strong>Breakfast:</strong> Protein oatmeal (1/2 cup oats mixed with 1 scoop protein powder) and berries.\n<strong>Lunch:</strong> Turkey wrap using a low-carb tortilla, mustard, and mixed greens.\n<strong>Dinner:</strong> Lean ground beef (96/4) stir-fry with zucchini and bell peppers.\n<strong>Snack:</strong> Apple slices with 1 tbsp almond butter.`,
      `<strong>Breakfast:</strong> Protein smoothie (whey, spinach, half banana, almond milk).\n<strong>Lunch:</strong> Tuna salad (made with Greek yogurt instead of mayo) over a bed of spinach.\n<strong>Dinner:</strong> Grilled chicken breast with roasted asparagus.\n<strong>Snack:</strong> Cottage cheese with a few almonds.`,
    ];
  } else if (stats.goal === "build") {
    state.mealPlans = [
      `<strong>Breakfast:</strong> 4 Whole eggs, 2 slices avocado toast, and a glass of whole milk.\n<strong>Lunch:</strong> Large portion of chicken breast, 1.5 cups jasmine rice, roasted vegetables.\n<strong>Dinner:</strong> 8oz Steak, sweet potato, and green beans cooked in olive oil.\n<strong>Snack:</strong> Mass-gainer shake or peanut butter sandwich.`,
      `<strong>Breakfast:</strong> Large bowl of oatmeal with peanut butter, chia seeds, and protein powder.\n<strong>Lunch:</strong> 8oz Ground turkey, 1.5 cups pasta, side salad with olive oil dressing.\n<strong>Dinner:</strong> Salmon fillet, 1 cup quinoa, roasted Brussels sprouts.\n<strong>Snack:</strong> Trail mix (nuts, dried fruit) and cottage cheese.`,
      `<strong>Breakfast:</strong> 3-Egg omelet with cheese and ham, side of hash browns.\n<strong>Lunch:</strong> 2 Chicken and bean burritos with cheese and guacamole.\n<strong>Dinner:</strong> Pork tenderloin, mashed potatoes, and buttered peas.\n<strong>Snack:</strong> Protein bar and a large banana.`,
    ];
  } else {
    state.mealPlans = [
      `<strong>Breakfast:</strong> 2 Whole eggs, 1 slice avocado toast.\n<strong>Lunch:</strong> Turkey wrap with mixed greens and a side of fruit.\n<strong>Dinner:</strong> Lean pork or tofu stir-fry with mixed vegetables and 1 cup rice.\n<strong>Snack:</strong> Apple slices with 1 tbsp almond butter.`,
      `<strong>Breakfast:</strong> Oatmeal with a handful of berries and a drizzle of honey.\n<strong>Lunch:</strong> Grilled chicken Caesar salad (light dressing).\n<strong>Dinner:</strong> Baked salmon with a side of couscous and steamed broccoli.\n<strong>Snack:</strong> Greek yogurt.`,
      `<strong>Breakfast:</strong> Protein smoothie (whey, mixed berries, almond milk).\n<strong>Lunch:</strong> Tuna salad sandwich on whole wheat bread.\n<strong>Dinner:</strong> Chicken thigh roasted with sweet potatoes and carrots.\n<strong>Snack:</strong> Handful of mixed nuts.`,
    ];
  }

  // Reset tabs and show Day 1
  ui.mealTabs.querySelectorAll(".tab-btn").forEach((btn, i) => {
    if (i === 0) btn.classList.add("is-active");
    else btn.classList.remove("is-active");
  });
  ui.mealText.innerHTML = state.mealPlans[0];

  // Exercise Strategy
  let exStr = "";
  if (stats.goal === "lose") {
    exStr = `<strong>Goal: Preserve Muscle, Burn Fat</strong>\n\n• <strong>Resistance:</strong> Lift heavy 3x/week. Focus on compound movements to signal your body to keep muscle.\n• <strong>Cardio:</strong> 3-4 sessions of LISS (Low-Intensity Steady State) like walking on an incline or cycling for 45 mins. Burns fat, spares recovery.\n• <strong>NEAT:</strong> Hit 10,000 steps daily.`;
  } else if (stats.goal === "build") {
    exStr = `<strong>Goal: Maximum Hypertrophy (Muscle Growth)</strong>\n\n• <strong>Resistance:</strong> Train 4-5x/week using a structured split (e.g., Push/Pull/Legs). Prioritize progressive overload (adding weight or reps each week).\n• <strong>Cardio:</strong> Limit to 1-2 short sessions. Don't burn the calories needed for growth.\n• <strong>Recovery:</strong> Muscle grows in bed, not the gym. Get 8 hours of sleep.`;
  } else {
    exStr = `<strong>Goal: Maintenance & Health</strong>\n\n• <strong>Resistance:</strong> Train 3x/week full-body to maintain current mass.\n• <strong>Cardio:</strong> 2 sessions of moderate cardio (jogging, swimming) for heart health.\n• <strong>Flexibility:</strong> Add 1 session of yoga or deep stretching to maintain mobility.`;
  }
  ui.exerciseText.innerHTML = exStr;
}

// Start app
init();
