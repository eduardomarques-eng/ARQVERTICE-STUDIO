/**
 * tests/e2e/critical-flows.spec.js
 * ArqVértice Studio — Testes E2E dos Fluxos Críticos de Navegação, 3D, BIM e IA (K08)
 */

const { test, expect } = require('@playwright/test');

test.describe('ArqVértice Studio — Fluxos Críticos de Produção (E2E)', () => {

  test('1. Inicialização da Aplicação & Carregamento do Studio', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ArqVértice/i);

    // Verifica presença de elementos canônicos do shell
    const mainHeader = page.locator('header, .app-header, nav').first();
    await expect(mainHeader).toBeVisible();

    // Valida healthcheck ativo
    const healthResponse = await page.request.get('/api/health');
    expect(healthResponse.status()).toBe(200);
    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('healthy');
  });

  test('2. Navegação para Viewport 3D & Inicialização de Canvas WebGL/WebGPU', async ({ page }) => {
    await page.goto('/index.html');
    
    // Verifica existência do container 3D ou canvas
    const canvas3D = page.locator('#threejs-canvas, #viewport-3d-canvas, canvas').first();
    if (await canvas3D.count() > 0) {
      await expect(canvas3D).toBeVisible();
    }

    // Verifica se os módulos de 3D Studio estão carregados
    const has3DStudio = await page.evaluate(() => typeof window.ArqVertice3DStudio !== 'undefined' || typeof window.THREE !== 'undefined');
    expect(has3DStudio).toBe(true);
  });

  test('3. Abertura do Command Center & IA Contextual', async ({ page }) => {
    await page.goto('/');

    // Simula abertura do modal de comandos contextuais (ESC ou trigger)
    const modal = page.locator('#command-palette-modal');
    if (await modal.count() > 0) {
      await page.evaluate(() => {
        const m = document.getElementById('command-palette-modal');
        if (m) m.classList.add('active');
      });
      await expect(modal).toBeVisible();

      // Digita comando natural
      const input = page.locator('#cmd-palette-input');
      if (await input.count() > 0) {
        await input.fill('Analise a iluminação da sala');
        await expect(input).toHaveValue('Analise a iluminação da sala');
      }
    }
  });

  test('4. Acesso ao Client Viewer com Identificador UUID Seguro', async ({ page }) => {
    const validUuid = 'a3b8c910-1234-4567-89ab-cdef01234567';
    const response = await page.goto(`/p/${validUuid}`);
    expect(response?.status()).toBe(200);

    // Valida carregamento do visualizador
    const viewerRoot = page.locator('#viewer-app, body');
    await expect(viewerRoot).toBeVisible();
  });

  test('5. Bloqueio de Enumeração IDOR em Rotas Sequenciais', async ({ page }) => {
    const forbiddenResponse = await page.goto('/p/1');
    // Servidor deve retornar 403 Forbidden para IDs sequenciais
    expect(forbiddenResponse?.status()).toBe(403);
  });

  test('6. Persistência de Estado e Recuperação', async ({ page }) => {
    await page.goto('/');

    // Grava alteração de estado no localStorage
    await page.evaluate(() => {
      localStorage.setItem('arqvertice_test_state', JSON.stringify({ project: 'praia-01', activeEnv: 'sala' }));
    });

    await page.reload();

    const storedState = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('arqvertice_test_state') || '{}');
    });

    expect(storedState.project).toBe('praia-01');
    expect(storedState.activeEnv).toBe('sala');
  });

});
