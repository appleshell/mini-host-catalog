const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/catalog.db');
const backupDir = path.join(__dirname, '../data/backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupPath = path.join(backupDir, `catalog-${timestamp}.db`);

fs.copyFileSync(dbPath, backupPath);
console.log(`✅ 备份成功: ${backupPath}`);

// 清理7天前的备份
const files = fs.readdirSync(backupDir);
const now = Date.now();
files.forEach(file => {
  const filePath = path.join(backupDir, file);
  const stats = fs.statSync(filePath);
  const age = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
  if (age > 7) {
    fs.unlinkSync(filePath);
    console.log(`🗑️  删除旧备份: ${file}`);
  }
});
