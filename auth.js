document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.querySelector("#register-form");

  // If this page has no registration form, do nothing.
  if (!registerForm) return;

  const fullNameInput = document.querySelector("#full-name");
  const emailInput = document.querySelector("#register-email");
  const passwordInput = document.querySelector("#register-password");
  const confirmPasswordInput = document.querySelector("#confirm-password");
  const message = document.querySelector("#register-message");
  const submitButton = registerForm.querySelector('button[type="submit"]');

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    message.style.color = "";

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!fullName) {
      message.textContent = "Please enter your full name.";
      return;
    }

    if (password.length < 8) {
      message.textContent = "Your password must contain at least 8 characters.";
      return;
    }

    if (password !== confirmPassword) {
      message.textContent = "Your passwords do not match.";
      confirmPasswordInput.focus();
      return;
    }

    if (typeof supabaseClient === "undefined") {
      message.textContent =
        "Supabase connection not found. Please check your setup.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        message.style.color = "green";
        message.textContent = "Account created successfully! Redirecting...";

        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");

        if (next === "checkout.html") {
          window.location.href = "./checkout.html";
        } else {
          window.location.href = "./index.html";
        }
        return;
      }

      message.style.color = "green";
      message.textContent =
        "Registration successful! Check your email for a confirmation link.";

      registerForm.reset();
    } catch (error) {
      message.style.color = "#d32f2f";

      message.textContent =
        error.message || "Registration failed. Please try again.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Create Account";
    }
  });
});

/* =========================================
   JUMIA CLONE - USER SIGN IN
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#login-form");

  // Run this section only on the login page.
  if (!loginForm) return;

  const emailInput = document.querySelector("#login-email");
  const passwordInput = document.querySelector("#login-password");
  const message = document.querySelector("#login-message");
  const submitButton = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    message.style.color = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      message.textContent = "Please enter your email and password.";
      return;
    }

    if (typeof supabaseClient === "undefined") {
      message.textContent =
        "Connection error. Please check your Supabase setup.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      if (data.session) {
        message.style.color = "green";
        message.textContent = "Sign-in successful! Welcome back.";

        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");

        if (next === "checkout.html") {
          window.location.href = "./checkout.html";
        } else {
          window.location.href = "./index.html";
        }
      } else {
        message.textContent =
          "Sign-in could not be completed. Please try again.";
      }
    } catch (error) {
      message.style.color = "#d32f2f";

      if (error.message?.toLowerCase().includes("email not confirmed")) {
        message.textContent =
          "Please confirm your email address before signing in.";
      } else {
        message.textContent =
          "Sign-in failed. Check your email and password and try again.";
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign In";
    }
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  // Only run this section on pages with the Account dropdown.
  const accountDropdown = document.querySelector(".account-dropdown");

  if (!accountDropdown) return;

  const signOutButton = document.querySelector("#sign-out-button");
  const signedOutItems = document.querySelectorAll('[data-auth="signed-out"]');
  const signedInItems = document.querySelectorAll('[data-auth="signed-in"]');

  // Show the correct links based on the customer's session.
  function updateAccountDropdown(session) {
    signedOutItems.forEach((item) => {
      item.hidden = Boolean(session);
    });

    signedInItems.forEach((item) => {
      item.hidden = !session;
    });
  }

  // Check whether a customer is already signed in.
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    updateAccountDropdown(data.session);
  } catch (error) {
    console.error("Could not retrieve the user session:", error);
    updateAccountDropdown(null);
  }

  // Keep the dropdown updated when authentication changes.
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateAccountDropdown(session);
  });

  // Sign out the customer.
  if (signOutButton) {
    signOutButton.addEventListener("click", async (event) => {
      event.preventDefault();

      signOutButton.textContent = "Signing out...";
      signOutButton.style.pointerEvents = "none";

      try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        updateAccountDropdown(null);

        // Close the Account dropdown.
        accountDropdown.classList.remove("open");
      } catch (error) {
        console.error("Sign-out failed:", error);
        alert("Unable to sign out. Please try again.");
      } finally {
        signOutButton.textContent = "Sign Out";
        signOutButton.style.pointerEvents = "";
      }
    });
  }
});

/* =========================================
   JUMIA CLONE — ACCOUNT SESSION & DROPDOWN
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

  // Registration and login pages don't have this component.
  if (!accountButton || !accountDropdown) return;

  if (typeof supabaseClient === "undefined") {
    console.error("Supabase client is unavailable on this page.");
    return;
  }

  const accountLabel = accountButton.querySelector(".account-label");
  const userNameElement = accountDropdown.querySelector(".account-user-name");
  const signedOutItems = accountDropdown.querySelectorAll(
    '[data-auth="signed-out"]',
  );
  const signedInItems = accountDropdown.querySelectorAll(
    '[data-auth="signed-in"]',
  );
  const signOutButton = accountDropdown.querySelector("#sign-out-button");

  let currentUserId = null;

  function updateAccount(session) {
    const user = session?.user ?? null;
    const isSignedIn = Boolean(user);

    signedOutItems.forEach((item) => {
      item.hidden = isSignedIn;
    });

    signedInItems.forEach((item) => {
      item.hidden = !isSignedIn;
    });

    if (isSignedIn) {
      const fullName = user.user_metadata?.full_name?.trim();
      const emailName = user.email?.split("@")[0];
      const displayName = fullName || emailName || "Customer";

      if (accountLabel) {
        accountLabel.textContent = `Hi, ${displayName}`;
      }

      if (userNameElement) {
        userNameElement.textContent = displayName;
      }

      currentUserId = user.id;
    } else {
      if (accountLabel) {
        accountLabel.textContent = "Account";
      }

      if (userNameElement) {
        userNameElement.textContent = "";
      }

      currentUserId = null;
    }
  }

  // Set the initial state from the saved Supabase session.
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    updateAccount(data.session);
  } catch (error) {
    console.error("Unable to load the account session:", error);
    updateAccount(null);
  }

  // Update the header when sign-in or sign-out occurs.
  supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAccount(session);

    if (event === "SIGNED_OUT") {
      accountDropdown.classList.remove("open");
      accountButton.setAttribute("aria-expanded", "false");
    }
  });

  // Toggle the dropdown and its arrow.
  accountButton.addEventListener("click", (event) => {
    event.preventDefault();

    const isOpen = accountDropdown.classList.toggle("open");
    accountButton.setAttribute("aria-expanded", String(isOpen));
  });

  // Close the dropdown when clicking outside.
  document.addEventListener("click", (event) => {
    if (
      !accountButton.contains(event.target) &&
      !accountDropdown.contains(event.target)
    ) {
      accountDropdown.classList.remove("open");
      accountButton.setAttribute("aria-expanded", "false");
    }
  });

  // Sign out and immediately restore the signed-out view.
  if (signOutButton) {
    signOutButton.addEventListener("click", async (event) => {
      event.preventDefault();

      signOutButton.textContent = "Logging out...";
      signOutButton.style.pointerEvents = "none";

      try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        updateAccount(null);
        accountDropdown.classList.remove("open");
        accountButton.setAttribute("aria-expanded", "false");
      } catch (error) {
        console.error("Logout failed:", error);
        alert("We couldn't log you out. Please try again.");
      } finally {
        signOutButton.textContent = "Logout";
        signOutButton.style.pointerEvents = "";
      }
    });
  }
});
