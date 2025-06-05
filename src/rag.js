const { supabase } = require('./supabaseClient');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractKeyword(question) {
  const lower = question.toLowerCase();
  if (lower.includes('defi')) return 'DeFi';
  if (lower.includes('ethereum')) return 'Ethereum';
  if (lower.includes('polygon')) return 'Polygon';
  if (lower.includes('aave')) return 'Aave';
  if (lower.includes('uniswap')) return 'Uniswap';
  if (lower.includes('solana')) return 'Solana';
  return question;
}

async function answerQuestion(question) {
  const keyword = extractKeyword(question);
  const { data, error } = await supabase
    .from('grant_metadata')
    .select('name, details, link, category, subcategory')
    .or(`name.ilike.*${keyword}*,details.ilike.*${keyword}*,category.ilike.*${keyword}*,subcategory.ilike.*${keyword}*`)
    .limit(5);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Database error occurred');
  }

  if (data && data.length > 0) {
    const grantsByCategory = data.reduce((acc, grant) => {
      const category = grant.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(grant);
      return acc;
    }, {});

    const formattedResponse = Object.entries(grantsByCategory)
      .map(([category, grants]) => {
        const grantsList = grants
          .map(grant =>
            `Name: ${grant.name}\nDetails: ${grant.details}\nSubcategory: ${grant.subcategory || ''}\nLink: <a href="${grant.link}" target="_blank">${grant.link}</a>`
          )
          .join("\n\n");
        return `Category: ${category}\n\n${grantsList}`;
      })
      .join("\n\n---\n\n");
    return formattedResponse;
  }

  // If no exact matches found, use OpenAI to generate a response
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant specializing in Web3 and DeFi grants. When asked about grants, provide specific information about available grants, including their names, organizations, and direct links when possible. Format your response in a clear, structured way. For any links, format them as HTML anchor tags like this: <a href=\"URL\" target=\"_blank\">URL</a>`,
        },
        { role: 'user', content: question },
      ],
      max_tokens: 500,
    });
    const answer = completion.choices?.[0]?.message?.content?.trim();
    return answer || "Sorry, I couldn't find specific grant information for your query.";
  } catch (err) {
    console.error('OpenAI error:', err);
    return "Sorry, I couldn't find grant information and the AI assistant is currently unavailable.";
  }
}

module.exports = { answerQuestion }; 