const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));

const db = mysql.createConnection({
  host: '122.175.45.45',
  port: '3306',
  user: 'comn_db',
  password: 'Qazwsx123#',
  database: 'temp' // Make sure this is correct
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('❌ DB Connection Error:', err.message);
    return;
  }
  console.log('✅ MySQL Connected');
});

// Route: Get results for specific ticker and date
app.get('/stock_results', (req, res) => {
  const { ticker, date } = req.query;
  console.log('🔍 Incoming Request:', { ticker, date });

  if (!ticker || !date) {
    return res.status(400).json({ error: 'ticker and date are required.' });
  }

  const query = `
    SELECT * 
    FROM temp.charts_data
    WHERE ticker = ? AND DATE(date) = ?
  `;

  db.query(query, [ticker, date], (err, results) => {
    if (err) {
      console.error('❌ SQL Query Error:', err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ Found ${results.length} record(s)`);
    res.json({ records: results });
  });
});

app.get('/tickers', (req, res) => {
  const query = `
    SELECT DISTINCT ticker FROM temp.charts_data ORDER BY ticker
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Ticker Fetch Error:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const tickers = results.map(row => row.ticker);
    res.json({ tickers });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});