const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Parse a natural language task description into structured task data
 * e.g. "Finish report by Friday, high priority, about 2 hours"
 */
async function parseNaturalLanguageTask(input) {
  const today = new Date().toISOString().split('T')[0];

  const prompt = `Today is ${today}. Parse this natural language task description into structured JSON.

Input: "${input}"

Return a JSON object with these fields (all optional except title):
{
  "title": "clean task title",
  "description": "any additional details",
  "dueDate": "ISO 8601 date string or null",  
  "priority": "low|medium|high|critical",
  "estimatedEffort": number (hours, 0.5-40),
  "urgency": number (1-10),
  "importance": number (1-10),
  "tags": ["array", "of", "tag", "names"],
  "reasoning": "brief explanation of how you determined priority/urgency"
}

Rules:
- "by Friday" → compute the next upcoming Friday date
- "ASAP" or "urgent" → high urgency (8-10) and priority "critical" or "high"
- "important" → high importance
- Effort clues: "quick" = 0.5h, "small" = 1h, "medium" = 2-4h, "large" = 8h
- Return ONLY valid JSON, no markdown, no explanation outside the JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    const raw = completion.choices[0].message.content.trim();
    return JSON.parse(raw);
  } catch (err) {
    console.error('OpenAI parse error:', err.message);
    // Fallback: return title only
    return {
      title: input,
      priority: 'medium',
      urgency: 5,
      importance: 5,
      estimatedEffort: 1,
      dueDate: null,
      tags: [],
      reasoning: 'Could not parse with AI – defaults applied',
    };
  }
}

/**
 * Get AI-powered priority suggestions for an existing task
 */
async function getTaskPrioritySuggestion(task) {
  const prompt = `Analyze this task and suggest improvements to its priority settings.

Task: ${JSON.stringify({
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    urgency: task.urgency,
    importance: task.importance,
    estimatedEffort: task.estimatedEffort,
    status: task.status,
  }, null, 2)}

Return JSON:
{
  "priority": "low|medium|high|critical",
  "urgency": number (1-10),
  "importance": number (1-10),
  "reasoning": "2-3 sentence explanation"
}

Return ONLY valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 300,
    });

    const raw = completion.choices[0].message.content.trim();
    return JSON.parse(raw);
  } catch (err) {
    console.error('OpenAI suggestion error:', err.message);
    return {
      priority: task.priority,
      urgency: task.urgency,
      importance: task.importance,
      reasoning: 'AI suggestion unavailable.',
    };
  }
}

/**
 * Get a daily productivity plan from AI
 */
async function getDailyPlan(tasks) {
  const today = new Date().toISOString().split('T')[0];
  const activeTasks = tasks
    .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    .slice(0, 20)
    .map(t => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      priorityScore: t.priorityScore,
      dueDate: t.dueDate,
      estimatedEffort: t.estimatedEffort,
    }));

  const prompt = `Today is ${today}. Given these tasks, create a daily productivity plan.

Tasks: ${JSON.stringify(activeTasks, null, 2)}

Return JSON:
{
  "morningFocus": [{ "taskId": "id", "title": "title", "reason": "why now" }],
  "afternoonFocus": [{ "taskId": "id", "title": "title", "reason": "why now" }],
  "quickWins": [{ "taskId": "id", "title": "title" }],
  "summary": "2-3 sentence overview of the day plan",
  "tip": "one productivity tip relevant to today's tasks"
}

Return ONLY valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const raw = completion.choices[0].message.content.trim();
    return JSON.parse(raw);
  } catch (err) {
    console.error('OpenAI daily plan error:', err.message);
    return {
      morningFocus: [],
      afternoonFocus: [],
      quickWins: [],
      summary: 'Could not generate AI plan.',
      tip: 'Focus on your highest priority tasks first.',
    };
  }
}

module.exports = { parseNaturalLanguageTask, getTaskPrioritySuggestion, getDailyPlan };
