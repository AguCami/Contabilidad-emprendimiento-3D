const test = require('node:test');
const assert = require('node:assert/strict');
const Calc = require('../js/calc.js');

test('printCost reproduce el ejemplo de la calculadora de referencia', () => {
  const wear = Calc.wearPerHour(855250, 3000, 20);
  assert.equal(wear, 342.1);
  const r = Calc.printCost({
    grams: 50, pricePerKg: 25000,
    hours: Calc.toHours(2, 30), watts: 220, kwhPrice: 50,
    wearPerHour: wear, laborHours: 0, laborRate: 0, extras: 0,
  });
  assert.equal(r.material, 1250);
  assert.equal(r.energy, 27.5);
  assert.equal(r.depreciation, 855.25);
  assert.equal(r.total, 2132.75);
  assert.equal(Calc.finalPrice(r.total, 4).price, 8531);
});

test('printCost suma mano de obra, extras y fallas', () => {
  const r = Calc.printCost({
    grams: 100, pricePerKg: 20000, hours: 5, watts: 200, kwhPrice: 100,
    wearPerHour: 100, laborHours: 0.5, laborRate: 4000, extras: 300, failRate: 10,
  });
  assert.equal(r.failure, 260);
  assert.equal(r.total, 5160);
});

test('priceForMargin calcula margen sobre el precio', () => {
  assert.equal(Calc.priceForMargin(500, 50), 1000);
  assert.equal(Calc.priceForMargin(600, 40), 1000);
});

test('lastMonths cruza de año', () => {
  assert.deepEqual(Calc.lastMonths('2026-02', 3), ['2025-12', '2026-01', '2026-02']);
});

const data = {
  settings: { fixedCostsMonthly: 10000, monthlyGoal: 5000, filamentPricePerKg: 1, kwhPrice: 1 },
  sales: [
    { date: '2026-10-02', client: 'Ana', product: 'Llavero', qty: 1, price: 3000, cost: 1000, status: 'cobrado' },
    { date: '2026-10-10', client: 'Beto', product: 'Maceta', qty: 1, price: 5000, cost: 2000, status: 'pendiente' },
    { date: '2026-10-11', client: 'Ana', product: 'Llavero', qty: 1, price: 9999, cost: 0, status: 'cancelado' },
    { date: '2026-11-01', client: 'Caro', product: 'Llavero', qty: 2, price: 6000, cost: 2000, status: 'cobrado' },
  ],
  expenses: [
    { date: '2026-10-01', category: 'Filamento', amount: 2000, fixed: false },
    { date: '2026-10-05', category: 'Alquiler', amount: 1000, fixed: true },
  ],
};

test('summary ignora ventas canceladas y filtra por mes', () => {
  const s = Calc.summary(data, '2026-10');
  assert.equal(s.income, 8000);
  assert.equal(s.expenses, 3000);
  assert.equal(s.profit, 5000);
  assert.equal(s.grossProfit, 5000);
  assert.equal(s.pendingCollection, 5000);
  assert.equal(s.salesCount, 2);
});

test('breakEven usa la contribución promedio', () => {
  // ingresos 14000, costo 5000, 3 ventas -> contribución 3000/venta
  const be = Calc.breakEven(10000, data);
  assert.equal(be.contribution, 3000);
  assert.equal(be.salesNeeded, 4);
});

test('productRanking agrupa por producto', () => {
  const r = Calc.productRanking(data);
  assert.equal(r[0].product, 'Llavero');
  assert.equal(r[0].units, 3);
  assert.equal(r[0].profit, 6000);
});

test('autoMilestones detecta primera venta y meta mensual', () => {
  const m = Calc.autoMilestones(data, '2026-11');
  assert.equal(m['first-sale'], true);
  assert.equal(m['monthly-goal'], true);
  assert.equal(m['ten-sales'], false);
});

test('insights avisa cobros pendientes', () => {
  const tips = Calc.insights(data, '2026-10');
  assert.ok(tips.some((t) => t.text.includes('sin cobrar')));
});

test('finalPrice agrega comisión e impuestos sin comerse la ganancia', () => {
  const r = Calc.finalPrice(500, 2, 15, 5, 0); // base 1000, /0.8 = 1250
  assert.equal(r.price, 1250);
  assert.equal(r.net, 1000);
  assert.equal(r.profit, 500);
  assert.equal(Calc.finalPrice(500, 2, 0, 0, 100).price, 1000);
  assert.equal(Calc.finalPrice(510, 2, 0, 0, 100).price, 1100);
});
