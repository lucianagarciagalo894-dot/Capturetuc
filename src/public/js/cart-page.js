
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cart-container');
  if (!container) return;

  const cartId = container.dataset.cartId;

  container.addEventListener('change', async (event) => {
    if (!event.target.classList.contains('cart-quantity-input')) return;

    const productId = event.target.dataset.productId;
    const quantity = Number(event.target.value);

    const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });

    if (response.ok) {
      window.location.reload();
    } else {
      const data = await response.json();
      alert(data.message || 'No se pudo actualizar la cantidad');
    }
  });

  container.addEventListener('click', async (event) => {
    if (event.target.classList.contains('cart-remove-btn')) {
      const productId = event.target.dataset.productId;
      const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
        method: 'DELETE'
      });
      if (response.ok) window.location.reload();
      return;
    }

    if (event.target.id === 'cart-clear-btn') {
      if (!confirm('¿Vaciar el carrito?')) return;
      const response = await fetch(`/api/carts/${cartId}`, { method: 'DELETE' });
      if (response.ok) window.location.reload();
    }
  });
});
