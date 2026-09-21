import { fechaCorta, fechaLocal, listaNumeros, numero, tiempoRelativo } from './formato';

describe('formato', () => {
  it('escribe los números con coma decimal y solo los decimales necesarios', () => {
    expect(numero(12.5)).toBe('12,5');
    expect(numero(22)).toBe('22');
  });

  it('arma listas legibles de medidas', () => {
    expect(listaNumeros([])).toBe('');
    expect(listaNumeros([12.5])).toBe('12,5');
    expect(listaNumeros([12.5, 9])).toBe('12,5 y 9');
    expect(listaNumeros([7, 9, 12])).toBe('7, 9 y 12');
  });

  it('no corre un día las fechas sin hora (YYYY-MM-DD)', () => {
    const f = fechaLocal('2027-05-17');
    expect([f.getFullYear(), f.getMonth(), f.getDate()]).toEqual([2027, 4, 17]);
    expect(fechaCorta('2027-05-17')).toContain('17');
  });

  describe('tiempoRelativo', () => {
    const ahora = new Date(2026, 8, 19, 10, 0); // 19 sep 2026
    it('usa palabras cercanas', () => {
      expect(tiempoRelativo('2026-09-19', ahora)).toBe('hoy');
      expect(tiempoRelativo('2026-09-18', ahora)).toBe('ayer');
    });
    it('cuenta en días hasta ~2 meses (importa en reproducción)', () => {
      expect(tiempoRelativo('2026-08-19', ahora)).toBe('hace 31 días');
    });
    it('pasa a meses después y entiende fechas futuras', () => {
      expect(tiempoRelativo('2026-06-21', ahora)).toBe('hace 3 meses');
      expect(tiempoRelativo('2027-05-17', ahora)).toBe('dentro de 8 meses');
    });
  });
});
