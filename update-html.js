const fs = require("fs");

let html = fs.readFileSync("index.html", "utf8");

// Replace the targets card in Row 1
const oldTargetsCardRegex =
  /<!-- 1\. Target Metrics Table -->[\s\S]*?<div class="card targets-card dashboard-col-small">[\s\S]*?<\/div>\s*<\/div>/;
const newTopRowHTML = `<!-- 1. Combined Body Comp & Targets -->
            <div class="card chart-card dashboard-col-small">
              <h2 class="card__title">Body Composition & Targets</h2>
              <div class="chart-wrapper">
                <canvas id="realDataChart"></canvas>
              </div>
              <div class="table-container" style="margin-top: 1rem;">
                <table class="metrics-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Current</th>
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody id="metricsTableBody">
                    <!-- JS Injects rows here -->
                  </tbody>
                </table>
              </div>
              <p class="target-note">
                *Targets estimated for your height & gender.
              </p>
            </div>
          </div>`;
html = html.replace(oldTargetsCardRegex, newTopRowHTML);

// Remove the old chart card in Row 2 entirely
const oldChartCardRegex =
  /<!-- 3\. Real Data Chart -->[\s\S]*?<div class="card chart-card dashboard-col-small">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
// Wait, the chart card has:
/*
            <!-- 3. Real Data Chart -->
            <div class="card chart-card dashboard-col-small">
              <h2 class="card__title">Body Composition</h2>
              <div class="chart-wrapper">
                <canvas id="radarChart"></canvas>
              </div>
              <div id="chartRawData" class="chart-raw-data"></div>
            </div>
*/
html = html.replace(
  /<!-- 3\. Real Data Chart -->[\s\S]*?<div class="card chart-card dashboard-col-small">[\s\S]*?<canvas id="radarChart"><\/canvas>[\s\S]*?<\/div>[\s\S]*?<div id="chartRawData" class="chart-raw-data"><\/div>[\s\S]*?<\/div>/,
  "",
);

fs.writeFileSync("index.html", html);
