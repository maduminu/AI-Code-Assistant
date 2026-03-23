const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const database = require('./database');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = (context = '') => `You are a Senior Principal Software Engineer and Security Expert.
Analyze the provided code OR answer the user's question about the previous conversation. 

ALWAYS return your response in strict JSON format.

${context ? `
[RELEVANT EXPERT KNOWLEDGE]
Use the following patterns to inform your analysis:
${context}
` : ''}

Your response MUST be a valid JSON object with the following structure:
{
  "optimizedCode": "The fully corrected and optimized code as a single string (if applicable, otherwise leave empty).",
  "language": "The programming language (e.g., 'javascript', 'python', etc.).",
  "analysis": [
    {
      "type": "warning", // Use "warning", "error", or "success" (or "info" for casual talk)
      "message": "A concise explanation of an issue, an improvement, or an answer to the user."
    }
  ]
}

If the user is asking a question about the conversation history (e.g., "What did you change?"), use the "analysis" array to answer their question directly.

Focus on:
1. Identifying bugs, security vulnerabilities, and performance bottlenecks.
2. Refactoring for better readability, maintainability, and modern best practices.
3. Explaining your previous changes clearly if asked.

Output ONLY the JSON object. Do NOT include any conversational text outside the JSON.`;

app.post('/api/analyze', async (req, res) => {
  try {
    const { messages, conversationId = 'default' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Valid messages array is required.' });
    }

    const latestMessage = messages[messages.length - 1];
    
    // Save User Message to DB
    if (latestMessage.role === 'user') {
        if (!database.getConversation(conversationId)) {
            database.createConversation(conversationId, latestMessage.content.substring(0, 50) + '...');
        }
        database.saveMessage({ conversationId, ...latestMessage });
    }

    // Load History from DB (to solve Statelessness)
    const history = database.getMessagesByConversation(conversationId);
    
    // RAG: Search Knowledge Base for relevant patterns
    const patterns = database.searchKnowledge(latestMessage.content);
    const contextContent = patterns.map(p => `[Pattern: ${p.pattern_name}]\nIssue: ${p.description}\nFix: ${p.solution}`).join('\n\n');

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT(contextContent) }
    ];

    history.slice(-10).forEach(msg => {
      if (msg.role === 'user') {
        apiMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant' || msg.role === 'ai') {
        // Reconstruct the full optimized response for context memory
        const fullContent = JSON.stringify({
            optimizedCode: msg.optimizedCode || '',
            analysis: JSON.parse(msg.analysis || '[]'),
            language: msg.language || 'javascript'
        });
        apiMessages.push({ role: 'assistant', content: fullContent });
      }
    });

    if (!process.env.OPENROUTER_API_KEY) {
       return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured.' });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "stepfun/step-3.5-flash:free", 
        "messages": apiMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return res.status(500).json({ error: 'OpenRouter API error.', details: errorText });
    }

    const result = await response.json();
    const responseText = result.choices[0].message?.content || "";
    
    // Robust JSON extraction
    let cleanJsonString = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) cleanJsonString = jsonMatch[1].trim();
    else {
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) cleanJsonString = responseText.substring(firstBrace, lastBrace + 1);
    }

    try {
      const parsedData = JSON.parse(cleanJsonString);
      
      // Save AI Response to DB
      database.saveMessage({
          conversationId,
          role: 'assistant',
          content: responseText,
          analysis: parsedData.analysis,
          optimizedCode: parsedData.optimizedCode,
          language: parsedData.language
      });

      res.json(parsedData);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanJsonString);
      res.status(500).json({ error: 'Failed to parse AI response into valid JSON.', rawOutput: cleanJsonString });
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
