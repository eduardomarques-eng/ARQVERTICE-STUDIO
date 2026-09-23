/**
 * tests/hardening-and-compliance.test.js
 * ArqVértice Studio — Suíte de Testes Automatizados para o Bloco K10
 * Testa o Hardening de Containers, Sanitização de Uploads 3D, Proteção IDOR e Conformidade.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SecurityUploadSanitizer = require('../js/security/upload-sanitizer');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SUÍTE DE TESTES: BLOCO K10 — HARDENING FINAL & CONFORMIDADE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  console.log('--- 1. Sanitização de Uploads 3D e Magic Bytes ---');
  // --------------------------------------------------------------------------
  // Buffer simulando GLB válido (Magic: glTF)
  const validGlbBuffer = Buffer.concat([
    Buffer.from('glTF', 'ascii'),
    Buffer.from([0x02, 0x00, 0x00, 0x00]), // version 2
    Buffer.from([0x20, 0x00, 0x00, 0x00])  // length
  ]);
  const glbRes = SecurityUploadSanitizer.validate3DUpload(validGlbBuffer, 'fachada_norte.glb');
  assert.strictEqual(glbRes.valid, true, 'GLB válido deve ser aceito');
  assert.strictEqual(glbRes.mimeType, 'model/gltf-binary', 'MIME type deve ser model/gltf-binary');
  console.log('  ✔ [PASS] Arquivo GLB com Magic Bytes legítimos validado com sucesso');

  // Buffer com extensão .glb mas conteúdo executável / forjado
  const fakeGlbBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'binary');
  const fakeGlbRes = SecurityUploadSanitizer.validate3DUpload(fakeGlbBuffer, 'trojan.glb');
  assert.strictEqual(fakeGlbRes.valid, false, 'GLB forjado deve ser rejeitado');
  assert.ok(fakeGlbRes.error.includes('Magic Bytes'), 'Erro deve apontar falha de Magic Bytes');
  console.log('  ✔ [PASS] Tentativa de upload de binário camuflado de GLB bloqueada por MIME-sniffing');

  // Validação de arquivo IFC
  const validIfcBuffer = Buffer.from('ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION((\'ViewDefinition [CoordinationView]\'),\'2;1\');\n', 'utf8');
  const ifcRes = SecurityUploadSanitizer.validate3DUpload(validIfcBuffer, 'modelo_estrutural.ifc');
  assert.strictEqual(ifcRes.valid, true, 'IFC válido deve ser aceito');
  console.log('  ✔ [PASS] Arquivo IFC com cabeçalho STEP ISO-10303 validado');

  // --------------------------------------------------------------------------
  console.log('\n--- 2. Proteção Contra Path Traversal e Extensões Maliciosas ---');
  // --------------------------------------------------------------------------
  const traversalRes = SecurityUploadSanitizer.validate3DUpload(validGlbBuffer, '../../etc/passwd.glb');
  assert.strictEqual(traversalRes.valid, true);
  assert.strictEqual(traversalRes.sanitizedFilename, 'passwd.glb', 'Path traversal deve ser higienizado');
  console.log('  ✔ [PASS] Nome com Directory Traversal higienizado com sucesso');

  const exeRes = SecurityUploadSanitizer.validate3DUpload(Buffer.from('exec'), 'malware.exe');
  assert.strictEqual(exeRes.valid, false, 'Extensão .exe deve ser terminantemente proibida');
  console.log('  ✔ [PASS] Extensões executáveis bloqueadas');

  // Limite de tamanho
  const oversizedBuffer = { length: 501 * 1024 * 1024 }; // mock buffer length
  const sizeRes = SecurityUploadSanitizer.validate3DUpload(oversizedBuffer, 'huge.glb');
  assert.strictEqual(sizeRes.valid, false, 'Arquivo > 500MB deve ser rejeitado');
  console.log('  ✔ [PASS] Limite máximo de 500MB por upload aplicado estritamente');

  // --------------------------------------------------------------------------
  console.log('\n--- 3. Blindagem de Acesso do Client Viewer & Prevenção IDOR ---');
  // --------------------------------------------------------------------------
  // Enumeração sequencial proibida
  const seq1 = SecurityUploadSanitizer.validateViewerAccess('1');
  const seq2 = SecurityUploadSanitizer.validateViewerAccess('42');
  const seq3 = SecurityUploadSanitizer.validateViewerAccess('project-10');
  assert.strictEqual(seq1.allowed, false, 'ID sequencial 1 deve ser rejeitado');
  assert.strictEqual(seq2.allowed, false, 'ID sequencial 42 deve ser rejeitado');
  assert.strictEqual(seq3.allowed, false, 'ID sequencial project-10 deve ser rejeitado');
  console.log('  ✔ [PASS] Tentativas de enumeração IDOR sequencial bloqueadas');

  // UUIDv4 criptográfico válido
  const validUUID = 'a3b8c910-1234-4567-89ab-cdef01234567';
  const uuidRes = SecurityUploadSanitizer.validateViewerAccess(validUUID);
  assert.strictEqual(uuidRes.allowed, true, 'UUIDv4 válido deve ser permitido');

  // Hash de token opaco seguro
  const validHash = 'arq_tok_live_9f8a7b6c5d4e3f2a1b';
  const hashRes = SecurityUploadSanitizer.validateViewerAccess(validHash);
  assert.strictEqual(hashRes.allowed, true, 'Token opaco de alta entropia deve ser permitido');
  console.log('  ✔ [PASS] Acesso concedido exclusivamente para UUIDv4 ou tokens criptográficos');

  // --------------------------------------------------------------------------
  console.log('\n--- 4. Auditoria de Hardening do Docker-Compose ---');
  // --------------------------------------------------------------------------
  const composePath = path.resolve(__dirname, '..', 'docker-compose.prod.yml');
  assert.ok(fs.existsSync(composePath), 'docker-compose.prod.yml deve existir');
  const composeContent = fs.readFileSync(composePath, 'utf8');

  assert.ok(composeContent.includes('read_only: true'), 'Containers devem ter read_only: true');
  assert.ok(composeContent.includes('no-new-privileges:true'), 'Containers devem ter no-new-privileges');
  assert.ok(composeContent.includes('cap_drop:'), 'Containers devem ter cap_drop');
  assert.ok(composeContent.includes('tmpfs:'), 'Containers devem montar tmpfs para escritas temporárias');
  assert.ok(!composeContent.includes('privileged: true'), 'Nenhum container pode ter privileged: true');
  console.log('  ✔ [PASS] Parâmetros de Hardening no docker-compose.prod.yml 100% conformes');

  // --------------------------------------------------------------------------
  console.log('\n--- 5. Auditoria de Hardening de Proxy e Servidor HTTP ---');
  // --------------------------------------------------------------------------
  const serverPath = path.resolve(__dirname, '..', 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  assert.ok(serverContent.includes('TRACE'), 'server.js deve filtrar TRACE');
  assert.ok(serverContent.includes('TRACK'), 'server.js deve filtrar TRACK');
  assert.ok(serverContent.includes('CONNECT'), 'server.js deve filtrar CONNECT');

  const caddyPath = path.resolve(__dirname, '..', 'Caddyfile');
  const caddyContent = fs.readFileSync(caddyPath, 'utf8');
  assert.ok(caddyContent.includes('disallowedMethods'), 'Caddyfile deve bloquear métodos não autorizados');

  const nginxPath = path.resolve(__dirname, '..', 'deploy', 'nginx', 'nginx.conf');
  const nginxContent = fs.readFileSync(nginxPath, 'utf8');
  assert.ok(nginxContent.includes('request_method ~ ^(TRACE|TRACK|CONNECT)$'), 'nginx.conf deve bloquear métodos');
  console.log('  ✔ [PASS] Bloqueio de métodos HTTP não autorizados validado em todas as camadas');

  // --------------------------------------------------------------------------
  console.log('\n--- 6. Termo de Conformidade Final (K10 Sign-Off) ---');
  // --------------------------------------------------------------------------
  const signOffPath = path.resolve(__dirname, '..', 'docs', 'production', 'K10_PRODUCTION_SIGN_OFF.md');
  assert.ok(fs.existsSync(signOffPath), 'docs/production/K10_PRODUCTION_SIGN_OFF.md deve existir');
  const signOffContent = fs.readFileSync(signOffPath, 'utf8');

  for (let i = 1; i <= 10; i++) {
    const blockKey = `K${i < 10 ? '0' + i : i}`;
    assert.ok(signOffContent.includes(blockKey), `Termo de Sign-Off deve cobrir o bloco ${blockKey}`);
  }
  assert.ok(signOffContent.includes('APROVADO'), 'Termo deve conter assinaturas e status de aprovação');
  console.log('  ✔ [PASS] Documento K10_PRODUCTION_SIGN_OFF.md cobre integralmente os 10 blocos');

  console.log('\n================================================================');
  console.log('🎉 TODOS OS 6 TESTES DO BLOCO K10 PASSARAM COM SUCESSO!');
  console.log('================================================================\n');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('❌ Falha nos testes de Hardening & Conformidade:', err);
    process.exit(1);
  });
}

module.exports = runTests;
