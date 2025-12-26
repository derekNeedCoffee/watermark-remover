/**
 * SQLite Database Setup
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'watermark.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

/**
 * Initialize database tables
 */
function initDatabase() {
  // Entitlements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS entitlements (
      install_id TEXT PRIMARY KEY,
      is_pro INTEGER DEFAULT 0,
      free_used_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // IAP transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS iap_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE,
      original_transaction_id TEXT,
      product_id TEXT,
      install_id TEXT,
      purchased_at TEXT,
      raw_receipt TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_iap_install_id ON iap_transactions(install_id);
    CREATE INDEX IF NOT EXISTS idx_iap_transaction_id ON iap_transactions(transaction_id);
  `);

  console.log('✅ Database initialized');
}

/**
 * Get or create entitlement for install ID
 */
function getOrCreateEntitlement(installId) {
  let entitlement = db.prepare('SELECT * FROM entitlements WHERE install_id = ?').get(installId);
  
  if (!entitlement) {
    db.prepare(`
      INSERT INTO entitlements (install_id, is_pro, free_used_count)
      VALUES (?, 0, 0)
    `).run(installId);
    
    entitlement = db.prepare('SELECT * FROM entitlements WHERE install_id = ?').get(installId);
  }
  
  return entitlement;
}

/**
 * Update entitlement
 */
function updateEntitlement(installId, updates) {
  const setClauses = [];
  const values = [];
  
  if (updates.is_pro !== undefined) {
    setClauses.push('is_pro = ?');
    values.push(updates.is_pro ? 1 : 0);
  }
  
  if (updates.free_used_count !== undefined) {
    setClauses.push('free_used_count = ?');
    values.push(updates.free_used_count);
  }
  
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(installId);
  
  db.prepare(`
    UPDATE entitlements SET ${setClauses.join(', ')} WHERE install_id = ?
  `).run(...values);
}

/**
 * Increment free used count
 */
function incrementFreeUsedCount(installId) {
  db.prepare(`
    UPDATE entitlements 
    SET free_used_count = free_used_count + 1, updated_at = CURRENT_TIMESTAMP 
    WHERE install_id = ?
  `).run(installId);
}

/**
 * Check if transaction exists
 */
function transactionExists(transactionId) {
  const result = db.prepare('SELECT 1 FROM iap_transactions WHERE transaction_id = ?').get(transactionId);
  return !!result;
}

/**
 * Save IAP transaction
 */
function saveTransaction(transaction) {
  db.prepare(`
    INSERT INTO iap_transactions (transaction_id, original_transaction_id, product_id, install_id, purchased_at, raw_receipt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    transaction.transactionId,
    transaction.originalTransactionId,
    transaction.productId,
    transaction.installId,
    transaction.purchasedAt,
    transaction.rawReceipt
  );
}

module.exports = {
  db,
  initDatabase,
  getOrCreateEntitlement,
  updateEntitlement,
  incrementFreeUsedCount,
  transactionExists,
  saveTransaction,
};


