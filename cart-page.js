
const cartItemsContainer = document.getElementById("cart-items");

const checkoutButton = document.getElementById("cart-checkout");

function formatNaira(amount) {
  return "₦" + amount.toLocaleString("en-NG");
}

function escapeCartHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function renderCart() {
  if (!cartItemsContainer) return;

  const cart = getCart();

  const heading = document.getElementById("cart-heading");
  const subtotalElement = document.getElementById("cart-subtotal");

  if (heading) {
    heading.textContent = `Cart (${cart.reduce(
      (sum, item) => sum + item.quantity,
      0,
    )})`;
  }

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <i class="fa-solid fa-cart-shopping"></i>
        <h2>Your cart is empty!</h2>
        <p>Browse our products and add your favourites.</p>
        <a href="index.html">Continue shopping</a>
      </div>
    `;
  } else {
    cartItemsContainer.innerHTML = cart
      .map(
        (item) => `
          <article class="cart-item">
            <img
              class="cart-item-image"
              src="${escapeCartHTML(item.image)}"
              alt="${escapeCartHTML(item.name)}"
            >

            <div class="cart-item-details">
              <h3>${escapeCartHTML(item.name)}</h3>
              <p class="cart-stock">In Stock</p>

              ${
                item.oldPrice > 0
                  ? `<del class="cart-old-price">${formatNaira(item.oldPrice)}</del>`
                  : ""
              }
            </div>

            <div class="cart-item-price">
              ${formatNaira(item.price * item.quantity)}
              ${
                item.discount
                  ? `<span class="cart-old-price">${escapeCartHTML(item.discount)}</span>`
                  : ""
              }
            </div>

            <div class="cart-item-actions">
              <button
                type="button"
                class="cart-remove"
                data-cart-action="remove"
                data-product-id="${escapeCartHTML(item.id)}"
              >
                <i class="fa-regular fa-trash-can"></i> Remove
              </button>

              <div class="cart-quantity">
                <button
                  type="button"
                  data-cart-action="decrease"
                  data-product-id="${escapeCartHTML(item.id)}"
                  ${item.quantity <= 1 ? "disabled" : ""}
                  aria-label="Decrease quantity"
                >−</button>

                <span>${item.quantity}</span>

                <button
                  type="button"
                  data-cart-action="increase"
                  data-product-id="${escapeCartHTML(item.id)}"
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>
          </article>
        `,
      )
      .join("");
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (subtotalElement) {
    subtotalElement.textContent = formatNaira(subtotal);
  }

  if (checkoutButton) {
    checkoutButton.textContent = `Checkout (${formatNaira(subtotal)})`;
    checkoutButton.disabled = cart.length === 0;
  }

  if (typeof updateCartCount === "function") {
    updateCartCount();
  }
}

/*
 * CHECKOUT NAVIGATION
 * Requires a signed-in Supabase customer.
 */
if (checkoutButton) {
  checkoutButton.addEventListener("click", async () => {
    const cart = getCart();

    if (!cart.length) {
      alert("Your cart is empty. Add products before checkout.");
      return;
    }

    checkoutButton.disabled = true;

    try {
      // Uses the existing Supabase client from supabase.js.
      const client = window.supabaseClient;

      if (!client || typeof client.auth?.getSession !== "function") {
        throw new Error(
          "Supabase client was not found. Check supabase.js and its script order.",
        );
      }

      const {
        data: { session },
        error,
      } = await client.auth.getSession();

      if (error) throw error;

      if (!session) {
        const returnTo = encodeURIComponent("checkout.html");
        window.location.href = `login.html?next=${returnTo}`;
        return;
      }

      window.location.href = "checkout.html";
    } catch (error) {
      console.error("Checkout error:", error);
      alert(
        "We couldn't verify your sign-in status. Please try again.",
      );
    } finally {
      checkoutButton.disabled = false;
    }
  });
}

renderCart();
