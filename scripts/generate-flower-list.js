import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const srcFlowersDir = path.join(projectRoot, 'Flowers');
const destFlowersDir = path.join(projectRoot, 'public', 'Flowers');
const outputFile = path.join(projectRoot, 'src', 'flowerList.json');

// Ensure public directory exists
const publicDir = path.join(projectRoot, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Function to recursively copy directories
function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    if (fs.lstatSync(path.join(from, element)).isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

console.log('Syncing flower assets...');
if (fs.existsSync(srcFlowersDir)) {
  copyFolderSync(srcFlowersDir, destFlowersDir);
} else {
  console.warn('Flowers folder not found at project root. Creating placeholder...');
  fs.mkdirSync(srcFlowersDir, { recursive: true });
  // Create subfolders
  const subfolders = ['Addons', 'Bows', 'Daisy', 'Lilys', 'Rose', 'Sunflowers', 'Tulips'];
  subfolders.forEach(sf => fs.mkdirSync(path.join(srcFlowersDir, sf), { recursive: true }));
}

// Now scan public/Flowers and group by folder
const categories = [
  { id: 'Rose', label: 'Roses 🌹' },
  { id: 'Tulips', label: 'Tulips 🌷' },
  { id: 'Lilys', label: 'Lilies ⚜️' },
  { id: 'Daisy', label: 'Daisies 🌼' },
  { id: 'Sunflowers', label: 'Sunflowers 🌻' },
  { id: 'Addons', label: 'Decorations ✨' },
  { id: 'Bows', label: 'Bows 🎀' }
];

const flowerList = {
  categories: categories.map(cat => {
    const catDir = path.join(destFlowersDir, cat.id);
    let files = [];
    
    if (fs.existsSync(catDir)) {
      files = fs.readdirSync(catDir)
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext);
        })
        .map(file => `/Flowers/${cat.id}/${file}`);
    }
    
    return {
      ...cat,
      files
    };
  })
};

fs.writeFileSync(outputFile, JSON.stringify(flowerList, null, 2), 'utf-8');
console.log(`Generated flower list with ${flowerList.categories.reduce((acc, cat) => acc + cat.files.length, 0)} files.`);
