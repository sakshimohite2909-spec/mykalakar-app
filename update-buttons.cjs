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
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const newClass = ' transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]';
      
      // Match <Button ... className="existing">
      content = content.replace(/<Button([\s\S]*?)className="([^"]*)"/g, (match, p1, p2) => {
        if (p2.includes('hover:bg-white/10')) return match;
        return `<Button${p1}className="${p2}${newClass}"`;
      });

      // Match <Button ... className={cn(...)}> 
      content = content.replace(/<Button([^>]*?)className=\{cn\(([^)]*)\)\}([^>]*?)>/g, (match, p1, p2, p3) => {
        if (p2.includes('hover:bg-white/10')) return match;
        return `<Button${p1}className={cn(${p2}, "${newClass}")}${p3}>`;
      });
      
      // Add className if missing
      content = content.replace(/<Button((?:(?!\bclassName=)[^>])*?)>/g, (match, p1) => {
        if (p1.includes('{...props}')) return match; // avoid spreading conflicts
        return `<Button${p1} className="${newClass.trim()}">`;
      });

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(adminDir);
processDir(adminCompDir);
