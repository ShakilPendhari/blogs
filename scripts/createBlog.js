const mongoose = require('mongoose');
const Blog = require('../src/models/Blog');
const { mongoUri, validateEnvironment } = require('../src/config');

// Usage: npm run create-blog -- --title "Title" --category React.js --excerpt "Summary" --content "# Markdown" --tags react,api --coverImage https://... --githubUrl https://github.com/... --deployedUrl https://... --published true
const args = process.argv.slice(2).reduce((result, arg, index, list) => {
  if (arg.startsWith('--')) result[arg.slice(2)] = list[index + 1] && !list[index + 1].startsWith('--') ? list[index + 1] : 'true'; return result;
}, {});
async function createBlog() {
  validateEnvironment();
  if (!args.title || !args.excerpt || !args.content) throw new Error('title, excerpt, and content are required.');
  await mongoose.connect(mongoUri);
  const blog = await Blog.create({ title: args.title, category: args.category || 'Other', excerpt: args.excerpt, content: args.content, tags: args.tags ? args.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [], coverImage: args.coverImage || undefined, githubUrl: args.githubUrl || undefined, deployedUrl: args.deployedUrl || undefined, published: args.published === 'true' });
  console.log(`Created blog: ${blog.slug}`); await mongoose.disconnect();
}
createBlog().catch(async error => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
