const accountButton = document.querySelector(".account-button");
const accountDropdown = document.querySelector(".account-dropdown");

accountButton.addEventListener("click", function (event) {
  event.preventDefault();

  accountDropdown.classList.toggle("open");
});

document.addEventListener("click", function (event) {
  if (
    !accountButton.contains(event.target) &&
    !accountDropdown.contains(event.target)
  ) {
    accountDropdown.classList.remove("open");
  }
});
const helpButton = document.querySelector(".help-button");
const helpDropdown = document.querySelector(".help-dropdown");

helpButton.addEventListener("click", function (event) {
  event.preventDefault();

  helpDropdown.classList.toggle("open");
});

document.addEventListener("click", function (event) {
  if (
    !helpButton.contains(event.target) &&
    !helpDropdown.contains(event.target)
  ) {
    helpDropdown.classList.remove("open");
  }
});

accountButton.addEventListener("click", function (event) {
  event.preventDefault();

  const isOpen = accountDropdown.classList.toggle("open");
  accountButton.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", function (event) {
  if (
    !accountButton.contains(event.target) &&
    !accountDropdown.contains(event.target)
  ) {
    accountDropdown.classList.remove("open");
    accountButton.setAttribute("aria-expanded", "false");
  }
});

/* =========================================================
   JUMIA-STYLE CATEGORY NAVIGATION
   ========================================================= */

/* =========================================================
   JUMIA CLONE - CATEGORY NAVIGATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const categories = document.querySelector(".categories");

  const categoryItems = document.querySelectorAll(".category");

  /* -------------------------------------------------------
       STOP IF CATEGORY SECTION DOES NOT EXIST
       ------------------------------------------------------- */

  if (!categories || !categoryItems.length) {
    return;
  }

  /* -------------------------------------------------------
       ACTIVE DROPDOWN VARIABLES
       ------------------------------------------------------- */

  let activeCategory = null;

  let activeDropdown = null;

  let closeTimer = null;

  /* -------------------------------------------------------
       SET UP EACH CATEGORY
       ------------------------------------------------------- */

  categoryItems.forEach((category) => {
    const dropdown = category.querySelector(":scope > .dropdown");

    /* Category has no dropdown */

    if (!dropdown) {
      return;
    }

    /* ---------------------------------------------------
           REMEMBER ORIGINAL LOCATION
           --------------------------------------------------- */

    dropdown._originalParent = category;

    dropdown._originalNextSibling = dropdown.nextSibling;

    /* ---------------------------------------------------
           OPEN WHEN MOUSE ENTERS CATEGORY
           --------------------------------------------------- */

    category.addEventListener("mouseenter", () => {
      clearTimeout(closeTimer);

      openDropdown(category, dropdown);
    });

    /* ---------------------------------------------------
           CLOSE WHEN LEAVING CATEGORY
           --------------------------------------------------- */

    category.addEventListener("mouseleave", () => {
      scheduleClose();
    });

    /* ---------------------------------------------------
           KEEP DROPDOWN OPEN WHEN MOUSE ENTERS IT
           --------------------------------------------------- */

    dropdown.addEventListener("mouseenter", () => {
      clearTimeout(closeTimer);
    });

    /* ---------------------------------------------------
           CLOSE WHEN LEAVING DROPDOWN
           --------------------------------------------------- */

    dropdown.addEventListener("mouseleave", () => {
      scheduleClose();
    });
  });

  /* =======================================================
       OPEN DROPDOWN
       ======================================================= */

  function openDropdown(category, dropdown) {
    /* Already open */

    if (activeCategory === category && activeDropdown === dropdown) {
      positionDropdown(category, dropdown);

      return;
    }

    /* Close previous dropdown */

    closeDropdown();

    /* Save active */

    activeCategory = category;

    activeDropdown = dropdown;

    /* Highlight category */

    category.classList.add("dropdown-active");

    /* ---------------------------------------------------
           MOVE DROPDOWN TO BODY
           --------------------------------------------------- */

    document.body.appendChild(dropdown);

    /* ---------------------------------------------------
           GIVE IT FLOATING CLASS
           --------------------------------------------------- */

    dropdown.classList.add("dropdown-floating");

    /* ---------------------------------------------------
           SHOW DROPDOWN
           --------------------------------------------------- */

    dropdown.style.display = "flex";

    /* ---------------------------------------------------
           POSITION IT
           --------------------------------------------------- */

    positionDropdown(category, dropdown);
  }

  /* =======================================================
       POSITION DROPDOWN
       ======================================================= */

  function positionDropdown(category, dropdown) {
    if (!category || !dropdown) {
      return;
    }

    /* Get category position */

    const categoryRect = category.getBoundingClientRect();

    /* Put dropdown directly underneath
           the category navigation */

    dropdown.style.top = `${categoryRect.bottom}px`;

    /* Full-width dropdown */

    dropdown.style.left = "0px";

    dropdown.style.right = "auto";
  }

  /* =======================================================
       SCHEDULE DROPDOWN CLOSE
       ======================================================= */

  function scheduleClose() {
    clearTimeout(closeTimer);

    closeTimer = setTimeout(() => {
      closeDropdown();
    }, 200);
  }

  /* =======================================================
       CLOSE DROPDOWN
       ======================================================= */

  function closeDropdown() {
    clearTimeout(closeTimer);

    if (!activeDropdown || !activeCategory) {
      return;
    }

    const dropdown = activeDropdown;

    const category = activeCategory;

    /* Remove active category state */

    category.classList.remove("dropdown-active");

    /* Remove floating class */

    dropdown.classList.remove("dropdown-floating");

    /* Clear inline styles */

    dropdown.style.display = "";

    dropdown.style.top = "";

    dropdown.style.left = "";

    dropdown.style.right = "";

    /* ---------------------------------------------------
           RETURN DROPDOWN TO ORIGINAL CATEGORY
           --------------------------------------------------- */

    const nextSibling = dropdown._originalNextSibling;

    if (nextSibling && nextSibling.parentNode === category) {
      category.insertBefore(dropdown, nextSibling);
    } else {
      category.appendChild(dropdown);
    }

    /* Clear active state */

    activeCategory = null;

    activeDropdown = null;
  }

  /* =======================================================
       UPDATE DROPDOWN ON PAGE SCROLL
       ======================================================= */

  window.addEventListener(
    "scroll",
    () => {
      if (activeCategory && activeDropdown) {
        positionDropdown(activeCategory, activeDropdown);
      }
    },
    {
      passive: true,
    },
  );

  /* =======================================================
       UPDATE DROPDOWN ON WINDOW RESIZE
       ======================================================= */

  window.addEventListener("resize", () => {
    if (activeCategory && activeDropdown) {
      positionDropdown(activeCategory, activeDropdown);
    }
  });

  /* =======================================================
       MOUSE WHEEL → HORIZONTAL CATEGORY SCROLL
       ======================================================= */

  categories.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        categories.scrollLeft += event.deltaY;

        event.preventDefault();
      }
    },
    {
      passive: false,
    },
  );

  /* =======================================================
       CLICK + DRAG CATEGORY BAR
       ======================================================= */

  let isDragging = false;

  let startX = 0;

  let startScrollLeft = 0;

  let hasDragged = false;

  categories.addEventListener("pointerdown", (event) => {
    /* Only react to left mouse button */

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    isDragging = true;

    hasDragged = false;

    startX = event.clientX;

    startScrollLeft = categories.scrollLeft;

    categories.classList.add("is-dragging");

    categories.setPointerCapture(event.pointerId);
  });

  categories.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }

    const distance = event.clientX - startX;

    /* Detect actual movement */

    if (Math.abs(distance) > 5) {
      hasDragged = true;
    }

    categories.scrollLeft = startScrollLeft - distance;
  });

  categories.addEventListener("pointerup", (event) => {
    isDragging = false;

    categories.classList.remove("is-dragging");

    try {
      categories.releasePointerCapture(event.pointerId);
    } catch (error) {}
  });

  categories.addEventListener("pointercancel", () => {
    isDragging = false;

    categories.classList.remove("is-dragging");
  });

  /* =======================================================
       PREVENT ACCIDENTAL CLICK AFTER DRAGGING
       ======================================================= */

  categories.addEventListener(
    "click",
    (event) => {
      if (hasDragged) {
        event.preventDefault();

        event.stopPropagation();

        hasDragged = false;
      }
    },
    true,
  );
});

/* =========================================
   JUMIA HOMEPAGE BANNER CAROUSEL
========================================= */

document.addEventListener("DOMContentLoaded", function () {
  const heroBanner = document.querySelector(".hero-banner");
  const heroImage = document.querySelector(".hero-slide-image");
  const prevButton = document.querySelector(".hero-prev");
  const nextButton = document.querySelector(".hero-next");
  const heroDots = document.querySelectorAll(".hero-dots span");

  const bannerImages = [
    "assets/jumiabanner4.jpg",
    "assets/jumiabanner5.jpg",
    "assets/jumiabanner6.jpg",
    "assets/jumiabanner7.jpg",
  ];

  if (
    !heroBanner ||
    !heroImage ||
    !prevButton ||
    !nextButton ||
    heroDots.length !== bannerImages.length
  ) {
    console.error("Banner carousel error: Check your HTML elements and dots.");
    return;
  }

  let currentBanner = 0;
  let bannerInterval;

  // Display a banner and update its active dot.
  function showBanner(index) {
    currentBanner = (index + bannerImages.length) % bannerImages.length;

    heroImage.src = bannerImages[currentBanner];

    heroDots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("active", dotIndex === currentBanner);
    });
  }

  function nextBanner() {
    showBanner(currentBanner + 1);
  }

  function previousBanner() {
    showBanner(currentBanner - 1);
  }

  // Start automatic sliding every five seconds.
  function startAutoplay() {
    clearInterval(bannerInterval);

    bannerInterval = setInterval(function () {
      nextBanner();
    }, 5000);
  }

  // Stop automatic sliding.
  function stopAutoplay() {
    clearInterval(bannerInterval);
  }

  nextButton.addEventListener("click", function () {
    nextBanner();
    startAutoplay();
  });

  prevButton.addEventListener("click", function () {
    previousBanner();
    startAutoplay();
  });

  // Clickable indicator dots.
  heroDots.forEach(function (dot, index) {
    dot.addEventListener("click", function () {
      showBanner(index);
      startAutoplay();
    });
  });

  // Pause when the mouse enters the banner.
  heroBanner.addEventListener("mouseenter", stopAutoplay);

  // Resume when the mouse leaves the banner.
  heroBanner.addEventListener("mouseleave", startAutoplay);

  // Display the first banner and start the carousel.
  showBanner(0);
  startAutoplay();
});

/* =========================================
   JUMIA CLONE - FLASH SALES
   Countdown + Product Carousel
========================================= */

document.addEventListener("DOMContentLoaded", function () {
  const flashSection = document.querySelector(".flash-sales");

  if (!flashSection) return;

  const productTrack = flashSection.querySelector("#flash-products");
  const previousButton = flashSection.querySelector(".flash-prev");
  const nextButton = flashSection.querySelector(".flash-next");
  const timerDisplay = flashSection.querySelector("#flash-timer");

  if (!productTrack || !previousButton || !nextButton) {
    console.error("Flash Sales: Required carousel elements are missing.");
    return;
  }

  /* -------------------------------------
       1. PRODUCT CAROUSEL
    ------------------------------------- */

  function getScrollAmount() {
    const firstProduct = productTrack.querySelector(".flash-product");

    if (!firstProduct) return 250;

    const trackStyle = window.getComputedStyle(productTrack);
    const gap = parseFloat(trackStyle.columnGap) || 10;

    return firstProduct.getBoundingClientRect().width + gap;
  }

  function updateArrowStates() {
    const maxScroll = productTrack.scrollWidth - productTrack.clientWidth;

    const hasOverflow = maxScroll > 2;

    previousButton.disabled = !hasOverflow || productTrack.scrollLeft <= 2;

    nextButton.disabled =
      !hasOverflow || productTrack.scrollLeft >= maxScroll - 2;
  }

  nextButton.addEventListener("click", function () {
    productTrack.scrollBy({
      left: getScrollAmount() * 3,
      behavior: "smooth",
    });
  });

  previousButton.addEventListener("click", function () {
    productTrack.scrollBy({
      left: -getScrollAmount() * 3,
      behavior: "smooth",
    });
  });

  productTrack.addEventListener("scroll", updateArrowStates, {
    passive: true,
  });

  window.addEventListener("resize", updateArrowStates);

  // Recheck after product images finish loading.
  productTrack.querySelectorAll("img").forEach(function (img) {
    if (!img.complete) {
      img.addEventListener("load", updateArrowStates, { once: true });
      img.addEventListener("error", updateArrowStates, { once: true });
    }
  });

  updateArrowStates();

  /* -------------------------------------
       2. COUNTDOWN TIMER
       Counts down to 7:00 PM local time.
    ------------------------------------- */

  function getNextSaleEnd() {
    const now = new Date();
    const saleEnd = new Date(now);

    saleEnd.setHours(19, 0, 0, 0);

    // If 7 PM has passed, count down to 7 PM tomorrow.
    if (now >= saleEnd) {
      saleEnd.setDate(saleEnd.getDate() + 1);
    }

    return saleEnd;
  }

  let saleEndTime = getNextSaleEnd();

  function updateCountdown() {
    if (!timerDisplay) return;

    const now = new Date();
    let remaining = saleEndTime.getTime() - now.getTime();

    // Start the next countdown if the current one has ended.
    if (remaining <= 0) {
      saleEndTime = getNextSaleEnd();
      remaining = saleEndTime.getTime() - now.getTime();
    }

    const totalSeconds = Math.floor(remaining / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const format = function (number) {
      return String(number).padStart(2, "0");
    };

    timerDisplay.textContent =
      format(hours) + "h : " + format(minutes) + "m : " + format(seconds) + "s";
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
});

document.addEventListener("DOMContentLoaded", async () => {
  const productGrid = document.querySelector("#home-products-grid");

  // Do nothing on pages that don't contain this section.
  if (!productGrid) return;

  const cartStatus = document.querySelector("#products-cart-status");
  const toast = document.querySelector("#products-toast");
  const exploreButton = document.querySelector("#products-load-more");

  // Sample catalogue for the front-end clone.

  // Fetch recommended products from Supabase.
  const { data: productRows, error: productsError } =
    await window.supabaseClient
      .from("products")
      .select(
        "id, name, price_kobo, old_price_kobo, discount_percent, image_url, rating, review_count",
      )
      .eq("source", "recommended")
      .eq("is_active", true);

  // Stop if Supabase returns an error.
  if (productsError) {
    console.error("Failed to load recommended products:", productsError);

    if (cartStatus) {
      cartStatus.textContent = "Unable to load products. Please try again.";
    }

    return;
  }

  // Convert Supabase records into the format
  // already expected by the existing product cards.
  const products = (productRows || []).map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price_kobo / 100,
    oldPrice: product.old_price_kobo == null ? 0 : product.old_price_kobo / 100,
    discount: product.discount_percent,
    rating: Number(product.rating ?? 0),
    reviews: product.review_count ?? 0,
    image: product.image_url
      ? product.image_url
          .replace("https://images.unsplash.com/", "")
          .split("?")[0]
      : "",
  }));

  // Fetch ALL active products for search.
  const { data: searchRows, error: searchError } = await window.supabaseClient
    .from("products")
    .select(
      "id, name, price_kobo, old_price_kobo, discount_percent, image_url, rating, review_count",
    )
    .eq("is_active", true);

  // Convert the complete catalogue for search results.
  const allSearchProducts = (searchRows || []).map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price_kobo / 100,
    oldPrice: product.old_price_kobo == null ? 0 : product.old_price_kobo / 100,
    discount: product.discount_percent ?? 0,
    rating: Number(product.rating ?? 0),
    reviews: product.review_count ?? 0,
    image: product.image_url
      ? product.image_url
          .replace("https://images.unsplash.com/", "")
          .split("?")[0]
      : "",
  }));

  if (searchError) {
    console.error("Failed to load search catalogue:", searchError);
  }

  // Show a helpful message if no products are available.
  if (products.length === 0) {
    if (cartStatus) {
      cartStatus.textContent =
        "No recommended products are available right now.";
    }

    return;
  }

  const naira = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  });

  const formatPrice = (price) => `₦${naira.format(price)}`;

  let cartCount = 0;
  let toastTimer;

  function showToast(message) {
    if (!toast) return;

    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;

    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2500);
  }

  function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "home-product-card";

    const visual = document.createElement("div");
    visual.className = "home-product-card__visual";

    const image = document.createElement("img");
    image.className = "home-product-card__image";
    image.src =
      `https://images.unsplash.com/${product.image}` +
      "?auto=format&fit=crop&w=500&q=80";
    image.alt = product.name;
    image.loading = "lazy";
    image.decoding = "async";

    const discount = document.createElement("span");
    discount.className = "home-product-card__discount";
    discount.textContent = `-${product.discount}%`;

    const wishlist = document.createElement("button");
    wishlist.type = "button";
    wishlist.className = "home-product-card__wishlist";
    wishlist.textContent = "♡";
    wishlist.setAttribute("aria-label", `Add ${product.name} to wishlist`);
    wishlist.setAttribute("aria-pressed", "false");

    wishlist.addEventListener("click", () => {
      const isFavourite = wishlist.getAttribute("aria-pressed") === "true";

      wishlist.setAttribute("aria-pressed", String(!isFavourite));
      wishlist.classList.toggle("is-favourite", !isFavourite);
      wishlist.textContent = isFavourite ? "♡" : "♥";
      wishlist.setAttribute(
        "aria-label",
        `${isFavourite ? "Add" : "Remove"} ${product.name} ${
          isFavourite ? "to" : "from"
        } wishlist`,
      );

      showToast(
        isFavourite
          ? "Removed from your favourites."
          : "Added to your favourites.",
      );
    });

    visual.append(image, discount, wishlist);

    const details = document.createElement("div");
    details.className = "home-product-card__details";

    const name = document.createElement("h3");
    name.className = "home-product-card__name";
    name.textContent = product.name;

    const price = document.createElement("p");
    price.className = "home-product-card__price";
    price.textContent = formatPrice(product.price);

    const oldPrice = document.createElement("p");
    oldPrice.className = "home-product-card__old-price";
    oldPrice.textContent = formatPrice(product.oldPrice);

    const rating = document.createElement("div");
    rating.className = "home-product-card__rating";

    const stars = document.createElement("span");
    stars.className = "home-product-card__stars";
    stars.textContent = "★★★★★";
    stars.setAttribute("aria-hidden", "true");

    const ratingText = document.createElement("span");
    ratingText.className = "home-product-card__reviews";
    ratingText.textContent = `${product.rating.toFixed(1)} (${product.reviews})`;

    rating.setAttribute(
      "aria-label",
      `Sample rating: ${product.rating} out of 5, ${product.reviews} sample reviews`,
    );
    rating.append(stars, ratingText);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "home-product-card__add add-to-cart";

    addButton.dataset.id = product.id;
    addButton.dataset.name = product.name;
    addButton.dataset.price = product.price;
    addButton.dataset.image = image.src;
    addButton.dataset.oldPrice = product.oldPrice;
    addButton.dataset.discount = product.discount;
    addButton.textContent = "Add to Cart";

    details.append(name, price, oldPrice, rating, addButton);
    card.append(visual, details);

    return card;
  }

  // Render all 15 cards.
  // Render products into the existing homepage grid.
  function renderProducts(productList) {
    const fragment = document.createDocumentFragment();

    productList.forEach((product) => {
      fragment.appendChild(createProductCard(product));
    });

    productGrid.replaceChildren(fragment);

    if (countLabel) {
      countLabel.textContent = `${productList.length} products`;
    }

    if (cartStatus) {
      cartStatus.textContent =
        productList.length === 0
          ? "No products found. Try another search."
          : `Showing ${productList.length} product(s).`;
    }
  }

  // Search elements.
  const searchForm = document.querySelector("#product-search-form");
  const searchInput = document.querySelector("#product-search-input");
  const countLabel = document.querySelector(".home-products__count");

  // Display the full recommended catalogue initially.
  renderProducts(products);

  // Search when the user submits the form.
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const searchTerm = searchInput.value.trim().toLowerCase();

      const filteredProducts = allSearchProducts.filter((product) =>
        product.name.toLowerCase().includes(searchTerm),
      );

      renderProducts(filteredProducts);

      // Scroll to the search results.
      document.querySelector("#recommended-products").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  // Bring customers back to the product grid.
  if (exploreButton) {
    exploreButton.addEventListener("click", () => {
      productGrid.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }
});
