// ============================================
// PERSONAL BUDGET TRACKER - MAIN APPLICATION
// Author: Ivan Akena
// Course: CSE 310 - Applied Programming
// Module: Mobile App, Web Apps, JavaScript
// Currency: UGX (Ugandan Shillings)
// ============================================

// ======================
// GLOBAL VARIABLES
// ======================
let transactions = [];
let spendingChart = null;
let currentFilterMonth = "";

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Function: getTodayDate
 * Purpose: Returns today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Function: formatDate
 * Purpose: Formats date for display (e.g., "June 6, 2026")
 */
function formatDate(dateString) {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Function: getCurrentMonth
 * Purpose: Returns current month in YYYY-MM format
 */
function getCurrentMonth() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Function: formatCurrency
 * Purpose: Formats a number as UGX currency
 */
function formatCurrency(amount) {
    return `UGX ${Math.round(amount).toLocaleString()}`;
}

/**
 * Function: saveToLocalStorage
 * Purpose: Saves transactions array to localStorage
 */
function saveToLocalStorage() {
    localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
}

/**
 * Function: loadFromLocalStorage
 * Purpose: Loads transactions from localStorage
 */
function loadFromLocalStorage() {
    const stored = localStorage.getItem('budgetTransactions');
    if (stored) {
        transactions = JSON.parse(stored);
    } else {
        // Sample data for demo (in UGX)
        transactions = [
            { id: 1, description: "Salary", amount: 2500000, type: "income", date: "2026-06-01", category: "Income" },
            { id: 2, description: "Groceries", amount: 350000, type: "expense", date: "2026-06-03", category: "Food" },
            { id: 3, description: "Rent", amount: 800000, type: "expense", date: "2026-06-01", category: "Housing" },
            { id: 4, description: "Freelance", amount: 500000, type: "income", date: "2026-06-05", category: "Income" },
            { id: 5, description: "Dining Out", amount: 75000, type: "expense", date: "2026-06-04", category: "Food" }
        ];
        saveToLocalStorage();
    }
}

/**
 * Function: addTransaction
 * Purpose: Adds a new transaction
 */
function addTransaction(description, amount, type, date) {
    if (!description || description.trim() === "") {
        showNotification("Please enter a description!", "error");
        return false;
    }
    
    if (!amount || amount <= 0) {
        showNotification("Please enter a valid amount!", "error");
        return false;
    }
    
    if (!date) {
        date = getTodayDate();
    }
    
    // Determine category based on description keywords
    let category = "Other";
    const descLower = description.toLowerCase();
    if (type === "income") {
        category = "Income";
    } else {
        if (descLower.includes("grocer") || descLower.includes("food") || descLower.includes("restaurant")) category = "Food";
        else if (descLower.includes("rent") || descLower.includes("mortgage")) category = "Housing";
        else if (descLower.includes("electric") || descLower.includes("water") || descLower.includes("utility")) category = "Utilities";
        else if (descLower.includes("transport") || descLower.includes("gas") || descLower.includes("bus") || descLower.includes("boda")) category = "Transport";
        else if (descLower.includes("entertain") || descLower.includes("movie") || descLower.includes("netflix")) category = "Entertainment";
    }
    
    const newTransaction = {
        id: Date.now(),
        description: description.trim(),
        amount: parseFloat(amount),
        type: type,
        date: date,
        category: category
    };
    
    transactions.push(newTransaction);
    saveToLocalStorage();
    renderTransactions();
    updateBalanceSummary();
    updateChart();
    showNotification(`${type === "income" ? "Income" : "Expense"} added!`, "success");
    return true;
}

/**
 * Function: deleteTransaction
 * Purpose: Deletes a transaction by ID
 */
function deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
        transactions = transactions.filter(t => t.id !== id);
        saveToLocalStorage();
        renderTransactions();
        updateBalanceSummary();
        updateChart();
        showNotification("Transaction deleted!", "success");
    }
}

/**
 * Function: updateBalanceSummary
 * Purpose: Calculates and updates balance, total income, total expenses
 */
function updateBalanceSummary() {
    let filtered = transactions;
    if (currentFilterMonth) {
        filtered = transactions.filter(t => t.date.substring(0, 7) === currentFilterMonth);
    }
    
    const totalIncome = filtered.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filtered.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    document.getElementById("currentBalance").textContent = formatCurrency(balance);
    document.getElementById("totalIncome").textContent = formatCurrency(totalIncome);
    document.getElementById("totalExpenses").textContent = formatCurrency(totalExpenses);
    
    // Change color based on balance
    const balanceElement = document.getElementById("currentBalance");
    if (balance < 0) {
        balanceElement.style.color = "#dc3545";
    } else {
        balanceElement.style.color = "#2c3e50";
    }
}

/**
 * Function: renderTransactions
 * Purpose: Displays all transactions in the DOM
 */
function renderTransactions() {
    const container = document.getElementById("transactionsList");
    if (!container) return;
    
    let filtered = transactions;
    if (currentFilterMonth) {
        filtered = transactions.filter(t => t.date.substring(0, 7) === currentFilterMonth);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">✨ No transactions. Add your first transaction above! ✨</div>';
        return;
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = filtered.map(transaction => `
        <div class="transaction-item" data-id="${transaction.id}">
            <div class="transaction-info">
                <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                <div class="transaction-date">${formatDate(transaction.date)}</div>
                <div class="transaction-category" style="font-size:0.8em; color:#888;">${transaction.category}</div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === "income" ? "+" : "-"} ${formatCurrency(transaction.amount)}
            </div>
            <button class="delete-transaction" data-id="${transaction.id}">Delete</button>
        </div>
    `).join("");
    
    // Add delete event listeners
    document.querySelectorAll(".delete-transaction").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteTransaction(id);
        });
    });
}

/**
 * Function: escapeHtml
 * Purpose: Prevents XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Function: updateChart
 * Purpose: Updates spending chart by category (pie chart)
 */
function updateChart() {
    const ctx = document.getElementById("spendingChart").getContext("2d");
    
    let filtered = transactions;
    if (currentFilterMonth) {
        filtered = transactions.filter(t => t.date.substring(0, 7) === currentFilterMonth);
    }
    
    // Aggregate spending by category (expenses only)
    const expensesByCategory = {};
    filtered.filter(t => t.type === "expense").forEach(t => {
        const cat = t.category;
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
    });
    
    const categories = Object.keys(expensesByCategory);
    const amounts = categories.map(cat => expensesByCategory[cat]);
    
    if (spendingChart) {
        spendingChart.destroy();
    }
    
    if (categories.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = "16px Arial";
        ctx.fillStyle = "#999";
        ctx.fillText("No expense data to display", 50, 100);
        return;
    }
    
    spendingChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    "#3498db", "#e74c3c", "#2ecc71", "#f39c12", 
                    "#9b59b6", "#1abc9c", "#e67e22", "#34495e"
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "right",
                    labels: { font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || "";
                            const value = context.raw || 0;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Function: showNotification
 * Purpose: Displays temporary notification
 */
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#3498db"};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation if not already present
    if (!document.querySelector("#notificationStyle")) {
        const style = document.createElement("style");
        style.id = "notificationStyle";
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = "opacity 0.3s";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Function: resetAllData
 * Purpose: Clears all transactions
 */
function resetAllData() {
    if (confirm("⚠️ WARNING: This will delete ALL transactions. This cannot be undone. Are you sure?")) {
        transactions = [];
        saveToLocalStorage();
        renderTransactions();
        updateBalanceSummary();
        updateChart();
        showNotification("All data has been reset!", "success");
    }
}

/**
 * Function: exportToCSV
 * Purpose: Exports transactions to CSV file
 */
function exportToCSV() {
    if (transactions.length === 0) {
        showNotification("No data to export!", "error");
        return;
    }
    
    let filtered = transactions;
    if (currentFilterMonth) {
        filtered = transactions.filter(t => t.date.substring(0, 7) === currentFilterMonth);
    }
    
    const headers = ["ID", "Description", "Amount (UGX)", "Type", "Date", "Category"];
    const rows = filtered.map(t => [t.id, t.description, t.amount, t.type, t.date, t.category]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget_export_${getTodayDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Export complete!", "success");
}

/**
 * Function: displayCurrentDate
 * Purpose: Shows today's date in the header
 */
function displayCurrentDate() {
    const dateElement = document.getElementById("dateDisplay");
    if (dateElement) {
        dateElement.textContent = formatDate(getTodayDate());
    }
}

/**
 * Function: init
 * Purpose: Initializes the application on page load
 */
function init() {
    displayCurrentDate();
    loadFromLocalStorage();
    renderTransactions();
    updateBalanceSummary();
    updateChart();
    
    // Set up month filter defaults
    const monthFilterInput = document.getElementById("filterMonth");
    const monthInputField = document.getElementById("monthInput");
    const currentMonth = getCurrentMonth();
    if (monthFilterInput) monthFilterInput.value = currentMonth;
    if (monthInputField) monthInputField.value = currentMonth;
    
    // Add transaction button
    document.getElementById("addTransactionBtn").addEventListener("click", () => {
        const description = document.getElementById("descriptionInput").value;
        const amount = document.getElementById("amountInput").value;
        const type = document.getElementById("typeSelect").value;
        const month = document.getElementById("monthInput").value;
        // Use the 1st day of selected month as the transaction date
        const date = month ? `${month}-01` : getTodayDate();
        addTransaction(description, amount, type, date);
        
        // Clear inputs
        document.getElementById("descriptionInput").value = "";
        document.getElementById("amountInput").value = "";
    });
    
    // Filter by month
    document.getElementById("filterMonth").addEventListener("change", (e) => {
        currentFilterMonth = e.target.value;
        renderTransactions();
        updateBalanceSummary();
        updateChart();
    });
    
    // Clear filter
    document.getElementById("clearFilterBtn").addEventListener("click", () => {
        currentFilterMonth = "";
        document.getElementById("filterMonth").value = getCurrentMonth();
        renderTransactions();
        updateBalanceSummary();
        updateChart();
        showNotification("Filter cleared", "info");
    });
    
    // Reset all data
    document.getElementById("resetAllBtn").addEventListener("click", resetAllData);
    
    // Export to CSV
    document.getElementById("exportBtn").addEventListener("click", exportToCSV);
    
    // Allow Enter key to add transaction
    const inputs = ["descriptionInput", "amountInput"];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                document.getElementById("addTransactionBtn").click();
            }
        });
    });
    
    console.log("Personal Budget Tracker initialized successfully!");
}

// Start the application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", init);