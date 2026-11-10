# Guia de Publicação no cPanel — FinanceControl

Este guia orienta passo a passo a publicação do **Frontend (React + Vite SPA)** e do **Backend (Laravel 11 REST API)** em uma hospedagem compartilhada com cPanel.

---

## 1. Topologia Recomendada de Diretórios

Para máxima segurança (evitando que o arquivo `.env` ou fontes PHP fiquem expostos na internet):

```text
/home/seu_usuario/
├── backend/                  <-- Laravel (fora de public_html)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── storage/
│   ├── .env                  <-- Protegido fora da raiz pública
│   └── artisan
│
└── public_html/              <-- Frontend React (conteúdo da pasta dist/)
    ├── assets/
    │   ├── *.js
    │   └── *.css
    ├── .htaccess             <-- Regras Apache / LiteSpeed (SPA)
    ├── favicon.ico
    ├── favicon.png
    ├── icon-192.png
    ├── icon-512.png
    ├── index.html
    ├── manifest.webmanifest
    ├── robots.txt
    └── sw.js
```

---

## 2. Publicando o Frontend React (Pasta `dist/`)

### Método A: Via Gerenciador de Arquivos (File Manager)
1. No seu computador, gere o build atualizado (já validado no repositório):
   ```bash
   npm run build
   ```
2. No cPanel, abra o **Gerenciador de Arquivos** e entre na pasta `public_html`.
3. Certifique-se de ativar a opção **"Mostrar arquivos ocultos (dotfiles)"** nas configurações do Gerenciador de Arquivos.
4. Envie o conteúdo interno de `dist/` para a raiz de `public_html`:
   - `assets/` (pasta)
   - `.htaccess` (essencial para evitar erro 404 ao atualizar rotas)
   - `index.html`
   - `manifest.webmanifest`
   - `sw.js`
   - `favicon.ico`, `favicon.png`, `icon-192.png`, `icon-512.png`, `robots.txt`

---

## 3. Publicando o Backend Laravel 11

### Passo 1: Criar o Subdomínio para a API
1. No cPanel, vá em **Domínios** -> **Criar um novo domínio** (ou **Subdomínios**).
2. Defina o subdomínio: `api.apacmcb.com.br`.
3. Defina o **Document Root** apontando para a pasta pública do Laravel:
   ```text
   /home/hgm21923/backend/public
   ```

### Passo 2: Enviar os arquivos do Backend
1. Crie a pasta `backend` dentro de `/home/hgm21923/` (um nível acima de `public_html`).
2. Envie os arquivos da pasta `backend/` do projeto.

### Passo 3: Configurar a Versão do PHP
1. No cPanel, acesse **MultiPHP Manager** (Gerenciador MultiPHP).
2. Selecione a versão **PHP 8.2** ou **PHP 8.3**.
3. Em **Select PHP Version** -> **Extensões**, confirme que as seguintes estão marcadas:
   - `pdo_mysql`
   - `bcmath`
   - `openssl`
   - `mbstring`
   - `fileinfo`
   - `tokenizer`
   - `xml` / `dom`
   - `json`

### Passo 4: Configurar o `.env` do Backend
Crie o arquivo `/home/hgm21923/backend/.env` com as configurações de produção:

```env
APP_NAME=FinanceControl
APP_ENV=production
APP_KEY=base64:O7iYkxYF54td2oJpOpj9PWOJco+k02CxKJS0ohXeTJw=
APP_DEBUG=false
APP_URL=https://api.apacmcb.com.br

DB_CONNECTION=mysql
DB_HOST=50.116.113.174
DB_PORT=3306
DB_DATABASE=hgm21923_dasboard_apacmcb
DB_USERNAME=hgm21923_dasboard_apacmcb
DB_PASSWORD=@Secur1t1@
DB_COLLATION=utf8mb4_unicode_ci

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
```

> **Atenção:** Se não tiver uma chave `APP_KEY`, no terminal do cPanel acesse a pasta `backend` e rode:
> ```bash
> php artisan key:generate
> ```

### Passo 5: Permissões de Escrita
No terminal ou gerenciador de arquivos, garanta permissão de escrita para:
- `/home/seu_usuario/backend/storage` (`chmod -R 775 storage`)
- `/home/seu_usuario/backend/bootstrap/cache` (`chmod -R 775 bootstrap/cache`)

---

## 4. Conectando Frontend à API Laravel

Caso a sua API esteja em `https://api.seudominio.com.br`:

1. No arquivo `.env` do Frontend (localmente antes de rodar `npm run build`):
   ```env
   VITE_API_URL=https://api.seudominio.com.br/api
   ```
2. Execute:
   ```bash
   npm run build
   ```
3. Envie a pasta `dist` resultante para o `public_html`.

> **Dica:** Se o frontend e o backend estiverem sob o mesmo domínio (com `/api` redirecionando para a pasta pública do Laravel via Proxy), o padrão `VITE_API_URL=/api` funcionará nativamente sem necessidade de configurar domínios cruzados.

---

## 5. Tarefas Agendadas (Cron Jobs no cPanel)

Para permitir sincronizações automáticas em segundo plano com os bancos de dados das unidades:

1. No cPanel, abra **Tarefas Cron** (Cron Jobs).
2. Configure a frequência para **Uma vez por minuto** (`* * * * *`).
3. Adicione o comando:
   ```bash
   php /home/seu_usuario/backend/artisan schedule:run >> /dev/null 2>&1
   ```

---

## 6. Testes de Validação em Produção

Após publicar, verifique:
1. **Frontend:** Acesse `https://seudominio.com.br/` e recarregue a página com `Ctrl + F5`.
2. **Rotas SPA:** Acesse diretamente `https://seudominio.com.br/fluxo-de-caixa` e certifique-se de que a tela abre sem erro 404.
3. **API Health Check:** Acesse `https://api.seudominio.com.br/api/units` no navegador. Deve retornar o JSON com as 5 unidades APAC cadastradas.
4. **Login:** Acesse o sistema utilizando:
   - **E-mail:** `admin@apacmcb.org.br`
   - **Senha:** `Admin@2026!`
