const https = require("https");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
let normalizedMA52024 = [];

// here i calculate the sum among indexes over a determined period(which will be every 5 candles and then every 30 candles)

function calculateMovingAverage(data, period) {
  let movingAverage = [];

  for (let i = 0; i < data.length; i++) {
    if (i >= period - 1) {
      let sum = 0;

      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }

      movingAverage.push(sum / period);
    } else {
      movingAverage.push(null);
    }
  }

  return movingAverage;
}

// this is just an exercise that calculates the difference between min and max value over a moving average
// might be useful later

function calculateMaxMinDiff(data, period) {
  let maxMin = [];
  for (let i = 0; i < data.length; i++) {
    if (i >= period - 1) {
      let min = Infinity;
      let max = -Infinity;

      for (let j = i - period + 1; j <= i; j++) {
        if (data[j] < min) {
          min = data[j];
        }
        if (data[j] > max) {
          max = data[j];
        }
      }
      maxMin.push(max - min);
    } else {
      maxMin.push(null);
    }
  }
  return maxMin;
}

// check if the idx is greater than previous idx

function checkIdx(arr, idx) {
  if (idx <= 0 || arr[idx] === null || arr[idx - 1] === null) {
    return false;
  } else {
    return arr[idx] > arr[idx - 1];
  }
}

// set up MSE  (Mean Squared Error) for compare ma52024 to live ma5 also we had to remove the null values

function mse(pattern1, pattern2) {
  if (pattern1.length !== pattern2.length) return Infinity;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < pattern1.length; i++) {
    if (pattern1[i] === null || pattern2[i] === null) continue;
    sum += (pattern1[i] - pattern2[i]) ** 2;
    count++;
  }
  return count > 0 ? sum / count : Infinity;
}

// normalize MSE due to price difference over different years
function normalize(pattern) {
  const mean = pattern.reduce((a, b) => a + b, 0) / pattern.length;
  const std = Math.sqrt(
    pattern.reduce((a, b) => a + (b - mean) ** 2, 0) / pattern.length
  );
  if (std === 0) return pattern.map(() => 0); // Avoid division by zero
  return pattern.map((p) => (p - mean) / std);
}

// getting better directional  info about the patterns

function getTrendDirection(values) {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
  const sumXX = x.reduce((acc, val) => acc + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope >= 0 ? "bullish" : "bearish";
}

// collecting past data from directory containing all .csv files --- year 2024 1 min candle---
// outputting one array of arrays for the whole 2024 year

let allData2024 = []; // this contain time and close price
let onlyPriceClose2024 = []; // this contain only price
let fileProcessed = 0;
const dataFolder = path.join(__dirname, "2024_BTC_1mCandle");

fs.readdir(dataFolder, function (err, files) {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

  files.forEach(function (csvfiles) {
    const filePath = path.join(dataFolder, csvfiles);
    fs.createReadStream(filePath)
      .pipe(
        csv({
          headers: false, // csv no headers
        })
      )
      .on("data", function (row) {
        const timestamp = row[0];
        const priceClose = row[4];
        allData2024.push({
          time: new Date(Number(timestamp)),
          close: parseFloat(priceClose),
        });
        onlyPriceClose2024.push(parseFloat(priceClose));
      })

      .on("end", function () {
        fileProcessed++;
        if (fileProcessed === files.length) {
          // Calculate current moving averages of year 2024
          const ma52024 = calculateMovingAverage(onlyPriceClose2024, 5); // this is the 5 minutes
          //const ma30204 = calculateMovingAverage(onlyPriceClose2024, 30); // this is the 30 minutes

          // detect relevant movement of the ma5 over a window of 30 minutes in the year 2024
          const threshold = 400; // $
          const windowSize = 30; // candles so 30 minutes
          const sigMovIdx = []; // array of those relevant idx

          for (let i = 0; i < ma52024.length; i++) {
            const start = ma52024[i];
            const end = ma52024[i + windowSize - 1];
            // Prevent out-of-bounds access
            if (i + windowSize - 1 >= ma52024.length) break;
            const diff = Math.abs(end - start);

            if (diff >= threshold) {
              const maWindow = ma52024.slice(i, i + windowSize);
              const direction = getTrendDirection(maWindow);
              sigMovIdx.push({ idx: i + windowSize - 1, direction });
            }
          }

          // extract patterns of the 30 candles (minutes) of MA of the 5 candles over 30 minutes window BEFORE the relevant idx.

          const preMovePattern = []; // array of arrays. each array is a pattern of the MA5 that had lead to difference of threshold (abs diff, so either bullish or bearish)

          sigMovIdx.forEach(function (entry) {
            const start = entry.idx - windowSize;
            if (start >= 0) {
              const pattern = ma52024.slice(start, entry.idx);
              preMovePattern.push({
                pattern,
                index: start,
                direction: entry.direction,
              });
            }
          });

          //  here i normalize the patterns
          preMovePattern.forEach((p) => {
            p.normalizedPattern = normalize(p.pattern); // add a new field
          });

          // here i normalised the entire ma52024 which i will need to use in order to output the 30 candles "future" of the most similar patter found
          normalizedMA52024 = normalize(ma52024);

          //Start the live refresh loop only after historical data is ready
          setInterval(() => refresh(preMovePattern), 30 * 1000);

          console.log(`All ${fileProcessed} files parsed!`);
          console.log(`Total entries: ${allData2024.length}`);
          // Example output
          console.log(allData2024.slice(0, 5)); // Show first 5 entries
          console.log(onlyPriceClose2024.slice(0, 100));

          // check if function moving average works for 2024
          console.log(ma52024.slice(0, 20));
          //console.log(ma30204.slice(0, 60));

          // check if sigMovIdx is working
          console.log(
            `Relevant index Detected ${sigMovIdx.length} significant moves.`
          );

          // check if the patter are extracted successfully
          console.log(`Extracted ${preMovePattern.length} pre-move patterns.`);
        }
      });
  });
});

// fetching current data from binance API, and then we parse it to JSON
function refresh(preMovePattern) {
  const url =
    "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=50";

  https.get(url, function (apiResponse) {
    let data = "";

    apiResponse.on("data", function (chunk) {
      data += chunk;
    });

    apiResponse.on("end", function () {
      const parsed = JSON.parse(data);

      const candles = parsed.map((element) => ({
        time: new Date(element[0]),
        closePrice: parseFloat(element[4]),
      }));

      const onlyClosePrices = candles.map((c) => c.closePrice);

      const ma5 = calculateMovingAverage(onlyClosePrices, 5);
      const ma30 = calculateMovingAverage(onlyClosePrices, 30);

      if (ma5.filter((v) => v !== null).length < 30) {
        console.warn("Not enough data to normalize live MA5.");
        return;
      }

      const recentMa5 = ma5.slice(-30);
      if (recentMa5.includes(null)) {
        console.warn("Not enough valid MA5 data for comparison.");
        return;
      }

      const normalizedLivema5 = normalize(recentMa5);

      // Compare live MA5 with historical pre-move patterns
      const comparisonResults = preMovePattern.map((p) => {
        const error = mse(normalizedLivema5, p.normalizedPattern);
        return { ...p, mse: error };
      });

      const sorted = comparisonResults.sort((a, b) => a.mse - b.mse);
      const mostSimilar = sorted[0];
      const threshold = 0.045;
      const similarPatterns = sorted.filter((p) => p.mse < threshold);

      // Extract future pattern for direction check
      if (similarPatterns.length > 0 && mostSimilar) {
        const startOfPattern = mostSimilar.index;
        const patternLength = mostSimilar.pattern.length;
        const endOfPattern = startOfPattern + patternLength;
        const futureStart = endOfPattern;

        if (futureStart + 30 <= normalizedMA52024.length) {
          mostSimilar.futurePattern = normalizedMA52024.slice(
            futureStart,
            futureStart + 30
          );
          mostSimilar.historicalPattern = normalizedMA52024.slice(
            startOfPattern,
            endOfPattern
          );
        }
      }

      //const patternCount = similarPatterns.length;

      let decision = "HOLD";
      if (liveTrend === "bullish" && predictedTrend === "bullish") {
        decision = "BUY";
      } else if (liveTrend === "bearish" && predictedTrend === "bearish") {
        decision = "SELL";
      }

      console.log(`Decision based on MA and pattern count: ${decision}`);

      // Optional: Save or display decision in JSON
      const output =
        similarPatterns.length > 0 && mostSimilar && mostSimilar.futurePattern
          ? {
              futurePattern: mostSimilar.futurePattern,
              historicalPattern: mostSimilar.historicalPattern,
              direction: mostSimilar.direction,
              mse: mostSimilar.mse,
              similarCount: similarPatterns.length,
              decision,
            }
          : {
              futurePattern: [],
              historicalPattern: [],
              direction: null,
              mse: null,
              similarCount: 0,
              decision,
            };

      fs.writeFileSync(
        "public/mostSimilar.json",
        JSON.stringify(output, null, 2),
        "utf8"
      );
      console.log("✅ mostSimilar.json written!");
    });
  });
}
