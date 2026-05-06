import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { createUser, getUserById, saveFigurinhas, getUserFile } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticação baseada em sessionId (simples, sem JWT para simplificar)
const sessions = new Map();

function verifySession(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.body.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = sessions.get(sessionId);
  next();
}

// Carregar grupos no startup
let grupos = [];
function loadGrupos() {
  try {
    const gruposFile = path.join(__dirname, 'data', 'grupos.json');
    grupos = JSON.parse(fs.readFileSync(gruposFile, 'utf-8'));
  } catch (err) {
    console.error('Error loading grupos:', err);
  }
}

loadGrupos();

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validar email simples
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = createUser(email, password);
    
    // Salvar hash de senha em arquivo separado
    const usersDir = path.join(__dirname, 'data', 'users');
    const credFile = path.join(usersDir, `${user.id}-cred.json`);
    fs.writeFileSync(credFile, JSON.stringify({
      userId: user.id,
      passwordHash: bcrypt.hashSync(password, 10)
    }, null, 2), 'utf-8');

    res.status(201).json({ 
      user: { id: user.id, email: user.email },
      message: 'User created successfully'
    });
  } catch (err) {
    if (err.message.includes('already registered')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Buscar usuário por email
    const usersDir = path.join(__dirname, 'data', 'users');
    const indexFile = path.join(usersDir, 'index.json');
    
    if (!fs.existsSync(indexFile)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
    const userId = Object.entries(index).find(([_, u]) => u.email === email)?.[0];

    if (!userId) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verificar senha
    const credFile = path.join(usersDir, `${userId}-cred.json`);
    if (!fs.existsSync(credFile)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const cred = JSON.parse(fs.readFileSync(credFile, 'utf-8'));
    if (!bcrypt.compareSync(password, cred.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Criar sessão
    const sessionId = uuidv4();
    sessions.set(sessionId, userId);

    res.json({ 
      sessionId,
      user: { id: userId, email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', verifySession, (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.json({ message: 'Logged out successfully' });
});

// ==================== GRUPOS & TIMES ROUTES ====================

app.get('/api/grupos', (req, res) => {
  res.json(grupos);
});

app.get('/api/grupos/:grupoId', (req, res) => {
  const grupo = grupos.find(g => g.id === req.params.grupoId);
  if (!grupo) {
    return res.status(404).json({ error: 'Grupo not found' });
  }
  res.json(grupo);
});

// ==================== FIGURINHAS ROUTES ====================

app.get('/api/figurinhas', verifySession, (req, res) => {
  try {
    const user = getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/figurinhas/:selecionId', verifySession, (req, res) => {
  try {
    const user = getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const selecionFigs = user.grupos[req.params.selecionId] || { base: [], fw: [], cc: [] };
    res.json(selecionFigs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle figurinha
app.post('/api/figurinhas/toggle', verifySession, (req, res) => {
  try {
    const { selecionId, tipo, numero } = req.body;

    if (!selecionId || !tipo || numero === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['base', 'fw', 'cc'].includes(tipo)) {
      return res.status(400).json({ error: 'Invalid tipo' });
    }

    const user = getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Inicializar grupo se não existe
    if (!user.grupos[selecionId]) {
      user.grupos[selecionId] = { coletadas: [], duplicatas: {} };
    }

    let selecionData = user.grupos[selecionId];
    
    // Se é um array antigo, converter para novo formato
    if (Array.isArray(selecionData)) {
      user.grupos[selecionId] = {
        coletadas: selecionData,
        duplicatas: {}
      };
      selecionData = user.grupos[selecionId];
    }

    // Garantir que coletadas existe
    if (!selecionData.coletadas) {
      selecionData.coletadas = [];
    }

    // Toggle - trabalhar com coletadas
    const arr = selecionData.coletadas;
    const index = arr.indexOf(numero);
    
    if (index > -1) {
      arr.splice(index, 1); // Remover
    } else {
      arr.push(numero); // Adicionar
    }

    saveFigurinhas(req.userId, user);
    
    res.json({ 
      figurinha: { selecionId, tipo, numero, coletada: index === -1 },
      selecionFigs: selecionData.coletadas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter estatísticas
app.get('/api/stats', verifySession, (req, res) => {
  try {
    const user = getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = {
      total: 0,
      coletadas: 0,
      percentual: 0,
      porSelecao: {},
      porGrupo: {}
    };

    // Calcular totais
    grupos.forEach(grupo => {
      let grupoColetadas = 0;
      let grupoTotal = 0;

      grupo.times.forEach(time => {
        const timeId = time.id;
        grupoTotal += 20; // Apenas base para grupos
        
        if (!stats.porSelecao[timeId]) {
          stats.porSelecao[timeId] = { total: 20, coletadas: 0, percentual: 0 };
        }

        // Lidar com dados antigos (array) e novos (objeto com coletadas)
        const timeData = user.grupos[timeId];
        let timeColetadas = 0;
        
        if (Array.isArray(timeData)) {
          // Formato antigo: array de números
          timeColetadas = timeData.length;
        } else if (timeData && typeof timeData === 'object' && timeData.coletadas) {
          // Novo formato: {coletadas: [...], duplicatas: {...}}
          timeColetadas = timeData.coletadas.length;
        }
        
        stats.porSelecao[timeId].coletadas = timeColetadas;
        stats.porSelecao[timeId].percentual = Math.round((timeColetadas / 20) * 100);
        
        grupoColetadas += timeColetadas;
      });

      stats.porGrupo[grupo.id] = {
        total: grupoTotal,
        coletadas: grupoColetadas,
        percentual: Math.round((grupoColetadas / grupoTotal) * 100)
      };

      stats.total += grupoTotal;
      stats.coletadas += grupoColetadas;
    });

    // Adicionar estatísticas de coleções especiais
    const fwData = user.grupos['GLOBAL_FW'] || [];
    const fwColetadas = Array.isArray(fwData) ? fwData.length : (fwData.coletadas || []).length;

    const ccData = user.grupos['GLOBAL_CC'] || [];
    const ccColetadas = Array.isArray(ccData) ? ccData.length : (ccData.coletadas || []).length;

    stats.porSelecao['GLOBAL_FW'] = {
      total: 19,
      coletadas: fwColetadas,
      percentual: Math.round((fwColetadas / 19) * 100)
    };

    stats.porSelecao['GLOBAL_CC'] = {
      total: 14,
      coletadas: ccColetadas,
      percentual: Math.round((ccColetadas / 14) * 100)
    };

    // Total global inclui FW e CC
    stats.total += 19 + 14;
    stats.coletadas += fwColetadas + ccColetadas;
    stats.percentual = stats.total > 0 ? Math.round((stats.coletadas / stats.total) * 100) : 0;

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add duplicate
app.post('/api/figurinhas/add-duplicate', verifySession, (req, res) => {
  try {
    const { selecionId, numero } = req.body;

    if (!selecionId || numero === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Obter dados do selecionId
    let selecionData = user.grupos[selecionId];
    
    // Se não existe, criar novo
    if (!selecionData) {
      user.grupos[selecionId] = {
        coletadas: [],
        duplicatas: {}
      };
      selecionData = user.grupos[selecionId];
    }
    
    // Se é um array (formato antigo), converter para novo formato
    if (Array.isArray(selecionData)) {
      user.grupos[selecionId] = {
        coletadas: selecionData,
        duplicatas: {}
      };
      selecionData = user.grupos[selecionId];
    }

    // Inicializar duplicatas se não existe
    if (!selecionData.duplicatas) {
      selecionData.duplicatas = {};
    }

    // Incrementar duplicata
    selecionData.duplicatas[numero] = (selecionData.duplicatas[numero] || 0) + 1;

    saveFigurinhas(req.userId, user);
    
    res.json({ 
      duplicata: { selecionId, numero, count: selecionData.duplicatas[numero] },
      duplicatas: selecionData.duplicatas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove duplicate
app.post('/api/figurinhas/remove-duplicate', verifySession, (req, res) => {
  try {
    const { selecionId, numero } = req.body;

    if (!selecionId || numero === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let selecionData = user.grupos[selecionId];
    
    if (!selecionData) {
      return res.status(404).json({ error: 'Selecao not found' });
    }

    // Se é um array (formato antigo), converter para novo formato
    if (Array.isArray(selecionData)) {
      user.grupos[selecionId] = {
        coletadas: selecionData,
        duplicatas: {}
      };
      selecionData = user.grupos[selecionId];
    }

    // Decrementar duplicata
    if (selecionData.duplicatas && selecionData.duplicatas[numero] > 0) {
      selecionData.duplicatas[numero]--;
      
      // Remover se chegar a 0
      if (selecionData.duplicatas[numero] === 0) {
        delete selecionData.duplicatas[numero];
      }
    }

    saveFigurinhas(req.userId, user);
    
    res.json({ 
      duplicata: { selecionId, numero, count: selecionData.duplicatas?.[numero] || 0 },
      duplicatas: selecionData.duplicatas || {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Grupos loaded: ${grupos.length}`);
});
