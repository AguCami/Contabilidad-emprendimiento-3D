# Taller 3D — Contabilidad para tu emprendimiento de impresión 3D

Web app para llevar las cuentas de un emprendimiento de impresiones 3D y seguir el
**camino al éxito**: saber cuánto cuesta cada pieza, a cuánto venderla, cuánto ganás
por mes y qué hacer para crecer.

No necesita instalación ni servidor: abrí `index.html` en el navegador (o publicalo con
GitHub Pages). Los datos se guardan en tu navegador; usá **Ajustes → Exportar backup**
para hacer copias de seguridad.

## Secciones

| Sección | Qué hace |
|---|---|
| **Panel** | Ingresos, gastos, ganancia neta, por cobrar, meta del mes, gráfico de 6 meses, en qué se va la plata, productos más rentables y consejos automáticos según tus números. |
| **Ventas** | Registro de pedidos con cliente, producto, canal y estado (pendiente → entregado → cobrado). El costo se calcula solo con gramos y tiempo, y se descuenta el filamento del stock. |
| **Gastos** | Gastos por categoría (filamento, luz, repuestos, envíos, publicidad, impuestos…), marcando los fijos. Botón para repetir los gastos fijos del mes anterior. |
| **Calculadora** | Costo de material, electricidad, desgaste de la máquina, mano de obra, extras y fallas → precio sugerido con multiplicador (x4 estándar), comisión de venta e impuestos. Copiar, compartir link, imprimir presupuesto o registrarlo como venta. |
| **Filamentos** | Stock de bobinas en gramos, precio por kg y alerta de poco stock. |
| **Camino al éxito** | 19 hitos en 4 etapas (Arranque, Validación, Rentabilidad, Crecimiento); muchos se completan solos con tus datos. Punto de equilibrio, meses seguidos con ganancia y próximos pasos. |
| **Ajustes** | Costos por defecto, metas, moneda, backups (JSON) y exportación a CSV (se abre en Excel). |

## Fórmulas de la calculadora

- **Material** = gramos ÷ 1000 × precio por kg
- **Electricidad** = horas × watts ÷ 1000 × precio del kWh
- **Desgaste/h** = costo de la impresora × (1 + % mantenimiento) ÷ vida útil en horas
  (ej.: $855.250 × 1,20 ÷ 3.000 h = $342,10/h)
- **Mano de obra** = horas de trabajo × valor hora
- **Fallas** = % de fallas × (material + electricidad + desgaste)
- **Precio** = costo total × multiplicador ÷ (1 − comisión − impuestos)

## Desarrollo

```bash
node --test tests/*.test.js
```

La lógica de negocio está en `js/calc.js` (sin dependencias, testeada) y la interfaz en `js/app.js`.
