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
function fillForm(blog) { $('blog-id').value = blog._id; $('title').value = blog.title; $('category').value = blog.category || 'Other'; $('excerpt').value = blog.excerpt; $('content').value = blog.content; $('tags').value = (blog.tags || []).join(', '); $('coverImage').value = blog.coverImage || ''; $('githubUrl').value = blog.githubUrl || ''; $('deployedUrl').value = blog.deployedUrl || ''; $('published').checked = blog.published; $('form-title').textContent = 'Edit article'; $('cancel-edit').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); }

async function request(url, options = {}) {
    const response = await fetch(`${API}${url}`, options);
    const data = response.status === 204 ? {} : await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
}
let currentPage = 1;
async function loadArticles() {
    const params = new URLSearchParams({ page: currentPage, limit: 8 });
    if ($('search').value.trim()) params.set('search', $('search').value.trim());
    if ($('filter-category').value) params.set('category', $('filter-category').value);
    if ($('filter-published').value) params.set('published', $('filter-published').value);
    const data = await request(`/blogs/admin/all?${params}`, { headers: headers() });
    $('articles').innerHTML = data.blogs.length ? data.blogs.map(blog => `<article class="article"><h3>${escapeHtml(blog.title)}</h3><p>${escapeHtml(blog.category || 'Other')} · ${blog.published ? 'Published' : 'Draft'}</p><div class="article-actions"><button class="button secondary view" data-id="${blog._id}">View</button><button class="button secondary edit" data-id="${blog._id}">Edit</button><button class="button danger delete" data-id="${blog._id}">Delete</button></div></article>`).join('') : '<p>No articles match these filters.</p>';
    $('articles').querySelectorAll('.edit').forEach(button => button.addEventListener('click', () => fillForm(data.blogs.find(blog => blog._id === button.dataset.id))));
    $('articles').querySelectorAll('.view').forEach(button => button.addEventListener('click', () => showDetails(data.blogs.find(blog => blog._id === button.dataset.id))));
    $('articles').querySelectorAll('.delete').forEach(button => button.addEventListener('click', () => deleteBlog(button.dataset.id)));
    $('page-summary').textContent = data.pagination.total ? `Page ${data.pagination.page} of ${Math.max(data.pagination.pages, 1)} · ${data.pagination.total} articles` : '0 articles'; $('previous-page').disabled = currentPage <= 1; $('next-page').disabled = currentPage >= data.pagination.pages;
}
function showDetails(blog) { $('blog-detail').innerHTML = `<p class="eyebrow">${escapeHtml(blog.category || 'Other')} · ${blog.published ? 'Published' : 'Draft'}</p><h2>${escapeHtml(blog.title)}</h2>${blog.coverImage ? `<img class="detail-image" src="${escapeHtml(blog.coverImage)}" alt="${escapeHtml(blog.title)}">` : ''}<p class="detail-excerpt">${escapeHtml(blog.excerpt)}</p><div class="detail-content">${escapeHtml(blog.content).replace(/\n/g, '<br>')}</div><div class="detail-links">${blog.githubUrl ? `<a class="button secondary" href="${escapeHtml(blog.githubUrl)}" target="_blank" rel="noreferrer">GitHub code</a>` : ''}${blog.deployedUrl ? `<a class="button" href="${escapeHtml(blog.deployedUrl)}" target="_blank" rel="noreferrer">View deployed site</a>` : ''}</div>`; $('blog-dialog').showModal(); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
async function deleteBlog(id) { if (!window.confirm('Delete this article permanently?')) return; try { await request(`/blogs/${id}`, { method: 'DELETE', headers: headers() }); await loadArticles(); message('Article deleted.'); } catch (error) { message(error.message, true); } }

$('category').innerHTML = categories.map(category => `<option value="${category}">${category}</option>`).join('');
$('filter-category').innerHTML += categories.map(category => `<option value="${category}">${category}</option>`).join('');
$('login-form').addEventListener('submit', async event => { event.preventDefault(); try { const data = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('password').value }) }); sessionStorage.setItem(tokenKey, data.token); $('password').value = ''; showAdmin(true); await loadArticles(); } catch (error) { message(error.message, true); } });
$('logout').addEventListener('click', async () => { try { await request('/auth/logout', { method: 'POST', headers: headers() }); } finally { sessionStorage.removeItem(tokenKey); showAdmin(false); } });
$('refresh').addEventListener('click', () => loadArticles().catch(error => message(error.message, true)));
$('search').addEventListener('input', () => { currentPage = 1; loadArticles().catch(error => message(error.message, true)); }); $('filter-category').addEventListener('change', () => { currentPage = 1; loadArticles().catch(error => message(error.message, true)); }); $('filter-published').addEventListener('change', () => { currentPage = 1; loadArticles().catch(error => message(error.message, true)); }); $('previous-page').addEventListener('click', () => { currentPage -= 1; loadArticles().catch(error => message(error.message, true)); }); $('next-page').addEventListener('click', () => { currentPage += 1; loadArticles().catch(error => message(error.message, true)); }); $('close-dialog').addEventListener('click', () => $('blog-dialog').close());
$('cancel-edit').addEventListener('click', resetForm);
$('blog-form').addEventListener('submit', async event => { event.preventDefault(); const id = $('blog-id').value; const payload = { title: $('title').value, category: $('category').value, excerpt: $('excerpt').value, content: $('content').value, tags: $('tags').value.split(',').map(tag => tag.trim()).filter(Boolean), coverImage: $('coverImage').value || undefined, githubUrl: $('githubUrl').value || undefined, deployedUrl: $('deployedUrl').value || undefined, published: $('published').checked }; try { await request(id ? `/blogs/${id}` : '/blogs', { method: id ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(payload) }); resetForm(); await loadArticles(); message('Article saved.'); } catch (error) { $('form-message').textContent = error.message; } });
if (token()) { showAdmin(true); loadArticles().catch(error => { sessionStorage.removeItem(tokenKey); showAdmin(false); message(error.message, true); }); }
