USE sashihiki;

-- Create users table
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  guid CHAR(26) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE expenses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  guid CHAR(26) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  note TEXT,
  paid_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create expense_matchings table
CREATE TABLE expense_matchings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  guid CHAR(26) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_user_id BIGINT NOT NULL,
  settled_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_user_id) REFERENCES users(id)
);

-- Create expense_matching_expenses table
-- 支出のスナップショットを保持し、元の支出が削除されても差額計算に影響しない
CREATE TABLE expense_matching_expenses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  expense_matching_id BIGINT NOT NULL,
  expense_id BIGINT,
  -- 支出スナップショット（追加時にコピー）
  user_guid CHAR(26) NOT NULL,
  expense_name VARCHAR(255) NOT NULL,
  expense_price INT NOT NULL,
  expense_paid_at DATETIME NOT NULL,
  -- 請求額（NULLの場合はexpense_priceを使用）
  request_amount INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (expense_matching_id, expense_id),
  FOREIGN KEY (expense_matching_id) REFERENCES expense_matchings(id),
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL
);

-- Insert hardcoded users
INSERT INTO users (guid, name) VALUES
  ('01KDF6Z4SC3FV178ZSB8VXGHTH', 'ユーザーA'),
  ('01KDF6Z4SCFN0VF2BW1E3MKJY3', 'ユーザーB');
