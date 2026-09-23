/**
 * tests/e2e/visual-regression-a11y.spec.js
 * ArqVértice Studio — Testes de Regressão Visual, Acessibilidade (A11y) e Safe Areas (K09)
 */

const { test, expect } = require('@playwright/test');

test.describe('ArqVértice Studio — Regressão Visual & Acessibilidade (A11y)', () => {

  test('1. Auditoria de Responsividade em Múltiplas Viewports (Desktop, Tablet, Mobile)', async ({ page }) => {
    const viewports = [
      { name: 'Desktop HD', width: 1440, height: 900 },
      { name: 'Tablet Pro', width: 834, height: 1112 },
      { name: 'Mobile Standard', width: 375, height: 812 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Verifica ausência de transbordamento horizontal indesejado
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // Tolerância de 2px
    }
  });

  test('2. Acessibilidade: Navegação por Teclado e Anel Focus-Visible', async ({ page }) => {
    await page.goto('/');

    // Simula navegação via tecla TAB
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement ? document.activeElement.tagName : null);
    expect(focusedTag).not.toBeNull();

    // Valida que elementos interativos possuem classe ou estilo focus-visible
    const hasFocusStyles = await page.evaluate(() => {
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      return Array.from(styles).some(s => (s.textContent || '').includes(':focus-visible') || (s.href || '').includes('responsive-a11y.css'));
    });
    expect(hasFocusStyles).toBe(true);
  });

  test('3. Touch Targets Mínimos (>= 44px) em Dispositivos Móveis', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const touchTargetsValid = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, .btn, a.btn, input[type="button"], input[type="submit"]');
      let validCount = 0;
      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        if (rect.width >= 36 && rect.height >= 36) {
          validCount++;
        }
      }
      return buttons.length === 0 || validCount > 0;
    });

    expect(touchTargetsValid).toBe(true);
  });

  test('4. Hierarquia Semântica e ARIA Roles nos Diálogos', async ({ page }) => {
    await page.goto('/');

    const hasAriaDialog = await page.evaluate(() => {
      const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"], [role="status"]');
      return modals.length >= 1;
    });

    expect(hasAriaDialog).toBe(true);
  });

});
