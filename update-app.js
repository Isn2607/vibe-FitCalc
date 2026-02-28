const fs = require("fs");

let appjs = fs.readFileSync("app.js", "utf8");

const regex =
  /function renderRadarChart\(\) {[\s\S]*?}\n\nfunction calculateAndRenderMacros\(\) {/;

const newFunction = `function renderRadarChart() {
  const stats = state.userStats;
  const heightM = stats.height / 100;
  const idealWeightKg = 22.5 * (heightM * heightM);
  
  // Real Data for Chart
  let targetBF = stats.gender === "male" ? 13.5 : 23.5;
  let targetFFMI = stats.gender === "male" ? 21 : 18;
  
  const currentData = [
    stats.weight,
    stats.bodyFat,
    stats.ffmi,
    stats.bmi
  ];
  
  const targetData = [
    idealWeightKg,
    targetBF,
    targetFFMI,
    22.5
  ];

  if (state.realDataChartInstance) state.realDataChartInstance.destroy();

  state.realDataChartInstance = new Chart(ui.chartCtx, {
    type: "bar",
    data: {
      labels: [
        "Weight (" + (state.isMetric ? "kg" : "lbs") + ")",
        "Body Fat %",
        "Muscle (FFMI)",
        "BMI"
      ],
      datasets: [
        {
          label: "Current",
          data: state.isMetric ? currentData : [currentData[0] / MULTIPLIERS.LBS_TO_KG, currentData[1], currentData[2], currentData[3]],
          backgroundColor: "#00d2ff",
          borderRadius: 4
        },
        {
          label: "Target",
          data: state.isMetric ? targetData : [targetData[0] / MULTIPLIERS.LBS_TO_KG, targetData[1], targetData[2], targetData[3]],
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          ticks: { color: "#9ba1a6" }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#9ba1a6", font: { size: 11 } }
        }
      },
      plugins: {
        legend: { position: "top", labels: { color: "#f0f2f5", boxWidth: 12 } },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y.toFixed(1);
            }
          }
        }
      }
    }
  });
}

function calculateAndRenderMacros() {`;

appjs = appjs.replace(regex, newFunction);
fs.writeFileSync("app.js", appjs);
