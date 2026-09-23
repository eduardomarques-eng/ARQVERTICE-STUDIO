-- ====================================================================
-- ARQVERTICE STUDIO — BANCO DE DADOS RELACIONAL
-- BLOCO D05: SISTEMA DE CÂMERAS E ENQUADRAMENTOS
-- SCHEMA: 18_camera_system.sql
-- ====================================================================

-- 1. CÂMERAS DO AMBIENTE (PONTOS DE VISTA E ENQUADRAMENTO)
CREATE TABLE IF NOT EXISTS environment_cameras (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    environment_id VARCHAR(64) NOT NULL,
    camera_code VARCHAR(32) NOT NULL,            -- ex: 'C01', 'C02', 'C03'
    name VARCHAR(255) NOT NULL,                   -- ex: 'C01 — Sala olhando para painel'
    description TEXT,                             -- descrição do ângulo e intenção visual
    origin VARCHAR(32) NOT NULL DEFAULT 'MANUAL', -- 'REVIT', 'MANUAL', 'REFERENCIA', 'SUGESTAO_IA'
    camera_reference_url TEXT,                    -- URL de imagem de referência da vista (CAMERA_REFERENCE)
    base_image_url TEXT,                          -- Perspectiva técnica bruta / Revit viewport
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',  -- 'DRAFT', 'APPROVED', 'LOCKED', 'ARCHIVED', 'REJECTED'
    current_version VARCHAR(16) NOT NULL DEFAULT 'V01',
    orientation VARCHAR(32) DEFAULT 'HORIZONTAL', -- 'HORIZONTAL' (Paisagem), 'VERTICAL' (Retrato)
    framing VARCHAR(64) DEFAULT 'PLANO_MEDIO',    -- 'AMPLO_GERAL', 'PLANO_MEDIO', 'DETALHE_CLOSEUP', 'ANGULAR_CONTRAPICADO', 'ZENITAL', 'PANORAMICO'
    purpose VARCHAR(64) DEFAULT 'APRESENTACAO',   -- 'APRESENTACAO', 'TECNICA', 'DETALHE', 'ILUMINACAO', 'CLIENTE'
    
    -- Campos técnicos reais quando disponíveis (não inventar valores ausentes)
    position_desc VARCHAR(255),                  -- Coordenadas ou posição relativa (ex: 'Canto noroeste a 1.2m da parede')
    target_direction VARCHAR(255),               -- Direção do olhar (ex: 'Sul-Sudeste para Deck')
    camera_height_m DECIMAL(4, 2) DEFAULT 1.55,  -- Altura do olhar do observador em metros
    focal_length VARCHAR(32) DEFAULT '24mm',     -- Lente focal (ex: '24mm', '35mm', '50mm')
    aspect_ratio VARCHAR(16) DEFAULT '16:9',     -- Proporção (ex: '16:9', '4:3', '1:1', '9:16')
    crop_factor VARCHAR(32),                     -- Recorte específico de enquadramento
    
    order_index INT NOT NULL DEFAULT 1,          -- Ordenação visual no ambiente
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,    -- Se bloqueada, a IA não pode modificar
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,   -- Câmera diretiva principal do cômodo
    
    approved_by VARCHAR(128),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_by VARCHAR(128) DEFAULT 'Equipe ArqVértice',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE
);

-- 2. VERSÕES DE ENQUADRAMENTO DA CÂMERA (HISTÓRICO NÃO DESTRUTIVO)
CREATE TABLE IF NOT EXISTS environment_camera_versions (
    id VARCHAR(64) PRIMARY KEY,
    camera_id VARCHAR(64) NOT NULL,
    version_tag VARCHAR(16) NOT NULL,            -- ex: 'V01', 'V02', 'V03'
    framing VARCHAR(64) NOT NULL,
    camera_reference_url TEXT,
    base_image_url TEXT,
    focal_length VARCHAR(32),
    camera_height_m DECIMAL(4, 2),
    target_direction VARCHAR(255),
    orientation VARCHAR(32) DEFAULT 'HORIZONTAL',
    aspect_ratio VARCHAR(16) DEFAULT '16:9',
    crop_factor VARCHAR(32),
    notes TEXT,
    created_by VARCHAR(128) DEFAULT 'Equipe ArqVértice',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (camera_id) REFERENCES environment_cameras(id) ON DELETE CASCADE
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_env_cameras_proj_env ON environment_cameras(project_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_env_cameras_status ON environment_cameras(status);
CREATE INDEX IF NOT EXISTS idx_env_cameras_order ON environment_cameras(environment_id, order_index);
CREATE INDEX IF NOT EXISTS idx_camera_versions_cam ON environment_camera_versions(camera_id);
