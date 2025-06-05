require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { answerQuestion } = require('./src/rag');

const app = express();
app.use(cors());
app.use(express.json());

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
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`)); 