document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;

  if (!supabase) {
    alert("Supabase connection failed. Please refresh.");
    return;
  }

  // 1. Check authentication
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.replace("login.html");
    return;
  }

  // 2. Verify administrator access
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    console.error("Admin verification error:", adminError);
    alert("Access denied. Administrator privileges required.");
    window.location.replace("index.html");
    return;
  }

  console.log("Administrator verified successfully.");

  // 3. Dashboard navigation
  const navLinks = document.querySelectorAll(".admin-nav a");

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const section = document.getElementById(link.dataset.section);

      if (!section) return;

      navLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");

      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  // 4. Format prices from kobo to naira
  function formatNaira(priceKobo) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format((Number(priceKobo) || 0) / 100);
  }

  // 5. Safely display text in HTML
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    });
  }
  let editingProductId = null;
  let productsCache = [];
  // 6. Load products from Supabase
  async function loadProducts() {
    const container = document.getElementById("admin-products-container");

    const message = document.getElementById("products-message");

    message.textContent = "Loading products...";

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        price_kobo,
        old_price_kobo,
        discount_percent,
        image_url,
        rating,
        review_count,
        source,
        is_active
      `,
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Products loading error:", error);

      message.textContent =
        "Could not load products. Check the browser console.";

      return;
    }

    if (!products || products.length === 0) {
      message.textContent = "No products found.";
      container.innerHTML = "";
      return;
    }

    message.textContent = `${products.length} products found.`;
    productsCache = products;

    container.innerHTML = `
      <div class="admin-products-table-wrapper">
        <table class="admin-products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Old Price</th>
              <th>Category/Source</th>
            <th>Status</th>
<th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${products
              .map(
                (product) => `
              <tr>
                <td>
                  <div class="admin-product-info">
                    ${
                      product.image_url
                        ? `<img
                            src="${escapeHTML(product.image_url)}"
                            alt="${escapeHTML(product.name)}"
                            class="admin-product-image"
                          >`
                        : ""
                    }

                    <span>${escapeHTML(product.name)}</span>
                  </div>
                </td>

                <td>${formatNaira(product.price_kobo)}</td>

                <td>
                  ${
                    product.old_price_kobo
                      ? formatNaira(product.old_price_kobo)
                      : "—"
                  }
                </td>

                <td>${escapeHTML(product.source || "—")}</td>

                                <td>
                  <span class="admin-product-status ${
                    product.is_active ? "active" : "inactive"
                  }">
                    ${product.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    class="edit-product-btn"
                    data-id="${escapeHTML(product.id)}"
                  >Edit</button>

                  <button
                    type="button"
                    class="delete-product-btn"
                    data-id="${escapeHTML(product.id)}"
                  >Delete</button>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // 7. Load the product list when dashboard opens

  // 7. Add Product Form
  const addProductBtn = document.getElementById("add-product-btn");
  const productsContainer = document.getElementById("admin-products-container");

  const productFormContainer = document.createElement("div");
  productFormContainer.id = "admin-product-form-container";
  productFormContainer.style.display = "none";

  productFormContainer.innerHTML = `
    <form id="admin-product-form" class="admin-product-form">
     <h3 id="product-form-heading">Add New Product</h3>
      <label for="product-name">Product Name</label>
      <input type="text" id="product-name" required>

      <label for="product-price">Price (₦)</label>
      <input type="number" id="product-price" min="0.01" step="0.01" required>

      <label for="product-old-price">Old Price (₦)</label>
      <input type="number" id="product-old-price" min="0" step="0.01">

      <label for="product-discount">Discount (%)</label>
      <input type="number" id="product-discount" min="0" max="100" value="0">

      <label for="product-image">Image URL</label>
     <input
  type="text"
  id="product-image"
  placeholder="Paste image URL or Base64 image data"
  required
>

      <label for="product-source">Product Source</label>
      <select id="product-source">
        <option value="recommended">Recommended</option>
        <option value="admin">Other Product</option>
      </select>

      <label class="admin-checkbox-label">
        <input type="checkbox" id="product-active" checked>
        Product is active
      </label>

      <div class="admin-form-actions">
        <button type="submit" id="save-product-btn">Save Product</button>
        <button type="button" id="cancel-product-btn">Cancel</button>
      </div>

      <p id="admin-product-form-message"></p>
    </form>
  `;

  productsContainer.before(productFormContainer);

  addProductBtn.addEventListener("click", () => {
    editingProductId = null;

    document.getElementById("admin-product-form").reset();

    document.getElementById("product-form-heading").textContent =
      "Add New Product";

    document.getElementById("save-product-btn").textContent = "Save Product";

    document.getElementById("admin-product-form-message").textContent = "";

    productFormContainer.style.display = "block";

    productFormContainer.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });

  document
    .getElementById("cancel-product-btn")
    .addEventListener("click", () => {
      editingProductId = null;

      productFormContainer.style.display = "none";

      document.getElementById("admin-product-form").reset();

      document.getElementById("product-form-heading").textContent =
        "Add New Product";

      document.getElementById("save-product-btn").textContent = "Save Product";
    });

  // 8. Edit and Delete Product Actions
  productsContainer.addEventListener("click", async (event) => {
    const editButton = event.target.closest(".edit-product-btn");
    const deleteButton = event.target.closest(".delete-product-btn");

    // EDIT
    if (editButton) {
      const product = productsCache.find(
        (item) => String(item.id) === editButton.dataset.id,
      );

      if (!product) return;

      editingProductId = product.id;

      document.getElementById("product-form-heading").textContent =
        "Edit Product";

      document.getElementById("product-name").value = product.name || "";

      document.getElementById("product-price").value =
        Number(product.price_kobo || 0) / 100;

      document.getElementById("product-old-price").value =
        product.old_price_kobo == null
          ? ""
          : Number(product.old_price_kobo) / 100;

      document.getElementById("product-discount").value =
        product.discount_percent || 0;

      document.getElementById("product-image").value = product.image_url || "";

      document.getElementById("product-source").value =
        product.source || "recommended";

      document.getElementById("product-active").checked =
        product.is_active !== false;

      document.getElementById("save-product-btn").textContent =
        "Update Product";

      document.getElementById("admin-product-form-message").textContent = "";

      productFormContainer.style.display = "block";

      productFormContainer.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    // DELETE
    if (deleteButton) {
      const productId = deleteButton.dataset.id;

      if (
        !confirm(
          "Are you sure you want to delete this product? This cannot be undone.",
        )
      ) {
        return;
      }

      deleteButton.disabled = true;
      deleteButton.textContent = "Deleting...";

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) {
        console.error("Product deletion error:", error);
        alert("Could not delete product: " + error.message);

        deleteButton.disabled = false;
        deleteButton.textContent = "Delete";
        return;
      }

      alert("Product deleted successfully!");

      await loadProducts();
    }
  });

  // 8. Save Product to Supabase
  document
    .getElementById("admin-product-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const saveButton = document.getElementById("save-product-btn");
      const message = document.getElementById("admin-product-form-message");

      saveButton.disabled = true;
      saveButton.textContent = "Saving...";
      message.textContent = "";

      const name = document.getElementById("product-name").value.trim();

      const priceNaira = Number(document.getElementById("product-price").value);

      const oldPriceInput = document.getElementById("product-old-price").value;

      const oldPriceNaira = oldPriceInput ? Number(oldPriceInput) : null;

      const discount =
        Number(document.getElementById("product-discount").value) || 0;

      const imageUrl = document.getElementById("product-image").value.trim();

      if (
        !imageUrl.startsWith("https://") &&
        !imageUrl.startsWith("http://") &&
        !imageUrl.startsWith("data:image/")
      ) {
        message.textContent = "Please enter a valid image URL or image data.";
        saveButton.disabled = false;
        saveButton.textContent = "Save Product";
        return;
      }

      const source = document.getElementById("product-source").value;

      const isActive = document.getElementById("product-active").checked;

      if (
        !name ||
        !Number.isFinite(priceNaira) ||
        priceNaira <= 0 ||
        (oldPriceNaira !== null &&
          (!Number.isFinite(oldPriceNaira) || oldPriceNaira < 0)) ||
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount > 100
      ) {
        message.textContent = "Please enter valid product details.";
        saveButton.disabled = false;
        saveButton.textContent = "Save Product";
        return;
      }

      const newProduct = {
        name,
        price_kobo: Math.round(priceNaira * 100),
        old_price_kobo:
          oldPriceNaira === null ? null : Math.round(oldPriceNaira * 100),
        discount_percent: discount,
        image_url: imageUrl,
        source,
        is_active: isActive,
      };

      let result;

      if (editingProductId) {
        result = await supabase
          .from("products")
          .update(newProduct)
          .eq("id", editingProductId);
      } else {
        result = await supabase.from("products").insert([newProduct]);
      }

      const { error } = result;

      if (error) {
        console.error("Product insertion error:", error);
        message.textContent = "Could not save product: " + error.message;
      } else {
        message.textContent = editingProductId
          ? "Product updated successfully!"
          : "Product added successfully!";

        document.getElementById("admin-product-form").reset();

        editingProductId = null;

        document.getElementById("product-form-heading").textContent =
          "Add New Product";

        saveButton.textContent = "Save Product";

        productFormContainer.style.display = "none";

        await loadProducts();
      }

      saveButton.disabled = false;
      saveButton.textContent = "Save Product";
    });

  // 9. Load products when dashboard opens
  await loadProducts();
});
