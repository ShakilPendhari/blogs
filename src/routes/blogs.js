const express = require('express');
const Blog = require('../models/Blog');
const { categories } = Blog;
const admin = require('../middleware/admin');
const router = express.Router();

const cleanText = value => typeof value === 'string' ? value.trim() : value;
function normalizePayload(body) {
  const payload = {};
  for (const key of ['title', 'slug', 'excerpt', 'content', 'coverImage', 'readingTime', 'category']) if (body[key] !== undefined) payload[key] = cleanText(body[key]);
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some(tag => typeof tag !== 'string')) { const error = new Error('tags must be an array of strings.'); error.status = 400; throw error; }
    payload.tags = body.tags.map(cleanText).filter(Boolean).slice(0, 12);
  }
  if (body.published !== undefined) {
    if (typeof body.published !== 'boolean') { const error = new Error('published must be a boolean.'); error.status = 400; throw error; }
    payload.published = body.published;
  }
  if (body.publishedAt !== undefined) { const date = new Date(body.publishedAt); if (Number.isNaN(date.valueOf())) { const error = new Error('publishedAt must be a valid date.'); error.status = 400; throw error; } payload.publishedAt = date; }
  return payload;
}
function required(payload, creating) { if (creating && ['title', 'excerpt', 'content'].some(key => !payload[key])) { const error = new Error('title, excerpt, and content are required.'); error.status = 400; throw error; } }

router.get('/categories', async (req, res, next) => { try { res.json({ categories }); } catch (error) { next(error); } });
router.get('/admin/all', admin, async (req, res, next) => { try { const blogs = await Blog.find({}).sort({ createdAt: -1 }).select('-__v'); res.json({ blogs }); } catch (error) { next(error); } });
router.get('/', async (req, res, next) => { try { const filter = { published: true }; if (req.query.category) filter.category = req.query.category; const blogs = await Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 }).select('-__v'); res.json({ blogs }); } catch (error) { next(error); } });
router.get('/:slug', async (req, res, next) => { try { const blog = await Blog.findOne({ slug: req.params.slug.toLowerCase(), published: true }).select('-__v'); if (!blog) return res.status(404).json({ error: 'Blog not found.' }); res.json({ blog }); } catch (error) { next(error); } });
router.post('/', admin, async (req, res, next) => { try { const payload = normalizePayload(req.body); required(payload, true); const blog = await Blog.create(payload); res.status(201).json({ blog }); } catch (error) { next(error); } });
router.put('/:id', admin, async (req, res, next) => { try { const payload = normalizePayload(req.body); const current = await Blog.findById(req.params.id); if (!current) return res.status(404).json({ error: 'Blog not found.' }); if (payload.published === true && !current.published && !payload.publishedAt) payload.publishedAt = new Date(); const blog = await Blog.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }); res.json({ blog }); } catch (error) { next(error); } });
router.delete('/:id', admin, async (req, res, next) => { try { const blog = await Blog.findByIdAndDelete(req.params.id); if (!blog) return res.status(404).json({ error: 'Blog not found.' }); res.status(204).end(); } catch (error) { next(error); } });
module.exports = router;
