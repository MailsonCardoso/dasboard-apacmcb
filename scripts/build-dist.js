import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const outputPublicDir = path.join(rootDir, ".output", "public");
const publicSourceDir = path.join(rootDir, "public");
const distDir = path.join(rootDir, "dist");

if (!fs.existsSync(outputPublicDir)) {
  console.error("Erro: Diretório .output/public não encontrado. Execute 'vite build' antes.");
  process.exit(1);
}

// 1. Limpa e recria diretório dist para evitar acúmulo de hashes antigos
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Copia arquivos compilados do Vite (.output/public) para dist
fs.cpSync(outputPublicDir, distDir, { recursive: true });

// 3. Garante que todos os arquivos estáticos de public/ estejam copiados para dist
if (fs.existsSync(publicSourceDir)) {
  fs.cpSync(publicSourceDir, distDir, { recursive: true });
}

// 4. Localiza os bundles principais JS e CSS gerados
const assetsDir = path.join(distDir, "assets");
if (!fs.existsSync(assetsDir)) {
  console.error("Erro: Diretório dist/assets não encontrado.");
  process.exit(1);
}

const assetFiles = fs.readdirSync(assetsDir);
const mainJs = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const mainCss = assetFiles.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

if (!mainJs || !mainCss) {
  console.error("Erro: Assets principais index-*.js ou styles-*.css não encontrados em dist/assets.");
  process.exit(1);
}

// 5. Gera dist/index.html otimizado para SPA no cPanel
const indexHtmlContent = `<!DOCTYPE html>
<html lang="pt-BR" suppressHydrationWarning>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FinanceControl — Gestão financeira multiunidade</title>
    <meta name="description" content="Consulta centralizada e somente leitura das finanças de todas as unidades." />
    <meta name="theme-color" content="#182754" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    <!-- Open Graph / Meta -->
    <meta property="og:title" content="FinanceControl — Gestão financeira multiunidade" />
    <meta property="og:description" content="Consulta centralizada e somente leitura das finanças de todas as unidades." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />

    <!-- PWA / Manifest / Ícones -->
    <link rel="icon" href="/favicon.ico" type="image/x-icon" />
    <link rel="icon" href="/favicon.png" type="image/png" sizes="64x64" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <link rel="manifest" href="/manifest.webmanifest" />

    <!-- Fontes Google -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Sora:wght@500;600;700&display=swap" />

    <!-- Estilos CSS Compilados -->
    <link rel="stylesheet" href="/assets/${mainCss}" />

    <!-- TanStack Start / TSR Client Hydration Shim para SPA Estático cPanel -->
    <script>
      self.$_TSR = {
        h: function() { this.hydrated = true; this.c(); },
        e: function() { this.streamEnded = true; this.c(); },
        c: function() {},
        p: function(e) { this.initialized ? e() : this.buffer.push(e); },
        buffer: [],
        initialized: true,
        router: {
          manifest: { routes: {} },
          matches: [],
          dehydratedData: {}
        }
      };
    </script>
  </head>
  <body suppressHydrationWarning>
    <div id="root"></div>

    <!-- Registro de Service Worker PWA -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').catch(function(err) {
            console.debug('Service Worker não registrado:', err);
          });
        });
      }
    </script>

    <!-- Bundle JavaScript Principal -->
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(distDir, "index.html"), indexHtmlContent, "utf-8");

// 6. Gera dist/.htaccess otimizado para cPanel (Apache / LiteSpeed)
const htaccessContent = `# ==============================================================================
# Apache / LiteSpeed - Configuração de Hospedagem cPanel (SPA React)
# ==============================================================================

# 1. Fallback caso ocorra 404 (evita página de erro padrão cPanel com scripts inseguros)
ErrorDocument 404 /index.html

# 2. Apache 2.4+ Roteamento Nativo SPA
<IfModule mod_dir.c>
  DirectoryIndex index.html
  FallbackResource /index.html
</IfModule>

# 3. Reescruta mod_rewrite (compatibilidade total)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Permite envio de cabeçalho Authorization para APIs REST
  RewriteCond %{HTTP:Authorization} .
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

  # Se o arquivo ou diretório existir fisicamente, entrega diretamente
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Todas as rotas do frontend React redirecionam para /index.html
  RewriteRule ^(.*)$ /index.html [L,QSA]
</IfModule>

# 4. Compressão de arquivos para carregamento rápido
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json application/manifest+json
</IfModule>

# 5. Controle de Cache: arquivos com hash ficam em cache longo; HTML/PWA sem cache
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
  </FilesMatch>

  <FilesMatch "(index\\.html|sw\\.js|manifest\\.webmanifest)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
  </FilesMatch>
</IfModule>
`;

fs.writeFileSync(path.join(distDir, ".htaccess"), htaccessContent, "utf-8");
fs.writeFileSync(path.join(distDir, "htaccess.txt"), htaccessContent, "utf-8");

// 7. Validação do Build: Verifica referências do index.html e manifest
console.log("\n==================================================");
console.log("Iniciando Validação de Integridade do Build 'dist'...");
console.log("==================================================");

let hasErrors = false;

// Função auxiliar para validar existência de arquivo relativo
function validateFile(relativePath, sourceDescription) {
  const cleanPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  const fullPath = path.join(distDir, cleanPath.split("?")[0]);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ [FALHA] Arquivo referenciado em ${sourceDescription} NÃO existe: ${cleanPath}`);
    hasErrors = true;
  } else {
    const stat = fs.statSync(fullPath);
    console.log(`✅ [OK] ${cleanPath} (${stat.size} bytes)`);
  }
}

// 7.1 Valida referências do index.html
console.log("\nVerificando referências no index.html:");
const regexHrefSrc = /(?:href|src)=["'](\/[^"']+)["']/g;
let match;
const tested = new Set();
while ((match = regexHrefSrc.exec(indexHtmlContent)) !== null) {
  const assetRef = match[1];
  if (!tested.has(assetRef)) {
    tested.add(assetRef);
    validateFile(assetRef, "index.html");
  }
}

// 7.2 Valida referências no manifest.webmanifest
const manifestPath = path.join(distDir, "manifest.webmanifest");
if (fs.existsSync(manifestPath)) {
  console.log("\nVerificando ícones no manifest.webmanifest:");
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    if (Array.isArray(manifest.icons)) {
      for (const icon of manifest.icons) {
        validateFile(icon.src, "manifest.webmanifest");
      }
    }
  } catch (err) {
    console.error("❌ [FALHA] Erro ao analisar manifest.webmanifest:", err);
    hasErrors = true;
  }
} else {
  console.error("❌ [FALHA] manifest.webmanifest não encontrado em dist/");
  hasErrors = true;
}

// 7.3 Valida presença do Service Worker e .htaccess
console.log("\nVerificando arquivos essenciais PWA e servidor:");
validateFile("/sw.js", "Service Worker");
validateFile("/.htaccess", "Apache Configuration");
validateFile("/robots.txt", "SEO Robots");

if (hasErrors) {
  console.error("\n❌ Validação do build falhou com erros acima.");
  process.exit(1);
}

console.log("\n==================================================");
console.log("🎉 Build validado com 100% de sucesso para cPanel!");
console.log("Pasta dist/ pronta para envio direto ao public_html.");
console.log("==================================================\n");

// 8. Gera pacote dist.zip (incluindo .htaccess) para upload e descompactação rápida no cPanel
try {
  if (process.platform === "win32") {
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path dist\\* -DestinationPath dist.zip -Force"`, { stdio: "inherit" });
    console.log("📦 Pacote 'dist.zip' gerado com sucesso na raiz do projeto (perfeito para upload direto no cPanel)!\n");
  }
} catch (err) {
  console.warn("Aviso ao compactar dist.zip:", err.message);
}
