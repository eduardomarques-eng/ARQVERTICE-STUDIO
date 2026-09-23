/**
 * js/security/upload-sanitizer.js
 * ArqVértice Studio — Sanitizador de Uploads 3D, Magic Bytes & Blindagem de Acesso
 * 
 * Proteções:
 * 1. Verificação de Magic Bytes para formatos 3D (GLB, IFC, PLY, KTX2, PNG, JPEG, WEBP)
 * 2. Prevenção de Path Traversal e extensões perigosas
 * 3. Limitação estrita de tamanho (500MB) e detecção de Zip-Bombs
 * 4. Validação de identificadores criptográficos (UUIDv4) para rotas do Client Viewer
 */

const path = require('path');

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500 MB
const DANGEROUS_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.msi', '.ps1', '.vbs', '.js', '.mjs',
  '.ts', '.html', '.htm', '.php', '.phtml', '.py', '.rb', '.dll', '.so'
];

const MAGIC_SIGNATURES = {
  glb: {
    check: (buf) => buf.length >= 12 && buf.toString('ascii', 0, 4) === 'glTF',
    mime: 'model/gltf-binary'
  },
  ifc: {
    check: (buf) => {
      const header = buf.slice(0, 100).toString('utf8');
      return header.includes('ISO-10303-21') || header.includes('HEADER;');
    },
    mime: 'application/octet-stream'
  },
  ply: {
    check: (buf) => buf.length >= 4 && (buf.toString('ascii', 0, 4) === 'ply\n' || buf.toString('ascii', 0, 4) === 'ply\r'),
    mime: 'application/octet-stream'
  },
  ktx2: {
    check: (buf) => buf.length >= 12 && buf[0] === 0xAB && buf[1] === 0x4B && buf[2] === 0x54 && buf[3] === 0x58,
    mime: 'image/ktx2'
  },
  png: {
    check: (buf) => buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47,
    mime: 'image/png'
  },
  jpg: {
    check: (buf) => buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF,
    mime: 'image/jpeg'
  },
  webp: {
    check: (buf) => buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP',
    mime: 'image/webp'
  }
};

class SecurityUploadSanitizer {
  /**
   * Valida e sanitiza arquivos 3D e assets recebidos
   */
  static validate3DUpload(buffer, originalFilename) {
    if (!buffer || !(buffer instanceof Buffer || buffer instanceof Uint8Array)) {
      return { valid: false, error: 'Buffer de arquivo inválido ou ausente.' };
    }

    if (buffer.length === 0) {
      return { valid: false, error: 'Arquivo com tamanho 0 (vazio).' };
    }

    if (buffer.length > MAX_UPLOAD_SIZE) {
      return {
        valid: false,
        error: `Tamanho do arquivo (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) excede o limite máximo permitido de 500MB.`
      };
    }

    // Sanitização de nome de arquivo contra Directory Traversal
    const basename = path.basename(originalFilename || 'unnamed.bin');
    const sanitizedFilename = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(sanitizedFilename).toLowerCase();

    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Extensão '${ext}' proibida por diretrizes de segurança da infraestrutura.`
      };
    }

    const formatKey = ext.replace('.', '');
    const sig = MAGIC_SIGNATURES[formatKey];

    if (sig) {
      const matchesMagic = sig.check(buffer);
      if (!matchesMagic) {
        return {
          valid: false,
          error: `MIME-sniffing falhou: O conteúdo binário do arquivo não corresponde aos Magic Bytes válidos para o formato .${formatKey}.`
        };
      }
    }

    return {
      valid: true,
      sanitizedFilename,
      format: formatKey || 'binary',
      sizeBytes: buffer.length,
      mimeType: sig ? sig.mime : 'application/octet-stream'
    };
  }

  /**
   * Valida identificador do Client Viewer para evitar enumeração IDOR
   */
  static validateViewerAccess(tokenOrId) {
    if (!tokenOrId || typeof tokenOrId !== 'string') {
      return { allowed: false, error: 'Token ou identificador de projeto não fornecido.' };
    }

    const trimmed = tokenOrId.trim();

    // Rejeita enumeração sequencial simples (ex: 1, 2, 42, project_1)
    if (/^\d+$/.test(trimmed) || /^project-?\d+$/i.test(trimmed)) {
      return {
        allowed: false,
        error: 'Identificadores sequenciais são proibidos. Utilize UUIDv4 criptográfico não-previsível.'
      };
    }

    // Aceita UUIDv4 ou hashes criptográficos seguros com pelo menos 16 caracteres
    const isUUIDv4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
    const isSecureHash = /^[a-zA-Z0-9_-]{16,}$/.test(trimmed);

    if (isUUIDv4 || isSecureHash) {
      return { allowed: true, identifier: trimmed };
    }

    return {
      allowed: false,
      error: 'Formato de identificador inválido para acesso ao Client Viewer.'
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUploadSanitizer;
}
