const fs = require('fs');
const path = require('path');

exports.up = (pgm) => {
  const sql = fs.readFileSync(path.join(__dirname, 'sql', '1720440000000_init-schema.up.sql'), 'utf8');
  pgm.sql(sql);
};

exports.down = (pgm) => {
  const sql = fs.readFileSync(path.join(__dirname, 'sql', '1720440000000_init-schema.down.sql'), 'utf8');
  pgm.sql(sql);
};
