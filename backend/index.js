const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables loaded

const SYSTEM_PROMPT = `You are a Senior Principal Software Engineer and Security Expert.
Analyze the provided code and return your analysis in strict JSON format.

Your response MUST be a valid JSON object with the following structure:
{
  "optimizedCode": "The fully corrected and optimized code as a single string.",
  "analysis": [
    {
      "type": "warning", // Use "warning", "error", or "success"
      "message": "A concise explanation of an issue found or an improvement made."
    }
  ]
}

Focus on:
1. Identifying bugs, security vulnerabilities, and performance bottlenecks.
2. Refactoring for better readability, maintainability, and modern best practices.
3. Providing clear, actionable insights in the analysis array.
Do not wrap your response in markdown code blocks (\`\`\`json). Just return the raw JSON string.`;

app.post('/api/analyze', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Valid code string is required.' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
       return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured.' });
    }

    const prompt = `${SYSTEM_PROMPT}\n\nHere is the code to analyze:\n\n${code}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "stepfun/step-3.5-flash:free", 
        "messages": [
          {"role": "user", "content": prompt}
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return res.status(500).json({ error: 'OpenRouter API error.', details: errorText });
    }

    const result = await response.json();
    const responseText = result.choices[0].message.content;
    
    // Clean potential markdown formatting from the response
    const cleanJsonString = responseText.replace(/^\\s*\`\`\`json/m, '').replace(/\`\`\`\\s*$/m, '').trim();

    try {
      const parsedData = JSON.parse(cleanJsonString);
      res.json(parsedData);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanJsonString);
      res.status(500).json({ 
        error: 'Failed to parse AI response into valid JSON.',
        rawOutput: cleanJsonString
      });
    }

  } catch (error) {
    console.error('Error during analysis:', error);
    res.status(500).json({ error: 'An error occurred during code analysis.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
