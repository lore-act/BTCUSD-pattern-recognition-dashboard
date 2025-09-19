 🔍 BTC/USD Pattern recognition dashboard
*A Node.js + Chart.js dashboard that detects recurring BTC/USD price patterns*  

This tool analyzes **historical and live BTC/USD data** to spot recurring trading patterns.  
It compares current market conditions against past data, projects potential outcomes, and  
visualizes results in a clean dashboard.  

📈 Whether you’re exploring crypto data or experimenting with trading ideas, this project  
gives you a hands-on look at **pattern recognition in financial markets**. 

[![License](https://img.shields.io/badge/license-BSL--1.1-blue.svg)](LICENSE)  


## 🚀 Features  
- 🔄 **Live Binance API integration** – fetches fresh 1 minute candles in real time  
- 📊 **Chart.js visualizations** – moving averages, volatility, pattern matches  
- 🧠 **Pattern similarity detection** – compares current setup with history (2024) (MSE-based) going through 500 000+ past prices 
- ➡️ **Output** – shows the most similar pattern based on MSE + how many similar patterns were found and also shows where those pattern occurred: near support / resistance / neutral zone.
- 🎯 **shows next 30 minutes movement** – Based on the most similar pattern found, it visualizes the next 30 minutes price movement of that pattern
- 📂 **CSV ingestion** – load and analyze historical BTC 1 minute candles  
- 📍 **Decision engine** – generates BUY / SELL / HOLD suggestions  
- ⏳ **auto refresh** – the dashboard refreshes every 30 sec

## 💡 Strategy
-  1 Wait to find a pattern with MSE <= 0.02 MSE (very similar to the live setting)
-  2 Wait to have a least 100+ similar patterns found
-  3 Compare market zone (Support / Resistance / Neutral) of the previous pattern, with current live setting price Zone
-  4 Check both MA (5 minutes and 30 minutes) are on the same direction (bullish / bearish) 
-  5 Go in the market to either buy or sell, depending on the decision engine.

## 🖼️ Dashboard Preview 
- **Price + moving averages** ![Updated_1](https://github.com/user-attachments/assets/20fa01a3-a2ab-4793-b49f-4d4f1da0d834)


- **Most similar historical patterns + Projected outcome for the next 30 minutes**![Updated_2](https://github.com/user-attachments/assets/ea196b06-6bac-4747-bbd0-a43dc3d1aeca)

- **max/min MA difference** ![DB_max min ma difference](https://github.com/user-attachments/assets/93d8890f-d522-4ab4-b589-2777e282a875)

## 🖼️ Dashboard "in action" next to real Vantage account (for testing) 
   - tips to understand the graph called "Most Similar Pattern Visualization (Period: 5)" :
   - the blueline is the current MA 5 minutes price, the red line connected to the blue line is the probable price prediction, that's why the time is represented with +1/+2/+3/+4/+5 minutes... till +30 minute
   - ![chrome_9vomZXmXAj](https://github.com/user-attachments/assets/9ecada23-7aa7-4bf1-9adc-ac2505ed0bfa)


 

## 🛠️ Tech Stack  
- **Backend**: Node.js, csv-parser, fs  
- **Frontend**: HTML, CSS, Chart.js  
- **Data**: Binance API + local CSVs downloaded from Binance API

## 📬 Contact
- gitHub: [@lore-act]
- Linkedin: [https://www.linkedin.com/in/lorenzo-grumetti/]
- email: lorenzo.grumetti@gmail.com
- project link [BTCUSD Pattern Recognition Dashboard] https://github.com/lore-act/BTCUSD-pattern-recognition-dashboard/ 
