# CONTRATOS DE API E ESPECIFICAÇÃO DE DADOS
## ARQVERTICE STUDIO — SCHEMAS ZOD & PADRONIZAÇÃO DE INTERFACES
**Versão:** 1.0.0  
**Data:** 21 de Setembro de 2026  
**Documento:** API_CONTRACTS.md  

---

### 1. PADRÕES GERAIS E TRATAMENTO DE ERROS (RFC 7807)

Todas as respostas de API do **ARQVERTICE STUDIO** seguem formatos estruturados e tipados. Em caso de falha, adota-se o padrão internacional **RFC 7807 (Problem Details for HTTP APIs)**:

```typescript
export interface ProblemDetails {
  type: string;        // URI de identificação do erro (ex: "/erros/validacao")
  title: string;       // Resumo legível do erro (ex: "Dados de entrada inválidos")
  status: number;      // Código HTTP (400, 401, 403, 404, 409, 500)
  detail: string;      // Explicação contextual da ocorrência
  instance?: string;   // Rota ou ID da requisição onde ocorreu o erro
  errors?: Record<string, string[]>; // Lista de erros por campo (Zod)
}
```

---

### 2. CONTRATOS DOS DOMÍNIOS PRINCIPAIS

#### 2.1. Domínio CLIENTES

##### `POST /api/clientes` — Criação de Cliente
```typescript
import { z } from 'zod';

export const CriarClienteSchema = z.object({
  nome: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres').max(150),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().trim().min(8, 'Telefone inválido').max(25),
  documento: z.string().trim().max(20).optional(), // CPF ou CNPJ
  observacoes: z.string().max(1000).optional()
});

export type CriarClienteInput = z.infer<typeof CriarClienteSchema>;
```

---

#### 2.2. Domínio PROJETOS

##### `POST /api/projetos` — Criação de Projeto
```typescript
export const CriarProjetoSchema = z.object({
  clienteId: z.string().uuid('ID do cliente inválido'),
  nomeObra: z.string().trim().min(3, 'Nome da obra é obrigatório').max(200),
  localizacao: z.string().trim().max(255).default(''),
  loteQuadra: z.string().trim().max(100).default(''),
  zona: z.string().trim().max(100).default(''),
  areaConstruidaM2: z.number().positive('Área construída deve ser positiva').optional(),
  areaTerrenoM2: z.number().positive('Área do terreno deve ser positiva').optional(),
  tipologia: z.string().trim().max(100).default('Residencial Unifamiliar'),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD').optional(),
  previsaoConclusao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD').optional(),
  empresa: z.string().default('ArqVértice • Arquitetura, Estrutura & Engenharia')
});
```

---

#### 2.3. Domínio AMBIENTES

##### `POST /api/projetos/[id]/ambientes` — Criação de Ambiente
```typescript
export const CriarAmbienteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome do ambiente é obrigatório').max(100),
  tipoAmbiente: z.enum([
    'SALA', 'COZINHA', 'SUITE', 'QUARTO', 'BANHEIRO', 
    'AREA_GOURMET', 'DECK', 'PISCINA', 'GARAGEM', 'FACHADA', 'OUTRO'
  ]),
  descricao: z.string().max(500).optional(),
  ordem: z.number().int().min(0).default(0)
});
```

---

#### 2.4. Domínio CRONOGRAMA (Mapeamento 100% Compatível com a Base Atual)

##### `POST /api/projetos/[id]/tarefas` — Criação de Etapa
```typescript
export const DISCIPLINAS_CANONICAS = ['Arquitetura', '3D', 'Estrutura', 'Complementares', 'Obras'] as const;

export const CriarTarefaSchema = z.object({
  id: z.string().uuid().optional(),
  ambienteId: z.string().uuid().optional().nullable(),
  descricao_etapa: z.string().trim().min(1, 'Descrição é obrigatória').max(255),
  disciplina_projeto: z.enum(DISCIPLINAS_CANONICAS, {
    errorMap: () => ({ message: 'Disciplina deve ser uma das 5 canônicas da ArqVértice' })
  }),
  projetista: z.string().trim().min(1, 'Projetista é obrigatório').max(100),
  data_conclusao: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Formato deve ser DD-MM-YYYY'),
  porcentagem: z.number().int().min(0).max(100).default(0),
  ordem: z.number().int().optional()
});

export const AtualizarTarefaSchema = CriarTarefaSchema.partial();
```

---

#### 2.5. Domínio ARQUIVOS & STORAGE (Upload Pré-Assinado)

##### `POST /api/storage/presign` — Obtenção de Permissão de Upload Direto
```typescript
export const SolicitarPresignSchema = z.object({
  projetoId: z.string().uuid(),
  ambienteId: z.string().uuid().optional().nullable(),
  nomeOriginal: z.string().min(1).max(255),
  mimeType: z.string().min(3).max(100),
  tamanhoBytes: z.number().positive().max(500 * 1024 * 1024, 'Tamanho máximo permitido é de 500MB'),
  categoria: z.enum([
    'PLANTA_TECNICA', 'PERSPECTIVA_REVIT', 'RENDER_FINAL', 'FOTO_OBRA',
    'MODELO_3D', 'DOCUMENTO_LEGAL', 'MOODBOARD', 'PRANCHA'
  ]),
  hashSha256: z.string().length(64).optional() // Checksum opcional para integridade
});

export interface RespostaPresign {
  uploadUrl: string;       // URL direta para PUT com presigned signature (S3/R2)
  storageKey: string;      // Caminho no bucket (ex: "projetos/p123/ambientes/a456/uuid.png")
  arquivoId: string;       // ID pré-gerado para confirmação no banco
  expiraEmSegundos: number;// Tempo de validade do link (ex: 900s = 15 minutos)
}
```

---

#### 2.6. Domínio INTELIGÊNCIA ARTIFICIAL (IA Contextual)

##### `POST /api/ia/gerar` — Geração de Imagem com Memória
```typescript
export const SolicitacaoGeracaoIASchema = z.object({
  ambienteId: z.string().uuid(),
  imagemReferenciaId: z.string().uuid().optional(), // Imagem base do Revit ou render anterior
  intencaoUsuario: z.string().trim().min(3, 'Descreva a intenção de alteração ou estudo'),
  manterLocks: z.boolean().default(true),           // Força aplicação dos bloqueios cadastrados
  aspectRatio: z.enum(['1:1', '4:3', '16:9', '3:2']).default('16:9'),
  provider: z.enum(['gemini', 'mock']).default('gemini')
});

export interface RespostaGeracaoIA {
  renderId: string;
  versao: string;            // ex: "V02"
  urlImagem: string;         // URL no storage da imagem gerada
  promptCompilado: string;   // Texto final enriquecido com contexto e locks
  tempoExecucaoMs: number;
  custoEstimadoUSD?: number;
  locksAplicados: string[];
}
```

---

#### 2.7. Domínio BRIEFING PÚBLICO (Área do Cliente)

##### `GET /api/publico/briefing/[token]` — Carregamento do Roteiro
- **Entrada:** `token` (String não-previsível via URL param).
- **Resposta:**
```typescript
export interface BriefingPublicoDTO {
  tokenValido: boolean;
  projeto: {
    nomeObra: string;
    clienteNome: string;
  };
  perguntas: Array<{
    id: string;
    secao: string;
    texto: string;
    tipo: 'texto' | 'longo' | 'radio' | 'checkbox' | 'cartoes';
    dica?: string;
    opcoes?: string[];
    cartoes?: Array<{ valor: string; ilustracao: string; desc: string }>;
  }>;
  respostasSalvas: Record<string, any>;
}
```

##### `POST /api/publico/briefing/[token]/responder` — Salvamento de Respostas
```typescript
export const EnviarRespostaBriefingSchema = z.object({
  respostas: z.record(z.string(), z.any()),
  concluido: z.boolean().default(false)
});
```
