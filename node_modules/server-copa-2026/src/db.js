import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from '@upstash/redis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataRoot = process.env.VERCEL ? '/tmp' : __dirname;
const usersDir = path.join(dataRoot, 'data', 'users');
const kvConfigured = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const storageType = kvConfigured ? 'kv' : 'file';
const redis = kvConfigured ? Redis.fromEnv() : null;
const usersIndexKey = 'users:index';

function getUserDataKey(userId) {
  return `users:${userId}:figurinhas`;
}

function getUserCredKey(userId) {
  return `users:${userId}:cred`;
}

export function getUsersDir() {
  return usersDir;
}

export function getStorageType() {
  return storageType;
}

// Garantir que o diretório de usuários existe
if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir, { recursive: true });
}

// Arquivo de índice de usuários
const usersIndexFile = path.join(usersDir, 'index.json');

async function getUsersIndex() {
  if (storageType === 'kv') {
    const index = await redis.get(usersIndexKey);
    return index || {};
  }

  if (!fs.existsSync(usersIndexFile)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(usersIndexFile, 'utf-8'));
  } catch {
    return {};
  }
}

async function saveUsersIndex(index) {
  if (storageType === 'kv') {
    await redis.set(usersIndexKey, index);
    return;
  }

  fs.writeFileSync(usersIndexFile, JSON.stringify(index, null, 2), 'utf-8');
}

export function getUserFile(userId) {
  return path.join(usersDir, `${userId}.json`);
}

export async function createUser(email, password) {
  const usersIndex = await getUsersIndex();
  
  // Verificar se email já existe
  if (Object.values(usersIndex).some(u => u.email === email)) {
    throw new Error('Email already registered');
  }

  const userId = uuidv4();
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  // Criar arquivo de figurinhas do usuário
  const figurinhas = {
    userId,
    grupos: {},
    lastUpdated: now
  };

  // Adicionar índice
  usersIndex[userId] = {
    email,
    createdAt: now,
    updatedAt: now
  };

  // Salvar
  if (storageType === 'kv') {
    await redis.set(getUserDataKey(userId), figurinhas);
    await redis.set(getUserCredKey(userId), { userId, passwordHash, updatedAt: now });
  } else {
    fs.writeFileSync(getUserFile(userId), JSON.stringify(figurinhas, null, 2), 'utf-8');
    const credFile = path.join(usersDir, `${userId}-cred.json`);
    fs.writeFileSync(credFile, JSON.stringify({ userId, passwordHash }, null, 2), 'utf-8');
  }

  await saveUsersIndex(usersIndex);

  return { id: userId, email, createdAt: now };
}

export async function validateUser(email, password) {
  const usersIndex = await getUsersIndex();
  const userId = Object.entries(usersIndex).find(
    ([_, u]) => u.email === email
  )?.[0];

  if (!userId) {
    return null;
  }

  if (storageType === 'kv') {
    const cred = await redis.get(getUserCredKey(userId));
    if (cred?.passwordHash && bcrypt.compareSync(password, cred.passwordHash)) {
      return { id: userId, email };
    }
    return null;
  }

  // Ler o arquivo do usuário para obter o hash da senha
  try {
    const credFile = path.join(usersDir, `${userId}-cred.json`);
    if (fs.existsSync(credFile)) {
      const cred = JSON.parse(fs.readFileSync(credFile, 'utf-8'));
      if (bcrypt.compareSync(password, cred.passwordHash)) {
        return { id: userId, email };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function getUserById(userId) {
  if (storageType === 'kv') {
    return (await redis.get(getUserDataKey(userId))) || null;
  }

  try {
    const filePath = getUserFile(userId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function saveFigurinhas(userId, figurinhas) {
  figurinhas.lastUpdated = new Date().toISOString();

  if (storageType === 'kv') {
    await redis.set(getUserDataKey(userId), figurinhas);
    return;
  }

  const filePath = getUserFile(userId);
  fs.writeFileSync(filePath, JSON.stringify(figurinhas, null, 2), 'utf-8');
}
