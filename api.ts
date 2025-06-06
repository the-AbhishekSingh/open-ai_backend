import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// RAG endpoint
app.post('/api/query', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Extract keywords from the question (simple split, filter for web3 terms)
    const web3Terms = [
      'defi', 'nft', 'infrastructure', 'dao', 'daos', 'layer 2', 'wallet', 'tooling', 'education', 'privacy', 'gaming', 'polygon', 'ethereum', 'aave', 'uniswap', 'zksync', 'opensea', 'decentraland', 'aragon', 'mask', 'gitcoin'
    ];
    const questionLower = question.toLowerCase();
    const matchedKeywords = web3Terms.filter(term => questionLower.includes(term));

    let contextData = [];
    let contextError = null;

    if (matchedKeywords.length > 0) {
      // Build dynamic or() filter for Supabase
      const orFilters = matchedKeywords.map(term => `details.ilike.%${term}%,category.ilike.%${term}%`).join(',');
      const result = await supabase
        .from('grants')
        .select('details, name, category, link')
        .or(orFilters)
        .limit(3);
      contextData = result.data || [];
      contextError = result.error;
    } else {
      // Fallback: search the whole question in details
      const result = await supabase
        .from('grants')
        .select('details, name, category, link')
        .ilike('details', `%${question}%`)
        .limit(3);
      contextData = result.data || [];
      contextError = result.error;
    }

    if (contextError) {
      throw contextError;
    }

    // 2. Prepare context for the prompt
    const context = contextData
      .map((doc: { details: string }) => doc.details)
      .join('\n\n');

    // 3. Create the prompt with context
    const prompt = `
      Context information:
      ${context}
      
      Question: ${question}
      
      Please provide a detailed answer based on the context provided above. If the context doesn't contain enough information to answer the question, please say so.
    `;

    // 4. Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions based on the provided context. If the context doesn't contain enough information, please say so."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // 5. Calculate cost (gpt-3.5-turbo)
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;
    const promptCost = (promptTokens / 1_000_000) * 0.5;
    const completionCost = (completionTokens / 1_000_000) * 1.5;
    const totalCost = promptCost + completionCost;

    // 5. Return the response
    res.json({
      answer: completion.choices[0].message.content,
      context: contextData,
      usage: completion.usage, // includes prompt_tokens, completion_tokens, total_tokens
      cost: {
        prompt_cost_usd: promptCost,
        completion_cost_usd: completionCost,
        total_cost_usd: totalCost
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process your question' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 