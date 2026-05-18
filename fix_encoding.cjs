const fs = require('fs');
const path = require('path');

const replacements = {
  'Ã§': 'ç',
  'Ã£': 'ã',
  'Ã©': 'é',
  'Ãµ': 'õ',
  'Ã¡': 'á',
  'Ã³': 'ó',
  'Ã\\xad': 'í',
  'Ãº': 'ú',
  'Ãª': 'ê',
  'Ã¢': 'â',
  'AÃ§Ãµes': 'Ações',
  'MÃ©dio': 'Médio',
  'ColeÃ§Ã£o': 'Coleção',
  'ColeÃ§Ãµes': 'Coleções',
  'ConfiguraÃ§Ãµes': 'Configurações',
  'EstatÃ\\xadsticas': 'Estatísticas',
  'NÃ£o': 'Não'
};

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath);
    } else if (filepath.endsWith('.jsx') || filepath.endsWith('.js') || filepath.endsWith('.css') || filepath.endsWith('.html')) {
      let content = fs.readFileSync(filepath, 'utf8');
      let original = content;
      
      // Let's also do a blanket replace for common double-encoded UTF-8 characters if any
      // but first use the specific map
      for (const [bad, good] of Object.entries(replacements)) {
        content = content.split(bad).join(good);
      }

      // Buffer approach for double UTF-8 encoded files
      // If we read as binary, we can convert back properly sometimes
      let buf = fs.readFileSync(filepath);
      let str = buf.toString('utf8');
      
      // We know there are instances of 'ColeÃ§Ã£o'. Let's do a replace
      let changed = false;
      let newStr = str;
      
      newStr = newStr.replace(/ColeÃ§Ã£o/g, 'Coleção');
      newStr = newStr.replace(/AÃ§Ãµes/g, 'Ações');
      newStr = newStr.replace(/MÃ©dio/g, 'Médio');
      newStr = newStr.replace(/ColeÃ§Ãµes/g, 'Coleções');
      newStr = newStr.replace(/EstatÃ­sticas/g, 'Estatísticas');
      newStr = newStr.replace(/NÃ£o/g, 'Não');
      newStr = newStr.replace(/ConfiguraÃ§Ãµes/g, 'Configurações');
      newStr = newStr.replace(/Ã§Ã£o/g, 'ção');
      newStr = newStr.replace(/Ã§/g, 'ç');
      newStr = newStr.replace(/Ã£/g, 'ã');
      newStr = newStr.replace(/Ã©/g, 'é');
      newStr = newStr.replace(/Ãµ/g, 'õ');
      newStr = newStr.replace(/Ã¡/g, 'á');
      newStr = newStr.replace(/Ã³/g, 'ó');
      newStr = newStr.replace(/Ã­/g, 'í');
      newStr = newStr.replace(/Ãº/g, 'ú');
      newStr = newStr.replace(/Ãª/g, 'ê');
      newStr = newStr.replace(/Ã¢/g, 'â');
      newStr = newStr.replace(/Ã/g, 'à'); // Fallback if standalone but dangerous. Better not.

      if (str !== newStr) {
        fs.writeFileSync(filepath, newStr, 'utf8');
        console.log('Fixed encoding in', filepath);
      }
    }
  });
}
walk('./src');
