const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");
const filesToCopy = [
    "index.html",
    "style.css",
    "script.js",
    "masteryRequest.js",
    "matchHistoryRequest.js",
    "rankedRequest.js",
    "utils.js",
    "allVars.js",
    "LoLData.ico"
];

// 🔹 Verifica se a pasta dist existe, se não, cria
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
    console.log("📁 Criando pasta dist/");
}

// 🔹 Copia os arquivos para a pasta dist
filesToCopy.forEach((file) => {
    const src = path.join(__dirname, file);
    const dest = path.join(distDir, file);

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Copiado: ${file}`);
    } else {
        console.warn(`⚠️ Arquivo não encontrado: ${file}`);
    }
});

console.log("🎉 Build concluído com sucesso!");