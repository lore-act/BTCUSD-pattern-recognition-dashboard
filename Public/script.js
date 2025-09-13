window.addEventListener("load", loadMostSimilarPattern);

async function loadMostSimilarPattern() {
  const summaryEl = document.getElementById("patternSummary");
  const canvas = document.getElementById("patternCanvas");
  const ctx = canvas.getContext("2d");

  try {
    const res = await fetch("mostSimilar.json");

    if (!res.ok) {
      throw new Error("mostSimilar.json not found");
    }

    const data = await res.json();
    const {
      futurePattern,
      historicalPattern = [],
      direction,
      mse,
      similarCount,
      patternStartPrice,
      patternEndPrice,
      dayLow,
      dayHigh,
    } = data;

    // adding logic to determnate supportzone, mid zome and resistance zone

    const rangeDay = dayHigh - dayLow || 1; // avoid divide by zero

    const normalizedStart = ((patternStartPrice - dayLow) / rangeDay) * 100;
    const normalizedEnd = ((patternEndPrice - dayLow) / rangeDay) * 100;

    let zone;
    if (normalizedStart < 33 && normalizedEnd < 33) {
      zone = "Support";
    } else if (normalizedStart > 66 && normalizedEnd > 66) {
      zone = "Resistance";
    } else {
      zone = "Neutral";
    }

    const pattern = [...historicalPattern, ...futurePattern];

    // ⛔ Check if no valid data
    if (
      !Array.isArray(futurePattern) ||
      futurePattern.length === 0 ||
      !direction ||
      similarCount === 0
    ) {
      summaryEl.innerHTML = "⚠️ No valid similar pattern found.";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // ✅ Draw chart
    const width = canvas.width;
    const height = canvas.height;

    const min = Math.min(...pattern);
    const max = Math.max(...pattern);
    const range = max - min || 1;

    const totalLength = pattern.length;
    const xStep = width / (totalLength - 1);

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();

    pattern.forEach((value, index) => {
      const x = index * xStep;
      const y = height - ((value - min) / range) * height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = direction === "bullish" ? "green" : "red";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw separator line between historical and future
    const sepX = historicalPattern.length * xStep;
    ctx.beginPath();
    ctx.moveTo(sepX, 0);
    ctx.lineTo(sepX, height);
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Summary text
    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.fillText(`Direction: ${direction}`, 10, 20);
    ctx.fillText(`MSE: ${mse.toFixed(5)}`, 10, 40);

    summaryEl.innerHTML = `
  Found ${similarCount ?? "?"} similar patterns.<br>
  Most similar pattern direction: <strong>${direction}</strong><br>
  MSE: <strong>${mse.toFixed(8)}</strong><br>
  Zone: <strong>${zone}</strong><br>
  (Start: ${patternStartPrice}, End: ${patternEndPrice}, Low: ${dayLow}, High: ${dayHigh})
`;

    // update the class in html related to the zones
    const zoneEl = document.getElementById("zoneLabel");
    console.log("Zone is:", zone);
    console.log("zoneEl is:", zoneEl);
    zoneEl.textContent = `Most similar pattern is in the ${zone} zone.`;
    console.log("zoneLabel content:", zoneEl.textContent);

    switch (zone) {
      case "Support":
        zoneEl.style.color = "green";
        break;
      case "Resistance":
        zoneEl.style.color = "red";
        break;
      default:
        zoneEl.style.color = "orange";
    }

    if (zone === "Support") {
      zoneEl.style.color = "green";
    } else if (zone === "Resistance") {
      zoneEl.style.color = "red";
    } else {
      zoneEl.style.color = "orange";
    }
  } catch (err) {
    console.error("❌ Failed to load or parse mostSimilar.json", err);
    summaryEl.innerHTML = "⚠️ Error loading pattern data.";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// auto refresh
setInterval(loadMostSimilarPattern, 30000);

function clearPatternCanvas() {
  const canvas = document.getElementById("patternCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//============================================================

function drawPatternChart(pattern, direction, mse) {
  const canvas = document.getElementById("patternCanvas");
  const ctx = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;

  const min = Math.min(...pattern);
  const max = Math.max(...pattern);
  const range = max - min || 1;

  const xStep = width / (pattern.length - 1);

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  pattern.forEach((value, index) => {
    const x = index * xStep;
    const y = height - ((value - min) / range) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.strokeStyle = direction === "bullish" ? "green" : "red";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Label
  ctx.fillStyle = "#000";
  ctx.font = "16px Arial";
  ctx.fillText(`Direction: ${direction}`, 10, 20);
  ctx.fillText(`MSE: ${mse.toFixed(5)}`, 10, 40);
}
