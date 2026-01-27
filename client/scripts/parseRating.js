const fs = require('fs');
const parser = require('@babel/parser');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'RatingPage.jsx');
const code = fs.readFileSync(file, 'utf8');
try {
  parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
  console.log('PARSE_OK');
} catch (e) {
  console.error('PARSE_ERR', e.message);
  console.error(e.codeFrame || e.loc);
  process.exit(1);
}
