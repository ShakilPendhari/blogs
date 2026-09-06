const API = '/api';
const categories = ['Frontend', 'Backend', 'React.js', 'Next.js', 'MongoDB', 'Databases', 'Linux', 'DevOps', 'JavaScript', 'TypeScript', 'CSS', 'Other'];
const tokenKey = 'blog-admin-token';
const $ = id => document.getElementById(id);
const token = () => sessionStorage.getItem(tokenKey);
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

function showAdmin(isAdmin) {
    $('login-panel').classList.toggle('hidden', isAdmin);
    $('admin-panel').classList.toggle('hidden', !isAdmin);
    $('logout').classList.toggle('hidden', !isAdmin);
}
function message(text, isError = false) { $('notice').textContent = text; $('notice').style.color = isError ? 'var(--danger)' : 'var(--accent)'; }
function resetForm() { $('blog-form').reset(); $('blog-id').value = ''; $('form-title').textContent = 'New article'; $('cancel-edit').classList.add('hidden'); $('published').checked = true; }
function fillForm(blog) { $('blog-id').value = blog._id; $('title').value = blog.title; $('category').value = blog.category || 'Other'; $('excerpt').value = blog.excerpt; $('content').value = blog.content; $('tags').value = (blog.tags || []).join(', '); $('coverImage').value = blog.coverImage || ''; $('published').checked = blog.published; $('form-title').textContent = 'Edit article'; $('cancel-edit').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); }

async function request(url, options = {}) {
    const response = await fetch(`${API}${url}`, options);
    const data = response.status === 204 ? {} : await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
}
async function loadArticles() {
    const data = await request('/blogs/admin/all', { headers: headers() });
    $('articles').innerHTML = data.blogs.length ? data.blogs.map(blog => `<article class="article"><h3>${escapeHtml(blog.title)}</h3><p>${escapeHtml(blog.category || 'Other')} · ${blog.published ? 'Published' : 'Draft'}</p><div class="article-actions"><button class="button secondary edit" data-id="${blog._id}">Edit</button><button class="button danger delete" data-id="${blog._id}">Delete</button></div></article>`).join('') : '<p>No articles yet.</p>';
    $('articles').querySelectorAll('.edit').forEach(button => button.addEventListener('click', () => fillForm(data.blogs.find(blog => blog._id === button.dataset.id))));
    $('articles').querySelectorAll('.delete').forEach(button => button.addEventListener('click', () => deleteBlog(button.dataset.id)));
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
async function deleteBlog(id) { if (!window.confirm('Delete this article permanently?')) return; try { await request(`/blogs/${id}`, { method: 'DELETE', headers: headers() }); await loadArticles(); message('Article deleted.'); } catch (error) { message(error.message, true); } }

$('category').innerHTML = categories.map(category => `<option value="${category}">${category}</option>`).join('');
$('login-form').addEventListener('submit', async event => { event.preventDefault(); try { const data = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('password').value }) }); sessionStorage.setItem(tokenKey, data.token); $('password').value = ''; showAdmin(true); await loadArticles(); } catch (error) { message(error.message, true); } });
$('logout').addEventListener('click', async () => { try { await request('/auth/logout', { method: 'POST', headers: headers() }); } finally { sessionStorage.removeItem(tokenKey); showAdmin(false); } });
$('refresh').addEventListener('click', () => loadArticles().catch(error => message(error.message, true)));
$('cancel-edit').addEventListener('click', resetForm);
$('blog-form').addEventListener('submit', async event => { event.preventDefault(); const id = $('blog-id').value; const payload = { title: $('title').value, category: $('category').value, excerpt: $('excerpt').value, content: $('content').value, tags: $('tags').value.split(',').map(tag => tag.trim()).filter(Boolean), coverImage: $('coverImage').value || undefined, published: $('published').checked }; try { await request(id ? `/blogs/${id}` : '/blogs', { method: id ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(payload) }); resetForm(); await loadArticles(); message('Article saved.'); } catch (error) { $('form-message').textContent = error.message; } });
if (token()) { showAdmin(true); loadArticles().catch(error => { sessionStorage.removeItem(tokenKey); showAdmin(false); message(error.message, true); }); }
