const mongoose = require('mongoose');

const defaultCategories = ['Frontend', 'Backend', 'React.js', 'Next.js', 'MongoDB', 'Databases', 'Linux', 'DevOps', 'JavaScript', 'TypeScript', 'CSS', 'Other'];

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
module.exports.defaultCategories = defaultCategories;
