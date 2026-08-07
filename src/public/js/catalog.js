// Cargado solo en /products.
// Escucha el evento "products:updated" que emite el servidor cuando el admin
// crea, edita o elimina un álbum, y vuelve a pedir el catálogo actualizado
// sin que el usuario tenga que recargar la página manualmente.

function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
}

function buildProductCard(product) {
  const thumb = product.thumbnails && product.thumbnails[0]
    ? `<img src="${product.thumbnails[0]}" alt="${product.title}" />`
    : '<div class="thumb-placeholder">Sin imagen</div>';

  return `
    <div class="product-card" data-id="${product._id}">
      <div class="product-thumb">${thumb}</div>
      <h3>${product.title}</h3>
      <p class="product-category">${product.category}</p>
      <p class="product-price">${formatPrice(product.price)}</p>
      <p class="product-stock">Stock: ${product.stock}</p>
      <p class="product-feature">Tamaño: ${product.features.size}</p>
      <p class="product-status ${product.status ? '' : 'inactive'}">
        ${product.status ? 'Disponible' : 'No disponible'}
      </p>
      <a href="/products/${product._id}" class="btn btn-secondary">Ver detalle</a>
    </div>
  `;
}

async function refreshCatalog() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  params.set('limit', grid.dataset.limit || '10');
  if (grid.dataset.query) params.set('query', grid.dataset.query);
  if (grid.dataset.sort) params.set('sort', grid.dataset.sort);

  const response = await fetch(`/api/products?${params.toString()}`);
  const data = await response.json();

  grid.innerHTML = data.payload.length
    ? data.payload.map(buildProductCard).join('')
    : '<p id="empty-message">No se encontraron álbumes con esos filtros.</p>';
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof io === 'undefined') return;
  const socket = io();
  socket.on('products:updated', refreshCatalog);
});
