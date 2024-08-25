let items = [];

// Fetch item details from API
async function fetchItem(code) {
  const url = `https://api.artifactsmmo.com/ge/${code}`;
  const options = { method: "GET", headers: { Accept: "application/json" } };
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(error);
    alert("Failed to fetch item details.");
    return null;
  }
}

// Determine color based on price or stock changes
function getColor(newValue, oldValue) {
  if (newValue > oldValue) {
    return "green"; // Price or stock increased
  } else if (newValue < oldValue) {
    return "red"; // Price or stock decreased
  } else {
    return "black"; // No change
  }
}

// Format timestamp as a readable string
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(); // Local date-time string
}

// Update the global timestamp
function updateGlobalTimestamp() {
  const timestampElement = document.getElementById("last-refresh-time");
  timestampElement.textContent = formatTimestamp(new Date().toISOString());
}

// Render items list
function renderItems() {
  const itemList = document.getElementById("item-list");
  itemList.innerHTML = "";
  items.forEach((item, index) => {
    const itemContainer = document.createElement("div");
    itemContainer.className = "item-container";

    // Determine colors based on price and stock changes
    const sellPriceColor = getColor(item.sell_price, item.previous_sell_price);
    const buyPriceColor = getColor(item.buy_price, item.previous_buy_price);
    const stockColor = getColor(item.stock, item.previous_stock_volume);

    const itemDetails = document.createElement("div");
    itemDetails.className = "item-details";

    // Image URL
    const imageUrl = `https://artifactsmmo.com/images/items/${item.code}.png`;

    // Include image, item code, stock, sell price, and buy price
    itemDetails.innerHTML = `<img src="${imageUrl}" alt="Item Image">
                                <br>
                                 <strong>Code:</strong> ${item.code} <br> 
                                 <strong>Stock:</strong> <span style="color: ${stockColor};">${item.stock}</span> <br>
                                 <strong>Sell Price:</strong> <span style="color: ${sellPriceColor};">${item.sell_price}</span> <br>
                                 <strong>Buy Price:</strong> <span style="color: ${buyPriceColor};">${item.buy_price}</span> <br>
                                 `;

    const controls = document.createElement("div");
    controls.className = "controls";

    const refreshInput = document.createElement("input");
    refreshInput.type = "number";
    refreshInput.min = "1";
    refreshInput.value = item.refreshRate;
    refreshInput.onchange = (e) => {
      items[index].refreshRate = e.target.value;
      clearInterval(item.interval);
      item.interval = setInterval(
        () => refreshItem(index),
        item.refreshRate * 1000
      );
      saveItems(); // Save to localStorage whenever the refresh rate changes
    };

    const manualRefreshButton = document.createElement("button");
    manualRefreshButton.textContent = "Refresh";
    manualRefreshButton.onclick = () => refreshItem(index);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => {
      clearInterval(items[index].interval);
      items.splice(index, 1);
      renderItems();
      saveItems(); // Save to localStorage after deletion
    };

    const leftButton = document.createElement("button");
    leftButton.textContent = "←";
    leftButton.onclick = () => {
      if (index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
        renderItems();
        saveItems(); // Save to localStorage after rearranging
      }
    };

    const rightButton = document.createElement("button");
    rightButton.textContent = "→"; // Right arrow
    rightButton.onclick = () => {
      if (index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
        renderItems();
        saveItems(); // Save to localStorage after rearranging
      }
    };

    controls.appendChild(refreshInput);
    controls.appendChild(manualRefreshButton); // Add the manual refresh button
    controls.appendChild(leftButton);
    controls.appendChild(rightButton);
    controls.appendChild(deleteButton);

    itemContainer.appendChild(itemDetails);
    itemContainer.appendChild(controls);

    itemList.appendChild(itemContainer);
  });

  updateGlobalTimestamp(); // Update global timestamp after rendering items
}

// Add a new item to the list
async function addItem() {
  const itemCode = document.getElementById("item-code").value.trim();
  if (itemCode) {
    const itemData = await fetchItem(itemCode);
    if (itemData) {
      itemData.refreshRate = 60; // Default refresh rate in seconds
      itemData.previous_stock_volume = itemData.stock;
      itemData.previous_sell_price = itemData.sell_price; // Initial previous prices
      itemData.previous_buy_price = itemData.buy_price;
      itemData.interval = setInterval(
        () => refreshItem(items.length),
        itemData.refreshRate * 1000
      );
      items.push(itemData);
      renderItems();
      saveItems(); // Save to localStorage after adding a new item
    }
    document.getElementById("item-code").value = "";
  } else {
    alert("Please enter a valid item code.");
  }
}

// Refresh item data
async function refreshItem(index) {
  const itemCode = items[index].code;
  const refreshedData = await fetchItem(itemCode);
  if (refreshedData) {
    items[index].previous_stock_volume = items[index].stock;
    items[index].previous_sell_price = items[index].sell_price; // Store old price before update
    items[index].previous_buy_price = items[index].buy_price;
    items[index] = { ...items[index], ...refreshedData }; // Update item with new data
    renderItems();
    saveItems(); // Save to localStorage after refreshing the item
  }
}

// Save items to localStorage
function saveItems() {
  localStorage.setItem("items", JSON.stringify(items));
}

// Load items from localStorage on page load
function loadItems() {
  const savedItems = localStorage.getItem("items");
  if (savedItems) {
    items = JSON.parse(savedItems);
    items.forEach((item, index) => {
      item.previous_stock_volume = item.stock;
      item.previous_sell_price = item.sell_price;
      item.previous_buy_price = item.buy_price;
      item.interval = setInterval(
        () => refreshItem(index),
        item.refreshRate * 1000
      );
    });
    renderItems();
  }
}

// Load items when the page loads
loadItems();
