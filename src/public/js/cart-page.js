// Cargado solo en /carts/:cid.
// Maneja los cambios de cantidad, la eliminación de productos, el vaciado
// del carrito y el panel de "Finalizar compra" (medio de pago). Tras cada
// operación exitosa se recarga la vista para reflejar el nuevo subtotal/total
// (el recálculo se hace en el servidor).

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

  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutPanel = document.getElementById('checkout-panel');
  if (checkoutBtn && checkoutPanel) {
    checkoutBtn.addEventListener('click', () => {
      checkoutPanel.classList.remove('hidden');
      checkoutPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const transferDetails = document.getElementById('transfer-details');
  const cashDetails = document.getElementById('cash-details');
  document.querySelectorAll('input[name="payment-method"]').forEach((input) => {
    input.addEventListener('change', () => {
      transferDetails.classList.toggle('hidden', input.value !== 'transferencia');
      cashDetails.classList.toggle('hidden', input.value !== 'efectivo');
    });
  });
});
