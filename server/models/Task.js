const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'completed', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  priorityScore: { type: Number, default: 0 },
  dueDate: { type: Date, default: null },
  estimatedEffort: { type: Number, default: 1, min: 0.5, max: 40 }, // hours
  actualEffort: { type: Number, default: null },
  urgency: { type: Number, default: 5, min: 1, max: 10 },
  importance: { type: Number, default: 5, min: 1, max: 10 },
  completedAt: { type: Date, default: null },
  naturalLanguageInput: { type: String, default: '' }, // original NLP input
  aiSuggestions: {
    priority: String,
    reasoning: String,
    suggestedDueDate: Date,
  },
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', null], default: null },
    nextDue: { type: Date, default: null }
  },
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Compute priority score before saving
taskSchema.pre('save', function (next) {
  this.priorityScore = computePriorityScore(this);
  next();
});

taskSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.$set) {
    const doc = { ...update.$set };
    if (doc.dueDate || doc.urgency || doc.importance || doc.estimatedEffort || doc.status) {
      const existing = await this.model.findOne(this.getQuery());
      const merged = { ...existing?.toObject(), ...doc };
      update.$set.priorityScore = computePriorityScore(merged);
    }
  }
  next();
});

function computePriorityScore(task) {
  const now = new Date();
  let score = 0;

  // Urgency (1-10) × 2
  score += (task.urgency || 5) * 2;

  // Importance (1-10) × 3
  score += (task.importance || 5) * 3;

  // Due date proximity boost
  if (task.dueDate) {
    const hoursUntilDue = (new Date(task.dueDate) - now) / (1000 * 60 * 60);
    if (hoursUntilDue < 0) score += 40; // overdue
    else if (hoursUntilDue < 24) score += 30;
    else if (hoursUntilDue < 72) score += 20;
    else if (hoursUntilDue < 168) score += 10;
    else if (hoursUntilDue < 720) score += 5;
  }

  // Effort penalty: bigger tasks slightly deprioritized for quick wins
  const effort = task.estimatedEffort || 1;
  if (effort <= 1) score += 5;
  else if (effort <= 4) score += 2;
  else if (effort > 8) score -= 3;

  // Priority label boost
  const priorityBoost = { critical: 20, high: 10, medium: 0, low: -5 };
  score += priorityBoost[task.priority] || 0;

  // Status penalty
  if (task.status === 'completed' || task.status === 'cancelled') score = 0;

  return Math.max(0, Math.round(score));
}

const Task = mongoose.model('Task', taskSchema);
module.exports = { Task, computePriorityScore };
