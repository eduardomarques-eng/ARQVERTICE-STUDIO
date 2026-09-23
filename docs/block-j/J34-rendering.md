# J34 — ARQVERTICE REALTIME RENDERING ENGINE

## 1. Visão Geral da Arquitetura

O módulo **J34 Realtime Rendering Engine** implementa um sistema de iluminação arquitetônica de alta fidelidade física em tempo real no navegador, equilibrando realismo visual, estabilidade, fluidez (60 FPS) e compatibilidade universal sem dependências de plugins externos ou cópia interna de motores de jogos pesados.

---

## 2. Render Pipeline Tiers

O motor adota um modelo em camadas de 5 níveis:

| Tier | Descrição | Backend | Recursos Suportados |
| :--- | :--- | :--- | :--- |
| **Tier 0** | Fallback Seguro | WebGL1 / Basic | Sombras desativadas, iluminação Lambert/Phong, DPR máx 1.0, baixo consumo. |
| **Tier 1** | WebGL2 PBR Standard | WebGL2 | Materiais PBR físicos (Roughness/Metalness), sombras PCF 1024, tone mapping básico. |
| **Tier 2** | WebGPU PBR Standard | WebGPURenderer | Renderização nativa WebGPU, shading de alta precisão, sombras suaves 2048. |
| **Tier 3** | WebGPU Avançado | WebGPURenderer | HDRI com radiância e irradiância, Screen-Space Reflections (SSR), contato de sombras e Bloom. |
| **Tier 4** | Cinematic Progressive Path Tracing | WebGPU Compute / Multi-pass | Acumulação progressiva de amostras (1 a 256), convergência estática suave, draft durante movimento. |

---

## 3. Catálogo de Materiais PBR Arquitetônicos

Todos os materiais utilizam o modelo físico PBR padrão com propriedades padronizadas:
- **Base Color** (Albedo)
- **Metalness & Roughness**
- **Normal & AO** (Oclusão de Ambiente)
- **Transmission & Thickness** (para vidros e água)
- **Clearcoat & Clearcoat Roughness** (para porcelanatos e madeiras nobres envernizadas)
- **IOR** (Índice de Refração: 1.52 para vidro, 1.333 para água)

### Presets Oficiais:
- `glass`: Vidro cristal arquitetônico com alta transmissão e refração física.
- `metal`: Alumínio e aço escovado com metalness 0.92 e reflexos nítidos.
- `wood`: Cumaru e freijó maciço com veios naturais e micro-brilho.
- `stone`: Mármore e Travertino Navona com acabamento semi-brilhante.
- `fabric`: Linho e estofamento fosco com efeito sheen.
- `ceramic`: Porcelanato retificado esmaltado com camada de clearcoat.
- `water`: Água límpida para piscinas com transparência, refração e movimentação.
- `paint`: Pintura látex e acrílica fosca / reboco branco.
- `concrete`: Concreto aparente ripado com rugosidade arquitetônica.

---

## 4. Sistema Físico de Iluminação e Temperatura Kelvin

O sistema modela luminárias e fontes de luz segundo parâmetros físicos:
- **Fontes Suportadas**: `Sun` (Direcional), `Sky` (Hemisférica), `HDRI` (Ambiente), `Area` (Retangular / Fita LED), `Point` (Pontual) e `Spot` (Foco direcional com penumbra e ângulo ajustáveis).
- **Conversor Kelvin ➔ RGB**: Converte temperaturas de cor (1.000K a 40.000K) em cores lineares RGB:
  - `2200K - 2700K`: Branco muito quente (lâmpadas incandescentes / velas).
  - `3000K`: Branco quente padrão residencial.
  - `4000K - 4500K`: Branco neutro para áreas de trabalho e cozinhas.
  - `6500K`: Luz do dia natural (Daylight D65).
  - `8000K - 12000K`: Luz de céu aberto sombreado.

---

## 5. Reflexos em Camadas e Ray Tracing

O pipeline de reflexos opera progressivamente:
1. **Environment Reflections**: Reflexão de mapa HDRI e cubemap global.
2. **Planar Reflections**: Reflexão de espelhos d'água e pisos de alta reflexão.
3. **Screen-Space Reflections (SSR)**: Reflexos de proximidade em superfícies horizontais.
4. **Ray Tracing Interface (`RayTracingCapability`)**:
   - `supported`: Detecção em tempo real via GPU e memória.
   - `backend`: `WebGPU-Compute` ou `WebGL2-Accumulation`.
   - `quality`: `draft`, `preview`, `cinematic`.
   - `maxSamples`: Até 256 amostras com convergência progressiva.
