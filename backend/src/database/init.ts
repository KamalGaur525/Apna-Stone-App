import pool from "./pool";

const createTables = async () => {
  try {
    // 1. Users Table
    const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        role ENUM('vendor', 'guest', 'admin') NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Vendors Table
const vendorsTable = `
  CREATE TABLE IF NOT EXISTS vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    gst_number VARCHAR(15) UNIQUE,
    firm_name VARCHAR(255),
    tier ENUM('Godown', 'Factory', 'Stone Seller'),
    logo_url VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    facebook VARCHAR(255) DEFAULT NULL,
    instagram VARCHAR(255) DEFAULT NULL,
    website VARCHAR(255) DEFAULT NULL,
    location TEXT,
    about TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

    // 3. Guests Table
    const guestsTable = `
  CREATE TABLE IF NOT EXISTS guests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NULL,
    whatsapp VARCHAR(15) NULL,
    email VARCHAR(255) NULL,
    location TEXT NULL,
    payment_status ENUM('pending', 'paid', 'rejected') DEFAULT 'pending',
    transaction_id VARCHAR(100) DEFAULT NULL,
    payment_date TIMESTAMP NULL,
    plan_type ENUM('monthly', 'yearly') DEFAULT 'monthly',
    expiry_date TIMESTAMP NULL,
    admin_note TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

    // 4. Transactions Table (NEWly Added)
    const transactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        transaction_id VARCHAR(100) NOT NULL UNIQUE,
        status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        type ENUM('guest_unlock', 'vendor_tier') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    // 5. Categories Table
    const categoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        parent_id INT DEFAULT NULL,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `;

    // 6. Products Table
    const productsTable = `
  CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    sub_category VARCHAR(255) DEFAULT NULL,
    third_category VARCHAR(255) DEFAULT NULL,
    description TEXT,
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending', -- Consistent Status
    rejection_reason TEXT DEFAULT NULL,   
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );
`;

    const serviceTypesTable = `
      CREATE TABLE IF NOT EXISTS service_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const serviceProvidersTable = `
      CREATE TABLE IF NOT EXISTS service_providers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_type_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        photo_url VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE
      );
    `;
   const subscriptionPlansTable = `
  CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_type ENUM('monthly', 'yearly') UNIQUE NOT NULL,
    price INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;
const otpsTable = `
  CREATE TABLE IF NOT EXISTS otps (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    mobile      VARCHAR(15) NOT NULL,
    gst_number  VARCHAR(15) NULL,
    otp_hash    VARCHAR(255) NOT NULL,
    user_type   ENUM('vendor', 'guest') NOT NULL,
    purpose     ENUM('login', 'register') NOT NULL DEFAULT 'login',
    attempts    INT DEFAULT 0,
    expires_at  DATETIME NOT NULL,
    verified    TINYINT(1) DEFAULT 0,
    ip_address  VARCHAR(45) NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mobile (mobile),
    INDEX idx_expires (expires_at),
    INDEX idx_mobile_type (mobile, user_type, verified)
  );
`;

    // Queries execution
    console.log("⏳ Initializing database tables...");

    await pool.query(usersTable);
    console.log("✅ Users table ready.");
    
    await pool.query(vendorsTable);
    console.log("✅ Vendors table ready.");
    
    await pool.query(guestsTable);
    console.log("✅ Guests table ready.");

    await pool.query(transactionsTable);
    console.log("✅ Transactions table ready.");

    await pool.query(categoriesTable);
    console.log("✅ Categories table ready.");

    await pool.query(productsTable);
    console.log("✅ Products table ready.");
    
     await pool.query(serviceTypesTable);
    console.log("✅ Service Types table ready.");

    await pool.query(serviceProvidersTable);
    console.log("✅ Service Providers table ready.");

   await pool.query(subscriptionPlansTable);
console.log("✅ Subscription Plans table ready.");

await pool.query(otpsTable);
console.log("✅ OTPs table ready.");

    console.log("🎉 All database tables initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
};

createTables();