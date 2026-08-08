// server.js — Servidor de build do ChatGó
// Recebe o código do app gerado pela IA, compila em APK usando uma fila
// (pra não travar quando vários usuários pedem build ao mesmo tempo).
//
// COMO USAR:
// 1. npm install express bullmq ioredis
// 2. Rodar Redis no servidor: sudo apt install redis-server -y && sudo systemctl start redis
// 3. node server.js
// 4. Em outro processo: node worker.js (o worker que realmente compila)

import express from "express";
import { Queue, QueueEvents } from "bullmq";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
app.use(express.json({ limit: "50mb" }));

const connection = { host: "127.0.0.1", port: 6379 };
const buildQueue = new Queue("apk-builds", { connection });
const queueEvents = new QueueEvents("apk-builds", { connection });

const BUILDS_DIR = "/tmp/chatgo-builds";
fs.mkdirSync(BUILDS_DIR, { recursive: true });

/**
 * POST /build
 * body: { projectFiles: { "App.js": "...", "package.json": "...", ... } }
 * Recebe os arquivos do projeto (gerados pela IA a partir da entrevista)
 * e coloca um job na fila de build.
 */
app.post("/build", async (req, res) => {
  const { projectFiles } = req.body;
  if (!projectFiles || Object.keys(projectFiles).length === 0) {
    return res.status(400).json({ error: "Nenhum arquivo de projeto foi enviado." });
  }

  const projectId = crypto.randomUUID();
  const dir = path.join(BUILDS_DIR, projectId);
  fs.mkdirSync(dir, { recursive: true });

  for (const [filePath, content] of Object.entries(projectFiles)) {
    const fullPath = path.join(dir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  const job = await buildQueue.add("build-apk", { projectId, dir }, {
    attempts: 1,
    removeOnComplete: 50,
    removeOnFail: 50,
  });

  res.json({ jobId: job.id, projectId, status: "na fila" });
});

/**
 * GET /build/:jobId/status
 * Consulta o andamento de um build (a pessoa pode ficar checando até ficar pronto).
 */
app.get("/build/:jobId/status", async (req, res) => {
  const job = await buildQueue.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Build não encontrado." });

  const state = await job.getState();
  const result = job.returnvalue;

  res.json({
    status: state, // waiting | active | completed | failed
    apkUrl: state === "completed" ? result?.apkUrl : null,
    erro: state === "failed" ? job.failedReason : null,
  });
});

app.listen(3001, () => console.log("Servidor de build do ChatGó rodando na porta 3001"));// worker.js — quem de fato compila os apps, um de cada vez (ou N por vez)
// Roda separado do server.js: node worker.js
//
// Fluxo de cada job:
// 1. npm install no projeto gerado
// 2. npx expo prebuild (gera a pasta /android)
// 3. ./gradlew assembleRelease (compila o .apk de verdade)
// 4. Sobe o .apk pro armazenamento (S3/R2) e devolve a URL pública

import { Worker } from "bullmq";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);
const connection = { host: "127.0.0.1", port: 6379 };

// Troque pela sua função real de upload (S3, R2, Backblaze...)
async function subirParaArmazenamento(caminhoApk, projectId) {
  // Exemplo com AWS S3 (adapte pro seu provedor):
  // const { PutObjectCommand, S3Client } = await import("@aws-sdk/client-s3");
  // const client = new S3Client({ region: "auto", endpoint: process.env.S3_ENDPOINT, credentials: {...} });
  // await client.send(new PutObjectCommand({
  //   Bucket: "chatgo-apks",
  //   Key: `${projectId}.apk`,
  //   Body: fs.createReadStream(caminhoApk),
  // }));
  // return `https://seu-bucket.exemplo.com/${projectId}.apk`;

  throw new Error("Configure a função subirParaArmazenamento() com seu provedor de armazenamento.");
}

const worker = new Worker(
  "apk-builds",
  async (job) => {
    const { projectId, dir } = job.data;

    await job.updateProgress(10);
    await execAsync(`cd ${dir} && npm install`, { maxBuffer: 1024 * 1024 * 50 });

    await job.updateProgress(35);
    await execAsync(`cd ${dir} && npx expo prebuild --platform android`, { maxBuffer: 1024 * 1024 * 50 });

    await job.updateProgress(60);
    await execAsync(`cd ${dir}/android && ./gradlew assembleRelease`, { maxBuffer: 1024 * 1024 * 100 });

    const apkPath = path.join(dir, "android/app/build/outputs/apk/release/app-release.apk");
    if (!fs.existsSync(apkPath)) {
      throw new Error("Build terminou mas o .apk não foi encontrado — veja os logs do Gradle.");
    }

    await job.updateProgress(90);
    const apkUrl = await subirParaArmazenamento(apkPath, projectId);

    // limpa a pasta temporária do build
    fs.rmSync(dir, { recursive: true, force: true });

    await job.updateProgress(100);
    return { apkUrl };
  },
  {
    connection,
    concurrency: 2, // quantos builds rodam ao mesmo tempo — ajuste conforme a RAM do servidor
    limiter: { max: 2, duration: 1000 }, // evita estourar CPU com picos de pedidos
  }
);

worker.on("completed", (job, result) => {
  console.log(`Build ${job.data.projectId} concluído: ${result.apkUrl}`);
});

worker.on("failed", (job, err) => {
  console.error(`Build ${job.data.projectId} falhou: ${err.message}`);
});

console.log("Worker de build do ChatGó rodando — aguardando jobs na fila...");// worker.js — quem de fato compila os apps, um de cada vez (ou N por vez)
// Roda separado do server.js: node worker.js
//
// Fluxo de cada job:
// 1. npm install no projeto gerado
// 2. npx expo prebuild (gera a pasta /android)
// 3. ./gradlew assembleRelease (compila o .apk de verdade)
// 4. Sobe o .apk pro armazenamento (S3/R2) e devolve a URL pública

import { Worker } from "bullmq";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);
const connection = { host: "127.0.0.1", port: 6379 };

// Troque pela sua função real de upload (S3, R2, Backblaze...)
async function subirParaArmazenamento(caminhoApk, projectId) {
  // Exemplo com AWS S3 (adapte pro seu provedor):
  // const { PutObjectCommand, S3Client } = await import("@aws-sdk/client-s3");
  // const client = new S3Client({ region: "auto", endpoint: process.env.S3_ENDPOINT, credentials: {...} });
  // await client.send(new PutObjectCommand({
  //   Bucket: "chatgo-apks",
  //   Key: `${projectId}.apk`,
  //   Body: fs.createReadStream(caminhoApk),
  // }));
  // return `https://seu-bucket.exemplo.com/${projectId}.apk`;

  throw new Error("Configure a função subirParaArmazenamento() com seu provedor de armazenamento.");
}

const worker = new Worker(
  "apk-builds",
  async (job) => {
    const { projectId, dir } = job.data;

    await job.updateProgress(10);
    await execAsync(`cd ${dir} && npm install`, { maxBuffer: 1024 * 1024 * 50 });

    await job.updateProgress(35);
    await execAsync(`cd ${dir} && npx expo prebuild --platform android`, { maxBuffer: 1024 * 1024 * 50 });

    await job.updateProgress(60);
    await execAsync(`cd ${dir}/android && ./gradlew assembleRelease`, { maxBuffer: 1024 * 1024 * 100 });

    const apkPath = path.join(dir, "android/app/build/outputs/apk/release/app-release.apk");
    if (!fs.existsSync(apkPath)) {
      throw new Error("Build terminou mas o .apk não foi encontrado — veja os logs do Gradle.");
    }

    await job.updateProgress(90);
    const apkUrl = await subirParaArmazenamento(apkPath, projectId);

    // limpa a pasta temporária do build
    fs.rmSync(dir, { recursive: true, force: true });

    await job.updateProgress(100);
    return { apkUrl };
  },
  {
    connection,
    concurrency: 2, // quantos builds rodam ao mesmo tempo — ajuste conforme a RAM do servidor
    limiter: { max: 2, duration: 1000 }, // evita estourar CPU com picos de pedidos
  }
);

worker.on("completed", (job, result) => {
  console.log(`Build ${job.data.projectId} concluído: ${result.apkUrl}`);
});

worker.on("failed", (job, err) => {
  console.error(`Build ${job.data.projectId} falhou: ${err.message}`);
});

console.log("Worker de build do ChatGó rodando — aguardando jobs na fila...");


# ChatGó — Plano Completo

Tudo o que construímos, organizado num só lugar. Marca cada etapa conforme for terminando.

## 1. O que é o ChatGó

Assistente de IA que conversa, cria apps (.apk), vídeos/desenhos animados e edita imagens — com transparência total (nunca esconde limites nem erros) e marca d'água "LP" por padrão.

## 2. Arquivos do projeto e pra que servem

| Arquivo | Função | Vai para |
|---|---|---|
| `chatgo-completo.jsx` | Tela do app inteira (login, chat, configurações) | `src/App.jsx` no GitHub |
| `package.json` | Lista de dependências do projeto | Raiz do repositório |
| `index.html` | Página raiz + Tailwind | Raiz do repositório |
| `main.jsx` *(a seguir)* | Ponto de entrada do React | `src/main.jsx` |
| `vite.config.js` *(a seguir)* | Configuração do build | Raiz do repositório |
| `supabaseClient.js` | Conexão com o banco de dados | `src/supabaseClient.js` |
| `schema.sql` | Tabelas do banco: perfis, projetos, mensagens, uso diário, planos | Colar no SQL Editor do Supabase |
| `server.js` | Recebe pedidos de build e enfileira | Servidor VPS |
| `worker.js` | Compila o `.apk` de verdade | Servidor VPS (processo separado) |
| `guia-servidor-build.md` | Passo a passo de montar o servidor | Leitura |
| `como-criar-o-app-de-verdade.md` | Roteiro das 5 fases, do zero ao app publicado | Leitura |

## 3. Regras de negócio (já implementadas no código)

| Plano | Apps/dia | Vídeos/dia | Imagens/dia | Marca d'água | Preço |
|---|---|---|---|---|---|
| **Free** | 1 | 1 (pergunta os minutos antes) | 10 | Sim, "LP" | Grátis |
| **PRO** | Ilimitado | Ilimitado | Ilimitado | Não | $9.99/mês ou $80.99/ano |
| **Admin (você)** | Ilimitado | Ilimitado | Ilimitado | Não | Grátis, reconhecido automaticamente pelo seu e-mail |

## 4. Ordem de execução — do zero ao app publicado

### Fase A — Repositório (✅ feito)
- [x] Conta no GitHub criada
- [x] Repositório `chatgo` criado
- [x] `App.jsx` colado dentro de `src/`

### Fase B — Completar o projeto (fazendo agora)
- [ ] Adicionar `package.json` na raiz
- [ ] Adicionar `index.html` na raiz
- [ ] Adicionar `src/main.jsx`
- [ ] Adicionar `vite.config.js` na raiz
- [ ] Adicionar `src/supabaseClient.js`

### Fase C — Supabase
- [ ] Criar conta e projeto em supabase.com
- [ ] Rodar o `schema.sql` no SQL Editor
- [ ] Copiar URL + chave "anon public" pro `supabaseClient.js`
- [ ] Ativar login Google e Facebook

### Fase D — Colocar no ar
- [ ] Criar conta no Vercel com o GitHub
- [ ] Importar o repositório `chatgo`
- [ ] Testar o link gerado

### Fase E — Servidor de build
- [ ] Alugar VPS
- [ ] Instalar Java, Node, Android SDK
- [ ] Subir `server.js` e `worker.js`
- [ ] Configurar armazenamento (S3/R2)

### Fase F — Geração real de código do app
- [ ] IA gera o projeto em JSON
- [ ] Ligar ao `POST /build` do servidor

## 5. Fora do escopo de código

- Escala para milhões: múltiplos servidores, comece com 1 VPS
- iOS precisa de Mac
- Login Google/Facebook exige criar app no Google Cloud / Meta

## 6. Próximo passo

Fase B — faltam 3 arquivos pra completar o projeto e importar no Vercel.

{
  "name": "chatgo",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.0"
  }
}


<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ChatGó</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SEU_PROJETO";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
