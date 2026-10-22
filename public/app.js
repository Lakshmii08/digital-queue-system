
const form = document.getElementById("token-form");
const list = document.getElementById("queue-list");
const currentToken = document.getElementById("current-token");
const message = document.getElementById("message");

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

async function refreshQueue() {
  try {
    const [queue, current] = await Promise.all([
      request("/api/queue"),
      request("/api/queue/current")
    ]);

    currentToken.textContent = current
      ? `${current.token} — ${current.name}`
      : "No token currently serving";

    list.replaceChildren();

    queue.forEach(item => {
      const li = document.createElement("li");
      li.textContent =
        `${item.token} | ${item.name} | ${item.department} | ${item.status}`;

      if (item.status === "SERVING") {
        const button = document.createElement("button");
        button.textContent = "Complete";
        button.style.marginLeft = "12px";

        button.addEventListener("click", async () => {
          try {
            await request(`/api/queue/${item.id}/complete`, {
              method: "PATCH"
            });
            message.textContent = "Token completed.";
            await refreshQueue();
          } catch (error) {
            message.textContent = error.message;
          }
        });

        li.appendChild(button);
      }

      list.appendChild(li);
    });
  } catch (error) {
    message.textContent = error.message;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  try {
    const item = await request("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.getElementById("name").value,
        department: document.getElementById("department").value
      })
    });

    message.textContent = `Your token is ${item.token}`;
    form.reset();
    await refreshQueue();
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById("next-button").addEventListener("click", async () => {
  try {
    const item = await request("/api/queue/next", {
      method: "POST"
    });
    message.textContent = `Now serving ${item.token}`;
    await refreshQueue();
  } catch (error) {
    message.textContent = error.message;
  }
});

refreshQueue();
