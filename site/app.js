// The browser only trusts the server's manifest (how many boxes are open).
// It never looks at the device date, and it only requests boxes that exist.
const grid = document.getElementById("grid");
const dialog = document.getElementById("box");

async function init() {
  const res = await fetch("manifest.json", { cache: "no-store" });
  const manifest = await res.json();
  document.getElementById("title").textContent = manifest.title;
  document.title = manifest.title;
  document.getElementById("subtitle").textContent = manifest.subtitle;

  for (let day = 1; day <= 24; day++) {
    const isOpen = day <= manifest.open;
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<span>${day}</span><span class="state">${isOpen ? "open" : "locked"}</span>`;
    if (isOpen) {
      btn.setAttribute("aria-label", `Open box ${day}`);
      btn.addEventListener("click", () => show(day));
    } else {
      btn.disabled = true;
      btn.setAttribute("aria-label", `Box ${day}, not open yet`);
    }
    li.appendChild(btn);
    grid.appendChild(li);
  }
}

async function show(day) {
  const res = await fetch(`days/${String(day).padStart(2, "0")}.json`, { cache: "no-store" });
  if (!res.ok) return;
  const data = await res.json();
  document.getElementById("box-day").textContent = `December ${day}`;
  document.getElementById("box-title").textContent = data.title;
  document.getElementById("box-text").textContent = data.text;
  dialog.showModal();
}

document.getElementById("close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
init();
