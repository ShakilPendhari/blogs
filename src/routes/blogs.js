const express = require('express');
const crypto = require('node:crypto');
const multer = require('multer');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const Blog = require('../models/Blog');
const { categories } = Blog;
const admin = require('../middleware/admin');
const { storage } = require('../config');
const router = express.Router();
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) });
const objectStorage = storage.bucket && storage.accessKeyId && storage.secretAccessKey ? new S3Client({ endpoint: storage.endpoint, region: storage.region, credentials: { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey }, forcePathStyle: Boolean(storage.endpoint) }) : null;


const cleanText = value => typeof value === 'string' ? value.trim() : value;

function normalizePayload(body) {
  const payload = {};

  for (const key of ['title', 'slug', 'excerpt', 'content', 'coverImage', 'githubUrl', 'deployedUrl', 'readingTime', 'category']) if (body[key] !== undefined) payload[key] = cleanText(body[key]);

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some(tag => typeof tag !== 'string')) {
      const error = new Error('tags must be an array of strings.');
      error.status = 400;
      throw error;
    }
    payload.tags = body.tags.map(cleanText).filter(Boolean).slice(0, 12);

  }
  if (body.published !== undefined) {
    if (typeof body.published !== 'boolean') {
      const error = new Error('published must be a boolean.');
      error.status = 400;
      throw error;
    }
    payload.published = body.published;

  }
  if (body.publishedAt !== undefined) {
    const date = new Date(body.publishedAt);
    if (Number.isNaN(date.valueOf())) {
      const error = new Error('publishedAt must be a valid date.');
      error.status = 400;
      throw error;
    } payload.publishedAt = date;
  }
  return payload;

}
function required(payload, creating) {
  if (creating && ['title', 'excerpt', 'content'].some(key => !payload[key])) {
    const error = new Error('title, excerpt, and content are required.');
    error.status = 400;
    throw error;

  }
}

router.get('/categories', async (req, res, next) => {
  try {
    res.json({ categories });

  }
  catch (error) {
    next(error);

  }
});

router.post('/upload', admin, (req, res, next) => imageUpload.single('image')(req, res, async error => {
  try {
    if (error) return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : 'Upload a JPEG, PNG, WebP, or GIF image.' });
    if (!req.file) return res.status(400).json({ error: 'Choose an image to upload.' });
    if (!objectStorage || !storage.publicBaseUrl) return res.status(503).json({ error: 'Image storage is not configured.' });
    const extension = req.file.originalname.includes('.') ? req.file.originalname.slice(req.file.originalname.lastIndexOf('.')).toLowerCase() : '';
    const key = `blog-covers/${Date.now()}-${crypto.randomUUID()}${extension}`;
    await objectStorage.send(new PutObjectCommand({ Bucket: storage.bucket, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype, CacheControl: 'public, max-age=31536000, immutable' }));
    res.status(201).json({ url: `${storage.publicBaseUrl}/${key}` });
  } catch (uploadError) { next(uploadError); }
}));


function pagination(query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);

  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
}
function listFilter(query, includeDrafts = false) {
  const filter = includeDrafts ? {} : { published: true };
  if (query.category) filter.category = query.category;
  if (includeDrafts && (query.published === 'true' || query.published === 'false')) filter.published = query.published === 'true';
  if (query.search?.trim()) {
    const search = query.search.trim();
    filter.$or = [{ title: { $regex: search, $options: 'i' } }, { excerpt: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }, { tags: { $regex: search, $options: 'i' } }];
  } return filter;
}
async function listBlogs(req, res, includeDrafts = false) {
  const filter = listFilter(req.query, includeDrafts);
  const { page, limit, skip } = pagination(req.query);
  const [blogs, total] = await Promise.all([Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).select('-__v'), Blog.countDocuments(filter)]);
  res.json({ blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
router.get('/admin/all', admin, async (req, res, next) => {
  try {
    await listBlogs(req, res, true);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    await listBlogs(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug.toLowerCase(), published: true }).select('-__v');
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });
    res.json({ blog });
  } catch (error) {
    next(error);

  }
});

router.post('/', admin, async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);
    required(payload, true);
    const blog = await Blog.create(payload);
    res.status(201).json({ blog });
  } catch (error) {
    next(error);

  }
});

router.put('/:id', admin, async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);
    const current = await Blog.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Blog not found.' });
    if (payload.published === true && !current.published && !payload.publishedAt) payload.publishedAt = new Date();
    const blog = await Blog.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.json({ blog });
  } catch (error) {
    next(error);

  }
});

router.delete('/:id', admin, async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });
    res.status(204).end();
  } catch (error) {
    next(error);

  }
});

module.exports = router;

