// ===== Conversor Universal =====
// Categorias com fatores relativos a uma unidade base.
// Temperatura é tratada à parte (fórmulas, não fatores).

const CATEGORIES = {
  comprimento: {
    label: 'Comprimento',
    icon: 'fa-ruler',
    base: 'm',
    units: {
      mm: { label: 'Milímetro (mm)', factor: 0.001 },
      cm: { label: 'Centímetro (cm)', factor: 0.01 },
      m: { label: 'Metro (m)', factor: 1 },
      km: { label: 'Quilômetro (km)', factor: 1000 },
      in: { label: 'Polegada (in)', factor: 0.0254 },
      ft: { label: 'Pé (ft)', factor: 0.3048 },
      yd: { label: 'Jarda (yd)', factor: 0.9144 },
      mi: { label: 'Milha (mi)', factor: 1609.344 },
    },
  },
  peso: {
    label: 'Peso',
    icon: 'fa-weight-hanging',
    base: 'kg',
    units: {
      mg: { label: 'Miligrama (mg)', factor: 0.000001 },
      g: { label: 'Grama (g)', factor: 0.001 },
      kg: { label: 'Quilograma (kg)', factor: 1 },
      t: { label: 'Tonelada (t)', factor: 1000 },
      oz: { label: 'Onça (oz)', factor: 0.0283495 },
      lb: { label: 'Libra (lb)', factor: 0.453592 },
    },
  },
  temperatura: {
    label: 'Temperatura',
    icon: 'fa-temperature-half',
    temperature: true,
    units: {
      C: { label: 'Celsius (°C)' },
      F: { label: 'Fahrenheit (°F)' },
      K: { label: 'Kelvin (K)' },
    },
  },
  area: {
    label: 'Área',
    icon: 'fa-vector-square',
    base: 'm2',
    units: {
      cm2: { label: 'Centímetro² (cm²)', factor: 0.0001 },
      m2: { label: 'Metro² (m²)', factor: 1 },
      ha: { label: 'Hectare (ha)', factor: 10000 },
      km2: { label: 'Quilômetro² (km²)', factor: 1000000 },
      ft2: { label: 'Pé² (ft²)', factor: 0.092903 },
      acre: { label: 'Acre', factor: 4046.86 },
    },
  },
  volume: {
    label: 'Volume',
    icon: 'fa-flask',
    base: 'l',
    units: {
      ml: { label: 'Mililitro (ml)', factor: 0.001 },
      l: { label: 'Litro (l)', factor: 1 },
      m3: { label: 'Metro³ (m³)', factor: 1000 },
      gal: { label: 'Galão US (gal)', factor: 3.78541 },
    },
  },
  velocidade: {
    label: 'Velocidade',
    icon: 'fa-gauge-high',
    base: 'mps',
    units: {
      mps: { label: 'Metro/seg (m/s)', factor: 1 },
      kmh: { label: 'Quilômetro/h (km/h)', factor: 0.277778 },
      mph: { label: 'Milha/h (mph)', factor: 0.44704 },
      kn: { label: 'Nó (kn)', factor: 0.514444 },
    },
  },
  dados: {
    label: 'Dados',
    icon: 'fa-database',
    base: 'B',
    units: {
      B: { label: 'Byte (B)', factor: 1 },
      KB: { label: 'Kilobyte (KB)', factor: 1024 },
      MB: { label: 'Megabyte (MB)', factor: 1024 ** 2 },
      GB: { label: 'Gigabyte (GB)', factor: 1024 ** 3 },
      TB: { label: 'Terabyte (TB)', factor: 1024 ** 4 },
    },
  },
};

const HISTORY_KEY = 'conversor:historico';
let currentCategory = 'comprimento';

const el = (id) => document.getElementById(id);
const categoryNav = el('categoryNav');
const fromUnit = el('fromUnit');
const toUnit = el('toUnit');
const inputValue = el('inputValue');
const outputValue = el('outputValue');
const resultText = el('resultText');
const historyList = el('historyList');

// ---- Conversão ----
function toBase(cat, unit, value) {
  if (cat.temperature) {
    if (unit === 'C') return value;
    if (unit === 'F') return (value - 32) * (5 / 9);
    if (unit === 'K') return value - 273.15;
  }
  return value * cat.units[unit].factor;
}

function fromBase(cat, unit, base) {
  if (cat.temperature) {
    if (unit === 'C') return base;
    if (unit === 'F') return base * (9 / 5) + 32;
    if (unit === 'K') return base + 273.15;
  }
  return base / cat.units[unit].factor;
}

function convert(value, from, to) {
  const cat = CATEGORIES[currentCategory];
  const base = toBase(cat, from, value);
  return fromBase(cat, to, base);
}

function format(num) {
  if (!isFinite(num)) return '—';
  // até 6 casas, sem zeros à toa
  return parseFloat(num.toFixed(6)).toLocaleString('pt-BR', { maximumFractionDigits: 6 });
}

// ---- Render ----
function renderCategories() {
  categoryNav.innerHTML = '';
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const btn = document.createElement('button');
    btn.className = 'category-btn' + (key === currentCategory ? ' active' : '');
    btn.innerHTML = `<i class="fa-solid ${cat.icon}"></i> ${cat.label}`;
    btn.addEventListener('click', () => {
      currentCategory = key;
      renderCategories();
      renderUnits();
      doConvert();
    });
    categoryNav.appendChild(btn);
  });
}

function renderUnits() {
  const cat = CATEGORIES[currentCategory];
  const opts = Object.entries(cat.units)
    .map(([key, u]) => `<option value="${key}">${u.label}</option>`)
    .join('');
  fromUnit.innerHTML = opts;
  toUnit.innerHTML = opts;
  const keys = Object.keys(cat.units);
  fromUnit.value = keys[0];
  toUnit.value = keys[1] || keys[0];
}

// ---- Histórico ----
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const items = loadHistory();
  if (!items.length) {
    historyList.innerHTML = '<li class="history-empty">Nenhuma conversão ainda.</li>';
    return;
  }
  historyList.innerHTML = items
    .map((t) => `<li class="history-item"><i class="fa-solid fa-angle-right"></i> ${t}</li>`)
    .join('');
}

function pushHistory(text) {
  const items = loadHistory();
  if (items[0] === text) return; // evita duplicar a última
  items.unshift(text);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 8)));
  renderHistory();
}

// ---- Fluxo principal ----
let historyTimer;
function doConvert() {
  const value = parseFloat(inputValue.value);
  if (isNaN(value)) {
    outputValue.value = '';
    resultText.textContent = '—';
    return;
  }
  const result = convert(value, fromUnit.value, toUnit.value);
  outputValue.value = format(result);

  const cat = CATEGORIES[currentCategory];
  const fromLabel = cat.units[fromUnit.value].label;
  const toLabel = cat.units[toUnit.value].label;
  const phrase = `${format(value)} ${fromLabel} = ${format(result)} ${toLabel}`;
  resultText.textContent = phrase;

  // grava no histórico após o usuário parar de digitar
  clearTimeout(historyTimer);
  historyTimer = setTimeout(() => pushHistory(phrase), 800);
}

// ---- Eventos ----
el('swapBtn').addEventListener('click', () => {
  const a = fromUnit.value;
  fromUnit.value = toUnit.value;
  toUnit.value = a;
  doConvert();
});

el('clearHistory').addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

inputValue.addEventListener('input', doConvert);
fromUnit.addEventListener('change', doConvert);
toUnit.addEventListener('change', doConvert);

// ---- Init ----
el('year').textContent = new Date().getFullYear();
renderCategories();
renderUnits();
renderHistory();
doConvert();
