/*
 * Lógica de negocio pura (sin DOM). Funciona en el navegador (window.Calc)
 * y en Node (module.exports) para poder testearla.
 */
(function (root) {
  'use strict';

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const round2 = (n) => Math.round(num(n) * 100) / 100;

  /** "2026-11" a partir de "2026-11-05" */
  const monthKey = (date) => String(date || '').slice(0, 7);

  /** Lista de claves de mes, de la más antigua a la más nueva, terminando en `endKey`. */
  function lastMonths(endKey, count) {
    let [y, m] = endKey.split('-').map(Number);
    const out = [];
    for (let i = 0; i < count; i++) {
      out.unshift(`${y}-${String(m).padStart(2, '0')}`);
      m -= 1;
      if (m === 0) { m = 12; y -= 1; }
    }
    return out;
  }

  /**
   * Desgaste (amortización) por hora de impresión.
   * Ej: impresora de $855.250, 20% extra de mantenimiento/repuestos, vida útil 3.000 h
   *     -> 855250 × 1,20 ÷ 3000 = $342,10 por hora.
   */
  function wearPerHour(printerCost, lifeHours, maintenancePct) {
    const life = num(lifeHours);
    if (life <= 0) return 0;
    return round2(num(printerCost) * (1 + num(maintenancePct) / 100) / life);
  }

  /** Horas decimales a partir de horas + minutos. */
  const toHours = (h, m) => num(h) + num(m) / 60;

  /**
   * Costo de una impresión.
   * p: { grams, pricePerKg, hours, watts, kwhPrice, wearPerHour,
   *      laborHours, laborRate, extras, failRate (%, opcional) }
   */
  function printCost(p) {
    const material = num(p.grams) / 1000 * num(p.pricePerKg);
    const energy = num(p.hours) * num(p.watts) / 1000 * num(p.kwhPrice);
    const depreciation = num(p.hours) * num(p.wearPerHour);
    const labor = num(p.laborHours) * num(p.laborRate);
    const extras = num(p.extras);
    // Las fallas desperdician material, energía y máquina (no tu tiempo de post-proceso).
    const failure = (material + energy + depreciation) * num(p.failRate) / 100;
    const total = material + energy + depreciation + labor + extras + failure;
    return {
      material: round2(material),
      energy: round2(energy),
      depreciation: round2(depreciation),
      labor: round2(labor),
      extras: round2(extras),
      failure: round2(failure),
      total: round2(total),
    };
  }

  /** Precio sugerido aplicando un margen de ganancia sobre el precio (no markup sobre el costo). */
  function priceForMargin(cost, marginPct) {
    const m = Math.min(num(marginPct), 95) / 100;
    return round2(num(cost) / (1 - m));
  }

  /**
   * Precio de venta: costo × multiplicador (x4 = estándar). Opcionalmente suma lo que se
   * llevan la plataforma (comisión, ej. MercadoLibre) y los impuestos, para que lo que te
   * queda en mano siga siendo costo × multiplicador. `roundTo` redondea hacia arriba.
   */
  function finalPrice(cost, multiplier, commissionPct, taxPct, roundTo) {
    const base = num(cost) * (num(multiplier) || 1);
    const fees = Math.min(num(commissionPct) + num(taxPct), 90) / 100;
    let price = base / (1 - fees);
    const step = num(roundTo);
    if (step > 0) price = Math.ceil(Math.round(price * 100) / 100 / step) * step;
    const commission = price * num(commissionPct) / 100;
    const tax = price * num(taxPct) / 100;
    const net = price - commission - tax;
    return {
      price: round2(price),
      commission: round2(commission),
      tax: round2(tax),
      net: round2(net),
      profit: round2(net - num(cost)),
      marginPct: price > 0 ? round2((net - num(cost)) / price * 100) : 0,
    };
  }

  /** Precio por kg de filamento a partir de los ajustes (directo o bobina/peso). */
  function kgPrice(settings) {
    const s = settings || {};
    if (num(s.filamentPricePerKg) > 0) return num(s.filamentPricePerKg);
    if (num(s.spoolPrice) > 0 && num(s.spoolGrams) > 0) return round2(num(s.spoolPrice) / num(s.spoolGrams) * 1000);
    return 0;
  }

  const isActiveSale = (s) => s.status !== 'cancelado';

  /** Resumen de un mes (o de todo si ym es null). */
  function summary(data, ym) {
    const inPeriod = (d) => !ym || monthKey(d) === ym;
    const sales = (data.sales || []).filter((s) => isActiveSale(s) && inPeriod(s.date));
    const expenses = (data.expenses || []).filter((e) => inPeriod(e.date));

    const income = sales.reduce((a, s) => a + num(s.price), 0);
    const salesCost = sales.reduce((a, s) => a + num(s.cost), 0);
    const spent = expenses.reduce((a, e) => a + num(e.amount), 0);
    const fixed = expenses.filter((e) => e.fixed).reduce((a, e) => a + num(e.amount), 0);
    const pendingCollection = sales
      .filter((s) => s.status !== 'cobrado')
      .reduce((a, s) => a + num(s.price), 0);
    const units = sales.reduce((a, s) => a + Math.max(1, num(s.qty)), 0);

    return {
      income: round2(income),
      expenses: round2(spent),
      fixedExpenses: round2(fixed),
      profit: round2(income - spent),
      // margen bruto: ingresos contra el costo calculado de lo vendido
      grossProfit: round2(income - salesCost),
      grossMarginPct: income > 0 ? round2((income - salesCost) / income * 100) : 0,
      netMarginPct: income > 0 ? round2((income - spent) / income * 100) : 0,
      salesCount: sales.length,
      units,
      avgTicket: sales.length ? round2(income / sales.length) : 0,
      pendingCollection: round2(pendingCollection),
    };
  }

  /** Serie mensual ingresos/gastos/ganancia para los últimos `count` meses. */
  function monthlySeries(data, endKey, count) {
    return lastMonths(endKey, count).map((key) => {
      const s = summary(data, key);
      return { key, income: s.income, expenses: s.expenses, profit: s.profit };
    });
  }

  /** Gastos agrupados por categoría, mayor a menor. */
  function expensesByCategory(data, ym) {
    const map = new Map();
    (data.expenses || []).forEach((e) => {
      if (ym && monthKey(e.date) !== ym) return;
      map.set(e.category, (map.get(e.category) || 0) + num(e.amount));
    });
    return [...map.entries()]
      .map(([category, amount]) => ({ category, amount: round2(amount) }))
      .sort((a, b) => b.amount - a.amount);
  }

  /** Ranking de productos por ganancia bruta. */
  function productRanking(data) {
    const map = new Map();
    (data.sales || []).filter(isActiveSale).forEach((s) => {
      const key = (s.product || 'Sin nombre').trim();
      const r = map.get(key) || { product: key, units: 0, income: 0, cost: 0 };
      r.units += Math.max(1, num(s.qty));
      r.income += num(s.price);
      r.cost += num(s.cost);
      map.set(key, r);
    });
    return [...map.values()]
      .map((r) => ({
        ...r,
        income: round2(r.income),
        cost: round2(r.cost),
        profit: round2(r.income - r.cost),
        marginPct: r.income > 0 ? round2((r.income - r.cost) / r.income * 100) : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
  }

  function clientCount(data) {
    const set = new Set();
    (data.sales || []).filter(isActiveSale).forEach((s) => {
      const c = (s.client || '').trim().toLowerCase();
      if (c) set.add(c);
    });
    return set.size;
  }

  /**
   * Punto de equilibrio: cuántas ventas por mes necesitás para cubrir los costos fijos,
   * usando la contribución promedio (precio - costo variable) de tus ventas.
   */
  function breakEven(fixedCosts, data) {
    const sales = (data.sales || []).filter(isActiveSale);
    const income = sales.reduce((a, s) => a + num(s.price), 0);
    const cost = sales.reduce((a, s) => a + num(s.cost), 0);
    if (!sales.length) return { salesNeeded: null, incomeNeeded: null, contribution: 0 };
    const contribution = (income - cost) / sales.length;
    const ratio = income > 0 ? (income - cost) / income : 0;
    if (contribution <= 0) return { salesNeeded: Infinity, incomeNeeded: Infinity, contribution: round2(contribution) };
    return {
      salesNeeded: Math.ceil(num(fixedCosts) / contribution),
      incomeNeeded: round2(num(fixedCosts) / ratio),
      contribution: round2(contribution),
    };
  }

  /** Meses consecutivos (hasta endKey inclusive) con ganancia > 0. */
  function profitableStreak(data, endKey) {
    let streak = 0;
    for (const key of lastMonths(endKey, 36).reverse()) {
      const s = summary(data, key);
      if (s.profit > 0) streak += 1;
      else break;
    }
    return streak;
  }

  /** Hitos que se detectan solos a partir de los datos. */
  function autoMilestones(data, endKey) {
    const settings = data.settings || {};
    const all = summary(data, null);
    const month = summary(data, endKey);
    const be = breakEven(num(settings.fixedCostsMonthly), data);
    const series = monthlySeries(data, endKey, 36);
    const bestMonth = Math.max(0, ...series.map((m) => m.income));
    return {
      'costs-configured': kgPrice(settings) > 0 && num(settings.kwhPrice) > 0,
      'first-sale': all.salesCount >= 1,
      'expenses-tracked': (data.expenses || []).length >= 5,
      'ten-sales': all.salesCount >= 10,
      'ten-clients': clientCount(data) >= 10,
      'healthy-margin': all.salesCount >= 3 && all.grossMarginPct >= 40,
      'break-even': be.salesNeeded !== null && be.salesNeeded !== Infinity && month.salesCount >= be.salesNeeded && month.profit > 0,
      'monthly-goal': num(settings.monthlyGoal) > 0 && bestMonth >= num(settings.monthlyGoal),
      'three-profitable': profitableStreak(data, endKey) >= 3,
      'fifty-clients': clientCount(data) >= 50,
    };
  }

  /** Consejos accionables según los números. Cada uno: { level: good|warn|bad|info, text } */
  function insights(data, endKey, money) {
    const fmt = money || round2;
    const out = [];
    const settings = data.settings || {};
    const month = summary(data, endKey);
    const prevKey = lastMonths(endKey, 2)[0];
    const prev = summary(data, prevKey);
    const all = summary(data, null);
    const ranking = productRanking(data);
    const fmtPct = (n) => `${Math.round(n)}%`;

    if (!all.salesCount) {
      out.push({ level: 'info', text: 'Registrá tu primera venta para empezar a ver tus números reales.' });
    }
    if (!kgPrice(settings) || !num(settings.kwhPrice)) {
      out.push({ level: 'warn', text: 'Completá tus costos en Ajustes (filamento, luz, impresora). Sin eso no sabés cuánto ganás de verdad por pieza.' });
    }
    if (month.income > 0 && prev.income > 0) {
      const change = (month.income - prev.income) / prev.income * 100;
      if (change >= 10) out.push({ level: 'good', text: `Los ingresos subieron ${fmtPct(change)} respecto al mes anterior. ¡Seguí así!` });
      else if (change <= -10) out.push({ level: 'warn', text: `Los ingresos bajaron ${fmtPct(-change)} respecto al mes anterior. Revisá qué canal o producto dejó de vender.` });
    }
    if (month.income > 0 && month.profit < 0) {
      out.push({ level: 'bad', text: 'Este mes estás gastando más de lo que ingresa. Revisá los gastos más grandes y si tus precios cubren los costos.' });
    }
    if (all.salesCount >= 3 && all.grossMarginPct < 30) {
      out.push({ level: 'bad', text: `Tu margen bruto promedio es ${fmtPct(all.grossMarginPct)}. En impresión 3D conviene apuntar a 50% o más: subí precios o reducí tiempo/material por pieza.` });
    } else if (all.salesCount >= 3 && all.grossMarginPct >= 50) {
      out.push({ level: 'good', text: `Margen bruto de ${fmtPct(all.grossMarginPct)}: tus precios están bien parados.` });
    }
    const losers = ranking.filter((r) => r.income > 0 && r.marginPct < 20);
    if (losers.length) {
      out.push({ level: 'warn', text: `Productos con margen bajo (<20%): ${losers.slice(0, 3).map((r) => r.product).join(', ')}. Repensá su precio o diseño.` });
    }
    if (ranking.length >= 2 && ranking[0].profit > 0) {
      out.push({ level: 'info', text: `Tu producto estrella es "${ranking[0].product}" (${ranking[0].units} u., ganancia ${fmt(ranking[0].profit)}). Promocionalo y creá variantes.` });
    }
    if (month.pendingCollection > 0) {
      out.push({ level: 'warn', text: `Tenés ${fmt(month.pendingCollection)} sin cobrar este mes. Hacé seguimiento a esos clientes.` });
    }
    const goal = num(settings.monthlyGoal);
    if (goal > 0 && month.income >= goal) {
      out.push({ level: 'good', text: '¡Alcanzaste la meta del mes! Pensá en subirla un 15-20% para el próximo.' });
    }
    const be = breakEven(num(settings.fixedCostsMonthly), data);
    if (be.salesNeeded === Infinity) {
      out.push({ level: 'bad', text: 'Con los precios actuales cada venta pierde plata: nunca vas a cubrir los costos fijos. Subí precios ya.' });
    }
    const filaments = data.filaments || [];
    const low = filaments.filter((f) => num(f.gramsLeft) > 0 && num(f.gramsLeft) < 200);
    if (low.length) {
      out.push({ level: 'warn', text: `Poco filamento: ${low.map((f) => `${f.material} ${f.color}`).join(', ')}. Reponé antes de quedarte sin stock.` });
    }
    return out;
  }

  const Calc = {
    num, round2, monthKey, lastMonths, printCost, priceForMargin, finalPrice, kgPrice, wearPerHour, toHours, summary,
    monthlySeries, expensesByCategory, productRanking, clientCount, breakEven,
    profitableStreak, autoMilestones, insights,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Calc;
  else root.Calc = Calc;
})(typeof window !== 'undefined' ? window : globalThis);
