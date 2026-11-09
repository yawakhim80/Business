import { getSupabaseClient, isSupabaseConfigured, STORAGE_BUCKET } from './supabase-client.js';

const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const loginStatus = document.querySelector('#login-status');
const loginButton = document.querySelector('#login-button');
const listingForm = document.querySelector('#listing-form');
const editorStatus = document.querySelector('#editor-status');
const listings = document.querySelector('#admin-listings');
const typeSelect = document.querySelector('#listing-type');
const imageInput = document.querySelector('#listing-image');
const cancelEdit = document.querySelector('#cancel-edit');
const listingTypeFilter = document.querySelector('#listing-type-filter');
const listingStatusFilter = document.querySelector('#listing-status-filter');
let supabase;
let currentItems = [];

const setStatus = (element, message, isError = false) => {
  element.textContent = message;
  element.classList.toggle('is-error', isError);
};

const formatPrice = item => `Rs. ${Number(item.price).toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const publicImageUrl = path => supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;

const updateFormLabels = () => {
  const isRoom = typeSelect.value === 'room';
  const isSpecialFood = typeSelect.value === 'special_food';
  document.querySelector('#name-label').textContent = isRoom ? 'Room name' : isSpecialFood ? 'Food name' : 'Product name';
  document.querySelector('#price-label').textContent = isRoom ? 'Price per night (Rs.)' : 'Price (Rs.)';
  document.querySelector('#availability-label').textContent = isRoom ? 'Room availability' : isSpecialFood ? 'Food availability' : 'Stock status';
  document.querySelector('#listing-available option[value="true"]').textContent = isRoom || isSpecialFood ? 'Available' : 'In stock';
  document.querySelector('#listing-available option[value="false"]').textContent = isRoom || isSpecialFood ? 'Unavailable' : 'Out of stock';
};

const renderListings = () => {
  listings.replaceChildren();
  const type = listingTypeFilter.value;
  const availability = listingStatusFilter.value;
  const items = currentItems.filter(item => (
    (type === 'all' || item.type === type) &&
    (availability === 'all' || String(item.is_available) === String(availability === 'available'))
  ));
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = currentItems.length === 0
      ? 'No listings yet. Use the form to add your first listing.'
      : 'No listings match these filters.';
    listings.append(empty);
    return;
  }

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'admin-listing';
    const image = document.createElement('img');
    image.src = publicImageUrl(item.image_path);
    image.alt = '';
    image.loading = 'lazy';
    const content = document.createElement('div');
    content.className = 'admin-listing-content';
    const title = document.createElement('h3');
    title.textContent = item.name;
    const meta = document.createElement('p');
    const typeLabel = item.type === 'room' ? 'Hotel room' : item.type === 'special_food' ? 'Hotel special food' : 'Mart product';
    meta.textContent = `${typeLabel} · ${formatPrice(item)}${item.type === 'room' ? ' / night' : ''}`;
    const status = document.createElement('p');
    status.className = 'listing-status';
    status.textContent = item.is_available
      ? (item.type === 'product' ? 'In stock' : 'Available')
      : (item.type === 'product' ? 'Out of stock' : 'Unavailable');
    const actions = document.createElement('div');
    actions.className = 'listing-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'secondary-button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => editListing(item));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'secondary-button delete-button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => deleteListing(item));
    actions.append(edit, remove);
    content.append(title, meta, status, actions);
    card.append(image, content);
    listings.append(card);
  });
};

const showLogin = (message, isError = true) => {
  dashboard.hidden = true;
  loginPanel.hidden = false;
  if (message) setStatus(loginStatus, message, isError);
};

const loadListings = async () => {
  listings.textContent = 'Loading listings…';
  const { data, error } = await supabase
    .from('catalog_items')
    .select('id, type, name, description, price, image_path, is_available, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  currentItems = data;
  renderListings();
};

const enterDashboard = async user => {
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  if (!isAdmin) {
    await supabase.auth.signOut();
    showLogin('This account does not have administrator access.');
    return;
  }

  loginPanel.hidden = true;
  dashboard.hidden = false;
  setStatus(loginStatus, '');
  await loadListings();
  dashboard.dataset.adminEmail = user.email || '';
};

const resetForm = () => {
  listingForm.reset();
  document.querySelector('#listing-id').value = '';
  document.querySelector('#editor-heading').textContent = 'Add a listing';
  document.querySelector('#save-button').textContent = 'Save listing';
  imageInput.required = false;
  cancelEdit.hidden = true;
  updateFormLabels();
};

const editListing = item => {
  document.querySelector('#listing-id').value = item.id;
  typeSelect.value = item.type;
  document.querySelector('#listing-name').value = item.name;
  document.querySelector('#listing-description').value = item.description;
  document.querySelector('#listing-price').value = item.price;
  document.querySelector('#listing-available').value = String(item.is_available);
  document.querySelector('#editor-heading').textContent = 'Edit listing';
  document.querySelector('#save-button').textContent = 'Update listing';
  imageInput.required = false;
  cancelEdit.hidden = false;
  updateFormLabels();
  setStatus(editorStatus, 'Choose a new image only if you want to replace the current one.');
  document.querySelector('#editor-heading').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const validateImage = image => {
  if (!image || image.size === 0) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
    throw new Error('Use a JPEG, PNG, or WebP image.');
  }
  if (image.size > 5 * 1024 * 1024) {
    throw new Error('Images must be 5 MB or smaller.');
  }
};

const uploadImage = async image => {
  validateImage(image);
  if (!image || image.size === 0) return null;

  const extension = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }[image.type];
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, image, {
    cacheControl: '3600',
    contentType: image.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
};

const removeUploadedImage = async path => {
  if (!path) return null;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  return error;
};

const saveListing = async event => {
  event.preventDefault();
  const saveButton = document.querySelector('#save-button');
  saveButton.disabled = true;
  setStatus(editorStatus, 'Saving listing…');

  let newImagePath;
  try {
    const formData = new FormData(listingForm);
    const id = formData.get('id');
    const name = String(formData.get('name') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const price = Number(formData.get('price'));
    const isAvailable = formData.get('available') === 'true';
    const image = imageInput.files[0];
    const existing = id ? currentItems.find(item => String(item.id) === id) : null;

    if (name.length < 2 || name.length > 120) throw new Error('Name must be between 2 and 120 characters.');
    if (description.length < 2 || description.length > 1000) throw new Error('Description must be between 2 and 1,000 characters.');
    if (!Number.isFinite(price) || price <= 0 || price > 99999999) throw new Error('Enter a price greater than zero.');
    if (id && !existing) throw new Error('That listing is no longer available. Refresh and try again.');
    if (!id && (!image || image.size === 0)) throw new Error('Choose an image for this new listing.');

    newImagePath = await uploadImage(image);
    const listing = {
      type: String(formData.get('type')),
      name,
      description,
      price: Math.round(price * 100) / 100,
      is_available: isAvailable,
      ...(newImagePath ? { image_path: newImagePath } : {}),
    };

    const query = id
      ? supabase.from('catalog_items').update(listing).eq('id', id)
      : supabase.from('catalog_items').insert(listing);
    const { error } = await query;
    if (error) throw error;

    const oldImagePath = newImagePath && existing ? existing.image_path : null;
    newImagePath = null;
    resetForm();
    try {
      await loadListings();
      setStatus(editorStatus, 'Listing saved and published.');
    } catch (refreshError) {
      console.error('Listing saved, but the catalog could not be refreshed:', refreshError);
      setStatus(editorStatus, 'Listing saved, but the listings could not refresh. Use Refresh to try again.', true);
    }

    if (oldImagePath) {
      const cleanupError = await removeUploadedImage(oldImagePath);
      if (cleanupError) {
        console.error('Unable to remove the replaced catalog image:', cleanupError);
        setStatus(editorStatus, 'Listing saved, but the previous image could not be removed from Storage.', true);
      }
    }
  } catch (error) {
    if (newImagePath) {
      const cleanupError = await removeUploadedImage(newImagePath);
      if (cleanupError) console.error('Unable to remove an unused uploaded image:', cleanupError);
    }
    console.error('Unable to save catalog listing:', error);
    setStatus(editorStatus, error.message || 'The listing could not be saved. Please try again.', true);
  } finally {
    saveButton.disabled = false;
  }
};

const deleteListing = async item => {
  if (!window.confirm(`Delete "${item.name}"? This also removes its image.`)) return;

  try {
    const { error } = await supabase.from('catalog_items').delete().eq('id', item.id);
    if (error) throw error;
    currentItems = currentItems.filter(listing => listing.id !== item.id);
    renderListings();
    const cleanupError = await removeUploadedImage(item.image_path);
    if (cleanupError) {
      console.error('Listing was deleted, but its Storage image could not be removed:', cleanupError);
      setStatus(editorStatus, 'Listing deleted, but its image could not be removed from Storage.', true);
      return;
    }
    setStatus(editorStatus, 'Listing deleted.');
  } catch (error) {
    console.error('Unable to delete catalog listing:', error);
    setStatus(editorStatus, error.message || 'The listing could not be deleted. Please try again.', true);
  }
};

const initialize = async () => {
  if (!isSupabaseConfigured()) {
    loginButton.disabled = true;
    setStatus(loginStatus, 'Add your Supabase publishable key in supabase-config.js to enable admin access.', true);
    return;
  }

  try {
    supabase = getSupabaseClient();
    supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        showLogin('Your admin session has ended. Please sign in again.');
      }
    });

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) await enterDashboard(data.session.user);
  } catch (error) {
    console.error('Unable to initialize admin access:', error);
    showLogin(error.message || 'Admin access is temporarily unavailable.');
  }
};

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginButton.disabled = true;
  setStatus(loginStatus, 'Signing in…');
  try {
    supabase = getSupabaseClient();
    const formData = new FormData(loginForm);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(formData.get('email')).trim(),
      password: String(formData.get('password')),
    });
    if (error) throw error;
    loginForm.reset();
    await enterDashboard(data.user);
  } catch (error) {
    console.error('Admin sign-in failed:', error);
    setStatus(loginStatus, error.message || 'Sign-in failed. Check your credentials and try again.', true);
  } finally {
    loginButton.disabled = false;
  }
});

listingForm.addEventListener('submit', saveListing);
typeSelect.addEventListener('change', updateFormLabels);
listingTypeFilter.addEventListener('change', renderListings);
listingStatusFilter.addEventListener('change', renderListings);
cancelEdit.addEventListener('click', resetForm);
document.querySelector('#refresh-button').addEventListener('click', async () => {
  try {
    await loadListings();
    setStatus(editorStatus, 'Listings refreshed.');
  } catch (error) {
    console.error('Unable to refresh catalog listings:', error);
    setStatus(editorStatus, error.message || 'The catalog could not be loaded.', true);
  }
});
document.querySelector('#logout-button').addEventListener('click', async event => {
  event.currentTarget.disabled = true;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    showLogin('You have been signed out.', false);
  } catch (error) {
    console.error('Admin sign-out failed:', error);
    setStatus(editorStatus, error.message || 'Sign-out failed. Please try again.', true);
  } finally {
    event.currentTarget.disabled = false;
  }
});

initialize();
