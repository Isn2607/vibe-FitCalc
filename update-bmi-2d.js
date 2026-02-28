const fs = require("fs");

let appjs = fs.readFileSync("app.js", "utf8");

const oldFuncStart = appjs.indexOf("function renderBMIChart() {");
const nextFuncStart = appjs.indexOf("function renderTargetsTable() {");

const newBmiCode = `function renderBMIChart() {
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
    id: 'bmiZones',
    beforeDraw(chart) {
      const { ctx, chartArea: { top, bottom, left, right }, scales: { x, y } } = chart;
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.clip();
      
      const numSegments = 50;
      const heightStep = (y.max - y.min) / numSegments;
      
      const drawZone = (bmiLimit1, bmiLimit2, color) => {
        ctx.beginPath();
        
        for(let i = 0; i <= numSegments; i++) {
          const h = y.min + i * heightStep;
          const h_cm = state.isMetric ? h : h * MULTIPLIERS.INCHES_TO_CM;
          const h_m = h_cm / 100;
          
          let w1_kg = bmiLimit1 === 0 ? 0 : bmiLimit1 * h_m * h_m;
          let w1 = state.isMetric ? w1_kg : w1_kg / MULTIPLIERS.LBS_TO_KG;
          
          let xPos = x.getPixelForValue(w1);
          let yPos = y.getPixelForValue(h);
          
          if(i === 0) ctx.moveTo(xPos, yPos);
          else ctx.lineTo(xPos, yPos);
        }
        
        for(let i = numSegments; i >= 0; i--) {
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
      
      drawZone(0, 18.5, 'rgba(52, 152, 219, 0.4)');   
      drawZone(18.5, 25, 'rgba(46, 204, 113, 0.4)');   
      drawZone(25, 30, 'rgba(241, 196, 15, 0.4)');     
      drawZone(30, Infinity, 'rgba(231, 76, 60, 0.4)');
      
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px sans-serif';
      
      const contourBMIs = [15, 18.5, 20, 25, 30, 35, 40];
      for (let targetBMI of contourBMIs) {
        ctx.beginPath();
        let lastX, lastY;
        for(let i = 0; i <= numSegments; i++) {
          const h = y.min + i * heightStep;
          const h_cm = state.isMetric ? h : h * MULTIPLIERS.INCHES_TO_CM;
          const h_m = h_cm / 100;
          
          let w_kg = targetBMI * h_m * h_m;
          let w = state.isMetric ? w_kg : w_kg / MULTIPLIERS.LBS_TO_KG;
          
          let xPos = x.getPixelForValue(w);
          let yPos = y.getPixelForValue(h);
          
          if(i === 0) ctx.moveTo(xPos, yPos);
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
    }
  };

  const xLabel = state.isMetric ? 'Weight (kg)' : 'Weight (lbs)';
  const yLabel = state.isMetric ? 'Height (cm)' : 'Height (in)';

  state.bmiChartInstance = new Chart(ui.bmiChartCtx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'You',
        data: [{
          x: state.isMetric ? stats.weight : stats.weight / MULTIPLIERS.LBS_TO_KG,
          y: state.isMetric ? stats.height : stats.height / MULTIPLIERS.INCHES_TO_CM
        }],
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: xLabel,
            color: '#9ba1a6'
          },
          min: state.isMetric ? 40 : 90,
          max: state.isMetric ? 150 : 330,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: '#9ba1a6' }
        },
        y: {
          title: {
            display: true,
            text: yLabel,
            color: '#9ba1a6'
          },
          min: state.isMetric ? 140 : 55,
          max: state.isMetric ? 210 : 83,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: '#9ba1a6' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return \`You: \${context.parsed.x.toFixed(1)} \${state.isMetric ? 'kg' : 'lbs'}, \${context.parsed.y.toFixed(1)} \${state.isMetric ? 'cm' : 'in'} (BMI: \${bmi.toFixed(1)})\`;
            }
          }
        }
      }
    },
    plugins: [bmiZonesPlugin]
  });
}
`;

appjs =
  appjs.substring(0, oldFuncStart) +
  newBmiCode +
  "\n" +
  appjs.substring(nextFuncStart);

fs.writeFileSync("app.js", appjs);
