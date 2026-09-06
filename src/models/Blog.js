const mongoose = require('mongoose');
const slugify = require('slugify');

const categories = ['Frontend', 'Backend', 'React.js', 'Next.js', 'MongoDB', 'Databases', 'Linux', 'DevOps', 'JavaScript', 'TypeScript', 'CSS', 'Other'];

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 200, match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug may contain only lowercase letters, numbers, and hyphens.'] },
  category: { type: String, enum: categories, default: 'Other', trim: true },
  excerpt: { type: String, required: true, trim: true, maxlength: 500 },
  content: { type: String, required: true, trim: true, maxlength: 100000 },
  coverImage: { type: String, trim: true, maxlength: 2048, validate: { validator: value => !value || /^https?:\/\//i.test(value), message: 'coverImage must be an http(s) URL.' } },
  tags: { type: [String], default: [], validate: [tags => tags.length <= 12, 'A blog may have at most 12 tags.'] },
  readingTime: { type: String, trim: true, maxlength: 30 },
  published: { type: Boolean, default: false },
  publishedAt: { type: Date }
}, { timestamps: true });

blogSchema.pre('validate', function makeSlug(next) {
  if (!this.slug && this.title) this.slug = slugify(this.title, { lower: true, strict: true, trim: true });
  if (this.published && !this.publishedAt) this.publishedAt = new Date();
  next();
});
module.exports = mongoose.model('Blog', blogSchema);
module.exports.categories = categories;
