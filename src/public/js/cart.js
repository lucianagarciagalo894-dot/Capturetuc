// Cargado en todas las páginas (layout principal).
// Se encarga de: crear/recuperar un carrito guardado en localStorage,
// mantener actualizado el link "Mi carrito" del nav, manejar el botón
// "Agregar al carrito" y el total estimado (con hojas extra) de la vista
// de detalle de producto.

async function getOrCreateCartId() {
  const cachedId = localStorage.getItem('capture_tuc_cart_id');
  if (cachedId) {
    // El carrito guardado en este navegador puede haber sido borrado del
    // lado del servidor (ej. limpieza de datos de prueba). Si ya no existe,
    // descartamos el ID viejo en vez de romper la página.
    const check = await fetch(`/api/carts/${cachedId}`);
    if (check.ok) return cachedId;
    localStorage.removeItem('capture_tuc_cart_id');
  }

  const response = await fetch('/api/carts', { method: 'POST' });
  const data = await response.json();
  const cartId = data.payload._id;
  localStorage.setItem('capture_tuc_cart_id', cartId);
  return cartId;
}

async function initNavCartLink() {
  const link = document.getElementById('nav-cart-link');
  if (!link) return;

  const cartId = await getOrCreateCartId();
  link.setAttribute('href', `/carts/${cartId}`);
}

function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
}

function initEstimatedTotal() {
  const box = document.getElementById('add-to-cart-box');
  const totalEl = document.getElementById('estimated-total');
  if (!box || !totalEl) return;

  const price = Number(box.dataset.price) || 0;
  const extraPageCost = Number(box.dataset.extraPageCost) || 0;
  const quantityInput = document.getElementById('quantity');
  const extraPagesInput = document.getElementById('extra-pages');

  function recalculate() {
    const quantity = Number(quantityInput.value) || 1;
    const extraPages = extraPagesInput ? Number(extraPagesInput.value) || 0 : 0;
    const unitPrice = price + extraPages * extraPageCost;
    totalEl.textContent = formatPrice(unitPrice * quantity);
  }

  quantityInput.addEventListener('input', recalculate);
  if (extraPagesInput) extraPagesInput.addEventListener('input', recalculate);
}

function initAddToCartButton() {
  document.addEventListener('click', async (event) => {
    if (event.target.id !== 'add-to-cart-btn') return;

    const button = event.target;
    const productId = button.dataset.productId;
    const quantityInput = document.getElementById('quantity');
    const extraPagesInput = document.getElementById('extra-pages');
    const quantity = Number(quantityInput ? quantityInput.value : 1) || 1;
    const extraPages = extraPagesInput ? Number(extraPagesInput.value) || 0 : 0;
    const feedback = document.getElementById('add-to-cart-message');

    try {
      const cartId = await getOrCreateCartId();
      const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, extraPages })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo agregar el álbum al carrito');
      }

      window.location.href = `/carts/${cartId}`;
    } catch (error) {
      if (feedback) {
        feedback.textContent = error.message;
        feedback.classList.add('error');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavCartLink();
  initEstimatedTotal();
  initAddToCartButton();
});
