const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src/pages/admin');
const adminCompDir = path.join(__dirname, 'src/components/admin');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      let lines = fs.readFileSync(fullPath, 'utf8').split('\n');
      const newClass = ' transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]';
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('<Button')) {
           if (lines[i].includes('className="') && !lines[i].includes('hover:bg-white/10')) {
               lines[i] = lines[i].replace(/className="([^"]*)"/, `className="$1${newClass}"`);
           } 
           else if (lines[i].includes('className={cn(') && !lines[i].includes('hover:bg-white/10')) {
               lines[i] = lines[i].replace(/className=\{cn\(([^)]*)\)\}/, `className={cn($1, "${newClass}")}`);
           }
           else if (!lines[i].includes('className=') && !lines[i].includes('hover:bg-white/10')) {
               lines[i] = lines[i].replace('<Button', `<Button className="${newClass.trim()}"`);
           }
        }
      }

      fs.writeFileSync(fullPath, lines.join('\n'));
    }
  }
}

processDir(adminDir);
processDir(adminCompDir);
