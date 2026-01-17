/**
 * SPENDUIT PREMIUM v1.0
 * Premium Features:
 * - Financial Goals Tracker with progress visualization
 * - Multi Wallet System (Cash, Bank, E-Wallet)
 * - Auto Monthly Report (Google Docs export)
 */

// --- 1. SETUP & INITIALIZATION ---

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // A. Setup Transaction Sheet (with WalletID column)
  let transSheet = ss.getSheetByName("Transactions");
  if (!transSheet) {
    transSheet = ss.insertSheet("Transactions");
    transSheet.appendRow([
      "ID",
      "Date",
      "Type",
      "Category",
      "Amount",
      "Note",
      "Timestamp",
      "WalletID",
    ]);
    transSheet.setFrozenRows(1);
    transSheet.getRange("A1:H1").setFontWeight("Bold").setBackground("#E0E0E0");
  } else {
    // Add WalletID column if not exists
    const headers = transSheet.getRange(1, 1, 1, 10).getValues()[0];
    if (!headers.includes("WalletID")) {
      const lastCol = headers.filter((h) => h !== "").length + 1;
      transSheet.getRange(1, lastCol).setValue("WalletID");
    }
  }

  // B. Setup Budget Sheet
  let budgetSheet = ss.getSheetByName("Budget");
  if (!budgetSheet) {
    budgetSheet = ss.insertSheet("Budget");
    budgetSheet.appendRow(["Category", "Monthly Limit"]);
    const defaultBudgets = [
      ["Makanan & Minuman", 2000000],
      ["Transportasi", 1000000],
      ["Belanja", 1500000],
      ["Tagihan & Utilitas", 1000000],
      ["Hiburan", 500000],
      ["Kesehatan", 500000],
      ["Lainnya", 500000],
    ];
    budgetSheet
      .getRange(2, 1, defaultBudgets.length, 2)
      .setValues(defaultBudgets);
    budgetSheet.setFrozenRows(1);
    budgetSheet
      .getRange("A1:B1")
      .setFontWeight("Bold")
      .setBackground("#FFF2CC");
  }

  // C. Setup Goals Sheet
  let goalsSheet = ss.getSheetByName("Goals");
  if (!goalsSheet) {
    goalsSheet = ss.insertSheet("Goals");
    goalsSheet.appendRow([
      "ID",
      "Name",
      "TargetAmount",
      "CurrentAmount",
      "Deadline",
      "Icon",
      "Color",
      "CreatedAt",
    ]);
    goalsSheet.setFrozenRows(1);
    goalsSheet.getRange("A1:H1").setFontWeight("Bold").setBackground("#D5F5E3");
  }

  // D. Setup Wallets Sheet
  let walletsSheet = ss.getSheetByName("Wallets");
  if (!walletsSheet) {
    walletsSheet = ss.insertSheet("Wallets");
    walletsSheet.appendRow([
      "ID",
      "Name",
      "Type",
      "InitialBalance",
      "Icon",
      "Color",
    ]);
    // Default wallets
    const defaultWallets = [
      ["WALLET-CASH", "Cash", "cash", 0, "💵", "#10B981"],
      ["WALLET-BANK", "Rekening Bank", "bank", 0, "🏦", "#3B82F6"],
      ["WALLET-EWALLET", "E-Wallet", "ewallet", 0, "📱", "#8B5CF6"],
    ];
    walletsSheet
      .getRange(2, 1, defaultWallets.length, 6)
      .setValues(defaultWallets);
    walletsSheet.setFrozenRows(1);
    walletsSheet
      .getRange("A1:F1")
      .setFontWeight("Bold")
      .setBackground("#E8DAEF");
  }

  // E. Setup Reports Sheet (to track generated reports)
  let reportsSheet = ss.getSheetByName("Reports");
  if (!reportsSheet) {
    reportsSheet = ss.insertSheet("Reports");
    reportsSheet.appendRow(["ID", "Month", "Year", "DocURL", "CreatedAt"]);
    reportsSheet.setFrozenRows(1);
    reportsSheet
      .getRange("A1:E1")
      .setFontWeight("Bold")
      .setBackground("#FCF3CF");
  }

  // F. Setup GoalTransactions Sheet (track topups and withdrawals)
  let goalTxSheet = ss.getSheetByName("GoalTransactions");
  if (!goalTxSheet) {
    goalTxSheet = ss.insertSheet("GoalTransactions");
    goalTxSheet.appendRow([
      "ID",
      "GoalID",
      "Type",
      "Amount",
      "Note",
      "CreatedAt",
    ]);
    goalTxSheet.setFrozenRows(1);
    goalTxSheet
      .getRange("A1:F1")
      .setFontWeight("Bold")
      .setBackground("#FADBD8");
  }
}

function doGet() {
  setupDatabase();
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("SPENDUIT Premium v1.0")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- 2. CORE ANALYTICS ENGINE ---

function getDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let transSheet = ss.getSheetByName("Transactions");

    if (!transSheet)
      return { error: true, message: "Tab 'Transactions' HILANG!" };

    // Ambil semua data
    const transData = transSheet.getDataRange().getValues();
    const transRows = transData.slice(1);

    let budgetMap = {};
    const budgetSheet = ss.getSheetByName("Budget");
    if (budgetSheet && budgetSheet.getLastRow() > 1) {
      budgetSheet
        .getDataRange()
        .getValues()
        .slice(1)
        .forEach((r) => {
          if (r[0]) budgetMap[r[0]] = Number(r[1]);
        });
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let categoryBreakdown = {};
    let allTransactions = [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Loop Data
    for (let i = transRows.length - 1; i >= 0; i--) {
      const row = transRows[i];

      // SKIP jika baris kosong
      if (!row[1] && !row[4]) continue;

      // Handle ID
      let id = row[0];
      if (!id || id === "") id = "AUTO-" + (i + 2);

      // Handle Date
      let date = parseDateRobust(row[1]);

      const type = row[2] || "Expense";
      const category = row[3] || "Lainnya";

      // Handle Amount
      let rawAmount = row[4];
      let amount = 0;
      if (typeof rawAmount === "number") {
        amount = rawAmount;
      } else if (typeof rawAmount === "string") {
        let clean = rawAmount
          .replace(/[^0-9,-]/g, "")
          .replace(/\./g, "")
          .replace(",", ".");
        amount = parseFloat(clean) || 0;
      }

      const note = row[5] || "";
      const walletId = row[7] || "WALLET-CASH";

      // Ensure rawDate is valid ISO String for frontend compatibility
      const isoDateString =
        date instanceof Date && !isNaN(date)
          ? date.toISOString()
          : new Date().toISOString();

      const transItem = {
        id: id.toString(), // Paksa jadi string
        date: formatDate(date), // String "25 Jan"
        rawDate: isoDateString, // String ISO "2023-01-25T..." (AMAN)
        type: type.toString(),
        category: category.toString(),
        amount: amount,
        fmtAmount: safeFormatRupiah(amount),
        note: note.toString(),
        rawType: type.toString(),
        walletId: walletId.toString(),
      };

      allTransactions.push(transItem);

      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      ) {
        if (type === "Income") {
          totalIncome += amount;
        } else if (type === "Expense") {
          totalExpense += amount;
          if (categoryBreakdown[category])
            categoryBreakdown[category] += amount;
          else categoryBreakdown[category] = amount;
        }
      }
    }

    // Budget Logic
    let budgetStatus = [];
    for (const [catName, limit] of Object.entries(budgetMap)) {
      const spent = categoryBreakdown[catName] || 0;
      const remaining = limit - spent;
      const percentage =
        limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
      let statusColor =
        percentage >= 100
          ? "bg-red-500"
          : percentage >= 80
            ? "bg-yellow-500"
            : "bg-emerald-500";

      budgetStatus.push({
        category: catName,
        limit: limit,
        spent: spent,
        remaining: remaining,
        percentage: percentage,
        fmtLimit: safeFormatRupiah(limit),
        fmtSpent: safeFormatRupiah(spent),
        fmtRemaining: safeFormatRupiah(remaining),
        statusColor: statusColor,
      });
    }
    budgetStatus.sort((a, b) => b.percentage - a.percentage);

    const balance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0
        ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
        : 0;

    return {
      totalIncome: safeFormatRupiah(totalIncome),
      totalExpense: safeFormatRupiah(totalExpense),
      balance: safeFormatRupiah(balance),
      savingsRate: savingsRate,
      recentTransactions: allTransactions.slice(0, 5),
      allTransactions: allTransactions,
      budgetOverview: budgetStatus,
      chartLabels: Object.keys(categoryBreakdown),
      chartValues: Object.values(categoryBreakdown),
    };
  } catch (error) {
    return {
      error: true,
      message: "Backend Error: " + error.toString(),
      recentTransactions: [],
      allTransactions: [],
    };
  }
}

// --- HELPERS ---
function parseDateRobust(input) {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  if (typeof input === "string") {
    const parts = input.split("/");
    if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

function safeFormatRupiah(angka) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  } catch (e) {
    return "Rp " + (angka || 0);
  }
}

// --- STANDARD APIs ---
function saveTransaction(formObject) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");
  const id = "TRX-" + new Date().getTime();
  const walletId = formObject.walletId || "WALLET-CASH";
  sheet.appendRow([
    id,
    formObject.date,
    formObject.type,
    formObject.category,
    formObject.amount,
    formObject.note,
    new Date(),
    walletId,
  ]);
  return { success: true, id: id };
}

function updateTransaction(formObject) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == formObject.editId) {
      sheet.getRange(i + 1, 2).setValue(formObject.editDate);
      sheet.getRange(i + 1, 3).setValue(formObject.editType);
      sheet.getRange(i + 1, 4).setValue(formObject.editCategory);
      sheet.getRange(i + 1, 5).setValue(formObject.editAmount);
      sheet.getRange(i + 1, 6).setValue(formObject.editNote);
      return { success: true };
    }
  }
  return { success: false, message: "ID not found" };
}

function deleteTransaction(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function formatDate(date) {
  const options = { day: "numeric", month: "short" };
  return date.toLocaleDateString("id-ID", options);
}

// ============================================
// --- PREMIUM FEATURE 1: GOALS TRACKER ---
// ============================================

function getGoalsData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Goals");
    if (!sheet || sheet.getLastRow() < 2) {
      return { goals: [], totalSaved: 0, totalTarget: 0 };
    }

    const data = sheet.getDataRange().getValues().slice(1);
    const goals = [];
    let totalSaved = 0;
    let totalTarget = 0;

    data.forEach((row) => {
      if (!row[0]) return;
      const target = Number(row[2]) || 0;
      const current = Number(row[3]) || 0;
      const deadline = row[4];
      const percentage =
        target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

      // Calculate days remaining
      let daysRemaining = null;
      let deadlineStr = "";
      if (deadline) {
        const deadlineDate =
          deadline instanceof Date ? deadline : new Date(deadline);
        const today = new Date();
        daysRemaining = Math.ceil(
          (deadlineDate - today) / (1000 * 60 * 60 * 24),
        );
        deadlineStr = deadlineDate.toISOString();
      }

      goals.push({
        id: row[0].toString(),
        name: row[1].toString(),
        targetAmount: target,
        currentAmount: current,
        deadline: deadlineStr,
        icon: row[5] || "🎯",
        color: row[6] || "#10B981",
        percentage: percentage,
        fmtTarget: safeFormatRupiah(target),
        fmtCurrent: safeFormatRupiah(current),
        fmtRemaining: safeFormatRupiah(target - current),
        daysRemaining: daysRemaining,
        isCompleted: percentage >= 100,
      });

      totalSaved += current;
      totalTarget += target;
    });

    return {
      goals: goals,
      totalSaved: safeFormatRupiah(totalSaved),
      totalTarget: safeFormatRupiah(totalTarget),
      overallProgress:
        totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
    };
  } catch (error) {
    return { error: true, message: error.toString(), goals: [] };
  }
}

function saveGoal(formObject) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Goals");
  const id = "GOAL-" + new Date().getTime();
  sheet.appendRow([
    id,
    formObject.name,
    Number(formObject.targetAmount) || 0,
    0, // CurrentAmount starts at 0
    formObject.deadline || "",
    formObject.icon || "🎯",
    formObject.color || "#10B981",
    new Date().toISOString(),
  ]);
  return { success: true, id: id };
}

function updateGoal(formObject) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Goals");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == formObject.id) {
      sheet.getRange(i + 1, 2).setValue(formObject.name);
      sheet.getRange(i + 1, 3).setValue(Number(formObject.targetAmount) || 0);
      sheet.getRange(i + 1, 5).setValue(formObject.deadline || "");
      sheet.getRange(i + 1, 6).setValue(formObject.icon || "🎯");
      sheet.getRange(i + 1, 7).setValue(formObject.color || "#10B981");
      return { success: true };
    }
  }
  return { success: false, message: "Goal not found" };
}

function addToGoal(goalId, amount, note, walletId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Goals");
  const data = sheet.getDataRange().getValues();

  // Find Goal
  let goalRowIndex = -1;
  let currentGoalAmount = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == goalId) {
      goalRowIndex = i + 1;
      currentGoalAmount = Number(data[i][3]) || 0;
      break;
    }
  }

  if (goalRowIndex === -1) return { success: false, message: "Goal not found" };

  const addAmount = Number(amount) || 0;

  // Handle Wallet (Expense from Wallet)
  let walletUpdated = false;
  if (walletId) {
    // We treat this as an "Expense" transaction for the wallet
    // So the wallet balance decreases
    const transSheet = ss.getSheetByName("Transactions");
    const newTxId = "TRX-" + new Date().getTime();
    const date = new Date();
    // ID, Date, Type, Category, Amount, Note, CreatedAt, WalletID
    transSheet.appendRow([
      newTxId,
      date,
      "Expense",
      "Tabungan",
      addAmount,
      "Topup Goal: " + (note || ""),
      date.toISOString(),
      walletId,
    ]);
    walletUpdated = true;
  }

  // Update Goal
  const newAmount = currentGoalAmount + addAmount;
  sheet.getRange(goalRowIndex, 4).setValue(newAmount);

  // Log Goal Transaction
  const txSheet = ss.getSheetByName("GoalTransactions");
  const txId = "GTX-" + new Date().getTime();
  txSheet.appendRow([
    txId,
    goalId,
    "topup",
    addAmount,
    note || "Topup",
    new Date().toISOString(),
  ]);

  return { success: true, newAmount: newAmount, walletUpdated: walletUpdated };
}

function withdrawFromGoal(goalId, amount, note, walletId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Goals");
  const data = sheet.getDataRange().getValues();

  // Find Goal
  let goalRowIndex = -1;
  let currentGoalAmount = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == goalId) {
      goalRowIndex = i + 1;
      currentGoalAmount = Number(data[i][3]) || 0;
      break;
    }
  }

  if (goalRowIndex === -1) return { success: false, message: "Goal not found" };

  const withdrawAmount = Number(amount) || 0;

  if (withdrawAmount > currentGoalAmount) {
    return { success: false, message: "Saldo tidak cukup" };
  }

  // Handle Wallet (Income to Wallet)
  let walletUpdated = false;
  if (walletId) {
    // We treat this as an "Income" transaction for the wallet
    // So the wallet balance increases
    const transSheet = ss.getSheetByName("Transactions");
    const newTxId = "TRX-" + new Date().getTime();
    const date = new Date();
    // ID, Date, Type, Category, Amount, Note, CreatedAt, WalletID
    transSheet.appendRow([
      newTxId,
      date,
      "Income",
      "Pencairan Tabungan",
      withdrawAmount,
      "Withdraw Goal: " + (note || ""),
      date.toISOString(),
      walletId,
    ]);
    walletUpdated = true;
  }

  const newAmount = currentGoalAmount - withdrawAmount;
  sheet.getRange(goalRowIndex, 4).setValue(newAmount);

  // Log Goal Transaction
  const txSheet = ss.getSheetByName("GoalTransactions");
  const txId = "GTX-" + new Date().getTime();
  txSheet.appendRow([
    txId,
    goalId,
    "withdraw",
    withdrawAmount,
    note || "Tarik dana",
    new Date().toISOString(),
  ]);

  return { success: true, newAmount: newAmount, walletUpdated: walletUpdated };
}

function getGoalHistory(goalId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const txSheet = ss.getSheetByName("GoalTransactions");
    if (!txSheet || txSheet.getLastRow() < 2) {
      return { transactions: [] };
    }

    const data = txSheet.getDataRange().getValues().slice(1);
    const transactions = data
      .filter((row) => row[1] === goalId)
      .map((row) => ({
        id: row[0].toString(),
        type: row[2].toString(),
        amount: Number(row[3]) || 0,
        fmtAmount: safeFormatRupiah(Number(row[3]) || 0),
        note: row[4].toString(),
        date: row[5] ? formatDate(new Date(row[5])) : "",
        rawDate: row[5] || "",
      }))
      .reverse(); // Most recent first

    return { transactions: transactions };
  } catch (error) {
    return { error: true, message: error.toString(), transactions: [] };
  }
}

function deleteGoal(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Goals");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      // Also delete related transactions
      const txSheet = ss.getSheetByName("GoalTransactions");
      if (txSheet) {
        const txData = txSheet.getDataRange().getValues();
        for (let j = txData.length - 1; j >= 1; j--) {
          if (txData[j][1] === id) {
            txSheet.deleteRow(j + 1);
          }
        }
      }
      return { success: true };
    }
  }
  return { success: false };
}

// ============================================
// --- PREMIUM FEATURE 2: MULTI WALLET ---
// ============================================

function getWalletsData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const walletsSheet = ss.getSheetByName("Wallets");
    const transSheet = ss.getSheetByName("Transactions");

    if (!walletsSheet || walletsSheet.getLastRow() < 2) {
      return { wallets: [], netWorth: 0 };
    }

    // Get all transactions to calculate balances
    const transactions = transSheet
      ? transSheet.getDataRange().getValues().slice(1)
      : [];
    const walletBalances = {};

    transactions.forEach((row) => {
      const type = row[2];
      const amount = Number(row[4]) || 0;
      const walletId = row[7] || "WALLET-CASH";

      if (!walletBalances[walletId]) walletBalances[walletId] = 0;
      if (type === "Income") {
        walletBalances[walletId] += amount;
      } else if (type === "Expense") {
        walletBalances[walletId] -= amount;
      }
    });

    // Build wallet list
    const walletsData = walletsSheet.getDataRange().getValues().slice(1);
    const wallets = [];
    let netWorth = 0;

    walletsData.forEach((row) => {
      if (!row[0]) return;
      const walletId = row[0].toString();
      const initialBalance = Number(row[3]) || 0;
      const transactionBalance = walletBalances[walletId] || 0;
      const currentBalance = initialBalance + transactionBalance;

      wallets.push({
        id: walletId,
        name: row[1].toString(),
        type: row[2].toString(),
        initialBalance: initialBalance,
        currentBalance: currentBalance,
        icon: row[4] || "💰",
        color: row[5] || "#10B981",
        fmtBalance: safeFormatRupiah(currentBalance),
        fmtInitial: safeFormatRupiah(initialBalance),
      });

      netWorth += currentBalance;
    });

    return {
      wallets: wallets,
      netWorth: safeFormatRupiah(netWorth),
      netWorthRaw: netWorth,
    };
  } catch (error) {
    return { error: true, message: error.toString(), wallets: [] };
  }
}

function saveWallet(formObject) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Wallets");
  const id = "WALLET-" + new Date().getTime();
  sheet.appendRow([
    id,
    formObject.name,
    formObject.type || "other",
    Number(formObject.initialBalance) || 0,
    formObject.icon || "💰",
    formObject.color || "#10B981",
  ]);
  return { success: true, id: id };
}

function updateWallet(formObject) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Wallets");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == formObject.id) {
      sheet.getRange(i + 1, 2).setValue(formObject.name);
      sheet.getRange(i + 1, 3).setValue(formObject.type || "other");
      sheet.getRange(i + 1, 4).setValue(Number(formObject.initialBalance) || 0);
      sheet.getRange(i + 1, 5).setValue(formObject.icon || "💰");
      sheet.getRange(i + 1, 6).setValue(formObject.color || "#10B981");
      return { success: true };
    }
  }
  return { success: false, message: "Wallet not found" };
}

function deleteWallet(id) {
  // Check if wallet has transactions
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transSheet = ss.getSheetByName("Transactions");
  const transactions = transSheet.getDataRange().getValues().slice(1);
  const hasTransactions = transactions.some((row) => row[7] === id);

  if (hasTransactions) {
    return {
      success: false,
      message:
        "Wallet masih memiliki transaksi. Pindahkan atau hapus transaksi terlebih dahulu.",
    };
  }

  const sheet = ss.getSheetByName("Wallets");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function transferBetweenWallets(fromWalletId, toWalletId, amount, note) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");
  const timestamp = new Date();
  const transferNote = note || "Transfer antar wallet";

  // Create expense from source wallet
  sheet.appendRow([
    "TRX-TF-" + timestamp.getTime() + "-OUT",
    timestamp,
    "Expense",
    "Transfer Keluar",
    Number(amount),
    transferNote + " (ke " + toWalletId + ")",
    timestamp,
    fromWalletId,
  ]);

  // Create income to destination wallet
  sheet.appendRow([
    "TRX-TF-" + timestamp.getTime() + "-IN",
    timestamp,
    "Income",
    "Transfer Masuk",
    Number(amount),
    transferNote + " (dari " + fromWalletId + ")",
    timestamp,
    toWalletId,
  ]);

  return { success: true };
}

// ============================================
// --- PREMIUM FEATURE 3: AUTO REPORT ---
// ============================================

function generateMonthlyReport(month, year) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reportData = getReportData(month, year);

    // Create Google Doc for report
    const docTitle = "Laporan Keuangan - " + getMonthName(month) + " " + year;
    const doc = DocumentApp.create(docTitle);
    const body = doc.getBody();

    // Header
    body
      .appendParagraph("📊 LAPORAN KEUANGAN BULANAN")
      .setHeading(DocumentApp.ParagraphHeading.HEADING1)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body
      .appendParagraph(getMonthName(month) + " " + year)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body
      .appendParagraph("Dibuat: " + new Date().toLocaleDateString("id-ID"))
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendHorizontalRule();

    // Summary Section
    body
      .appendParagraph("💰 RINGKASAN KEUANGAN")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const summaryTable = body.appendTable([
      ["Total Pemasukan", reportData.fmtTotalIncome],
      ["Total Pengeluaran", reportData.fmtTotalExpense],
      ["Saldo Akhir", reportData.fmtBalance],
      ["Saving Rate", reportData.savingsRate + "%"],
    ]);
    summaryTable.setBorderWidth(1);

    // Goal Summary Section
    body
      .appendParagraph("🎯 MUTASI TABUNGAN")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const goalTable = body.appendTable([
      ["Total Topup Tabungan", reportData.goalSummary.fmtTotalTopup],
      ["Total Penarikan Tabungan", reportData.goalSummary.fmtTotalWithdraw],
    ]);
    goalTable.setBorderWidth(1);

    // Category Breakdown
    body
      .appendParagraph("📂 PENGELUARAN PER KATEGORI")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    if (reportData.categoryBreakdown.length > 0) {
      const categoryData = [["Kategori", "Jumlah", "Persentase"]];
      reportData.categoryBreakdown.forEach((cat) => {
        categoryData.push([cat.name, cat.fmtAmount, cat.percentage + "%"]);
      });
      const catTable = body.appendTable(categoryData);
      catTable.getRow(0).editAsText().setBold(true);
      catTable.setBorderWidth(1);
    } else {
      body.appendParagraph("Tidak ada pengeluaran bulan ini.");
    }

    // Top Expenses
    body
      .appendParagraph("🔝 TOP 5 PENGELUARAN TERBESAR")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    if (reportData.topExpenses.length > 0) {
      const topData = [["Tanggal", "Kategori", "Catatan", "Jumlah"]];
      reportData.topExpenses.forEach((exp) => {
        topData.push([exp.date, exp.category, exp.note, exp.fmtAmount]);
      });
      const topTable = body.appendTable(topData);
      topTable.getRow(0).editAsText().setBold(true);
      topTable.setBorderWidth(1);
    } else {
      body.appendParagraph("Tidak ada data pengeluaran.");
    }

    // Footer
    body.appendHorizontalRule();
    body
      .appendParagraph("Dibuat otomatis oleh SPENDUIT Premium")
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .editAsText()
      .setFontSize(10)
      .setItalic(true);

    doc.saveAndClose();

    // Save report record
    const reportsSheet = ss.getSheetByName("Reports");
    const reportId = "RPT-" + new Date().getTime();
    reportsSheet.appendRow([
      reportId,
      month,
      year,
      doc.getUrl(),
      new Date().toISOString(),
    ]);

    return {
      success: true,
      docUrl: doc.getUrl(),
      docId: doc.getId(),
      message: "Laporan berhasil dibuat!",
    };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function getReportData(month, year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transSheet = ss.getSheetByName("Transactions");
  const data = transSheet.getDataRange().getValues().slice(1);

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = {};
  const expenses = [];

  data.forEach((row) => {
    const date = parseDateRobust(row[1]);
    if (date.getMonth() + 1 !== month || date.getFullYear() !== year) return;

    const type = row[2];
    const category = row[3] || "Lainnya";
    const amount = Number(row[4]) || 0;
    const note = row[5] || "";

    if (type === "Income") {
      totalIncome += amount;
    } else if (type === "Expense") {
      totalExpense += amount;
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      expenses.push({
        date: formatDate(date),
        category: category,
        amount: amount,
        fmtAmount: safeFormatRupiah(amount),
        note: note,
      });
    }
  });

  // Sort expenses and get top 5
  expenses.sort((a, b) => b.amount - a.amount);
  const topExpenses = expenses.slice(0, 5);

  // Build category breakdown
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name: name,
      amount: amount,
      fmtAmount: safeFormatRupiah(amount),
      percentage:
        totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ADDED: Goal Summary
  let totalGoalTopup = 0;
  let totalGoalWithdraw = 0;
  const goalTxSheet = ss.getSheetByName("GoalTransactions");
  if (goalTxSheet) {
    const goalData = goalTxSheet.getDataRange().getValues().slice(1);
    goalData.forEach((row) => {
      const date = parseDateRobust(row[5]);
      if (date.getMonth() + 1 !== month || date.getFullYear() !== year) return;

      const type = row[2];
      const amount = Number(row[3]) || 0;

      if (type === "topup") totalGoalTopup += amount;
      if (type === "withdraw") totalGoalWithdraw += amount;
    });
  }

  const balance = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  return {
    month: month,
    year: year,
    monthName: getMonthName(month),
    totalIncome: totalIncome,
    fmtTotalIncome: safeFormatRupiah(totalIncome),
    totalExpense: totalExpense,
    fmtTotalExpense: safeFormatRupiah(totalExpense),
    balance: balance,
    fmtBalance: safeFormatRupiah(balance),
    savingsRate: savingsRate,
    topExpenses: topExpenses,
    categoryBreakdown: categoryBreakdown,
    goalSummary: {
      totalTopup: totalGoalTopup,
      fmtTotalTopup: safeFormatRupiah(totalGoalTopup),
      totalWithdraw: totalGoalWithdraw,
      fmtTotalWithdraw: safeFormatRupiah(totalGoalWithdraw),
    },
  };
}

function getReportsList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Reports");
    if (!sheet || sheet.getLastRow() < 2) {
      return { reports: [] };
    }

    const data = sheet.getDataRange().getValues().slice(1);
    const reports = data
      .filter((row) => row[0])
      .map((row) => ({
        id: row[0].toString(),
        month: Number(row[1]),
        year: Number(row[2]),
        monthName: getMonthName(Number(row[1])),
        docUrl: row[3].toString(),
        createdAt: row[4] ? new Date(row[4]).toLocaleDateString("id-ID") : "",
      }))
      .reverse(); // Most recent first

    return { reports: reports };
  } catch (error) {
    return { error: true, message: error.toString(), reports: [] };
  }
}

function getMonthName(month) {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return months[month - 1] || "";
}

// ============================================
// --- FEATURE 4: BUDGET MANAGEMENT ---
// ============================================

function getBudgetsList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Budget");
    if (!sheet || sheet.getLastRow() < 2) {
      return { budgets: [] };
    }

    const data = sheet.getDataRange().getValues().slice(1);
    const budgets = data
      .filter((row) => row[0])
      .map((row) => ({
        category: row[0],
        limit: Number(row[1]) || 0,
        fmtLimit: safeFormatRupiah(Number(row[1]) || 0),
      }));

    return { budgets: budgets };
  } catch (error) {
    return { error: true, message: error.toString(), budgets: [] };
  }
}

function saveBudget(category, limit) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Budget");
    if (!sheet) return { success: false, message: "Budget sheet not found" };

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Find existing category
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === category) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      // Create new if not exists (though mostly we update)
      sheet.appendRow([category, Number(limit) || 0]);
    } else {
      // Update existing
      sheet.getRange(rowIndex, 2).setValue(Number(limit) || 0);
    }

    return { success: true, message: "Budget updated" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function deleteBudget(category) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Budget");
    if (!sheet) return { success: false, message: "Budget sheet not found" };

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === category) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex !== -1) {
      sheet.deleteRow(rowIndex);
      return { success: true, message: "Budget deleted" };
    } else {
      return { success: false, message: "Budget not found" };
    }
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
