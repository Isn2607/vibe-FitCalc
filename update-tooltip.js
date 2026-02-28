const fs = require("fs");
let appjs = fs.readFileSync("app.js", "utf8");

appjs = appjs.replace(
  `label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y.toFixed(1);
            }`,
  `label: function(context) {
              let val = context.parsed.y.toFixed(1);
              let label = context.dataset.label + ': ' + val;
              if (context.dataIndex === 0) label += state.isMetric ? ' kg' : ' lbs';
              if (context.dataIndex === 1) label += '%';
              return label;
            }`,
);

fs.writeFileSync("app.js", appjs);
