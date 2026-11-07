const checkoutForm = document.getElementById("checkout-form");
const checkoutItems = document.getElementById("checkout-items");
const checkoutMessage = document.getElementById("checkout-message");
const continuePaymentButton = document.getElementById("continue-payment");
const stateInput = document.getElementById("state");

const deliveryFees = {
  Lagos: 2000,
  Ogun: 2500,
  Oyo: 3000,
  "Abuja (FCT)": 3500,
};

let currentSubtotal = 0;

function updateCheckoutTotal() {
  const selectedState = stateInput.value;
  const deliveryFee = deliveryFees[selectedState];

  document.getElementById("checkout-delivery").textContent =
    deliveryFee !== undefined ? naira(deliveryFee) : "Select location";

  const total = currentSubtotal + (deliveryFee ?? 0);

  document.getElementById("checkout-total").textContent = naira(total);

  continuePaymentButton.disabled =
    !selectedState || deliveryFee === undefined || currentSubtotal <= 0;
}
const naira = (amount) =>
  "₦" +
  amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function showCheckoutMessage(message) {
  checkoutMessage.textContent = message;
}

function escapeCheckoutHTML(value) {
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

function renderCheckoutItems(cart) {
  checkoutItems.innerHTML = cart
    .map(
      (item) => `
    <article class="checkout-product">
      <img
        src="${escapeCheckoutHTML(item.image)}"
        alt="${escapeCheckoutHTML(item.name)}"
      >

      <div>
        <div class="checkout-product-name">
          ${escapeCheckoutHTML(item.name)}
        </div>

        <div class="checkout-product-meta">
          Quantity: ${item.quantity}
        </div>

        <div class="checkout-product-price">
          ${naira(item.price * item.quantity)}
        </div>
      </div>
    </article>
  `,
    )
    .join("");

  currentSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  document.getElementById("checkout-subtotal").textContent =
    naira(currentSubtotal);

  updateCheckoutTotal();
}

async function initializeCheckout() {
  const client = window.supabaseClient;

  if (!client) {
    showCheckoutMessage(
      "We couldn't connect to your account. Please refresh the page.",
    );
    continuePaymentButton.disabled = true;
    return;
  }

  try {
    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    const session = data.session;

    if (!session) {
      window.location.replace(
        "./login.html?next=" + encodeURIComponent("checkout.html"),
      );
      return;
    }

    // Use the same customer's cart, if per-user cart storage is enabled.
    if (typeof activeUserId !== "undefined") {
      activeUserId = session.user.id;
    }

    const cart = getCart();

    if (!cart.length) {
      showCheckoutMessage(
        "Your cart is empty. Add products before checking out.",
      );
      continuePaymentButton.disabled = true;
      return;
    }

    const fullNameInput = document.getElementById("full-name");

    const metadataName = session.user.user_metadata?.full_name;

    if (metadataName) {
      fullNameInput.value = metadataName;
    }

    renderCheckoutItems(cart);
  } catch (error) {
    console.error("Checkout initialization failed:", error);

    showCheckoutMessage(
      "We couldn't load your checkout. Please refresh and try again.",
    );

    continuePaymentButton.disabled = true;
  }
}

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showCheckoutMessage("");

  if (!checkoutForm.reportValidity()) return;

  const client = window.supabaseClient;

  if (!client) {
    showCheckoutMessage("Unable to connect. Please refresh and try again.");
    return;
  }

  continuePaymentButton.disabled = true;
  continuePaymentButton.textContent = "Initializing payment...";

  try {
    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();

    if (sessionError) throw sessionError;

    const session = sessionData.session;

    if (!session) {
      window.location.href =
        "./login.html?next=" + encodeURIComponent("checkout.html");
      return;
    }

    const cart = getCart();

    if (!cart.length) {
      throw new Error("Your cart is empty.");
    }

    const deliveryFee = deliveryFees[stateInput.value];

    if (deliveryFee === undefined) {
      throw new Error("Please select a valid delivery location.");
    }

    const formData = new FormData(checkoutForm);

    const { data, error } = await client.functions.invoke(
      "hyper-service",
      {
        body: {
          fullName: formData.get("fullName"),
          phone: formData.get("phone"),
          address: formData.get("address"),
          city: formData.get("city"),
          state: formData.get("state"),
          cart: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        },
      },
    );

    if (error) throw error;

    if (!data?.authorizationUrl) {
      throw new Error(data?.error || "Could not initialize payment.");
    }

    window.location.href = data.authorizationUrl;
  } catch (error) {
   console.error("Payment initialization error:", error);

if (error.context) {
  try {
    const details = await error.context.json();
    console.error("Edge Function response:", details);
    showCheckoutMessage(details.error || JSON.stringify(details));
  } catch {
    console.error("Could not read Edge Function response.");
  }
}

    showCheckoutMessage(
      error.message || "Payment initialization failed. Please try again.",
    );

    continuePaymentButton.disabled = false;
    continuePaymentButton.textContent = "Continue to Payment";
  }
});
stateInput.addEventListener("change", updateCheckoutTotal);
9;
initializeCheckout();
