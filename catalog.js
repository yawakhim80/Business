import { getSupabaseClient, isSupabaseConfigured, STORAGE_BUCKET } from './supabase-client.js';

const formatPrice = price => `Rs. ${Number(price).toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const renderCatalog = (container, items, type, availability) => {
  container.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'catalog-empty';
    empty.textContent = type === 'product'
      ? 'Our current selection is being updated. Please visit or contact Yawa Mart for today’s availability.'
      : type === 'room'
        ? 'Room listings are being updated. Please contact the team to ask about available rooms.'
        : 'No restaurant specials are listed at the moment. Please contact the team to ask about today’s menu.';
    container.append(empty);
    return;
  }

  const visibleItems = items.filter(item => (
    availability === 'all' ||
    (availability === 'available' ? item.is_available : !item.is_available)
  ));
  if (visibleItems.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'catalog-empty';
    empty.textContent = 'No listings match this availability filter.';
    container.append(empty);
    return;
  }

  visibleItems.forEach(item => {
    const card = document.createElement('article');
    card.className = 'catalog-card';
    const image = document.createElement('img');
    image.className = 'catalog-image';
    image.src = getSupabaseClient().storage.from(STORAGE_BUCKET).getPublicUrl(item.image_path).data.publicUrl;
    image.alt = item.name;
    image.loading = 'lazy';
    const content = document.createElement('div');
    content.className = 'catalog-card-content';
    const title = document.createElement('h3');
    title.textContent = item.name;
    const description = document.createElement('p');
    description.className = 'catalog-description';
    description.textContent = item.description;
    const price = document.createElement('p');
    price.className = 'catalog-price';
    price.textContent = `${formatPrice(item.price)}${type === 'room' ? ' / night' : ''}`;
    const status = document.createElement('p');
    status.className = item.is_available ? 'catalog-status is-available' : 'catalog-status is-unavailable';
    status.textContent = item.is_available
      ? (type === 'product' ? 'In stock' : 'Available')
      : (type === 'product' ? 'Out of stock' : 'Currently unavailable');
    content.append(title, description, price, status);
    card.append(image, content);
    container.append(card);
  });
};

const loadCatalog = async container => {
  const type = container.dataset.catalog;
  const filterRow = document.createElement('div');
  filterRow.className = 'catalog-filters';
  const filterLabel = document.createElement('label');
  filterLabel.className = 'catalog-filter-label';
  filterLabel.textContent = 'Availability';
  const filter = document.createElement('select');
  filter.className = 'catalog-filter';
  filter.disabled = true;
  filter.setAttribute('aria-label', 'Filter listings by availability');
  [['all', 'All listings'], ['available', 'Available / in stock'], ['unavailable', 'Unavailable / out of stock']].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    filter.append(option);
  });
  filterLabel.append(filter);
  filterRow.append(filterLabel);
  container.before(filterRow);
  let items = [];
  filter.addEventListener('change', () => renderCatalog(container, items, type, filter.value));

  if (!isSupabaseConfigured()) {
    const message = document.createElement('p');
    message.className = 'catalog-error';
    message.textContent = 'Catalog setup is not complete. Please contact us for current availability.';
    container.replaceChildren(message);
    return;
  }

  try {
    const { data, error } = await getSupabaseClient()
      .from('catalog_items')
      .select('id, type, name, description, price, image_path, is_available')
      .eq('type', type)
      .order('created_at', { ascending: false });
    if (error) throw error;

    items = data;
    filter.disabled = false;
    renderCatalog(container, items, type, filter.value);
  } catch (error) {
    console.error('Unable to load public catalog:', error);
    const message = document.createElement('p');
    message.className = 'catalog-error';
    message.textContent = 'We could not load current listings. Please contact us for availability.';
    container.replaceChildren(message);
  }
};

document.querySelectorAll('[data-catalog]').forEach(container => {
  loadCatalog(container);
});
