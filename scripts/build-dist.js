import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const outputPublicDir = path.join(rootDir, ".output", "public");
const distDir = path.join(rootDir, "dist");

if (!fs.existsSync(outputPublicDir)) {
  console.error("Diretório .output/public não encontrado. Execute o build antes.");
  process.exit(1);
}

// Cria / limpa dist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copia recursivamente tudo de .output/public para dist
fs.cpSync(outputPublicDir, distDir, { recursive: true });

// Encontra o arquivo principal JS e CSS em dist/assets
const assetsDir = path.join(distDir, "assets");
const assetFiles = fs.readdirSync(assetsDir);

const mainJs = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const mainCss = assetFiles.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

if (!mainJs || !mainCss) {
  console.error("Assets principais não encontrados em dist/assets.");
  process.exit(1);
}

// Gera o index.html otimizado para SPA no cPanel
const indexHtmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FinanceControl — Gestão financeira multiunidade</title>
    <meta name="description" content="Consulta centralizada e somente leitura das finanças de todas as unidades." />
    <meta property="og:title" content="FinanceControl" />
    <meta property="og:description" content="Consulta centralizada e somente leitura das finanças de todas as unidades." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.ico" type="image/x-icon" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Sora:wght@500;600;700&display=swap" />
    <link rel="stylesheet" href="/assets/${mainCss}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(distDir, "index.html"), indexHtmlContent, "utf-8");

// Gera .htaccess para Apache/cPanel com suporte a rotas SPA e cache de assets
const htaccessContent = `# ==============================================================================
# Apache / LiteSpeed - Configuração de Hospedagem cPanel (SPA React)
# ==============================================================================

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Se o arquivo ou diretório existir fisicamente, serve diretamente
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Todas as rotas do frontend React redirecionam para index.html
  RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
  </FilesMatch>

  <FilesMatch "index\\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
  </FilesMatch>
</IfModule>
`;

fs.writeFileSync(path.join(distDir, ".htaccess"), htaccessContent, "utf-8");
console.log("Pasta dist/ gerada com sucesso para o cPanel!");

