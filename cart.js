let activeUserId = null;

function getCartStorageKey() {
  if (!activeUserId) return null;

  return `jumiaCloneCart:${activeUserId}`;
}

function getCart() {
  const storageKey = getCartStorageKey();

  // No signed-in user means no visible cart.
  if (!storageKey) return [];

  try {
    const storedCart = JSON.parse(localStorage.getItem(storageKey) || "[]");

    return Array.isArray(storedCart) ? storedCart : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  const storageKey = getCartStorageKey();

  // Never save a cart without an authenticated user.
  if (!storageKey) return;

  localStorage.setItem(storageKey, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const countElement = document.getElementById("cart-count");

  if (!countElement) return;

  const totalQuantity = getCart().reduce(
    (total, product) => total + product.quantity,
    0,
  );

  countElement.textContent = totalQuantity;
}


async function addToCart(product) {
  if (!activeUserId) {
    throw new Error("Please sign in before adding products.");
  }

  const cart = getCart();
  const existingProduct = cart.find((item) => item.id === product.id);

  const newQuantity = existingProduct
    ? existingProduct.quantity + 1
    : 1;

  const { error } = await supabaseClient
    .from("cart_items")
    .upsert(
      {
        user_id: activeUserId,
        product_id: product.id,
        product_name: product.name,
        unit_price_kobo: Math.round(product.price * 100),
        image_url: product.image,
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,product_id",
      },
    );

  if (error) {
    console.error("Could not save cart item to Supabase:", error);
    throw error;
  }

  if (existingProduct) {
    existingProduct.quantity = newQuantity;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  saveCart(cart);
}


function changeCartQuantity(productId, change) {
  const cart = getCart();
  const product = cart.find((item) => item.id === productId);

  if (!product) return;

  product.quantity += change;

  const updatedCart = cart.filter((item) => item.quantity > 0);

  saveCart(updatedCart);
}

function removeFromCart(productId) {
  const updatedCart = getCart().filter((item) => item.id !== productId);

  saveCart(updatedCart);
}

document.addEventListener("click", async (event) => {
  const addButton = event.target.closest(".add-to-cart");

  if (addButton) {
    event.preventDefault();

    // Prevent repeated clicks while checking the session.
    if (addButton.disabled) return;

    const originalText = addButton.textContent;
    addButton.disabled = true;
    addButton.textContent = "Checking login...";

    try {
      // 1. Check the customer's Supabase session.
      if (typeof supabaseClient === "undefined") {
        throw new Error("Supabase client is unavailable.");
      }

      const { data, error } = await supabaseClient.auth.getSession();

      if (error) throw error;

      // 2. Stop if the customer is not logged in.
      if (!data.session) {
        alert("Please sign in to add products to your cart.");
        window.location.href = "./login.html";
        return;
      }
      activeUserId = data.session.user.id;

      // 3. Read the product details only after authentication.
      const product = {
        id: addButton.dataset.id,
        name: addButton.dataset.name,
        price: Number(addButton.dataset.price),
        image: addButton.dataset.image,
        oldPrice: Number(addButton.dataset.oldPrice) || 0,
        discount: addButton.dataset.discount || "",
      };

      // 4. Validate the product information.
      if (
        !product.id ||
        !product.name ||
        !Number.isFinite(product.price) ||
        product.price <= 0 ||
        !product.image
      ) {
        console.error("Invalid product data:", product);
        alert("This product could not be added. Please try again.");
        return;
      }

      // 5. Add the product using your existing cart function.
      await addToCart(product);

      addButton.textContent = "Added to Cart";
    } catch (error) {
      console.error("Add-to-cart error:", error);
      alert(
        "We couldn't verify your login or add this product. Please try again.",
      );
    } finally {
      addButton.disabled = false;

      // Restore the original button label.
      // Keep the success message briefly visible.
      if (addButton.isConnected) {
        if (addButton.textContent === "Checking login...") {
          addButton.textContent = originalText;
        } else if (addButton.textContent !== "Added to Cart") {
          addButton.textContent = originalText;
        }
      }
    }

    return;
  }

  // Existing cart quantity and removal controls.
  const quantityButton = event.target.closest("[data-cart-action]");

  if (quantityButton) {
    const productId = quantityButton.dataset.productId;
    const action = quantityButton.dataset.cartAction;

    if (action === "increase") {
      changeCartQuantity(productId, 1);
    } else if (action === "decrease") {
      changeCartQuantity(productId, -1);
    } else if (action === "remove") {
      removeFromCart(productId);
    }

    if (typeof renderCart === "function") {
      renderCart();
    }
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === CART_STORAGE_KEY) {
    updateCartCount();

    if (typeof renderCart === "function") {
      renderCart();
    }
  }
});
async function syncCartWithSession() {
  if (typeof supabaseClient === "undefined") {
    console.error("Supabase client is unavailable.");
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Could not load the current session:", error);
    return;
  }

  activeUserId = data.session?.user?.id ?? null;

  updateCartCount();

  if (typeof renderCart === "function") {
    renderCart();
  }
}

syncCartWithSession();

supabaseClient.auth.onAuthStateChange((_event, session) => {
  activeUserId = session?.user?.id ?? null;

  updateCartCount();

  if (typeof renderCart === "function") {
    renderCart();
  }
});
updateCartCount();
