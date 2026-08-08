
function buildProductPayload(form) {
  const data = new FormData(form);
  const thumbnail = data.get('thumbnail');

  return {
    title: data.get('title'),
    description: data.get('description'),
    code: data.get('code'),
    category: data.get('category'),
    price: Number(data.get('price')),
    stock: Number(data.get('stock')),
    thumbnails: thumbnail ? [thumbnail] : [],
    features: {
      size: data.get('size'),
      cover: data.get('cover'),
      pages: Number(data.get('pages')),
      extraPageCost: Number(data.get('extraPageCost')) || 0
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const createForm = document.getElementById('create-product-form');
  const createFeedback = document.getElementById('create-feedback');

  if (createForm) {
    createForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildProductPayload(createForm))
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        createFeedback.textContent = 'Álbum creado correctamente.';
        createFeedback.classList.remove('error');
        window.location.reload();
      } catch (error) {
        createFeedback.textContent = error.message;
        createFeedback.classList.add('error');
      }
    });
  }

  const list = document.getElementById('admin-products-list');
  if (!list) return;

  list.addEventListener('submit', async (event) => {
    if (!event.target.classList.contains('edit-product-form')) return;
    event.preventDefault();

    const card = event.target.closest('.admin-product-card');
    const productId = card.dataset.id;

    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildProductPayload(event.target))
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'No se pudo actualizar el álbum');
      return;
    }
    window.location.reload();
  });

  list.addEventListener('click', async (event) => {
    const card = event.target.closest('.admin-product-card');
    if (!card) return;
    const productId = card.dataset.id;

    if (event.target.classList.contains('delete-product-btn')) {
      if (!confirm('¿Eliminar este álbum?')) return;
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (response.ok) window.location.reload();
      return;
    }

    if (event.target.classList.contains('toggle-status-btn')) {
      const currentStatus = event.target.dataset.status === 'true';
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !currentStatus })
      });
      if (response.ok) window.location.reload();
    }
  });
});
