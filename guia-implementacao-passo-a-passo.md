# 🌍 Global Wealth Radar — Guia de Implementação para Iniciantes

> Leia tudo antes de começar. Cada passo tem explicação do **porquê** você está fazendo aquilo.
> Tempo estimado: **2 a 3 horas** na primeira vez.

---

## ANTES DE COMEÇAR — O QUE VOCÊ VAI PRECISAR

### Contas gratuitas para criar (faça isso agora)

| Serviço | Link | Para que serve | Custo |
|---|---|---|---|
| GitHub | github.com | Hospedar o site (grátis) | $0 |
| Supabase | supabase.com | Banco de dados + login | $0 |
| Stripe | stripe.com | Receber pagamentos | $0 fixo |
| Alpha Vantage | alphavantage.co | Dados dos ETFs | $0 |
| Resend | resend.com | Enviar emails de alerta | $0 |
| Cloudflare | cloudflare.com | DNS do domínio (opcional) | $0 |

### Programas para instalar no seu computador

**1. Node.js** (o motor que roda o projeto)
- Acesse: nodejs.org
- Clique em **"LTS"** (versão estável)
- Baixe e instale normalmente
- Para verificar: abra o Terminal e digite `node --version`
- Deve aparecer algo como `v20.x.x` ✅

**2. Git** (para enviar arquivos ao GitHub)
- **Mac**: abra o Terminal e digite `git --version` — ele já vem instalado
- **Windows**: baixe em git-scm.com e instale
- Para verificar: `git --version` deve mostrar `git version 2.x.x` ✅

**3. VS Code** (editor de código — opcional mas recomendado)
- Baixe em code.visualstudio.com

### O que é o Terminal?
- **Mac**: pressione `Cmd + Espaço`, digite "Terminal", Enter
- **Windows**: pressione `Win + X`, clique em "Terminal" ou "PowerShell"
- É uma janela onde você digita comandos. Não tem nada de difícil.

---

## PARTE 1 — DESCOMPACTAR E PREPARAR O PROJETO

### Passo 1.1 — Baixar e descompactar o ZIP

1. Baixe o arquivo `global-wealth-radar.zip`
2. Descompacte na sua pasta de projetos
   - **Mac**: clique duplo no ZIP
   - **Windows**: clique direito → "Extrair tudo"
3. Você vai ter uma pasta chamada `global-wealth-radar`

### Passo 1.2 — Abrir no Terminal

```bash
# Mac/Linux: navegue até a pasta do projeto
cd ~/Desktop/global-wealth-radar

# Windows (PowerShell):
cd C:\Users\SEU_USUARIO\Desktop\global-wealth-radar

# Confirme que está na pasta certa — deve listar os arquivos do projeto:
ls
# Deve mostrar: src, scripts, supabase, package.json, etc.
```

**Dica**: No VS Code, você pode abrir a pasta e usar o terminal integrado (Ctrl+` ou Cmd+`)

### Passo 1.3 — Instalar as dependências

```bash
npm install
```

⏱ Aguarde 1-2 minutos. Você vai ver muitas linhas passando — é normal.

Ao final deve aparecer algo como:
```
added 847 packages in 45s
```

### Passo 1.4 — Criar o arquivo de variáveis de ambiente

```bash
# Mac/Linux:
cp .env.example .env

# Windows (PowerShell):
copy .env.example .env
```

Abra o arquivo `.env` no VS Code (ou qualquer editor de texto).
Você vai preenchê-lo ao longo dos próximos passos.

O arquivo tem este formato:
```
PUBLIC_SUPABASE_URL=          ← você vai preencher isso
PUBLIC_SUPABASE_ANON_KEY=     ← e isso
...
```

---

## PARTE 2 — CONFIGURAR O GITHUB (onde o site vai ficar hospedado)

### Passo 2.1 — Criar conta no GitHub

1. Acesse github.com
2. Clique em **"Sign up"**
3. Escolha um username (ex: `joaosilva`) — esse nome vai aparecer na URL temporária do site
4. Confirme o email

### Passo 2.2 — Criar um repositório

1. No GitHub, clique no **"+"** no canto superior direito
2. Clique em **"New repository"**
3. Preencha:
   - **Repository name**: `global-wealth-radar`
   - **Visibility**: Public (necessário para o GitHub Pages gratuito)
   - **NÃO** marque "Add a README file"
4. Clique em **"Create repository"**

Você vai ver uma página com instruções. **Guarde a URL** — vai ser algo como:
`https://github.com/SEU_USERNAME/global-wealth-radar`

### Passo 2.3 — Conectar seu projeto local ao GitHub

No terminal, dentro da pasta do projeto:

```bash
# Inicializar o Git no projeto
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro "commit" (salvar ponto inicial)
git commit -m "feat: initial Global Wealth Radar MVP"

# Conectar ao GitHub (substitua SEU_USERNAME pelo seu username)
git remote add origin https://github.com/SEU_USERNAME/global-wealth-radar.git

# Enviar os arquivos
git branch -M main
git push -u origin main
```

Ele vai pedir seu username e senha do GitHub.
**Atenção**: No GitHub, a "senha" para o terminal é um **Personal Access Token**, não sua senha normal.

Para criar o token:
1. GitHub → clique na sua foto → **Settings**
2. Role até o final → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token (classic)**
5. Note: "deploy token", Expiration: 90 days
6. Marque: **repo** (check all)
7. **Generate token** → copie o token (começa com `ghp_`)
8. Use esse token como senha no terminal

### Passo 2.4 — Ativar o GitHub Pages

1. No GitHub, abra seu repositório
2. Clique em **Settings** (aba no topo)
3. No menu esquerdo, clique em **Pages**
4. Em **Source**, selecione **"GitHub Actions"**
5. Clique em **Save**

---

## PARTE 3 — CONFIGURAR O SUPABASE (banco de dados + login)

### Passo 3.1 — Criar a conta e o projeto

1. Acesse supabase.com
2. Clique em **"Start your project"**
3. Faça login com GitHub (mais fácil)
4. Clique em **"New project"**
5. Preencha:
   - **Organization**: sua organização (já deve ter uma com seu nome)
   - **Project name**: `global-wealth-radar`
   - **Database Password**: crie uma senha forte e **SALVE EM ALGUM LUGAR SEGURO**
   - **Region**: `East US (North Virginia)` — melhor para público americano
6. Clique em **"Create new project"**
7. Aguarde ~2 minutos enquanto o banco é criado

### Passo 3.2 — Criar as tabelas (rodar o SQL)

1. No painel do Supabase, clique em **"SQL Editor"** no menu esquerdo (ícone de código `<>`)
2. Clique em **"New query"**
3. Abra o arquivo `supabase/schema.sql` do seu projeto no VS Code
4. Selecione **todo o conteúdo** (Ctrl+A ou Cmd+A) e copie (Ctrl+C)
5. Cole no SQL Editor do Supabase
6. Clique em **"Run"** (botão verde) ou pressione Ctrl+Enter
7. Deve aparecer: `Success. No rows returned` ✅

Se aparecer erro vermelho, verifique se colou o arquivo completo.

### Passo 3.3 — Pegar as chaves do Supabase

1. No menu esquerdo, clique em **"Project Settings"** (ícone de engrenagem ⚙️)
2. Clique em **"API"**
3. Você vai ver duas chaves:

```
Project URL:   https://xxxxxxxxxxxx.supabase.co
anon key:      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Copie cada uma e cole no seu arquivo `.env`:

```
PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1N...   ← anon key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1N...         ← service_role key
```

⚠️ A `service_role` key é secreta — nunca compartilhe publicamente.

### Passo 3.4 — Configurar o Login com Google

Você vai criar credenciais no Google Cloud Console.
Parece complicado mas são só 5 minutos.

**No Google Cloud Console:**

1. Acesse console.cloud.google.com
2. Faça login com sua conta Google
3. Clique em **"Select a project"** → **"New project"**
   - Nome: `Global Wealth Radar`
   - Clique em **Create**
4. Com o projeto selecionado, clique no menu ☰ → **"APIs & Services"** → **"Credentials"**
5. Clique em **"+ Create Credentials"** → **"OAuth client ID"**
6. Se pedir para configurar a "OAuth consent screen":
   - User Type: **External** → Create
   - App name: `Global Wealth Radar`
   - User support email: seu email
   - Developer contact: seu email
   - Clique em **Save and Continue** (nas outras telas também)
   - Em **Scopes**: clique Save and Continue sem adicionar nada
   - Em **Test users**: adicione seu próprio email → Save and Continue
   - **Back to Dashboard**
7. Volte em **Credentials** → **Create Credentials** → **OAuth client ID**
8. Application type: **"Web application"**
9. Name: `Global Wealth Radar`
10. Em **Authorized redirect URIs**, clique em **+ Add URI** e adicione:
    ```
    https://xxxxxxxxxxxx.supabase.co/auth/v1/callback
    ```
    (substitua `xxxxxxxxxxxx` pelo ID do seu projeto Supabase)
11. Clique em **Create**
12. Salve o **Client ID** e **Client Secret** que aparecem

**No Supabase:**

1. Vá em **Authentication** → **Providers**
2. Encontre **Google** e clique nele
3. Ative o toggle **"Enable Sign in with Google"**
4. Cole o **Client ID** e **Client Secret** do Google
5. Clique em **Save**

### Passo 3.5 — Configurar as URLs de redirecionamento

Ainda no Supabase:

1. Vá em **Authentication** → **URL Configuration**
2. Preencha:
   - **Site URL**: `https://globalwealthradar.com` (ou `https://SEU_USERNAME.github.io/global-wealth-radar` por enquanto)
   - **Redirect URLs** (clique em "+ Add URL" para cada uma):
     ```
     https://globalwealthradar.com/auth/callback
     https://SEU_USERNAME.github.io/global-wealth-radar/auth/callback
     http://localhost:4321/auth/callback
     ```
3. Clique em **Save**

---

## PARTE 4 — CONFIGURAR O STRIPE (pagamentos)

### Passo 4.1 — Criar conta no Stripe

1. Acesse stripe.com
2. Clique em **"Start now"**
3. Preencha seus dados e confirme o email
4. **Importante**: complete o formulário de ativação da conta para receber pagamentos reais (precisa de documentos)
   - Para testar, você pode usar sem ativar (modo de teste)

### Passo 4.2 — Criar o produto

1. No Stripe, clique em **"Products"** no menu esquerdo
2. Clique em **"+ Add product"**
3. Preencha:
   - **Name**: `Global Wealth Radar Premium`
   - **Description**: `Full access to ETF tracker, sovereign risk, watchlist and alerts`
4. Em **Pricing**, preencha:
   - **Pricing model**: Standard pricing
   - **Price**: `19.00`
   - **Currency**: USD
   - **Billing period**: Monthly
5. Clique em **"Save product"**

Agora crie o plano anual:
6. Na página do produto, clique em **"Add another price"**
7. Price: `182.00`, Currency: USD, Billing period: Yearly
8. Clique em **Save**

### Passo 4.3 — Pegar os Price IDs

Na página do produto, você vai ver dois preços listados.
Cada um tem um **Price ID** que começa com `price_`:

```
Monthly: price_1ABC123...
Yearly:  price_1XYZ456...
```

Copie e cole no `.env`:
```
STRIPE_PRICE_MONTHLY=price_1ABC123...
STRIPE_PRICE_ANNUAL=price_1XYZ456...
```

### Passo 4.4 — Pegar as chaves do Stripe

1. No Stripe, clique em **"Developers"** no menu superior direito
2. Clique em **"API keys"**
3. Você vai ver:
   - **Publishable key**: `pk_live_...` (ou `pk_test_...` em modo de teste)
   - **Secret key**: `sk_live_...` (clique em "Reveal" para ver)

Cole no `.env`:
```
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

---

## PARTE 5 — CONFIGURAR O SUPABASE CLI E EDGE FUNCTIONS

As Edge Functions são pequenos servidores que ficam dentro do Supabase.
Elas processam pagamentos e enviam emails com segurança.

### Passo 5.1 — Instalar o Supabase CLI

```bash
# Instalar globalmente
npm install -g supabase

# Verificar instalação
supabase --version
# Deve mostrar: 1.x.x
```

### Passo 5.2 — Fazer login no Supabase via terminal

```bash
supabase login
```

Vai abrir o navegador. Faça login com sua conta Supabase e autorize.
Volta pro terminal automaticamente.

### Passo 5.3 — Conectar seu projeto

Você precisa do **Project Reference ID** do seu projeto Supabase.
Para encontrar: Supabase Dashboard → Settings ⚙️ → General → **Project ID**
(É um código como `abcdefghijklmnop`)

```bash
# Execute dentro da pasta do projeto:
supabase link --project-ref SEU_PROJECT_ID

# Ele vai pedir a senha do banco de dados que você criou no Passo 3.1
```

### Passo 5.4 — Configurar as chaves secretas nas Edge Functions

Esses são os segredos que as funções precisam para funcionar.
**NUNCA** ficam no código — ficam guardados com segurança no Supabase.

```bash
# Chave secreta do Stripe (começa com sk_)
supabase secrets set STRIPE_SECRET_KEY=sk_live_SUACHAVEAQUI

# Webhook secret do Stripe (vamos pegar no próximo passo)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_SUACHAVEAQUI

# URL do seu site
supabase secrets set SITE_URL=https://globalwealthradar.com

# Chave do Resend para emails (vamos pegar depois)
supabase secrets set RESEND_API_KEY=re_SUACHAVEAQUI
```

### Passo 5.5 — Fazer o deploy das Edge Functions

```bash
# Deploy das 4 funções (uma por vez)
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy check-alerts
supabase functions deploy export-csv
```

Cada uma deve mostrar: `Deployed Function create-checkout` ✅

### Passo 5.6 — Configurar o Webhook do Stripe

Agora vamos dizer ao Stripe para chamar sua Edge Function quando um pagamento acontecer.

1. No Stripe → **Developers** → **Webhooks**
2. Clique em **"+ Add endpoint"**
3. **Endpoint URL**: 
   ```
   https://SEU_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
   ```
   (substitua SEU_PROJECT_ID pelo ID do seu projeto Supabase)
4. Em **"Select events to listen to"**, adicione:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Clique em **"Add endpoint"**
6. Na página do webhook, clique em **"Reveal"** ao lado de **"Signing secret"**
7. Copie o `whsec_...` e rode:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_SEUSECRETAQUI
```

---

## PARTE 6 — CONFIGURAR O ALPHA VANTAGE (dados de ETF)

### Passo 6.1 — Criar conta e pegar a chave

1. Acesse alphavantage.co
2. Clique em **"GET YOUR FREE API KEY"**
3. Preencha: First Name, Last Name, Organization (pode ser "Personal"), Email
4. Clique em **"GET FREE API KEY"**
5. A chave vai aparecer na tela e no email. É algo como: `ABCDEFGHIJ123456`

Cole no `.env`:
```
ALPHA_VANTAGE_KEY=ABCDEFGHIJ123456
```

### Passo 6.2 — Popular o banco com os ETFs

```bash
# Primeiro: popular os metadados (nome, categoria, etc.)
node scripts/seed-etf-metadata.js
```

Deve mostrar:
```
✅ Successfully seeded 20 ETFs
```

```bash
# Testar a atualização de preços (sem escrever no banco)
node scripts/update-etf-data.js --dry-run
```

Se mostrar dados de preço para VTI, VXUS etc., está funcionando! ✅

```bash
# Agora rodar de verdade (vai demorar ~5 minutos por causa dos delays da API)
node scripts/update-etf-data.js
```

---

## PARTE 7 — CONFIGURAR O RESEND (emails de alerta)

### Passo 7.1 — Criar conta

1. Acesse resend.com
2. Clique em **"Sign Up"**
3. Crie a conta com seu email

### Passo 7.2 — Criar e verificar seu domínio

Para enviar emails profissionais (alerts@globalwealthradar.com), você precisa verificar seu domínio.

1. No Resend, clique em **"Domains"** → **"Add Domain"**
2. Digite seu domínio: `globalwealthradar.com`
3. O Resend vai mostrar alguns registros DNS para adicionar

**No Cloudflare** (ou onde comprou o domínio):
1. Acesse cloudflare.com → seu domínio → **DNS**
2. Adicione cada registro mostrado pelo Resend (TXT, MX)
3. Volte no Resend e clique em **"Verify"**
4. Aguarde até 24h (geralmente menos de 1h)

### Passo 7.3 — Pegar a API key

1. Resend → **API Keys** → **"Create API Key"**
2. Name: `global-wealth-radar`
3. Permission: **Full Access**
4. Clique em **Create**
5. Copie a chave (começa com `re_`)

```bash
supabase secrets set RESEND_API_KEY=re_SUACHAVEAQUI
```

Também cole no `.env`:
```
RESEND_API_KEY=re_SUACHAVEAQUI
```

---

## PARTE 8 — ADICIONAR OS SECRETS NO GITHUB

O GitHub precisa das suas chaves para fazer o deploy automaticamente.
Essas chaves ficam guardadas com segurança e nunca aparecem no código.

### Passo 8.1 — Acessar os Secrets

1. No GitHub, abra seu repositório `global-wealth-radar`
2. Clique em **"Settings"** (aba no topo)
3. No menu esquerdo, clique em **"Secrets and variables"** → **"Actions"**
4. Clique em **"New repository secret"**

### Passo 8.2 — Adicionar cada secret

Adicione um por um clicando em **"New repository secret"**:

| Name (exatamente assim) | Value |
|---|---|
| `PUBLIC_SUPABASE_URL` | Seu Supabase URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Sua anon key do Supabase |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Sua publishable key do Stripe |
| `STRIPE_PRICE_MONTHLY` | price_... do plano mensal |
| `STRIPE_PRICE_ANNUAL` | price_... do plano anual |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua service_role key do Supabase |
| `ALPHA_VANTAGE_KEY` | Sua chave do Alpha Vantage |

Para cada um:
1. Clique em **"New repository secret"**
2. **Name**: exatamente como na tabela
3. **Secret**: o valor correspondente
4. Clique em **"Add secret"**

---

## PARTE 9 — PRIMEIRO DEPLOY (colocar o site no ar)

### Passo 9.1 — Atualizar o domínio nos arquivos

Antes de publicar, atualize seu domínio nos arquivos principais.

Abra `astro.config.mjs` e mude a linha:
```javascript
site: 'https://globalwealthradar.com',
```
Para o seu domínio (ou URL temporária do GitHub Pages):
```javascript
site: 'https://SEU_USERNAME.github.io',
```
(Depois você muda de volta quando tiver o domínio)

Abra `public/CNAME` e mude para seu domínio:
```
globalwealthradar.com
```
Se não tiver domínio ainda, deixe o arquivo vazio ou delete-o.

### Passo 9.2 — Enviar tudo para o GitHub

```bash
# Dentro da pasta do projeto
git add .
git commit -m "config: add environment and domain settings"
git push origin main
```

### Passo 9.3 — Acompanhar o deploy

1. No GitHub, clique na aba **"Actions"**
2. Você vai ver um workflow rodando: **"🚀 Deploy to GitHub Pages"**
3. Clique nele para acompanhar
4. Aguarde ~3 minutos
5. Deve aparecer um check verde ✅

### Passo 9.4 — Acessar seu site

Após o deploy, seu site estará em:
```
https://SEU_USERNAME.github.io/global-wealth-radar
```

ou se configurou o domínio próprio:
```
https://globalwealthradar.com
```

---

## PARTE 10 — DOMÍNIO PRÓPRIO (opcional mas recomendado)

### Passo 10.1 — Comprar o domínio

Recomendação: **Cloudflare Registrar** (cloudflare.com/products/registrar)
- Mais barato (~$10/ano)
- Já tem proteção DDoS e CDN gratuitos
- Alternativas: Namecheap, Google Domains

Pesquise `globalwealthradar.com` — se estiver disponível, compre.

### Passo 10.2 — Configurar DNS no Cloudflare

No Cloudflare, com seu domínio selecionado → **DNS** → **Records**:

Adicione estes registros (clique em **"Add record"** para cada um):

```
Tipo: A    | Nome: @   | Conteúdo: 185.199.108.153 | TTL: Auto
Tipo: A    | Nome: @   | Conteúdo: 185.199.109.153 | TTL: Auto
Tipo: A    | Nome: @   | Conteúdo: 185.199.110.153 | TTL: Auto
Tipo: A    | Nome: @   | Conteúdo: 185.199.111.153 | TTL: Auto
Tipo: CNAME| Nome: www | Conteúdo: SEU_USERNAME.github.io | TTL: Auto
```

⚠️ No Cloudflare, deixe o proxy (nuvem laranja) **DESLIGADO** (cinza) para os registros A. O GitHub Pages precisa ver o IP direto.

### Passo 10.3 — Configurar no GitHub Pages

1. GitHub → seu repositório → **Settings** → **Pages**
2. Em **Custom domain**, digite: `globalwealthradar.com`
3. Clique em **Save**
4. Aguarde alguns minutos e marque **"Enforce HTTPS"**

### Passo 10.4 — Atualizar as URLs

Agora que tem o domínio, atualize os arquivos:

**`astro.config.mjs`**:
```javascript
site: 'https://globalwealthradar.com',
```

**`public/CNAME`**:
```
globalwealthradar.com
```

**Supabase** → Authentication → URL Configuration:
```
Site URL: https://globalwealthradar.com
Redirect URLs: https://globalwealthradar.com/auth/callback
```

Envie as mudanças:
```bash
git add .
git commit -m "config: update to custom domain"
git push origin main
```

---

## PARTE 11 — TESTAR TUDO (checklist)

Faça cada teste abaixo e marque ✅:

### 11.1 — Site básico
```
□ Abrir https://SEU_DOMINIO.com — landing page abre?
□ Clicar em "Start Free" — vai para /dashboard?
□ Dashboard mostra dados de ETF? (precisa ter rodado o script de update)
□ Blog abre e mostra os 3 posts?
□ Post individual abre e lê corretamente?
```

### 11.2 — Login
```
□ Clicar em "Sign in" — vai para /auth/signin?
□ Clicar em "Continue with Google" — abre tela do Google?
□ Fazer login com Google — redireciona para /dashboard?
□ Header mostra foto do usuário e "Sign out"?
□ No Supabase → Table Editor → profiles — apareceu uma linha com seus dados?
```

### 11.3 — Stripe (modo de teste)
```
□ Ir para /pricing — página carrega com os planos?
□ Clicar em "Start Premium →" — redireciona para Stripe Checkout?
□ Na página do Stripe, usar cartão de teste: 4242 4242 4242 4242
  (qualquer data futura, qualquer CVV, qualquer CEP)
□ Após pagamento, redireciona para /dashboard?
□ No Supabase → profiles — is_premium = true?
□ Acessar /premium — funciona sem redirecionar para /pricing?
```

### 11.4 — Funcionalidades Premium
```
□ /premium/etf-tracker — mostra todos os ETFs?
□ /premium/watchlist — consigo adicionar um ticker (ex: VTI)?
□ /premium/watchlist — consigo criar um alerta de preço?
□ /premium/sovereign-risk — mostra a tabela de países?
□ Botão "Export CSV" — baixa um arquivo .csv?
```

### 11.5 — Newsletter
```
□ Na landing page, digitar um email e clicar "Subscribe Free"
□ No Supabase → newsletter_subscribers — apareceu o email?
```

### 11.6 — Deploy automático
```
□ Fazer qualquer mudança no código (ex: mudar um texto)
□ git add . && git commit -m "test" && git push
□ GitHub → Actions — novo deploy iniciou automaticamente?
□ Após ~3 minutos, mudança aparece no site ao vivo?
```

---

## PARTE 12 — CONFIGURAR O SEO (ser encontrado no Google)

### Passo 12.1 — Google Search Console

1. Acesse search.google.com/search-console
2. Faça login com Google
3. Clique em **"Add property"**
4. Escolha **"Domain"** e digite `globalwealthradar.com`
5. Ele vai pedir para verificar com um registro DNS TXT
6. No Cloudflare → DNS → Add record:
   - Tipo: TXT
   - Nome: @
   - Conteúdo: o código que o Google deu
7. Volte no Google Search Console e clique em **"Verify"**

### Passo 12.2 — Submeter o Sitemap

1. No Search Console, no menu esquerdo clique em **"Sitemaps"**
2. Em "Add a new sitemap", digite:
   ```
   sitemap-index.xml
   ```
3. Clique em **"Submit"**

O Google vai começar a indexar seu site em 1-2 semanas.

---

## PARTE 13 — WORKFLOW DO DIA A DIA

Após o setup inicial, sua rotina será:

### Para escrever um novo post de blog:

1. Crie um arquivo em `src/content/blog/meu-novo-post.md`
2. Copie o formato de um dos posts existentes (frontmatter no topo)
3. Escreva o conteúdo em Markdown
4. Envie para o GitHub:
```bash
git add .
git commit -m "blog: new post - nome do post"
git push
```
5. Deploy automático em ~3 minutos ✅

### Para atualizar dados de ETF manualmente:
```bash
node scripts/update-etf-data.js
```

### Para ver os logs de alertas enviados:
- Supabase → Table Editor → `alert_history`

### Para ver os assinantes da newsletter:
- Supabase → Table Editor → `newsletter_subscribers`

### Para ver os usuários premium:
- Supabase → Table Editor → `profiles` → filtrar `is_premium = true`

---

## PROBLEMAS COMUNS E SOLUÇÕES

### "npm: command not found"
→ Node.js não está instalado. Vá em nodejs.org e instale.

### "git: command not found" (Windows)
→ Git não está instalado. Vá em git-scm.com e instale.

### GitHub Actions falhou (X vermelho)
→ Clique no X → veja qual step falhou → geralmente é um Secret faltando
→ Verifique se todos os 7 Secrets estão adicionados corretamente no GitHub

### Login com Google não funciona
→ Verifique se a Redirect URL no Google Cloud Console está exatamente igual à do Supabase
→ Verifique se ativou o Google Provider no Supabase
→ Verifique se o Site URL do Supabase está correto

### Stripe Checkout não redireciona
→ Verifique se a Edge Function `create-checkout` foi deployed
→ Verifique se o `STRIPE_SECRET_KEY` está correto nos secrets do Supabase
→ Teste: `supabase functions list` — deve mostrar as 4 funções

### ETF data está vazio no dashboard
→ Rode `node scripts/seed-etf-metadata.js`
→ Depois `node scripts/update-etf-data.js`
→ Verifique se `SUPABASE_SERVICE_KEY` está no `.env`

### Site mostra erro 404 após deploy
→ Verifique se o GitHub Pages está configurado como "GitHub Actions" (não "Deploy from branch")
→ Verifique se o `site` no `astro.config.mjs` está com o domínio correto

### "Permission denied" ao fazer push
→ Use o Personal Access Token como senha (não sua senha do GitHub)

---

## DICAS FINAIS

### Modo de Teste vs. Produção no Stripe
- Use `pk_test_` e `sk_test_` enquanto está testando
- Troque para `pk_live_` e `sk_live_` quando for ao ar de verdade
- No modo de teste, use o cartão: `4242 4242 4242 4242`

### Onde ver seus dados
| O que | Onde ver |
|---|---|
| Usuários | Supabase → Table Editor → profiles |
| Pagamentos | Stripe → Dashboard |
| Emails enviados | Resend → Logs |
| ETF updates | Supabase → Table Editor → etf_update_log |
| Alertas disparados | Supabase → Table Editor → alert_history |
| Deploy history | GitHub → Actions |
| Tráfego do site | Google Search Console |

### Próximos passos após o MVP
1. **Escrever mais posts** — SEO é um jogo de conteúdo
2. **Postar no Reddit** — r/investing, r/financialindependence, r/expats
3. **Twitter/X** — compartilhe screenshots do dashboard
4. **Product Hunt** — lance na segunda-feira de manhã
5. **Upgrade Alpha Vantage** — quando tiver +50 ETFs ($50/mês)
6. **Upgrade Supabase** — quando tiver +1.000 usuários ($25/mês)

---

## RESUMO DOS COMANDOS PRINCIPAIS

```bash
# Rodar localmente (desenvolvimento)
npm run dev

# Ver o site em produção local
npm run build && npm run preview

# Enviar mudanças para o ar
git add .
git commit -m "descrição da mudança"
git push

# Atualizar dados de ETF
node scripts/update-etf-data.js

# Seed inicial dos ETFs (só uma vez)
node scripts/seed-etf-metadata.js

# Testar sem escrever no banco
node scripts/update-etf-data.js --dry-run

# Deploy das Edge Functions (quando mudar o código delas)
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy check-alerts
supabase functions deploy export-csv

# Ver logs das Edge Functions
supabase functions logs create-checkout
```

---

*Se travar em qualquer passo, releia a seção "Problemas Comuns".
Boa sorte com o Global Wealth Radar! 🌍*
