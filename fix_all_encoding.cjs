const fs = require('fs');
const path = require('path');

const replacements = {
  '├º': 'ç',
  '├ú': 'ã',
  '├ó': 'â',
  '├í': 'á',
  '├Á': 'õ',
  '├¬': 'ê',
  '├®': 'é',
  '├¡': 'í',
  '├│': 'ó',
  '├Ü': 'Ú',
  'Produ├º├úo': 'Produção',
  'Tr├ónsito': 'Trânsito',
  'N├úo': 'Não',
  'For├ºar': 'Forçar',
  'Endere├ºo': 'Endereço',
  'Hist├│rico': 'Histórico',
  'Conclu├¡da': 'Concluída',
  'M├®todo': 'Método',
  'Log├¡stica': 'Logística'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Replace all mappings
  for (const [bad, good] of Object.entries(replacements)) {
    newContent = newContent.split(bad).join(good);
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
        walkDir(fullPath);
      }
    } else {
      if (['.js', '.jsx', '.ts', '.tsx', '.json'].includes(path.extname(fullPath))) {
        processFile(fullPath);
      }
    }
  }
}

// Start from root directory (current directory)
walkDir(process.cwd());
console.log('Done!');
