const express = require('express');
const router = express.Router();
const { Task } = require('../models/Task');
const Project = require('../models/Project');

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const [total, byStatus, byPriority, projects] = await Promise.all([
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const statusMap = {};
    byStatus.forEach(s => (statusMap[s._id] = s.count));
    const priorityMap = {};
    byPriority.forEach(p => (priorityMap[p._id] = p.count));
    const projectMap = {};
    projects.forEach(p => (projectMap[p._id] = p.count));

    res.json({ total, statusMap, priorityMap, projectMap });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/productivity - tasks completed per day (last 30 days)
router.get('/productivity', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const data = await Task.aggregate([
      { $match: { status: 'completed', completedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
          totalEffort: { $sum: '$actualEffort' },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0
    const filled = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const found = data.find(x => x._id === key);
      filled.push({ date: key, count: found?.count || 0, totalEffort: found?.totalEffort || 0 });
    }

    res.json(filled);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/overdue
router.get('/overdue', async (req, res) => {
  try {
    const tasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] },
    })
      .populate('project', 'name color')
      .sort({ dueDate: 1 })
      .limit(20);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/upcoming - tasks due in next N days
router.get('/upcoming', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const now = new Date();
    const until = new Date();
    until.setDate(until.getDate() + days);

    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: until },
      status: { $nin: ['completed', 'cancelled'] },
    })
      .populate('project', 'name color')
      .sort({ dueDate: 1, priorityScore: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/completion-rate
router.get('/completion-rate', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [created, completed] = await Promise.all([
      Task.countDocuments({ createdAt: { $gte: since } }),
      Task.countDocuments({ completedAt: { $gte: since } }),
    ]);

    res.json({
      created,
      completed,
      rate: created > 0 ? Math.round((completed / created) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
