const express = require('express');
const router = express.Router();
const { parseNaturalLanguageTask, getTaskPrioritySuggestion, getDailyPlan } = require('../services/aiService');
const { Task } = require('../models/Task');

// POST /api/ai/parse - parse natural language into task fields
router.post('/parse', async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) return res.status(400).json({ message: 'Input is required' });

    const parsed = await parseNaturalLanguageTask(input);
    res.json({ ...parsed, naturalLanguageInput: input });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/suggest/:taskId - get AI priority suggestion for existing task
router.post('/suggest/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const suggestion = await getTaskPrioritySuggestion(task);

    // Optionally apply the suggestion
    if (req.body.apply) {
      task.priority = suggestion.priority;
      task.urgency = suggestion.urgency;
      task.importance = suggestion.importance;
      task.aiSuggestions = { priority: suggestion.priority, reasoning: suggestion.reasoning };
      await task.save();
    }

    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ai/daily-plan - generate a daily productivity plan
router.get('/daily-plan', async (req, res) => {
  try {
    const tasks = await Task.find({ status: { $nin: ['completed', 'cancelled'] } })
      .populate('project', 'name')
      .sort({ priorityScore: -1 })
      .limit(30);

    const plan = await getDailyPlan(tasks);
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
