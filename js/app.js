/* Taller 3D — contabilidad para un emprendimiento de impresión 3D.
 * Todo se guarda en el navegador (localStorage). Usá "Exportar" en Ajustes para hacer backups. */
(function () {
  'use strict';
  const C = window.Calc;
  const STORAGE_KEY = 'taller3d.v1';
  const THEME_KEY = 'taller3d.theme';

  // ---------- Datos de referencia ----------
  const CURRENCIES = [
    ['ARS', 'ARS ($) · Peso argentino'], ['USD', 'USD (US$) · Dólar'], ['EUR', 'EUR (€) · Euro'],
    ['MXN', 'MXN ($) · Peso mexicano'], ['CLP', 'CLP ($) · Peso chileno'], ['COP', 'COP ($) · Peso colombiano'],
    ['UYU', 'UYU ($) · Peso uruguayo'], ['PEN', 'PEN (S/) · Sol peruano'],
  ];
  const MATERIALS = ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU (flexible)', 'Nylon', 'PC', 'Resina'];
  // Consumo promedio aproximado durante una impresión típica (no el pico de la fuente).
  const PRINTERS = [
    { name: 'Bambu Lab A1 mini', watts: 80 },
    { name: 'Bambu Lab A1', watts: 95 },
    { name: 'Bambu Lab P1S / P1P', watts: 140 },
    { name: 'Bambu Lab X1 Carbon', watts: 190 },
    { name: 'Creality Ender 3 V3 / V3 SE', watts: 120 },
    { name: 'Creality K1 / K1C', watts: 150 },
    { name: 'Prusa MK4 / MK4S', watts: 90 },
    { name: 'Elegoo Neptune 4 / 4 Pro', watts: 130 },
    { name: 'Anycubic Kobra 2 / 3', watts: 120 },
    { name: 'Impresora grande (cama 300+ mm)', watts: 220 },
    { name: 'Resina (Elegoo Mars / Saturn)', watts: 60 },
  ];
  const MULTIPLIERS = [
    [1.5, 'x1,5 - Al costo (mayorista)'], [2, 'x2 - Bajo'], [2.5, 'x2,5'], [3, 'x3 - Competitivo'],
    [4, 'x4 - Estándar'], [5, 'x5 - Premium'], [6, 'x6 - Personalizado / diseño propio'],
  ];
  const EXPENSE_CATEGORIES = [
    'Filamento / resina', 'Electricidad', 'Repuestos y mantenimiento', 'Impresoras y equipos',
    'Packaging', 'Envíos', 'Marketing y publicidad', 'Comisiones (MercadoLibre, pagos)',
    'Impuestos (monotributo, IIBB)', 'Alquiler y servicios', 'Software y diseños STL', 'Herramientas',
    'Sueldos / retiro personal', 'Otros',
  ];
  const CHANNELS = ['Instagram', 'WhatsApp', 'MercadoLibre', 'Tienda online', 'Feria / evento', 'Local / reventa', 'Boca en boca', 'Otro'];
  const STATUSES = [['pendiente', 'Pendiente'], ['entregado', 'Entregado (sin cobrar)'], ['cobrado', 'Cobrado'], ['cancelado', 'Cancelado']];

  const STAGES = [
    {
      name: '1 · Arranque',
      items: [
        { id: 'costs-configured', auto: true, title: 'Conocer tus costos reales', why: 'Cargá precio del filamento, luz e impresora en Ajustes.' },
        { id: 'first-sale', auto: true, title: 'Registrar la primera venta' },
        { id: 'expenses-tracked', auto: true, title: 'Anotar al menos 5 gastos', why: 'Lo que no se mide no se puede mejorar.' },
        { id: 'm-catalog', title: 'Catálogo de 10 productos con buenas fotos', why: 'Luz natural, fondo neutro y una foto con escala (mano, moneda).' },
        { id: 'm-social', title: 'Perfil activo en Instagram / TikTok', why: 'Los timelapses de impresión son el contenido que más engancha.' },
      ],
    },
    {
      name: '2 · Validación',
      items: [
        { id: 'ten-sales', auto: true, title: '10 ventas registradas' },
        { id: 'ten-clients', auto: true, title: '10 clientes distintos' },
        { id: 'healthy-margin', auto: true, title: 'Margen bruto de 40% o más', why: 'Con al menos 3 ventas registradas.' },
        { id: 'm-marketplace', title: 'Publicar en MercadoLibre o una tienda online' },
        { id: 'm-niche', title: 'Elegir un nicho', why: 'Ej.: repuestos a medida, deco, cosplay, regalos empresariales, maquetas.' },
      ],
    },
    {
      name: '3 · Rentabilidad',
      items: [
        { id: 'break-even', auto: true, title: 'Superar el punto de equilibrio en el mes', why: 'Ventas suficientes para cubrir los costos fijos.' },
        { id: 'monthly-goal', auto: true, title: 'Alcanzar tu meta mensual de ingresos' },
        { id: 'three-profitable', auto: true, title: '3 meses seguidos con ganancia' },
        { id: 'm-fund', title: 'Separar un fondo de reinversión', why: '10–20% de la ganancia de cada mes, para repuestos y nuevas máquinas.' },
        { id: 'm-legal', title: 'Formalizar el emprendimiento', why: 'Monotributo / registro fiscal: te habilita a vender a empresas.' },
      ],
    },
    {
      name: '4 · Crecimiento',
      items: [
        { id: 'fifty-clients', auto: true, title: '50 clientes distintos' },
        { id: 'm-printer2', title: 'Sumar una segunda impresora', why: 'Cuando la primera está ocupada más del 60% del tiempo.' },
        { id: 'm-b2b', title: 'Un cliente mayorista o empresa recurrente' },
        { id: 'm-own-designs', title: 'Vender diseños propios', why: 'Más margen y una marca que te diferencia.' },
      ],
    },
  ];

  const DEFAULT_SETTINGS = {
    businessName: 'Mi taller 3D',
    currency: 'ARS',
    material: 'PLA',
    filamentPricePerKg: 25000,
    kwhPrice: 50,
    printerModel: '',
    printerWatts: 220,
    printerCost: 855250,
    printerLifeHours: 3000,
    maintenancePct: 20,
    laborRate: 0,
    multiplier: 4,
    commissionPct: 0,
    taxPct: 0,
    roundTo: 0,
    failRate: 0,
    monthlyGoal: 300000,
    fixedCostsMonthly: 50000,
  };

  // ---------- Estado y persistencia ----------
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  function emptyData() {
    return { settings: { ...DEFAULT_SETTINGS }, sales: [], expenses: [], filaments: [], milestones: {} };
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyData();
      const d = JSON.parse(raw);
      return {
        ...emptyData(), ...d,
        settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
      };
    } catch (e) {
      return emptyData();
    }
  }
  let data = load();
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { toast('No se pudo guardar en este navegador. Exportá un backup desde Ajustes.'); }
  }

  const ui = {
    month: today().slice(0, 7),
    tab: 'panel',
    salesFilter: { q: '', status: '', onlyMonth: true },
    expFilter: { q: '', category: '', onlyMonth: true },
    calc: null,
  };

  // ---------- Utilidades ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => data.settings;

  let moneyFmt;
  function money(n, decimals = 2) {
    const key = `${S().currency}-${decimals}`;
    if (!moneyFmt || moneyFmt.key !== key) {
      try {
        moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: S().currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      } catch (e) {
        moneyFmt = new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      }
      moneyFmt.key = key;
    }
    return moneyFmt.format(C.num(n));
  }
  const money0 = (n) => money(n, 0);
  const numFmt = (n, d = 0) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: d }).format(C.num(n));
  const pct = (n) => `${numFmt(n, 1)}%`;
  const monthName = (key, short) => {
    const [y, m] = key.split('-').map(Number);
    const name = new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: short ? 'short' : 'long', year: short ? '2-digit' : 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  const dateFmt = (d) => (d ? d.split('-').reverse().join('/') : '');
  const options = (list, selected) => list.map((o) => {
    const [v, label] = Array.isArray(o) ? o : [o, o];
    return `<option value="${esc(v)}"${String(v) === String(selected) ? ' selected' : ''}>${esc(label)}</option>`;
  }).join('');

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function field(label, name, value, opts = {}) {
    const { type = 'number', suffix, prefix, hint, step = 'any', attrs = '', cls = '' } = opts;
    const input = type === 'select'
      ? `<select name="${name}" ${attrs}>${opts.options}</select>`
      : type === 'textarea'
        ? `<textarea name="${name}" rows="2" ${attrs}>${esc(value)}</textarea>`
        : `<input name="${name}" type="${type}" ${type === 'number' ? `step="${step}" inputmode="decimal"` : ''} value="${esc(value)}" ${attrs}>`;
    const unit = prefix || suffix
      ? `<span class="unit-wrap">${prefix ? `<span class="unit pre">${prefix}</span>` : ''}${input}${suffix ? `<span class="unit">${suffix}</span>` : ''}</span>`
      : input;
    return `<label class="field ${cls}">${esc(label)}${unit}${hint ? `<span class="hint">${hint}</span>` : ''}</label>`;
  }

  // Diálogo genérico con un formulario
  function openForm(title, innerHtml, onSubmit, opts = {}) {
    const dlg = $('#dialog');
    const form = $('#dialog-form');
    form.innerHTML = `
      <h2>${esc(title)}</h2>
      ${innerHtml}
      <div class="dialog-actions">
        ${opts.onDelete ? '<button type="button" class="btn danger" data-act="delete" style="margin-right:auto">Eliminar</button>' : ''}
        <button type="button" class="btn" data-act="cancel">Cancelar</button>
        <button type="submit" class="btn primary">${opts.submitLabel || 'Guardar'}</button>
      </div>`;
    form.onsubmit = (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      $$('input[type=checkbox]', form).forEach((c) => { values[c.name] = c.checked; });
      if (onSubmit(values, form) !== false) { dlg.close(); render(); }
    };
    form.onclick = (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'cancel') dlg.close();
      if (act === 'delete' && confirm('¿Eliminar este registro?')) { opts.onDelete(); dlg.close(); render(); }
    };
    if (opts.onReady) opts.onReady(form);
    dlg.showModal();
    const first = form.querySelector('input:not([type=hidden]), select');
    if (first) first.focus();
  }

  // ---------- Cálculo de costo con los ajustes ----------
  const wearFromSettings = (s = S()) => C.wearPerHour(s.printerCost, s.printerLifeHours, s.maintenancePct);

  function costForJob({ grams, hours, laborHours, extras, pricePerKg }) {
    const s = S();
    return C.printCost({
      grams, hours, laborHours, extras,
      pricePerKg: C.num(pricePerKg) || C.kgPrice(s),
      watts: s.printerWatts, kwhPrice: s.kwhPrice, wearPerHour: wearFromSettings(s),
      laborRate: s.laborRate, failRate: s.failRate,
    });
  }

  // ---------- Inventario: descontar filamento usado ----------
  function applyFilamentUse(sale, sign) {
    if (!sale.filamentId || !C.num(sale.grams) || sale.status === 'cancelado') return;
    const f = data.filaments.find((x) => x.id === sale.filamentId);
    if (f) f.gramsLeft = Math.max(0, C.round2(C.num(f.gramsLeft) - sign * C.num(sale.grams)));
  }

  // ---------- Gráficos ----------
  function barChart(series) {
    const W = 640, H = 240, padL = 56, padR = 8, padT = 12, padB = 28;
    const max = Math.max(1, ...series.flatMap((m) => [m.income, m.expenses]));
    const nice = niceMax(max);
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const slot = plotW / series.length;
    const barW = Math.min(28, (slot - 18) / 2);
    const y = (v) => padT + plotH - (v / nice) * plotH;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice);
    const bar = (x, v, cls) => {
      const h = Math.max(0, padT + plotH - y(v));
      if (h < 0.5) return '';
      const r = Math.min(4, h, barW / 2);
      const top = padT + plotH - h;
      return `<path class="${cls}" d="M${x},${padT + plotH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${padT + plotH} Z"/>`;
    };
    let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos y gastos por mes">`;
    ticks.forEach((t) => {
      svg += `<line class="grid-line" x1="${padL}" x2="${W - padR}" y1="${y(t)}" y2="${y(t)}"/>`;
      svg += `<text class="axis-label" x="${padL - 8}" y="${y(t) + 4}" text-anchor="end">${compact(t)}</text>`;
    });
    series.forEach((m, i) => {
      const cx = padL + slot * i + slot / 2;
      svg += bar(cx - barW - 1, m.income, 'bar-income');
      svg += bar(cx + 1, m.expenses, 'bar-expense');
      svg += `<text class="axis-label" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(monthName(m.key, true))}</text>`;
      svg += `<rect class="hit" x="${padL + slot * i}" y="${padT}" width="${slot}" height="${plotH}" data-tip="${i}"/>`;
    });
    svg += '</svg>';
    return svg;
  }
  function niceMax(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function compact(n) {
    return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }
  function bindTooltips(root, getHtml) {
    const tip = $('#tooltip');
    $$('[data-tip]', root).forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        tip.innerHTML = getHtml(el.dataset.tip);
        tip.hidden = false;
        const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
        tip.style.left = `${x}px`;
        tip.style.top = `${e.clientY + 14}px`;
      });
      el.addEventListener('mouseleave', () => { tip.hidden = true; });
    });
  }

  // ---------- Vistas ----------
  const view = () => $('#view');

  function renderPanel() {
    const m = ui.month;
    const sum = C.summary(data, m);
    const prev = C.summary(data, C.lastMonths(m, 2)[0]);
    const series = C.monthlySeries(data, m, 6);
    const cats = C.expensesByCategory(data, m);
    const tips = C.insights(data, m, money0);
    const ranking = C.productRanking(data).slice(0, 5);
    const goal = C.num(S().monthlyGoal);
    const goalPct = goal > 0 ? Math.min(100, (sum.income / goal) * 100) : 0;
    const delta = (cur, before) => {
      if (!before) return '<span class="delta">Sin datos del mes anterior</span>';
      const d = ((cur - before) / Math.abs(before)) * 100;
      return `<span class="delta ${d >= 0 ? 'pos' : 'neg'}">${d >= 0 ? '▲' : '▼'} ${pct(Math.abs(d))} vs mes anterior</span>`;
    };
    const recent = [...data.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const catMax = Math.max(1, ...cats.map((c) => c.amount));
    const icons = { good: '✓', warn: '!', bad: '✕', info: 'i' };

    view().innerHTML = `
      <div class="page-head">
        <div><h1>Panel · ${esc(monthName(m))}</h1><p>Cómo viene el negocio este mes.</p></div>
        <div class="btn-row">
          <button class="btn primary" data-act="new-sale">+ Venta</button>
          <button class="btn" data-act="new-expense">+ Gasto</button>
        </div>
      </div>

      <div class="grid kpis">
        <div class="card kpi"><div class="label">Ingresos</div><div class="value">${money0(sum.income)}</div>${delta(sum.income, prev.income)}</div>
        <div class="card kpi"><div class="label">Gastos</div><div class="value">${money0(sum.expenses)}</div>${delta(sum.expenses, prev.expenses)}</div>
        <div class="card kpi"><div class="label">Ganancia neta</div><div class="value ${sum.profit >= 0 ? 'pos' : 'neg'}">${money0(sum.profit)}</div><span class="delta">Margen neto ${pct(sum.netMarginPct)}</span></div>
        <div class="card kpi"><div class="label">Ventas</div><div class="value">${sum.salesCount}</div><span class="delta">Ticket promedio ${money0(sum.avgTicket)}</span></div>
        <div class="card kpi"><div class="label">Por cobrar</div><div class="value">${money0(sum.pendingCollection)}</div><span class="delta">Ventas pendientes o entregadas</span></div>
      </div>

      <div class="card section">
        <div class="page-head" style="margin-bottom:8px">
          <h2>Meta del mes</h2>
          <span class="muted small">${money0(sum.income)} de ${money0(goal)}</span>
        </div>
        <div class="progress ${goalPct >= 100 ? 'good' : ''}" role="progressbar" aria-valuenow="${Math.round(goalPct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${goalPct}%"></span></div>
        <p class="small muted" style="margin:8px 0 0">${goal <= 0 ? 'Definí una meta mensual en Ajustes.' : goalPct >= 100 ? '¡Meta cumplida! 🎉' : `Te faltan ${money0(goal - sum.income)} (${pct(100 - goalPct)}).`}</p>
      </div>

      <div class="grid two section">
        <div class="card">
          <h2>Ingresos vs. gastos (6 meses)</h2>
          <div class="legend"><span><i style="background:var(--series-1)"></i>Ingresos</span><span><i style="background:var(--series-2)"></i>Gastos</span></div>
          <div id="chart">${barChart(series)}</div>
          <details class="small" style="margin-top:8px"><summary class="muted">Ver como tabla</summary>
            <div class="table-wrap"><table><thead><tr><th>Mes</th><th class="num">Ingresos</th><th class="num">Gastos</th><th class="num">Ganancia</th></tr></thead><tbody>
            ${series.map((s) => `<tr><td>${esc(monthName(s.key, true))}</td><td class="num">${money0(s.income)}</td><td class="num">${money0(s.expenses)}</td><td class="num ${s.profit >= 0 ? 'pos' : 'neg'}">${money0(s.profit)}</td></tr>`).join('')}
            </tbody></table></div>
          </details>
        </div>
        <div class="card">
          <h2>¿En qué se va la plata?</h2>
          ${cats.length ? `<div class="hbar-list">${cats.map((c) => `
            <div class="hbar"><span title="${esc(c.category)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.category)}</span>
              <div class="track"><div class="fill" style="width:${(c.amount / catMax) * 100}%"></div></div>
              <span class="num">${money0(c.amount)}</span></div>`).join('')}</div>`
    : '<p class="empty">Sin gastos este mes.</p>'}
        </div>
      </div>

      <div class="grid two section">
        <div class="card">
          <h2>Consejos según tus números</h2>
          ${tips.length ? `<ul class="insights">${tips.map((t) => `<li class="${t.level}"><span class="ico" aria-hidden="true">${icons[t.level]}</span><span>${esc(t.text)}</span></li>`).join('')}</ul>` : '<p class="muted">Todo en orden por ahora. ¡Seguí cargando datos!</p>'}
        </div>
        <div class="card">
          <h2>Productos más rentables</h2>
          ${ranking.length ? `<div class="table-wrap"><table><thead><tr><th>Producto</th><th class="num">Unid.</th><th class="num">Ganancia</th><th class="num">Margen</th></tr></thead><tbody>
            ${ranking.map((r) => `<tr><td>${esc(r.product)}</td><td class="num">${r.units}</td><td class="num">${money0(r.profit)}</td><td class="num ${r.marginPct < 20 ? 'neg' : ''}">${pct(r.marginPct)}</td></tr>`).join('')}
          </tbody></table></div>` : '<p class="empty">Todavía no hay ventas.</p>'}
          <h3 style="margin-top:16px">Últimas ventas</h3>
          ${recent.length ? `<div class="table-wrap"><table><tbody>${recent.map((s) => `<tr><td>${dateFmt(s.date)}</td><td>${esc(s.product)}</td><td><span class="badge ${s.status}">${esc(s.status)}</span></td><td class="num">${money0(s.price)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small">—</p>'}
        </div>
      </div>
      ${!data.sales.length && !data.expenses.length ? `<div class="card section"><h2>¿Primera vez?</h2><p>Empezá cargando tus costos en <a href="#ajustes">Ajustes</a>, calculá el precio de una pieza en la <a href="#calculadora">Calculadora</a> y registrá tus ventas y gastos. Si querés ver cómo se ve con datos, cargá el ejemplo.</p><button class="btn" data-act="demo">Cargar datos de ejemplo</button></div>` : ''}
    `;
    bindTooltips($('#chart'), (i) => {
      const s = series[i];
      return `<strong>${esc(monthName(s.key))}</strong><br>Ingresos: ${money0(s.income)}<br>Gastos: ${money0(s.expenses)}<br>Ganancia: ${money0(s.profit)}`;
    });
  }

  // ----- Ventas -----
  function saleForm(sale) {
    const isNew = !sale;
    const s = sale || {
      date: today(), client: '', product: '', qty: 1, channel: 'Instagram', status: 'cobrado',
      filamentId: '', grams: '', hours: '', minutes: '', laborHours: '', extras: '', price: '', cost: '', notes: '',
    };
    const filamentOpts = [['', '— Sin descontar stock —'], ...data.filaments.map((f) => [f.id, `${f.material} ${f.color} (${numFmt(f.gramsLeft)} g)`])];
    const totalH = C.num(s.hours);
    const hh = s.minutes !== undefined && s.minutes !== '' ? s.hours : Math.floor(totalH) || '';
    const mm = s.minutes !== undefined && s.minutes !== '' ? s.minutes : (totalH ? Math.round((totalH % 1) * 60) : '');
    openForm(isNew ? 'Nueva venta' : 'Editar venta', `
      <div class="form-grid">
        ${field('Fecha', 'date', s.date, { type: 'date', attrs: 'required' })}
        ${field('Cliente', 'client', s.client, { type: 'text', attrs: 'list="clients-list" autocomplete="off"' })}
        ${field('Producto', 'product', s.product, { type: 'text', attrs: 'required list="products-list" autocomplete="off"', cls: 'wide' })}
        ${field('Cantidad', 'qty', s.qty, { step: '1', attrs: 'min="1"' })}
        ${field('Canal', 'channel', '', { type: 'select', options: options(CHANNELS, s.channel) })}
        ${field('Estado', 'status', '', { type: 'select', options: options(STATUSES, s.status) })}
      </div>
      <fieldset>
        <legend>Costo de producción</legend>
        <div class="form-grid">
          ${field('Filamento usado', 'filamentId', '', { type: 'select', options: options(filamentOpts, s.filamentId), cls: 'wide', hint: 'Si elegís uno, se descuentan los gramos del stock.' })}
          ${field('Gramos (total)', 'grams', s.grams, { suffix: 'g' })}
          ${field('Tiempo', 'hours', hh, { suffix: 'horas' })}
          ${field('Tiempo', 'minutes', mm, { suffix: 'min' })}
          ${field('Horas de trabajo', 'laborHours', s.laborHours, { suffix: 'h', hint: 'Post-proceso, pintura, armado.' })}
          ${field('Extras', 'extras', s.extras, { prefix: '$', hint: 'Imanes, tornillos, packaging…' })}
          ${field('Costo calculado', 'cost', s.cost, { prefix: '$', hint: 'Se calcula solo; podés corregirlo.' })}
        </div>
      </fieldset>
      <div class="form-grid">
        ${field('Precio cobrado (total)', 'price', s.price, { prefix: '$', attrs: 'required' })}
        <div class="field"><span class="small muted" id="sale-hint">&nbsp;</span></div>
        ${field('Notas', 'notes', s.notes, { type: 'textarea', cls: 'wide' })}
      </div>
      <datalist id="clients-list">${[...new Set(data.sales.map((x) => x.client).filter(Boolean))].map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
      <datalist id="products-list">${[...new Set(data.sales.map((x) => x.product).filter(Boolean))].map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
    `, (v) => {
      const hours = C.toHours(v.hours, v.minutes);
      const record = {
        id: sale?.id || uid(), date: v.date, client: v.client.trim(), product: v.product.trim(),
        qty: Math.max(1, Math.round(C.num(v.qty))), channel: v.channel, status: v.status,
        filamentId: v.filamentId, grams: C.num(v.grams), hours: C.round2(hours), minutes: '',
        laborHours: C.num(v.laborHours), extras: C.num(v.extras),
        price: C.num(v.price), cost: C.num(v.cost), notes: v.notes,
      };
      if (sale) {
        applyFilamentUse(sale, -1);
        Object.assign(sale, record);
      } else {
        data.sales.push(record);
      }
      applyFilamentUse(record, 1);
      save();
      toast(isNew ? 'Venta registrada' : 'Venta actualizada');
    }, {
      onDelete: sale ? () => {
        applyFilamentUse(sale, -1);
        data.sales = data.sales.filter((x) => x !== sale);
        save();
      } : null,
      onReady(form) {
        const costInput = form.elements.cost;
        let manual = !isNew && sale.cost > 0;
        costInput.addEventListener('input', () => { manual = true; });
        const recalc = () => {
          const f = data.filaments.find((x) => x.id === form.elements.filamentId.value);
          const c = costForJob({
            grams: form.elements.grams.value,
            hours: C.toHours(form.elements.hours.value, form.elements.minutes.value),
            laborHours: form.elements.laborHours.value,
            extras: form.elements.extras.value,
            pricePerKg: f ? f.pricePerKg : 0,
          });
          if (!manual) costInput.value = c.total || '';
          const price = C.num(form.elements.price.value);
          const cost = C.num(costInput.value);
          const sug = C.finalPrice(cost, S().multiplier, S().commissionPct, S().taxPct, S().roundTo).price;
          $('#sale-hint').innerHTML = cost > 0
            ? `Precio sugerido (x${numFmt(S().multiplier, 1)}): <strong>${money(sug)}</strong>${price > 0 ? ` · Ganancia: <strong class="${price - cost >= 0 ? 'pos' : 'neg'}">${money(price - cost)}</strong> (${pct(((price - cost) / price) * 100)})` : ''}`
            : '&nbsp;';
        };
        ['grams', 'hours', 'minutes', 'laborHours', 'extras', 'price', 'filamentId', 'cost'].forEach((n) => {
          form.elements[n].addEventListener('input', recalc);
        });
        form.elements.product.addEventListener('change', () => {
          // Autocompletar con la última venta del mismo producto
          if (!isNew) return;
          const last = [...data.sales].reverse().find((x) => x.product === form.elements.product.value);
          if (!last) return;
          ['grams', 'laborHours', 'extras', 'price'].forEach((n) => { if (!form.elements[n].value) form.elements[n].value = last[n] || ''; });
          if (!form.elements.hours.value && last.hours) {
            form.elements.hours.value = Math.floor(last.hours);
            form.elements.minutes.value = Math.round((last.hours % 1) * 60);
          }
          if (last.filamentId) form.elements.filamentId.value = last.filamentId;
          recalc();
        });
        recalc();
      },
    });
  }

  function renderVentas() {
    const f = ui.salesFilter;
    const q = f.q.toLowerCase();
    const rows = data.sales
      .filter((s) => (!f.onlyMonth || C.monthKey(s.date) === ui.month))
      .filter((s) => !f.status || s.status === f.status)
      .filter((s) => !q || `${s.client} ${s.product} ${s.channel} ${s.notes}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
    const active = rows.filter((s) => s.status !== 'cancelado');
    const tot = active.reduce((a, s) => a + C.num(s.price), 0);
    const totCost = active.reduce((a, s) => a + C.num(s.cost), 0);

    view().innerHTML = `
      <div class="page-head">
        <div><h1>Ventas</h1><p>${f.onlyMonth ? esc(monthName(ui.month)) : 'Todas las fechas'} · ${active.length} ventas · ${money0(tot)} · ganancia bruta ${money0(tot - totCost)}</p></div>
        <div class="btn-row">
          <button class="btn" data-act="csv-sales">Exportar CSV</button>
          <button class="btn primary" data-act="new-sale">+ Nueva venta</button>
        </div>
      </div>
      <div class="card">
        <div class="toolbar">
          <input type="search" id="s-q" placeholder="Buscar cliente, producto…" value="${esc(f.q)}">
          <select id="s-status"><option value="">Todos los estados</option>${options(STATUSES, f.status)}</select>
          <label class="check"><input type="checkbox" id="s-month" ${f.onlyMonth ? 'checked' : ''}> Solo el mes seleccionado</label>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Producto</th><th class="num">Cant.</th><th>Canal</th><th>Estado</th><th class="num">Precio</th><th class="num">Costo</th><th class="num">Ganancia</th><th></th></tr></thead>
            <tbody>
              ${rows.length ? rows.map((s) => {
    const profit = C.num(s.price) - C.num(s.cost);
    return `<tr>
                  <td>${dateFmt(s.date)}</td><td>${esc(s.client) || '<span class="muted">—</span>'}</td><td>${esc(s.product)}</td>
                  <td class="num">${s.qty}</td><td>${esc(s.channel)}</td>
                  <td><button class="badge ${s.status}" style="border:0;cursor:pointer" data-cycle="${s.id}" title="Cambiar estado">${esc(s.status)}</button></td>
                  <td class="num">${money0(s.price)}</td><td class="num">${money0(s.cost)}</td>
                  <td class="num ${profit >= 0 ? 'pos' : 'neg'}">${money0(profit)}</td>
                  <td><button class="btn sm" data-edit="${s.id}">Editar</button></td></tr>`;
  }).join('') : '<tr><td colspan="10" class="empty">No hay ventas para mostrar.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
    $('#s-q').addEventListener('input', (e) => { f.q = e.target.value; rerenderKeepFocus('#s-q'); });
    $('#s-status').addEventListener('change', (e) => { f.status = e.target.value; render(); });
    $('#s-month').addEventListener('change', (e) => { f.onlyMonth = e.target.checked; render(); });
    $$('[data-edit]').forEach((b) => b.addEventListener('click', () => saleForm(data.sales.find((s) => s.id === b.dataset.edit))));
    $$('[data-cycle]').forEach((b) => b.addEventListener('click', () => {
      const s = data.sales.find((x) => x.id === b.dataset.cycle);
      const order = ['pendiente', 'entregado', 'cobrado'];
      if (s.status === 'cancelado') return;
      s.status = order[(order.indexOf(s.status) + 1) % order.length];
      save(); render();
    }));
  }

  function rerenderKeepFocus(sel) {
    const el = $(sel);
    const pos = el.selectionStart;
    render();
    const again = $(sel);
    again.focus();
    try { again.setSelectionRange(pos, pos); } catch (e) { /* search input */ }
  }

  // ----- Gastos -----
  function expenseForm(exp) {
    const isNew = !exp;
    const e = exp || { date: today(), category: 'Filamento / resina', description: '', amount: '', fixed: false, filamentId: '', gramsAdded: '' };
    openForm(isNew ? 'Nuevo gasto' : 'Editar gasto', `
      <div class="form-grid">
        ${field('Fecha', 'date', e.date, { type: 'date', attrs: 'required' })}
        ${field('Categoría', 'category', '', { type: 'select', options: options(EXPENSE_CATEGORIES, e.category) })}
        ${field('Descripción', 'description', e.description, { type: 'text', cls: 'wide', attrs: 'placeholder="Ej: 3 bobinas PLA negro"' })}
        ${field('Monto', 'amount', e.amount, { prefix: '$', attrs: 'required' })}
        <label class="check" style="align-self:end;padding-bottom:10px"><input type="checkbox" name="fixed" ${e.fixed ? 'checked' : ''}> Gasto fijo mensual</label>
      </div>
      ${isNew && data.filaments.length ? `<fieldset><legend>¿Compraste filamento?</legend><div class="form-grid">
        ${field('Sumar al stock de', 'filamentId', '', { type: 'select', options: options([['', '— No —'], ...data.filaments.map((f) => [f.id, `${f.material} ${f.color}`])], '') })}
        ${field('Gramos', 'gramsAdded', '', { suffix: 'g', hint: '1 bobina = 1000 g' })}
      </div></fieldset>` : ''}
    `, (v) => {
      const record = {
        id: exp?.id || uid(), date: v.date, category: v.category, description: v.description.trim(),
        amount: C.num(v.amount), fixed: !!v.fixed,
      };
      if (exp) Object.assign(exp, record); else data.expenses.push(record);
      if (isNew && v.filamentId && C.num(v.gramsAdded) > 0) {
        const f = data.filaments.find((x) => x.id === v.filamentId);
        if (f) {
          f.gramsLeft = C.num(f.gramsLeft) + C.num(v.gramsAdded);
          f.pricePerKg = C.round2(C.num(v.amount) / C.num(v.gramsAdded) * 1000);
        }
      }
      save();
      toast(isNew ? 'Gasto registrado' : 'Gasto actualizado');
    }, { onDelete: exp ? () => { data.expenses = data.expenses.filter((x) => x !== exp); save(); } : null });
  }

  function renderGastos() {
    const f = ui.expFilter;
    const q = f.q.toLowerCase();
    const rows = data.expenses
      .filter((e) => (!f.onlyMonth || C.monthKey(e.date) === ui.month))
      .filter((e) => !f.category || e.category === f.category)
      .filter((e) => !q || `${e.description} ${e.category}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
    const tot = rows.reduce((a, e) => a + C.num(e.amount), 0);
    const fixedTemplates = data.expenses.filter((e) => e.fixed);
    view().innerHTML = `
      <div class="page-head">
        <div><h1>Gastos</h1><p>${f.onlyMonth ? esc(monthName(ui.month)) : 'Todas las fechas'} · ${rows.length} gastos · ${money0(tot)}</p></div>
        <div class="btn-row">
          ${fixedTemplates.length ? '<button class="btn" data-act="copy-fixed" title="Copia al mes seleccionado los gastos fijos del mes anterior">Repetir gastos fijos</button>' : ''}
          <button class="btn" data-act="csv-expenses">Exportar CSV</button>
          <button class="btn primary" data-act="new-expense">+ Nuevo gasto</button>
        </div>
      </div>
      <div class="card">
        <div class="toolbar">
          <input type="search" id="e-q" placeholder="Buscar…" value="${esc(f.q)}">
          <select id="e-cat"><option value="">Todas las categorías</option>${options(EXPENSE_CATEGORIES, f.category)}</select>
          <label class="check"><input type="checkbox" id="e-month" ${f.onlyMonth ? 'checked' : ''}> Solo el mes seleccionado</label>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Tipo</th><th class="num">Monto</th><th></th></tr></thead>
          <tbody>${rows.length ? rows.map((e) => `<tr>
            <td>${dateFmt(e.date)}</td><td>${esc(e.category)}</td><td>${esc(e.description) || '<span class="muted">—</span>'}</td>
            <td>${e.fixed ? '<span class="badge entregado">Fijo</span>' : '<span class="muted small">Variable</span>'}</td>
            <td class="num">${money0(e.amount)}</td><td><button class="btn sm" data-edit="${e.id}">Editar</button></td></tr>`).join('')
    : '<tr><td colspan="6" class="empty">No hay gastos para mostrar.</td></tr>'}</tbody>
        </table></div>
      </div>`;
    $('#e-q').addEventListener('input', (e) => { f.q = e.target.value; rerenderKeepFocus('#e-q'); });
    $('#e-cat').addEventListener('change', (e) => { f.category = e.target.value; render(); });
    $('#e-month').addEventListener('change', (e) => { f.onlyMonth = e.target.checked; render(); });
    $$('[data-edit]').forEach((b) => b.addEventListener('click', () => expenseForm(data.expenses.find((x) => x.id === b.dataset.edit))));
  }

  function copyFixedExpenses() {
    const prevKey = C.lastMonths(ui.month, 2)[0];
    const prevFixed = data.expenses.filter((e) => e.fixed && C.monthKey(e.date) === prevKey);
    if (!prevFixed.length) { toast(`No hay gastos fijos en ${monthName(prevKey)}`); return; }
    const existing = new Set(data.expenses.filter((e) => C.monthKey(e.date) === ui.month).map((e) => `${e.category}|${e.description}`));
    let added = 0;
    prevFixed.forEach((e) => {
      if (existing.has(`${e.category}|${e.description}`)) return;
      const day = e.date.slice(8, 10);
      const [y, m] = ui.month.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      data.expenses.push({ ...e, id: uid(), date: `${ui.month}-${String(Math.min(Number(day), lastDay)).padStart(2, '0')}` });
      added += 1;
    });
    save(); render();
    toast(added ? `${added} gastos fijos copiados` : 'Los gastos fijos ya estaban cargados');
  }

  // ----- Calculadora -----
  function calcDefaults() {
    const s = S();
    return {
      material: s.material, currency: s.currency, grams: 50, pricePerKg: C.kgPrice(s),
      hours: 2, minutes: 30, printerModel: s.printerModel, watts: s.printerWatts, kwhPrice: s.kwhPrice,
      printerCost: s.printerCost, lifeHours: s.printerLifeHours, maintenancePct: s.maintenancePct,
      wearPerHour: wearFromSettings(s), laborRate: s.laborRate, laborHours: 0, extras: 0,
      failRate: s.failRate, multiplier: s.multiplier, qty: 1, commissionPct: s.commissionPct,
      taxPct: s.taxPct, roundTo: s.roundTo, client: '', product: '',
    };
  }
  const CALC_KEYS = Object.keys({
    material: 1, currency: 1, grams: 1, pricePerKg: 1, hours: 1, minutes: 1, printerModel: 1, watts: 1, kwhPrice: 1,
    printerCost: 1, lifeHours: 1, maintenancePct: 1, wearPerHour: 1, laborRate: 1, laborHours: 1, extras: 1,
    failRate: 1, multiplier: 1, qty: 1, commissionPct: 1, taxPct: 1, roundTo: 1, client: 1, product: 1,
  });

  function calcResult(c) {
    const cost = C.printCost({
      grams: c.grams, pricePerKg: c.pricePerKg, hours: C.toHours(c.hours, c.minutes), watts: c.watts,
      kwhPrice: c.kwhPrice, wearPerHour: c.wearPerHour, laborHours: c.laborHours, laborRate: c.laborRate,
      extras: c.extras, failRate: c.failRate,
    });
    const qty = Math.max(1, Math.round(C.num(c.qty)));
    const sale = C.finalPrice(cost.total, c.multiplier, c.commissionPct, c.taxPct, c.roundTo);
    return { cost, qty, sale, unitCost: C.round2(cost.total / qty), unitPrice: C.round2(sale.price / qty) };
  }

  function renderCalculadora() {
    if (!ui.calc) ui.calc = calcDefaults();
    const c = ui.calc;
    const multOpts = MULTIPLIERS.some(([v]) => Number(v) === Number(c.multiplier)) ? MULTIPLIERS : [...MULTIPLIERS, [c.multiplier, `x${c.multiplier}`]];
    view().innerHTML = `
      <div class="page-head">
        <div><h1>Calculadora de costos</h1><p>Cuánto te cuesta imprimir una pieza y a cuánto venderla.</p></div>
        <div class="btn-row">
          <button class="btn" data-act="calc-reset">Restablecer</button>
          <button class="btn" data-act="calc-save-defaults" title="Guarda máquina, energía, filamento y margen como valores por defecto">Guardar como predeterminado</button>
        </div>
      </div>
      <div class="calc-layout">
        <form id="calc-form" autocomplete="off" onsubmit="return false">
          <fieldset>
            <legend>📦 Material y tiempo</legend>
            <div class="form-grid g2">
              ${field('Tipo de material', 'material', '', { type: 'select', options: options(MATERIALS, c.material) })}
              ${field('Moneda', 'currency', '', { type: 'select', options: options(CURRENCIES, c.currency) })}
              ${data.filaments.length ? field('Usar precio de mi stock', 'fromStock', '', { type: 'select', cls: 'wide', options: options([['', '— Elegí un filamento de tu inventario —'], ...data.filaments.map((f) => [f.id, `${f.material} ${f.color} · ${money0(f.pricePerKg)}/kg`])], '') }) : ''}
              ${field('Peso de la pieza', 'grams', c.grams, { suffix: 'gramos', hint: 'Lo indica el slicer (incluí soportes y purga).' })}
              ${field('Precio del filamento', 'pricePerKg', c.pricePerKg, { prefix: '$', suffix: 'por kg' })}
              ${field('Tiempo', 'hours', c.hours, { suffix: 'horas' })}
              ${field('Tiempo', 'minutes', c.minutes, { suffix: 'minutos' })}
            </div>
          </fieldset>

          <fieldset>
            <legend>⚡ Máquina y energía</legend>
            <div class="form-grid g2">
              ${field('Guía rápida por modelo (autocompletar)', 'printerModel', '', { type: 'select', cls: 'wide', options: options([['', 'Elegí un modelo o valor de referencia'], ...PRINTERS.map((p) => [p.name, `${p.name} · ~${p.watts} W`])], c.printerModel) })}
              ${field('Consumo', 'watts', c.watts, { suffix: 'watts', hint: 'Promedio real, no el de la fuente.' })}
              ${field('Costo kWh', 'kwhPrice', c.kwhPrice, { prefix: '$', hint: 'Mirá tu factura de luz: total ÷ kWh consumidos.' })}
              ${field('Costo de la impresora', 'printerCost', c.printerCost, { prefix: '$' })}
              ${field('Desgaste máquina', 'wearPerHour', c.wearPerHour, { prefix: '$', suffix: '/h' })}
              ${field('Vida útil', 'lifeHours', c.lifeHours, { suffix: 'horas' })}
              ${field('Mantenimiento y repuestos', 'maintenancePct', c.maintenancePct, { suffix: '%', hint: 'Boquillas, correas, PEI…' })}
            </div>
            <p class="note">Desgaste/h = costo de la impresora × (1 + mantenimiento) ÷ vida útil. Con los valores actuales: ${money(c.printerCost)} × ${numFmt(1 + C.num(c.maintenancePct) / 100, 2)} ÷ ${numFmt(c.lifeHours)} h = <strong>${money(C.wearPerHour(c.printerCost, c.lifeHours, c.maintenancePct))}/h</strong>.</p>
          </fieldset>

          <fieldset>
            <legend>🧰 Mano de obra y extras</legend>
            <div class="form-grid g2">
              ${field('Mano de obra', 'laborRate', c.laborRate, { prefix: '$', suffix: '/h' })}
              ${field('Horas de trabajo', 'laborHours', c.laborHours, { suffix: 'h' })}
              ${field('Extras', 'extras', c.extras, { prefix: '$', suffix: 'total', hint: 'Pintura, imanes, packaging, envío…' })}
              ${field('Margen de fallas', 'failRate', c.failRate, { suffix: '%', hint: 'Impresiones que salen mal (5–10% es típico).' })}
            </div>
            <p class="note">La mano de obra se calcula aparte: horas de trabajo × valor por hora. Ese resultado se suma al costo total.</p>
          </fieldset>

          <fieldset>
            <legend>📊 Ajustes finales</legend>
            <div class="form-grid g2">
              ${field('Margen de ganancia', 'multiplier', '', { type: 'select', options: options(multOpts, c.multiplier) })}
              ${field('Cantidad de piezas', 'qty', c.qty, { step: '1', attrs: 'min="1"' })}
              ${field('Comisión de venta', 'commissionPct', c.commissionPct, { suffix: '%', hint: 'Ej.: MercadoLibre 13–17%, Mercado Pago ~6%.' })}
              ${field('Impuestos', 'taxPct', c.taxPct, { suffix: '%', hint: 'IIBB, IVA si corresponde.' })}
              ${field('Redondear precio a', 'roundTo', '', { type: 'select', options: options([[0, 'Sin redondear'], [10, '$10'], [50, '$50'], [100, '$100'], [500, '$500'], [1000, '$1.000']], c.roundTo) })}
            </div>
            <p class="note">La cantidad de piezas se usa para dividir el costo total y mostrar el costo por unidad. Comisión e impuestos se suman al precio para que lo que te queda en mano siga respetando el margen.</p>
          </fieldset>

          <fieldset>
            <legend>🧾 Presupuesto (opcional)</legend>
            <div class="form-grid g2">
              ${field('Cliente', 'client', c.client, { type: 'text' })}
              ${field('Producto / descripción', 'product', c.product, { type: 'text' })}
            </div>
          </fieldset>
        </form>
        <aside class="card result-card" id="calc-result"></aside>
      </div>`;

    const form = $('#calc-form');
    const renderResult = () => {
      const r = calcResult(c);
      const parts = [
        ['Costo de material', r.cost.material, 'var(--series-1)'],
        ['Electricidad', r.cost.energy, '#eda100'],
        ['Amortización / desgaste', r.cost.depreciation, 'var(--series-2)'],
        ['Mano de obra', r.cost.labor, '#6250d6'],
        ['Extras', r.cost.extras, '#1baf7a'],
      ];
      if (C.num(c.failRate) > 0) parts.push(['Fallas', r.cost.failure, '#e87ba4']);
      const total = r.cost.total || 1;
      $('#calc-result').innerHTML = `
        <h2>Resumen del presupuesto</h2>
        <div class="stack" aria-hidden="true">${parts.filter((p) => p[1] > 0).map((p) => `<span style="width:${(p[1] / total) * 100}%;background:${p[2]}" data-tip="${esc(p[0])}: ${esc(money(p[1]))} (${pct((p[1] / total) * 100)})"></span>`).join('')}</div>
        <table class="breakdown"><tbody>
          ${parts.map((p) => `<tr><td><span class="dot" style="background:${p[2]}"></span>${p[0]}:</td><td class="num">${money(p[1])}</td></tr>`).join('')}
          <tr class="total"><td>Costo total:</td><td class="num">${money(r.cost.total)}</td></tr>
        </tbody></table>
        <div class="sale-box">
          <div class="muted small">Venta sugerida</div>
          <div class="price-hero">${money(r.sale.price)}</div>
          ${r.qty > 1 ? `<div class="small muted">${money(r.unitPrice)} por unidad</div>` : ''}
        </div>
        <div class="mini-grid">
          <div class="mini"><span>Costo por unidad</span><strong>${money(r.unitCost)}</strong></div>
          <div class="mini"><span>Margen aplicado</span><strong>x${numFmt(c.multiplier, 1)}</strong></div>
          <div class="mini"><span>Ganancia</span><strong class="pos">${money(r.sale.profit)}</strong></div>
          <div class="mini"><span>Margen sobre precio</span><strong>${pct(r.sale.marginPct)}</strong></div>
          ${r.sale.commission ? `<div class="mini"><span>Comisión</span><strong>${money(r.sale.commission)}</strong></div>` : ''}
          ${r.sale.tax ? `<div class="mini"><span>Impuestos</span><strong>${money(r.sale.tax)}</strong></div>` : ''}
        </div>
        <div class="btn-row two-cols">
          <button class="btn" data-act="calc-copy">📋 Copiar</button>
          <button class="btn primary" data-act="calc-share">🔗 Compartir link</button>
          <button class="btn" data-act="calc-print">🖨️ Imprimir presupuesto</button>
          <button class="btn" data-act="calc-to-sale">➕ Registrar como venta</button>
        </div>`;
      bindTooltips($('#calc-result'), (t) => esc(t));
    };

    form.addEventListener('input', (e) => {
      const { name, value } = e.target;
      if (!name || name === 'fromStock') return;
      c[name] = e.target.type === 'number' ? value : value;
      if (['printerCost', 'lifeHours', 'maintenancePct'].includes(name)) {
        c.wearPerHour = C.wearPerHour(c.printerCost, c.lifeHours, c.maintenancePct);
        form.elements.wearPerHour.value = c.wearPerHour;
        const note = form.elements.wearPerHour.closest('fieldset').querySelector('.note strong');
        if (note) note.textContent = `${money(c.wearPerHour)}/h`;
      }
      if (name === 'currency') {
        S().currency = value; save(); moneyFmt = null; renderCalculadora(); return;
      }
      renderResult();
    });
    form.addEventListener('change', (e) => {
      const { name, value } = e.target;
      if (name === 'printerModel') {
        const p = PRINTERS.find((x) => x.name === value);
        if (p) { c.watts = p.watts; form.elements.watts.value = p.watts; renderResult(); }
      }
      if (name === 'fromStock') {
        const f = data.filaments.find((x) => x.id === value);
        if (f) {
          c.pricePerKg = f.pricePerKg; form.elements.pricePerKg.value = f.pricePerKg;
          const mat = MATERIALS.find((m) => m.toLowerCase().startsWith(String(f.material).toLowerCase().split(' ')[0]));
          if (mat) { c.material = mat; form.elements.material.value = mat; }
          renderResult();
        }
      }
    });
    renderResult();
  }

  function calcText() {
    const c = ui.calc;
    const r = calcResult(c);
    return [
      `Presupuesto — ${S().businessName}`,
      c.client ? `Cliente: ${c.client}` : '',
      c.product ? `Producto: ${c.product}` : '',
      `Material: ${c.material} · ${numFmt(c.grams)} g · ${numFmt(c.hours)} h ${numFmt(c.minutes)} min`,
      r.qty > 1 ? `Cantidad: ${r.qty} piezas (${money(r.unitPrice)} c/u)` : '',
      `Precio: ${money(r.sale.price)}`,
    ].filter(Boolean).join('\n');
  }

  function shareLink() {
    const params = new URLSearchParams();
    CALC_KEYS.forEach((k) => { if (ui.calc[k] !== '' && ui.calc[k] !== undefined) params.set(k, ui.calc[k]); });
    return `${location.origin}${location.pathname}#calculadora?${params.toString()}`;
  }

  function printBudget() {
    const c = ui.calc;
    const r = calcResult(c);
    const w = window.open('', '_blank');
    if (!w) { toast('Permití las ventanas emergentes para imprimir'); return; }
    const row = (a, b) => `<tr><td>${a}</td><td style="text-align:right">${b}</td></tr>`;
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Presupuesto</title>
      <style>body{font:14px/1.5 system-ui,sans-serif;color:#111;max-width:640px;margin:40px auto;padding:0 20px}
      h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:8px 0;border-bottom:1px solid #ddd}
      .total td{font-weight:700;font-size:18px;border-bottom:none}.muted{color:#666}</style></head><body>
      <h1>${esc(S().businessName)}</h1><p class="muted">Presupuesto · ${dateFmt(today())}</p>
      ${c.client ? `<p><strong>Cliente:</strong> ${esc(c.client)}</p>` : ''}
      <table>
        ${row('Producto', esc(c.product || 'Impresión 3D'))}
        ${row('Material', `${esc(c.material)} · ${numFmt(c.grams)} g`)}
        ${row('Tiempo de impresión', `${numFmt(c.hours)} h ${numFmt(c.minutes)} min`)}
        ${row('Cantidad', `${r.qty}`)}
        ${r.qty > 1 ? row('Precio unitario', money(r.unitPrice)) : ''}
        <tr class="total"><td>Total</td><td style="text-align:right">${money(r.sale.price)}</td></tr>
      </table>
      <p class="muted">Presupuesto válido por 15 días. Los tiempos de entrega se confirman al aprobarlo.</p>
      <script>window.onload=function(){window.print()}<\/script></body></html>`);
    w.document.close();
  }

  // ----- Filamentos -----
  function filamentForm(fil) {
    const isNew = !fil;
    const f = fil || { material: 'PLA', color: '', brand: '', gramsLeft: 1000, pricePerKg: C.kgPrice(S()) };
    openForm(isNew ? 'Nuevo filamento' : 'Editar filamento', `
      <div class="form-grid">
        ${field('Material', 'material', '', { type: 'select', options: options(MATERIALS, f.material) })}
        ${field('Color', 'color', f.color, { type: 'text', attrs: 'required placeholder="Negro"' })}
        ${field('Marca', 'brand', f.brand, { type: 'text', attrs: 'placeholder="Grilon3, Printalot, Bambu…"' })}
        ${field('Stock disponible', 'gramsLeft', f.gramsLeft, { suffix: 'g' })}
        ${field('Precio', 'pricePerKg', f.pricePerKg, { prefix: '$', suffix: 'por kg' })}
      </div>`, (v) => {
      const rec = { id: fil?.id || uid(), material: v.material, color: v.color.trim(), brand: v.brand.trim(), gramsLeft: C.num(v.gramsLeft), pricePerKg: C.num(v.pricePerKg) };
      if (fil) Object.assign(fil, rec); else data.filaments.push(rec);
      save();
    }, { onDelete: fil ? () => { data.filaments = data.filaments.filter((x) => x !== fil); save(); } : null });
  }

  function renderInventario() {
    const fs = [...data.filaments].sort((a, b) => a.gramsLeft - b.gramsLeft);
    const totalValue = fs.reduce((a, f) => a + (C.num(f.gramsLeft) / 1000) * C.num(f.pricePerKg), 0);
    view().innerHTML = `
      <div class="page-head">
        <div><h1>Filamentos</h1><p>${fs.length} bobinas · ${numFmt(fs.reduce((a, f) => a + C.num(f.gramsLeft), 0) / 1000, 2)} kg en stock · valor ${money0(totalValue)}</p></div>
        <button class="btn primary" data-act="new-filament">+ Agregar filamento</button>
      </div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Material</th><th>Color</th><th>Marca</th><th style="min-width:160px">Stock</th><th class="num">$/kg</th><th></th></tr></thead>
        <tbody>${fs.length ? fs.map((f) => {
    const p = Math.min(100, (C.num(f.gramsLeft) / 1000) * 100);
    const low = C.num(f.gramsLeft) < 200;
    return `<tr><td>${esc(f.material)}</td><td>${esc(f.color)}</td><td>${esc(f.brand) || '<span class="muted">—</span>'}</td>
            <td><div class="small ${low ? 'neg' : ''}">${numFmt(f.gramsLeft)} g ${low ? '· ¡reponer!' : ''}</div><div class="progress ${low ? '' : 'good'}" style="height:6px"><span style="width:${p}%;${low ? 'background:var(--bad)' : ''}"></span></div></td>
            <td class="num">${money0(f.pricePerKg)}</td>
            <td><div class="btn-row" style="flex-wrap:nowrap"><button class="btn sm" data-refill="${f.id}" title="Sumar una bobina de 1 kg">+1 kg</button><button class="btn sm" data-edit="${f.id}">Editar</button></div></td></tr>`;
  }).join('') : '<tr><td colspan="6" class="empty">Cargá tus bobinas para controlar el stock. Al registrar ventas con filamento, se descuenta solo.</td></tr>'}</tbody>
      </table></div></div>`;
    $$('[data-edit]').forEach((b) => b.addEventListener('click', () => filamentForm(data.filaments.find((x) => x.id === b.dataset.edit))));
    $$('[data-refill]').forEach((b) => b.addEventListener('click', () => {
      const f = data.filaments.find((x) => x.id === b.dataset.refill);
      f.gramsLeft = C.num(f.gramsLeft) + 1000; save(); render(); toast(`+1 kg de ${f.material} ${f.color}`);
    }));
  }

  // ----- Camino al éxito -----
  function renderCamino() {
    const m = ui.month;
    const auto = C.autoMilestones(data, m);
    const isDone = (it) => (it.auto ? !!auto[it.id] : !!data.milestones[it.id]);
    const all = STAGES.flatMap((s) => s.items);
    const doneCount = all.filter(isDone).length;
    const progress = Math.round((doneCount / all.length) * 100);
    const currentStage = STAGES.find((s) => s.items.some((it) => !isDone(it))) || STAGES[STAGES.length - 1];
    const nextSteps = all.filter((it) => !isDone(it)).slice(0, 3);
    const sum = C.summary(data, m);
    const be = C.breakEven(S().fixedCostsMonthly, data);
    const goal = C.num(S().monthlyGoal);
    const series = C.monthlySeries(data, m, 12);
    const best = series.reduce((a, s) => (s.income > a.income ? s : a), { income: 0, key: m });
    const streak = C.profitableStreak(data, m);
    const yearIncome = series.reduce((a, s) => a + s.income, 0);
    const yearProfit = series.reduce((a, s) => a + s.profit, 0);
    const beText = be.salesNeeded === null
      ? 'Registrá ventas con su costo para calcularlo.'
      : be.salesNeeded === Infinity
        ? 'Tus ventas no dejan contribución: con estos precios no se llega nunca.'
        : `Necesitás <strong>${be.salesNeeded} ventas</strong> (≈ ${money0(be.incomeNeeded)}) por mes para cubrir ${money0(S().fixedCostsMonthly)} de costos fijos. Cada venta deja en promedio ${money0(be.contribution)}.`;
    const bePct = be.salesNeeded && be.salesNeeded !== Infinity ? Math.min(100, (sum.salesCount / be.salesNeeded) * 100) : 0;

    view().innerHTML = `
      <div class="page-head"><div><h1>Camino al éxito</h1><p>Hitos para pasar de hobby a negocio rentable. Los marcados como <em>auto</em> se completan solos con tus datos.</p></div></div>

      <div class="grid two">
        <div class="card">
          <div class="level-head">
            <div class="level-ring" style="--p:${progress}"><div>${progress}%</div></div>
            <div>
              <div class="muted small">Etapa actual</div>
              <h2 style="margin:0">${esc(currentStage.name)}</h2>
              <div class="small muted">${doneCount} de ${all.length} hitos logrados</div>
            </div>
          </div>
          <h3 style="margin-top:16px">Próximos pasos</h3>
          ${nextSteps.length ? `<ol class="small" style="padding-left:18px;margin:0">${nextSteps.map((it) => `<li>${esc(it.title)}${it.why ? ` <span class="muted">— ${esc(it.why)}</span>` : ''}</li>`).join('')}</ol>` : '<p>¡Completaste todo el camino! Subí tu meta mensual y seguí creciendo. 🚀</p>'}
        </div>
        <div class="card">
          <h2>Números clave</h2>
          <div class="mini-grid">
            <div class="mini"><span>Meta mensual</span><strong>${goal ? `${pct(Math.min(999, (sum.income / goal) * 100))}` : '—'}</strong></div>
            <div class="mini"><span>Meses seguidos con ganancia</span><strong>${streak}</strong></div>
            <div class="mini"><span>Mejor mes (12 m)</span><strong>${best.income ? `${money0(best.income)}` : '—'}</strong><small class="muted">${best.income ? esc(monthName(best.key, true)) : ''}</small></div>
            <div class="mini"><span>Últimos 12 meses</span><strong>${money0(yearIncome)}</strong><small class="${yearProfit >= 0 ? 'pos' : 'neg'}">ganancia ${money0(yearProfit)}</small></div>
          </div>
          <h3 style="margin-top:16px">Punto de equilibrio</h3>
          <p class="small">${beText}</p>
          ${bePct ? `<div class="progress ${bePct >= 100 ? 'good' : ''}"><span style="width:${bePct}%"></span></div><p class="small muted" style="margin-top:6px">${sum.salesCount} de ${be.salesNeeded} ventas este mes</p>` : ''}
        </div>
      </div>

      <div class="stages section">
        ${STAGES.map((st) => {
    const d = st.items.filter(isDone).length;
    return `<div class="card stage"><h3><span>${esc(st.name)}</span><span class="muted small">${d}/${st.items.length}</span></h3>
            <div class="progress ${d === st.items.length ? 'good' : ''}" style="height:6px;margin-bottom:10px"><span style="width:${(d / st.items.length) * 100}%"></span></div>
            <ul class="milestones">${st.items.map((it) => {
      const done = isDone(it);
      return `<li class="${done ? 'done' : ''}">
                <button class="tick" ${it.auto ? 'disabled title="Se completa automáticamente"' : `data-toggle="${it.id}" title="Marcar como ${done ? 'pendiente' : 'logrado'}"`} aria-pressed="${done}" aria-label="${esc(it.title)}">${done ? '✓' : ''}</button>
                <span>${esc(it.title)}${it.auto ? '<span class="auto-tag">auto</span>' : ''}${it.why ? `<span class="why">${esc(it.why)}</span>` : ''}</span></li>`;
    }).join('')}</ul></div>`;
  }).join('')}
      </div>

      <div class="card section">
        <h2>Consejos para crecer en impresión 3D</h2>
        <ul class="small" style="margin:0;padding-left:18px;display:grid;gap:6px">
          <li><strong>Cobrá tu tiempo.</strong> Diseño, post-proceso y atención al cliente son trabajo: ponelo en "mano de obra".</li>
          <li><strong>Usá multiplicador x3–x5.</strong> Por debajo de x2 casi siempre perdés plata cuando aparecen fallas o reclamos.</li>
          <li><strong>Vendé lo que se imprime solo.</strong> Piezas que no necesitan supervisión ni soportes rinden más por hora de máquina.</li>
          <li><strong>Tené productos "gancho" y productos rentables.</strong> Un llavero barato atrae; una lámpara personalizada paga las cuentas.</li>
          <li><strong>Separá tu sueldo del negocio.</strong> Registrá tu retiro como gasto (categoría "Sueldos / retiro personal").</li>
          <li><strong>Revisá este panel una vez por semana.</strong> 10 minutos de números evitan meses de sorpresas.</li>
        </ul>
      </div>`;
    $$('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
      data.milestones[b.dataset.toggle] = !data.milestones[b.dataset.toggle];
      save(); render();
    }));
  }

  // ----- Ajustes -----
  function renderAjustes() {
    const s = S();
    view().innerHTML = `
      <div class="page-head"><div><h1>Ajustes</h1><p>Tus costos base, metas y copias de seguridad.</p></div></div>
      <form id="settings-form" class="card" autocomplete="off">
        <fieldset><legend>Negocio</legend><div class="form-grid">
          ${field('Nombre del emprendimiento', 'businessName', s.businessName, { type: 'text' })}
          ${field('Moneda', 'currency', '', { type: 'select', options: options(CURRENCIES, s.currency) })}
        </div></fieldset>
        <fieldset><legend>Costos de producción (por defecto)</legend><div class="form-grid">
          ${field('Material habitual', 'material', '', { type: 'select', options: options(MATERIALS, s.material) })}
          ${field('Precio del filamento', 'filamentPricePerKg', s.filamentPricePerKg, { prefix: '$', suffix: 'por kg' })}
          ${field('Costo kWh', 'kwhPrice', s.kwhPrice, { prefix: '$' })}
          ${field('Modelo de impresora', 'printerModel', '', { type: 'select', options: options([['', '— Otro / no sé —'], ...PRINTERS.map((p) => [p.name, p.name])], s.printerModel) })}
          ${field('Consumo de la impresora', 'printerWatts', s.printerWatts, { suffix: 'W' })}
          ${field('Costo de la impresora', 'printerCost', s.printerCost, { prefix: '$' })}
          ${field('Vida útil', 'printerLifeHours', s.printerLifeHours, { suffix: 'h' })}
          ${field('Mantenimiento', 'maintenancePct', s.maintenancePct, { suffix: '%' })}
          ${field('Tu hora de trabajo', 'laborRate', s.laborRate, { prefix: '$', suffix: '/h' })}
          ${field('Margen de fallas', 'failRate', s.failRate, { suffix: '%' })}
        </div><p class="note">Desgaste resultante: <strong id="wear-preview">${money(wearFromSettings())}/h</strong></p></fieldset>
        <fieldset><legend>Precios</legend><div class="form-grid">
          ${field('Multiplicador por defecto', 'multiplier', '', { type: 'select', options: options(MULTIPLIERS, s.multiplier) })}
          ${field('Comisión de venta', 'commissionPct', s.commissionPct, { suffix: '%' })}
          ${field('Impuestos', 'taxPct', s.taxPct, { suffix: '%' })}
          ${field('Redondear precios a', 'roundTo', '', { type: 'select', options: options([[0, 'Sin redondear'], [10, '$10'], [50, '$50'], [100, '$100'], [500, '$500'], [1000, '$1.000']], s.roundTo) })}
        </div></fieldset>
        <fieldset><legend>Metas</legend><div class="form-grid">
          ${field('Meta de ingresos mensual', 'monthlyGoal', s.monthlyGoal, { prefix: '$' })}
          ${field('Costos fijos mensuales', 'fixedCostsMonthly', s.fixedCostsMonthly, { prefix: '$', hint: 'Alquiler, internet, monotributo, suscripciones… Se usa para el punto de equilibrio.' })}
        </div>
        ${data.expenses.some((e) => e.fixed) ? `<button type="button" class="btn sm" data-act="fixed-from-expenses" style="margin-top:10px">Usar los gastos fijos de ${esc(monthName(ui.month))}</button>` : ''}
        </fieldset>
        <div class="btn-row"><button type="submit" class="btn primary">Guardar ajustes</button></div>
      </form>

      <div class="card section">
        <h2>Copias de seguridad</h2>
        <p class="small muted">Los datos se guardan en este navegador. Exportá un backup seguido (y antes de cambiar de compu o borrar el historial).</p>
        <div class="btn-row">
          <button class="btn" data-act="export-json">⬇️ Exportar backup (.json)</button>
          <label class="btn" style="cursor:pointer">⬆️ Importar backup<input type="file" accept="application/json,.json" id="import-file" hidden></label>
          <button class="btn" data-act="csv-sales">Ventas CSV</button>
          <button class="btn" data-act="csv-expenses">Gastos CSV</button>
        </div>
        <h3 style="margin-top:16px">Zona de pruebas</h3>
        <div class="btn-row">
          <button class="btn" data-act="demo">Cargar datos de ejemplo</button>
          <button class="btn danger" data-act="reset">Borrar todo</button>
        </div>
      </div>`;
    const form = $('#settings-form');
    form.addEventListener('input', () => {
      const v = Object.fromEntries(new FormData(form).entries());
      $('#wear-preview').textContent = `${money(C.wearPerHour(v.printerCost, v.printerLifeHours, v.maintenancePct))}/h`;
    });
    form.elements.printerModel.addEventListener('change', (e) => {
      const p = PRINTERS.find((x) => x.name === e.target.value);
      if (p) form.elements.printerWatts.value = p.watts;
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(form).entries());
      Object.keys(v).forEach((k) => {
        const isText = ['businessName', 'currency', 'material', 'printerModel'].includes(k);
        s[k] = isText ? v[k] : C.num(v[k]);
      });
      s.businessName = s.businessName.trim() || 'Mi taller 3D';
      moneyFmt = null;
      ui.calc = null;
      save(); render();
      toast('Ajustes guardados');
    });
    $('#import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const d = JSON.parse(reader.result);
          if (!d || !Array.isArray(d.sales) || !Array.isArray(d.expenses)) throw new Error('formato');
          if (!confirm('Esto reemplaza todos los datos actuales por los del backup. ¿Continuar?')) return;
          data = { ...emptyData(), ...d, settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) } };
          moneyFmt = null; ui.calc = null;
          save(); render(); toast('Backup importado');
        } catch (err) {
          toast('El archivo no es un backup válido');
        }
      };
      reader.readAsText(file);
    });
  }

  // ---------- CSV ----------
  function toCsv(rows, cols) {
    const q = (v) => {
      const s = String(v ?? '');
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return '﻿' + [cols.map((c) => q(c[0])).join(';'), ...rows.map((r) => cols.map((c) => q(typeof c[1] === 'function' ? c[1](r) : r[c[1]])).join(';'))].join('\n');
  }
  const decimal = (n) => String(C.round2(n)).replace('.', ',');

  // ---------- Datos de ejemplo ----------
  function demoData() {
    const d = emptyData();
    d.settings.businessName = 'Impresiones 3D (ejemplo)';
    const fil = [
      { id: uid(), material: 'PLA', color: 'Negro', brand: 'Grilon3', gramsLeft: 640, pricePerKg: 25000 },
      { id: uid(), material: 'PLA', color: 'Blanco', brand: 'Grilon3', gramsLeft: 1450, pricePerKg: 25000 },
      { id: uid(), material: 'PETG', color: 'Transparente', brand: 'Printalot', gramsLeft: 150, pricePerKg: 29000 },
      { id: uid(), material: 'TPU (flexible)', color: 'Rojo', brand: 'Printalot', gramsLeft: 800, pricePerKg: 38000 },
    ];
    d.filaments = fil;
    const products = [
      { product: 'Llavero personalizado', grams: 8, hours: 0.5, labor: 0.1, extras: 150, price: 2500 },
      { product: 'Maceta geométrica', grams: 120, hours: 6, labor: 0.3, extras: 0, price: 14000 },
      { product: 'Soporte de celular', grams: 45, hours: 2.5, labor: 0.2, extras: 0, price: 7000 },
      { product: 'Lámpara luna', grams: 180, hours: 11, labor: 0.5, extras: 3500, price: 32000 },
      { product: 'Figura para pintar', grams: 60, hours: 5, labor: 1, extras: 500, price: 15000 },
      { product: 'Repuesto a medida', grams: 30, hours: 1.5, labor: 1.5, extras: 0, price: 9000 },
      { product: 'Organizador de escritorio', grams: 210, hours: 9, labor: 0.2, extras: 0, price: 19000 },
    ];
    const clients = ['Lucía', 'Martín', 'Sofía', 'Diego', 'Valentina', 'Juan', 'Camila', 'Tomás', 'Mica', 'Ferretería El Tornillo', 'Agus', 'Paula', 'Nico', 'Flor'];
    const months = C.lastMonths(ui.month, 6);
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const tmp = data; data = d; // costForJob usa data.settings
    months.forEach((mk, mi) => {
      const n = 5 + mi * 2 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const p = products[Math.floor(rnd() * products.length)];
        const qty = rnd() < 0.2 ? 2 + Math.floor(rnd() * 3) : 1;
        const f = fil[Math.floor(rnd() * 2)];
        const cost = costForJob({ grams: p.grams * qty, hours: p.hours * qty, laborHours: p.labor * qty, extras: p.extras * qty, pricePerKg: f.pricePerKg });
        const isLast = mi === months.length - 1;
        const status = isLast && rnd() < 0.3 ? (rnd() < 0.5 ? 'pendiente' : 'entregado') : 'cobrado';
        d.sales.push({
          id: uid(), date: `${mk}-${String(1 + Math.floor(rnd() * 27)).padStart(2, '0')}`,
          client: clients[Math.floor(rnd() * clients.length)], product: p.product, qty,
          channel: CHANNELS[Math.floor(rnd() * 4)], status, filamentId: f.id,
          grams: p.grams * qty, hours: C.round2(p.hours * qty), laborHours: p.labor * qty, extras: p.extras * qty,
          price: p.price * qty, cost: cost.total, notes: '',
        });
      }
      d.expenses.push(
        { id: uid(), date: `${mk}-03`, category: 'Filamento / resina', description: '3 bobinas PLA', amount: 75000 + Math.round(rnd() * 20000), fixed: false },
        { id: uid(), date: `${mk}-10`, category: 'Electricidad', description: 'Parte proporcional factura', amount: 9000 + Math.round(rnd() * 3000), fixed: true },
        { id: uid(), date: `${mk}-15`, category: 'Impuestos (monotributo, IIBB)', description: 'Monotributo', amount: 32000, fixed: true },
        { id: uid(), date: `${mk}-18`, category: 'Marketing y publicidad', description: 'Publicidad Instagram', amount: 10000 + Math.round(rnd() * 15000), fixed: false },
        { id: uid(), date: `${mk}-20`, category: 'Packaging', description: 'Cajas y bolsas', amount: 6000 + Math.round(rnd() * 4000), fixed: false },
      );
      if (mi === 2) d.expenses.push({ id: uid(), date: `${mk}-12`, category: 'Repuestos y mantenimiento', description: 'Boquillas y PEI', amount: 28000, fixed: false });
    });
    data = tmp;
    d.milestones = { 'm-social': true, 'm-catalog': true };
    return d;
  }

  // ---------- Acciones globales ----------
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.closest('#dialog-form')) return;
    const act = btn.dataset.act;
    switch (act) {
      case 'new-sale': saleForm(); break;
      case 'new-expense': expenseForm(); break;
      case 'new-filament': filamentForm(); break;
      case 'copy-fixed': copyFixedExpenses(); break;
      case 'csv-sales':
        download(`ventas-${today()}.csv`, toCsv(data.sales, [
          ['Fecha', 'date'], ['Cliente', 'client'], ['Producto', 'product'], ['Cantidad', 'qty'], ['Canal', 'channel'],
          ['Estado', 'status'], ['Gramos', 'grams'], ['Horas', (r) => decimal(r.hours)], ['Precio', (r) => decimal(r.price)],
          ['Costo', (r) => decimal(r.cost)], ['Ganancia', (r) => decimal(r.price - r.cost)], ['Notas', 'notes'],
        ]), 'text/csv;charset=utf-8');
        break;
      case 'csv-expenses':
        download(`gastos-${today()}.csv`, toCsv(data.expenses, [
          ['Fecha', 'date'], ['Categoría', 'category'], ['Descripción', 'description'], ['Monto', (r) => decimal(r.amount)], ['Fijo', (r) => (r.fixed ? 'Sí' : 'No')],
        ]), 'text/csv;charset=utf-8');
        break;
      case 'export-json':
        download(`taller3d-backup-${today()}.json`, JSON.stringify(data, null, 2), 'application/json');
        break;
      case 'demo':
        if ((data.sales.length || data.expenses.length) && !confirm('Esto reemplaza tus datos actuales por datos de ejemplo. ¿Continuar?')) return;
        data = demoData(); moneyFmt = null; ui.calc = null; save(); render(); toast('Datos de ejemplo cargados');
        break;
      case 'reset':
        if (!confirm('¿Borrar TODOS los datos? Exportá un backup antes si los querés conservar.')) return;
        data = emptyData(); moneyFmt = null; ui.calc = null; save(); render(); toast('Datos borrados');
        break;
      case 'fixed-from-expenses': {
        const total = data.expenses.filter((x) => x.fixed && C.monthKey(x.date) === ui.month).reduce((a, x) => a + C.num(x.amount), 0);
        $('#settings-form').elements.fixedCostsMonthly.value = total;
        toast('Recordá guardar los ajustes');
        break;
      }
      case 'calc-reset': ui.calc = calcDefaults(); render(); break;
      case 'calc-save-defaults': {
        const c = ui.calc; const s = S();
        Object.assign(s, {
          material: c.material, filamentPricePerKg: C.num(c.pricePerKg), kwhPrice: C.num(c.kwhPrice), printerModel: c.printerModel,
          printerWatts: C.num(c.watts), printerCost: C.num(c.printerCost), printerLifeHours: C.num(c.lifeHours),
          maintenancePct: C.num(c.maintenancePct), laborRate: C.num(c.laborRate), failRate: C.num(c.failRate),
          multiplier: C.num(c.multiplier), commissionPct: C.num(c.commissionPct), taxPct: C.num(c.taxPct), roundTo: C.num(c.roundTo),
        });
        save(); toast('Guardado como predeterminado');
        break;
      }
      case 'calc-copy':
        try { await navigator.clipboard.writeText(calcText()); toast('Presupuesto copiado'); } catch (err) { prompt('Copiá el texto:', calcText()); }
        break;
      case 'calc-share': {
        const url = shareLink();
        try {
          if (navigator.share) await navigator.share({ title: 'Presupuesto impresión 3D', text: calcText(), url });
          else { await navigator.clipboard.writeText(url); toast('Link copiado'); }
        } catch (err) {
          if (err && err.name === 'AbortError') return;
          prompt('Copiá el link:', url);
        }
        break;
      }
      case 'calc-print': printBudget(); break;
      case 'calc-to-sale': {
        const c = ui.calc; const r = calcResult(c);
        saleForm(null);
        const form = $('#dialog-form');
        const set = (n, v) => { if (form.elements[n]) form.elements[n].value = v; };
        set('client', c.client); set('product', c.product); set('qty', r.qty); set('grams', C.num(c.grams) * r.qty);
        const totalH = C.toHours(c.hours, c.minutes) * r.qty;
        set('hours', Math.floor(totalH)); set('minutes', Math.round((totalH % 1) * 60));
        set('laborHours', c.laborHours); set('extras', c.extras); set('price', r.sale.price);
        form.elements.grams.dispatchEvent(new Event('input'));
        set('cost', r.cost.total * 1); // el costo de la calculadora manda
        form.elements.cost.dispatchEvent(new Event('input'));
        break;
      }
      default: break;
    }
  });

  // ---------- Router ----------
  const VIEWS = {
    panel: renderPanel, ventas: renderVentas, gastos: renderGastos, calculadora: renderCalculadora,
    inventario: renderInventario, camino: renderCamino, ajustes: renderAjustes,
  };
  function readHash() {
    const [tab, query] = location.hash.replace(/^#/, '').split('?');
    ui.tab = VIEWS[tab] ? tab : 'panel';
    if (ui.tab === 'calculadora' && query) {
      const p = new URLSearchParams(query);
      const c = calcDefaults();
      CALC_KEYS.forEach((k) => { if (p.has(k)) c[k] = p.get(k); });
      ui.calc = c;
      history.replaceState(null, '', '#calculadora');
    }
  }
  function render() {
    $('#tooltip').hidden = true;
    $('#business-name').textContent = S().businessName;
    document.title = `${S().businessName} — Contabilidad`;
    $$('#tabs a').forEach((a) => {
      if (a.dataset.tab === ui.tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    VIEWS[ui.tab]();
  }
  window.addEventListener('hashchange', () => { readHash(); render(); window.scrollTo(0, 0); });

  // Mes seleccionado
  const monthInput = $('#month');
  monthInput.value = ui.month;
  monthInput.addEventListener('change', () => { if (monthInput.value) { ui.month = monthInput.value; render(); } });

  // Tema claro/oscuro
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  try { applyTheme(localStorage.getItem(THEME_KEY)); } catch (e) { /* sin storage */ }
  $('#theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* sin storage */ }
  });

  readHash();
  render();
})();
