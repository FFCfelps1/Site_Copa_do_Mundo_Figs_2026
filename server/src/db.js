import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataRoot = process.env.VERCEL ? '/tmp' : __dirname;
const usersDir = path.join(dataRoot, 'data', 'users');

export function getUsersDir() {
  return usersDir;
}

// Garantir que o diretório de usuários existe
if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir, { recursive: true });
}

// Arquivo de índice de usuários
const usersIndexFile = path.join(usersDir, 'index.json');

function getUsersIndex() {
  if (!fs.existsSync(usersIndexFile)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(usersIndexFile, 'utf-8'));
  } catch {
    return {};
  }
}

function saveUsersIndex(index) {
  fs.writeFileSync(usersIndexFile, JSON.stringify(index, null, 2), 'utf-8');
}

export function getUserFile(userId) {
  return path.join(usersDir, `${userId}.json`);
}

export function createUser(email, password) {
  const usersIndex = getUsersIndex();
  
  // Verificar se email já existe
  if (Object.values(usersIndex).some(u => u.email === email)) {
    throw new Error('Email already registered');
  }

  const userId = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  // Criar estrutura do usuário
  const user = {
    id: userId,
    email,
    passwordHash: hashedPassword,
    createdAt: now,
    updatedAt: now
  };

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
  fs.writeFileSync(getUserFile(userId), JSON.stringify(figurinhas, null, 2), 'utf-8');
  saveUsersIndex(usersIndex);

  return { id: userId, email, createdAt: now };
}

export function validateUser(email, password) {
  const usersIndex = getUsersIndex();
  const userId = Object.entries(usersIndex).find(
    ([_, u]) => u.email === email
  )?.[0];

  if (!userId) {
    return null;
  }

  // Ler o arquivo do usuário para obter o hash da senha
  try {
    const filePath = getUserFile(userId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Buscar informação de senha (pode estar em outro local, vamos adicionar)
    // Por enquanto vamos procurar na pasta de usuários por um arquivo de credenciais
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

export function getUserById(userId) {
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

export function saveFigurinhas(userId, figurinhas) {
  const filePath = getUserFile(userId);
  figurinhas.lastUpdated = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(figurinhas, null, 2), 'utf-8');
}
