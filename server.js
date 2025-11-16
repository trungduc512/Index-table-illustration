import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import { run } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, 'indexConfig.json');
let indexConfig = {};
try {
  indexConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
} catch (err) {
  console.warn('indexConfig.json not found or invalid — using empty config');
}

// auto-run seeding on start
await run();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from project root and public folder
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

// API để trả benchmarks.json
app.get('/api/benchmarks', (req, res) => {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'benchmarks.json'), 'utf-8')
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Cannot read benchmarks.json' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// GET current config
app.get('/api/config', (req, res) => {
  res.json(indexConfig);
});

// POST update config; body: { key, totalDocs?, batchSize?, indexFields? }
app.post('/api/config', (req, res) => {
  const { totalDocs, batchSize, indexFields } = req.body;

  if (
    totalDocs === undefined &&
    batchSize === undefined &&
    indexFields === undefined
  ) {
    return res
      .status(400)
      .json({ error: 'Request body must include totalDocs and/or batchSize' });
  }

  if (totalDocs !== undefined) {
    const n = Number(totalDocs);
    if (!Number.isFinite(n) || n <= 0)
      return res
        .status(400)
        .json({ error: 'totalDocs must be a positive number' });
    Object.keys(indexConfig).forEach((k) => {
      indexConfig[k].totalDocs = n;
    });
  }

  if (batchSize !== undefined) {
    const b = Number(batchSize);
    if (!Number.isFinite(b) || b <= 0)
      return res
        .status(400)
        .json({ error: 'batchSize must be a positive number' });
    Object.keys(indexConfig).forEach((k) => {
      indexConfig[k].batchSize = b;
    });
  }

  if (indexFields !== undefined) {
    let parsed;
    if (Array.isArray(indexFields)) parsed = indexFields;
    else if (typeof indexFields === 'string')
      parsed = indexFields
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    else
      return res.status(400).json({
        error: 'indexFields must be an array or comma-separated string',
      });

    if (!indexConfig.withIndex) {
      return res.status(500).json({ error: "Config 'withIndex' not found" });
    }
    indexConfig.withIndex.indexFields = parsed;
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(indexConfig, null, 2));

  res.json({ message: 'Config updated', config: indexConfig });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
