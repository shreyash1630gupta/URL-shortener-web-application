const form = document.getElementById("shortenForm");
const input = document.getElementById("longUrl");
const message = document.getElementById("message");
const resultBox = document.getElementById("resultBox");
const shortUrlAnchor = document.getElementById("shortUrlAnchor");
const copyBtn = document.getElementById("copyBtn");
const historyList = document.getElementById("historyList");
const refreshBtn = document.getElementById("refreshBtn");
const shortenBtn = document.getElementById("shortenBtn");

let currentShortUrl = "";

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function loadHistory() {
  historyList.innerHTML = "<p>Loading history...</p>";

  try {
    const response = await fetch("/api/history");
    const links = await response.json();

    if (!response.ok) {
      throw new Error(links.message || "Could not load history");
    }

    if (!links.length) {
      historyList.innerHTML = "<p>No links shortened yet.</p>";
      return;
    }

    historyList.innerHTML = links
      .map((item) => {
        const shortLink = `${window.location.origin}/${item.shortCode}`;
        return `
          <article class="history-item">
            <div class="row">
              <a href="${shortLink}" target="_blank" rel="noopener noreferrer">${shortLink}</a>
              <span class="meta">Clicks: ${item.clicks || 0}</span>
            </div>
            <div class="original">${escapeHtml(item.originalUrl)}</div>
            <div class="meta">Created: ${formatDate(item.createdAt)}</div>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    historyList.innerHTML = `<p>${error.message}</p>`;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const originalUrl = input.value.trim();
  if (!originalUrl) {
    showMessage("Please enter a URL.", "error");
    return;
  }

  shortenBtn.disabled = true;
  shortenBtn.textContent = "Shortening...";

  try {
    const response = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    currentShortUrl = data.shortUrl;
    shortUrlAnchor.textContent = data.shortUrl;
    shortUrlAnchor.href = data.shortUrl;
    resultBox.classList.remove("hidden");
    showMessage(data.message, "success");
    input.value = "";
    await loadHistory();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    shortenBtn.disabled = false;
    shortenBtn.textContent = "Shorten";
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentShortUrl);
    showMessage("Short URL copied to clipboard.", "success");
  } catch (error) {
    showMessage("Copy failed. Please copy manually.", "error");
  }
});
async function clearHistory() {
  try {
    const response = await fetch("/api/clear", {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to clear history");
    }

    showMessage(data.message, "success");
    resultBox.classList.add("hidden");
    currentShortUrl = "";
    await loadHistory();
  } catch (error) {
    showMessage(error.message, "error");
  }
}
refreshBtn.addEventListener("click", loadHistory);

loadHistory();
