const express = require('express');
const router = express.Router();
const { Task } = require('../models/Task');

// GET /api/tasks - list tasks with filters & sorting
router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      project,
      tag,
      search,
      sortBy = 'priorityScore',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
      dueBefore,
      dueAfter,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (project) filter.project = project;
    if (tag) filter.tags = tag;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
    }

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('project', 'name color icon')
        .populate('tags', 'name color')
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name color icon')
      .populate('tags', 'name color');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/bulk-update - batch status/priority update
router.post('/bulk-update', async (req, res) => {
  try {
    const { ids, update } = req.body;
    await Task.updateMany({ _id: { $in: ids } }, { $set: update });
    res.json({ message: `Updated ${ids.length} tasks` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    const populated = await task.populate('project', 'name color icon');
    await populated.populate('tags', 'name color');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const update = { ...req.body };

    // Auto-set completedAt
    if (update.status === 'completed' && !update.completedAt) {
      update.completedAt = new Date();
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    )
      .populate('project', 'name color icon')
      .populate('tags', 'name color');

    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'completed') update.completedAt = new Date();

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).populate('project', 'name color icon').populate('tags', 'name color');

    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id/subtasks/:subtaskId
router.patch('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, 'subtasks._id': req.params.subtaskId },
      { $set: { 'subtasks.$.completed': req.body.completed } },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task or subtask not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
