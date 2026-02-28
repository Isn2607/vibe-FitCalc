const fs = require("fs");

let appjs = fs.readFileSync("app.js", "utf8");

const newBmiFunction = `function renderBMIChart() {
  const bmi = state.userStats.bmi;
  
  if (state.bmiChartInstance) {
    state.bmiChartInstance.destroy();
  }

  // To create a traditional BMI chart (x: Categories, y: BMI scale) or similar to reference
  // We'll create a Bar chart where the background is colored based on zones
  // and a line/point shows the user's BMI. 
  // Let's create a Bar chart with a floating point or line indicating current BMI.

  // The categories of BMI
  const bmiCategories = ["Underweight", "Normal", "Overweight", "Obese"];
  
  // Using an annotation-like approach or simply a bar chart with colored bars and a scatter point for the user
  state.bmiChartInstance = new Chart(ui.bmiChartCtx, {
    type: 'bar',
    data: {
      labels: bmiCategories,
      datasets: [
        {
          type: 'bar',
          label: 'BMI Ranges',
          data: [18.5, 24.9, 29.9, 40], // Max values for each category for visual scale
          backgroundColor: [
            '#3498db', // Underweight (Blue)
            '#2ecc71', // Normal (Green)
            '#f1c40f', // Overweight (Yellow)
            '#e74c3c'  // Obese (Red)
          ],
          barPercentage: 1.0,
          categoryPercentage: 1.0,
        },
        {
          type: 'line',
          label: 'Your BMI',
          data: [bmi, bmi, bmi, bmi], // Draw a straight line across at the user's BMI
          borderColor: '#ffffff',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 45,
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          ticks: { color: "#9ba1a6" },
          title: {
            display: true,
            text: 'BMI Value',
            color: '#9ba1a6'
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#9ba1a6", font: { size: 10 } }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 1) {
                return 'Your BMI: ' + bmi.toFixed(1);
              }
              return context.label + ' Max BMI: ' + context.raw;
            }
          }
        }
      }
    }
  });
}
`;

// Replace old function
appjs = appjs.replace(
  /function renderBMIChart\(\) {[\s\S]*?}\n\nfunction renderTargetsTable\(\) {/,
  newBmiFunction + "\nfunction renderTargetsTable() {",
);

fs.writeFileSync("app.js", appjs);
