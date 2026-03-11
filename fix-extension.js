const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "out");

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

function scrubUnderscores(dir) {
  const items = fs.readdirSync(dir);
  items.forEach((item) => {
    let oldPath = path.join(dir, item);
    let newName = item;
    if (item.startsWith("_")) {
      newName = item.replace(/^_+/g, "").replace(/\._/g, ".");
      const newPath = path.join(dir, newName);
      fs.renameSync(oldPath, newPath);
      oldPath = newPath;
      console.log(`Renamed: ${item} -> ${newName}`);
    }
    if (fs.statSync(oldPath).isDirectory()) {
      scrubUnderscores(oldPath);
    }
  });
}

function moveInlineScripts(htmlPath) {
  let content = fs.readFileSync(htmlPath, "utf8");
  const scriptRegex = /<script(?![^>]*src)([^>]*)>([\s\S]*?)<\/script>/g;
  let count = 0;
  const newContent = content.replace(
    scriptRegex,
    (tag, attributes, scriptContent) => {
      if (scriptContent.trim().length === 0) return tag;
      const htmlName = path.basename(htmlPath, ".html");
      const filename = `${htmlName}-inline-${count++}.js`;
      const scriptPath = path.join(path.dirname(htmlPath), filename);
      fs.writeFileSync(scriptPath, scriptContent);
      return `<script ${attributes} src="./${filename}"></script>`;
    },
  );
  fs.writeFileSync(htmlPath, newContent);
}

if (fs.existsSync(outDir)) {
  console.log("--- Phase 1: Aggressive Renaming ---");
  scrubUnderscores(outDir);

  console.log("--- Phase 2: Moving Inline Scripts & Fixing Content ---");
  const allFiles = getAllFiles(outDir);
  allFiles.forEach((filePath) => {
    const ext = path.extname(filePath);
    if (ext === ".html") moveInlineScripts(filePath);

    if ([".html", ".js", ".css", ".json", ".txt"].includes(ext)) {
      let content = fs.readFileSync(filePath, "utf8");
      const updatedContent = content
        .replace(/\/_+next/g, "/next")
        .replace(/_+next/g, "next")
        .replace(/\/_+not-found/g, "/not-found")
        .replace(/_+not-found/g, "not-found")
        .replace(/_+full\.txt/g, "full.txt")
        .replace(/_+head\.txt/g, "head.txt")
        .replace(/_+index\.txt/g, "index.txt")
        // This is the important part: we suppress the error message entirely

        // Change these lines in Phase 2
        .replace(/Error\("Connection closed."\)/g, 'new Error("velox_ready")')
        .replace(/\.error\("Connection closed."\)/g, '.log("velox_ready")') // Turn error into a log
        .replace(/"Connection closed."/g, '"velox_ready"');

      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, "utf8");
      }
    }
  });
  console.log("--- Phase 3: Cleanup Complete ---");
}
