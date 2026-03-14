const fs = require('fs');
const files = [
  'public/headshot/dashboard.html',
  'public/headshot/products.html',
  'public/headshot/categories.html',
  'public/headshot/admins.html'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/ data-label="[^"]*"/g, '');
  c = c.replace(/ class="hide-mobile"/g, '');
  c = c.replace(/"hide-mobile"/g, '""');
  fs.writeFileSync(f, c);
  console.log('Restored: ' + f);
});
