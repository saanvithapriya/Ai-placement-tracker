const SkillProgress = require('../models/SkillProgress');

// @desc    Get all skills for logged-in user
// @route   GET /api/skills
const getSkills = async (req, res) => {
  const skills = await SkillProgress.find({ user: req.user._id }).sort('name');
  const stats = {
    total: skills.length,
    completed: skills.filter((s) => s.status === 'Completed').length,
    inProgress: skills.filter((s) => s.status === 'In Progress').length,
    notStarted: skills.filter((s) => s.status === 'Not Started').length,
    avgProgress: skills.length > 0
      ? Math.round(skills.reduce((sum, s) => sum + s.progress, 0) / skills.length)
      : 0,
  };
  res.json({ success: true, count: skills.length, stats, skills });
};

// @desc    Create a skill entry
// @route   POST /api/skills
const createSkill = async (req, res) => {
  const { name, category, progress, target, notes } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Skill name is required' });

  const existing = await SkillProgress.findOne({ user: req.user._id, name });
  if (existing) return res.status(400).json({ success: false, message: 'You already have this skill tracked' });

  const skill = await SkillProgress.create({
    user: req.user._id, name, category, progress: progress || 0, target: target || 100, notes,
  });
  res.status(201).json({ success: true, skill });
};

// @desc    Update skill progress
// @route   PUT /api/skills/:id
const updateSkill = async (req, res) => {
  const skill = await SkillProgress.findOne({ _id: req.params.id, user: req.user._id });
  if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

  const fields = ['name', 'category', 'progress', 'target', 'notes'];
  fields.forEach((f) => { if (req.body[f] !== undefined) skill[f] = req.body[f]; });

  await skill.save();
  res.json({ success: true, skill });
};

// @desc    Delete skill
// @route   DELETE /api/skills/:id
const deleteSkill = async (req, res) => {
  const skill = await SkillProgress.findOne({ _id: req.params.id, user: req.user._id });
  if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
  await skill.deleteOne();
  res.json({ success: true, message: 'Skill deleted' });
};

module.exports = { getSkills, createSkill, updateSkill, deleteSkill };
