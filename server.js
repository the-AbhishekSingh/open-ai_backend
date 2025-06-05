try {
  require('dotenv').config();
} catch (error) {
  console.warn('Warning: dotenv configuration failed. Make sure .env file exists and is properly formatted.');
}

const express = require('express');
const cors = require('cors');
const { answerQuestion } = require('./src/rag');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    const answer = await answerQuestion(question);
    res.json({ answer });
  } catch (err) {
    console.error('Error in /api/ask:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
}); 