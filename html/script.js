class EconomyMarket {
  constructor() {
    this.selectedItems = new Set();
    this.inventoryData = {};
    this.priceData = {};
    this.notifications = [];
    this.init();
  }

  init() {
      this.setupEventHandlers();
      this.createNotificationContainer();
  }

  setupEventHandlers() {
    window.addEventListener("message", (event) => {
     
      if (event.data.type === "openMarket") {
        this.inventoryData = event.data.inventory;
        this.priceData = event.data.prices;
        this.renderInventory();
        this.renderPrices();
        this.setupClickHandlers();
        this.selectAllItems();
        document.getElementById("marketBackground").style.display = "block";
        document.getElementById("marketContainer").style.display = "flex";
        document.getElementById("marketContainer").classList.remove("show");
        setTimeout(() => {
          document.getElementById("marketContainer").classList.add("show");
        }, 50);
      } else if (event.data.type === "closeMarket") {
        document.getElementById("marketContainer").classList.remove("show");
        setTimeout(() => {
          document.getElementById("marketContainer").style.display = "none";
          document.getElementById("marketBackground").style.display = "none";
        }, 400);
      } else if (event.data.type === "updatePrices") {
        this.priceData = event.data.prices;
        this.renderPrices();
      } else if (event.data.type === "showNotification") {
        this.showNotification(
          event.data.message,
          event.data.notificationType || "info",
        );
      } else if (event.data.type === "showSellPrompt") {
        const prompt = document.getElementById("sellPrompt");
        if (event.data.show) {
          prompt.style.display = "block";
          setTimeout(() => {
            prompt.classList.remove("hide");
            prompt.classList.add("show");
          }, 10);
        } else {
          prompt.classList.remove("show");
          prompt.classList.add("hide");
          setTimeout(() => {
            prompt.style.display = "none";
          }, 300);
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closeMarket();
      }
    });

    document.getElementById("sellAllBtn").addEventListener("click", () => {
      this.sellAllItems();
    });
  }

  createNotificationContainer() {
    const container = document.createElement("div");
    container.id = "notification-container";
    container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
    document.body.appendChild(container);
  }

  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
            background: rgba(30, 30, 30, 0.51);
            border-radius: 0;
            padding: 0.5em 0.5em;
            margin-bottom: 0.5em;
            color: #FFFFFF;
            font-family: 'Athiti';
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
            opacity: 0;
            transform: translateY(100%);
            transition: all 0.3s ease;
            pointer-events: auto;
        `;

    document.getElementById("notification-container").appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 100);

    this.notifications.push(notification);

    if (this.notifications.length > 3) {
      const oldNotification = this.notifications.shift();
      oldNotification.style.opacity = "0";
      oldNotification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (oldNotification.parentNode) {
          oldNotification.parentNode.removeChild(oldNotification);
        }
      }, 300);
    }

    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
          this.notifications.splice(index, 1);
        }
      }, 300);
    }, 3000);
  }

  closeMarket() {
    fetch(`https://${GetParentResourceName()}/closeMarket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    // Hide UI immediately; server will also instruct UI to close
    document.getElementById("marketContainer").style.display = "none";
    document.getElementById("marketBackground").style.display = "none";
  }

  renderInventory() {
    const grid = document.querySelector(".inventory-grid");
    grid.innerHTML = "";

    Object.keys(this.inventoryData).forEach((itemType) => {
      const itemData = this.inventoryData[itemType];
      const itemElement = document.createElement("div");
      itemElement.className = "inventory-item";
      itemElement.setAttribute("data-item", itemType);

      if (itemData.quantity === 0) {
        itemElement.classList.add("disabled");
      }

      const iconClass = this.getIconClass(itemType);
      itemElement.innerHTML = `
                <div class="item-icon ${iconClass}" style="background-image: url('nui://vorp_inventory/html/img/items/${itemType}.png')"></div>
                <div class="item-quantity">${itemData.quantity}</div>
                <div class="item-name">${itemData.name}</div>
            `;

      grid.appendChild(itemElement);
    });
  }

  renderPrices() {
    const priceList = document.querySelector(".price-list");
    priceList.innerHTML = "";

    Object.keys(this.priceData).forEach((itemType) => {
      const priceData = this.priceData[itemType];
      const priceElement = document.createElement("div");
      priceElement.className = "price-item";

      const iconClass = this.getIconClass(itemType);
      const trendIcon = this.getTrendIcon(priceData.trend);

      priceElement.innerHTML = `
                <div class="price-icon ${iconClass}" style="background-image: url('nui://vorp_inventory/html/img/items/${itemType}.png')"></div>
                <div class="price-name">${priceData.name}</div>
                <div class="price-value">$${priceData.current}</div>
                <div class="price-trend ${priceData.trend}">${trendIcon}</div>
            `;

      priceList.appendChild(priceElement);
    });
  }

  setupClickHandlers() {
    document.querySelectorAll(".inventory-item").forEach((item) => {
      item.addEventListener("click", () => {
        this.toggleItemSelection(item);
      });
    });
  }

  toggleItemSelection(itemElement) {
    const itemType = itemElement.getAttribute("data-item");
    const itemData = this.inventoryData[itemType];

    if (itemData.quantity === 0 || itemElement.classList.contains("disabled"))
      return;

    if (this.selectedItems.has(itemType)) {
      this.selectedItems.delete(itemType);
      itemElement.classList.remove("selected");
    } else {
      this.selectedItems.add(itemType);
      itemElement.classList.add("selected");
    }

    this.updateSellButton();
  }

  updateSellButton() {
    const sellBtn = document.getElementById("sellAllBtn");
    const selectedCount = this.selectedItems.size;

    if (selectedCount > 0) {
      sellBtn.style.opacity = "1";
      sellBtn.style.pointerEvents = "auto";
      sellBtn.style.background = "linear-gradient(180deg, rgba(255, 199, 0, 0.3) 0%, rgba(255, 153, 0, 0.2) 100%)";
      sellBtn.style.border = "1px solid rgba(255, 199, 0, 0.5)";
      sellBtn.querySelector("span").textContent =
        `ขายทั้งหมด (${selectedCount})`;
    } else {
      sellBtn.style.opacity = "1";
      sellBtn.style.pointerEvents = "auto";
      sellBtn.style.background = "linear-gradient(180deg, rgba(255, 199, 0, 0.2) 0%, rgba(255, 153, 0, 0.1) 100%)";
      sellBtn.style.border = "1px solid rgba(255, 199, 0, 0.3)";
      sellBtn.querySelector("span").textContent = "เลือกทั้งหมด";
    }
    
    fetch(`https://${GetParentResourceName()}/paysfx`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
      
        }),
      });  }

  sellAllItems() {
    if (this.selectedItems.size === 0) {
      this.selectAllItems();
      return;
    }

    this.showSellConfirmationModal();
  }

  selectAllItems() {
    Object.keys(this.inventoryData).forEach((itemType) => {
      const itemData = this.inventoryData[itemType];
      if (itemData && itemData.quantity > 0) {
        this.selectedItems.add(itemType);
        const itemElement = document.querySelector(`[data-item="${itemType}"]`);
        if (itemElement && !itemElement.classList.contains("disabled")) {
          itemElement.classList.add("selected");
        }
      }
    });

    this.updateSellButton();
  }

  showSellConfirmationModal() {
    const modal = document.createElement("div");
    modal.className = "sell-confirmation-modal";
    modal.innerHTML = `
            <div class="modal-content">
                <h2>ยืนยันการขาย</h2>
                <div class="confirmation-items">
                    ${this.getSelectedItemsList()}
                </div>
                <div class="total-value">
                    <strong>รวม: $<span id="totalValue">${this.calculateTotalValue()}</span></strong>
                </div>
                <div class="modal-buttons">
                    <button class="confirm-btn donate-btn">ยืนยันขาย</button>
                    <button class="cancel-btn donate-btn">ยกเลิก</button>
                </div>
            </div>
        `;

    const style = document.createElement("style");
    style.textContent = `
            .sell-confirmation-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background: rgba(30, 30, 30, 0.95);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 0;
                padding: 2em;
                max-width: 600px;
                width: 90%;
            }
            .modal-content h3 {
                font-family: 'Athiti';
                font-size: 24px;
                color: #FFFF00;
                text-align: center;
                margin-bottom: 1em;
            }
            .confirmation-items {
                margin-bottom: 1em;
                max-height: 300px;
                overflow-y: auto;
            }
            .confirmation-items::-webkit-scrollbar {
                width: 6px;
            }
            .confirmation-items::-webkit-scrollbar-track {
                background: rgba(40, 40, 40, 0.5);
            }
            .confirmation-items::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 0;
            }
            .confirmation-items::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
            .confirmation-item {
                display: flex;
                align-items: center;
                padding: 0.8em 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                font-family: 'Athiti';
                color: #FFFFFF;
            }
            .confirmation-item-info {
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .confirmation-item-name {
                font-weight: 500;
            }
            .confirmation-item-value {
                color: #FFFF00;
                margin-right: 1em;
            }
            .confirmation-item-controls {
                display: flex;
                align-items: center;
                gap: 0.5em;
            }
            .quantity-input {
                width: 60px;
                height: 35px;
                background: rgba(40, 40, 40, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: #FFFFFF;
                font-family: 'Athiti';
                font-size: 14px;
                text-align: center;
                border-radius: 0;
            }
            .max-btn {
                width: 50px;
                height: 35px;
                background: linear-gradient(180deg, rgba(255, 199, 0, 0.2) 0%, rgba(255, 153, 0, 0.1) 100%);
                border: 1px solid rgba(255, 199, 0, 0.3);
                border-radius: 0px;
                color: #FFFFFF;
                font-family: 'Athiti';
                font-style: normal;
                font-weight: 400;
                font-size: 12px;
                line-height: 24px;
                cursor: pointer;
                transition: 0.2s;
            }
            .max-btn:hover {
                background: linear-gradient(180deg, rgba(255, 199, 0, 0.3) 0%, rgba(255, 153, 0, 0.2) 100%);
                border: 1px solid rgba(255, 199, 0, 0.5);
            }
            .total-value {
                text-align: center;
                font-family: 'Athiti';
                font-size: 18px;
                color: #FFFF00;
                margin-bottom: 1em;
                padding: 1em;
                background: rgba(40, 40, 40, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .modal-buttons {
                display: flex;
                gap: 1em;
                justify-content: center;
            }
            .donate-btn {
                width: 100%;
                height: 45px;
                background: linear-gradient(180deg, rgba(255, 199, 0, 0.2) 0%, rgba(255, 153, 0, 0.1) 100%);
                border: 1px solid rgba(255, 199, 0, 0.3);
                border-radius: 0px;
                color: #FFFFFF;
                font-family: 'Athiti';
                font-style: normal;
                font-weight: 400;
                font-size: 16px;
                line-height: 24px;
                cursor: pointer;
                transition: 0.2s;
            }
            .donate-btn:hover {
                background: linear-gradient(180deg, rgba(255, 199, 0, 0.3) 0%, rgba(255, 153, 0, 0.2) 100%);
                border: 1px solid rgba(255, 199, 0, 0.5);
            }
        `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Setup quantity change handlers
    this.setupQuantityHandlers(modal);

    modal.querySelector(".confirm-btn").addEventListener("click", () => {
      this.executeSell();
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });

    modal.querySelector(".cancel-btn").addEventListener("click", () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });
  }

  getSelectedItemsList() {
    let html = "";
    this.selectedItems.forEach((itemType) => {
      const itemData = this.inventoryData[itemType];
      if (itemData && itemData.quantity > 0) {
        const sellQuantity = Math.min(itemData.quantity, 1);
        const itemValue = sellQuantity * this.priceData[itemType].current;
        html += `
                    <div class="confirmation-item" data-item="${itemType}" data-price="${this.priceData[itemType].current}" data-max="${itemData.quantity}">
                        <div class="confirmation-item-info">
                            <span class="confirmation-item-name">${itemData.name}</span>
                            <span class="confirmation-item-value">$<span class="item-value">${itemValue}</span></span>
                        </div>
                        <div class="confirmation-item-controls">
                            <input type="number" class="quantity-input" value="${sellQuantity}" min="0" max="${itemData.quantity}" data-item="${itemType}">
                            <button class="max-btn" data-item="${itemType}" data-max="${itemData.quantity}">MAX</button>
                        </div>
                    </div>
                `;
      }
    });
    return html;
  }

  setupQuantityHandlers(modal) {
    const quantityInputs = modal.querySelectorAll(".quantity-input");
    const maxButtons = modal.querySelectorAll(".max-btn");

    quantityInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        const itemType = e.target.dataset.item;
        const maxQuantity = parseInt(e.target.max);
        let value = parseInt(e.target.value) || 0;

        if (value > maxQuantity) {
          value = maxQuantity;
          e.target.value = value;
        }
        if (value < 0) {
          value = 0;
          e.target.value = value;
        }

        this.updateItemValue(itemType, value);
        this.updateTotalValue();
      });
    });

    maxButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const itemType = e.target.dataset.item;
        const maxQuantity = parseInt(e.target.dataset.max);
        const input = modal.querySelector(
          `.quantity-input[data-item="${itemType}"]`,
        );

        input.value = maxQuantity;
        this.updateItemValue(itemType, maxQuantity);
        this.updateTotalValue();
      });
    });
  }

  updateItemValue(itemType, quantity) {
    const itemElement = document.querySelector(
      `.confirmation-item[data-item="${itemType}"]`,
    );
    if (itemElement) {
      const price = parseInt(itemElement.dataset.price);
      const value = quantity * price;
      const valueSpan = itemElement.querySelector(".item-value");
      if (valueSpan) {
        valueSpan.textContent = value;
      }
    }
  }

  updateTotalValue() {
    const items = document.querySelectorAll(".confirmation-item");
    let total = 0;

    items.forEach((item) => {
      const input = item.querySelector(".quantity-input");
      const price = parseInt(item.dataset.price);
      const quantity = parseInt(input.value) || 0;
      total += quantity * price;
    });

    const totalSpan = document.getElementById("totalValue");
    if (totalSpan) {
      totalSpan.textContent = total;
    }
  }

  calculateTotalValue() {
    let totalValue = 0;
    this.selectedItems.forEach((itemType) => {
      const itemData = this.inventoryData[itemType];
      if (itemData && itemData.quantity > 0) {
        const sellQuantity = Math.min(itemData.quantity, 1);
        const itemValue = sellQuantity * this.priceData[itemType].current;
        totalValue += itemValue;
      }
    });
    return totalValue;
  }

  executeSell() {
    let itemsToSell = {};
    const items = document.querySelectorAll(".confirmation-item");

    if (items.length > 0) {
      items.forEach((item) => {
        const itemType = item.dataset.item;
        const input = item.querySelector(".quantity-input");
        const sellQuantity = parseInt(input.value) || 0;

        if (sellQuantity > 0) {
          itemsToSell[itemType] = sellQuantity;
        }
      });
    } else {
      this.selectedItems.forEach((itemType) => {
        const itemData = this.inventoryData[itemType];
        if (itemData && itemData.quantity > 0) {
          const sellQuantity = Math.min(itemData.quantity, 1);
          itemsToSell[itemType] = sellQuantity;
        }
      });
    }

    if (Object.keys(itemsToSell).length > 0) {
      this.sendSellData(itemsToSell);
      this.selectedItems.clear();
      this.updateUI();
      this.updateSellButton();
    }
  }

  sendSellData(soldItems) {
    fetch(`https://${GetParentResourceName()}/sellItems`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: soldItems,
      }),
    });
  }

  getSellItemsData() {
    const sellData = {};
    const items = document.querySelectorAll(".confirmation-item");

    if (items.length > 0) {
      items.forEach((item) => {
        const itemType = item.dataset.item;
        const input = item.querySelector(".quantity-input");
        const quantity = parseInt(input.value) || 0;
        if (quantity > 0) {
          sellData[itemType] = quantity;
        }
      });
    } else {
      this.selectedItems.forEach((itemType) => {
        const itemData = this.inventoryData[itemType];
        if (itemData && itemData.quantity > 0) {
          sellData[itemType] = Math.min(itemData.quantity, 1);
        }
      });
    }
    return sellData;
  }

  showSellSuccess(soldItems, totalValue) {
    const modal = document.createElement("div");
    modal.className = "sell-success-modal";
    modal.innerHTML = `
            <div class="modal-content">
                <h3>ขายสำเร็จ!</h3>
                <div class="sold-items">
                    ${soldItems
                      .map(
                        (item) => `
                        <div class="sold-item">
                            <span>${item.name} x${item.quantity}</span>
                            <span>$${item.total}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                <div class="total-value">
                    <strong>รวม: $${totalValue}</strong>
                </div>
                <button class="close-modal">ปิด</button>
            </div>
        `;

    const style = document.createElement("style");
    style.textContent = `
            .sell-success-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background: rgba(30, 30, 30, 0.95);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 0;
                padding: 2em;
                max-width: 400px;
                width: 90%;
            }
            .modal-content h3 {
                font-family: 'Athiti';
                font-size: 24px;
                color: #FFFF00;
                text-align: center;
                margin-bottom: 1em;
            }
            .sold-items {
                margin-bottom: 1em;
                max-height: 200px;
                overflow-y: auto;
            }
            .sold-items::-webkit-scrollbar {
                width: 6px;
            }
            .sold-items::-webkit-scrollbar-track {
                background: rgba(40, 40, 40, 0.5);
            }
            .sold-items::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 0;
            }
            .sold-items::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
            .sold-item {
                display: flex;
                justify-content: space-between;
                padding: 0.5em 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                font-family: 'Athiti';
                color: #FFFFFF;
            }
            .total-value {
                text-align: center;
                font-family: 'Athiti';
                font-size: 18px;
                color: #FFFF00;
                margin-bottom: 1em;
                padding: 1em;
                background: rgba(40, 40, 40, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .close-modal {
                width: 100%;
                padding: 0.8em;
                background: #00AA00;
                border: 2px solid rgba(0, 200, 0, 0.8);
                border-radius: 0;
                color: white;
                font-family: 'Athiti';
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .close-modal:hover {
                background: #00CC00;
            }
        `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    modal.querySelector(".close-modal").addEventListener("click", () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });

    setTimeout(() => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
        document.head.removeChild(style);
      }
    }, 3000);
  }

  updateUI() {
    Object.keys(this.inventoryData).forEach((itemType) => {
      const itemElement = document.querySelector(`[data-item="${itemType}"]`);
      if (itemElement) {
        const quantityElement = itemElement.querySelector(".item-quantity");
        if (quantityElement) {
          quantityElement.textContent = this.inventoryData[itemType].quantity;
        }
      }
    });
  }

  getIconClass(itemType) {
    return "item-icon-image";
  }

  getTrendIcon(trend) {
    const icons = {
      up: "↑",
      down: "↓",
      stable: "●",
    };
    return icons[trend] || "→";
  }

}

const market = new EconomyMarket();
