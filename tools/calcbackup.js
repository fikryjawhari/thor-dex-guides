// A damage-calc backup file (hzla/Dynamic-Calc-Decomps backups/*.js, kumakuma1/hardlovecalc backups/*.js) -> JSON.
// Usage: node tools/calcbackup.js <backup.js> <out.json>     out = {backup_data, backup_moves} (whichever the file defines)
const fs = require('fs');
var backup_data, backup_moves;
eval(fs.readFileSync(process.argv[2], 'utf8'));
fs.writeFileSync(process.argv[3], JSON.stringify({ backup_data, backup_moves }));
