const fs = require("fs");

let appjs = fs.readFileSync("app.js", "utf8");

const bmiFunctionCode = `
function renderBMIChart() {
  const bmi = state.userStats.bmi;
  
  if (state.bmiChartInstance) {
    state.bmiChartInstance.destroy();
  }

  // Create a half-doughnut chart for BMI
  const data = {
    datasets: [{
      data: [18.5, 6.5, 5, 10], // Underweight (<18.5), Normal (18.5-25), Overweight (25-30), Obese (30+)
      backgroundColor: [
        '#f39c12', // Underweight (Yellow/Blue)
        '#2ecc71', // Normal (Green)
        '#f39c12', // Overweight (Orange)
        '#e74c3c'  // Obese (Red)
      ],
      borderWidth: 0,
      circumference: 180,
      rotation: 270,
    }]
  };

  // Determine pointer rotation based on BMI
  // Map BMI to an angle between -90 and 90 degrees
  // Total span is 0 to 40 (we cap it at 40)
  const clampedBmi = Math.min(Math.max(bmi, 0), 40);
  
  // Custom plugin to draw a needle
  const gaugeNeedle = {
    id: 'gaugeNeedle',
    afterDatasetDraw(chart, args, options) {
      const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
      ctx.save();
      
      const cx = left + width / 2;
      const cy = bottom;
      
      // Calculate angle
      // Range: 0 to 40
      // 0 = -PI/2 (left), 40 = PI/2 (right)
      const angle = Math.PI + (clampedBmi / 40) * Math.PI;

      // Draw Needle
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(height - 10, 0);
      ctx.lineTo(0, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      // Draw Dot at base
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, 10);
      ctx.fill();
      ctx.restore();
      
      // Draw Text Label
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('BMI: ' + bmi.toFixed(1), cx, cy + 20);
    }
  };

  state.bmiChartInstance = new Chart(ui.bmiChartCtx, {
    type: 'doughnut',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '80%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      layout: {
        padding: {
          bottom: 25 // Space for text
        }
      }
    },
    plugins: [gaugeNeedle]
  });
}

function renderTargetsTable() {`;

appjs = appjs.replace("function renderTargetsTable() {", bmiFunctionCode);

fs.writeFileSync("app.js", appjs);
