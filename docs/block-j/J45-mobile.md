# J45 — Mobile & Adaptive 3D Quality Profiles

## 1. Visão Geral
O subsistema **J45** garante que a experiência 3D do ArqVértice Studio seja fluida e estável em toda a gama de dispositivos de consumo, desde smartphones intermediários (Android/iOS) até estações de trabalho de alta performance com monitores 4K.

---

## 2. Matriz de Perfis de Dispositivos (`DeviceProfiler`)

| Perfil | Max DPR | Resolução de Sombras | FPS Alvo | Texturas Máx | Path Tracing |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Android** | `1.25` | $512 \times 512$ | 45 FPS | $1024 \times 1024$ | Desativado |
| **iOS** | `1.50` | $1024 \times 1024$ | 60 FPS | $2048 \times 2048$ | Desativado |
| **Tablet** | `1.50` | $1024 \times 1024$ | 60 FPS | $2048 \times 2048$ | Desativado |
| **Notebook** | `1.50` | $1024 \times 1024$ | 60 FPS | $2048 \times 2048$ | Habilitado (Progressivo) |
| **Desktop** | `2.00` | $2048 \times 2048$ | 60 FPS | $4096 \times 4096$ | Habilitado (Total) |

---

## 3. Heurísticas de Controle Térmico e de Memória
- **DPR Throttling**: Limitação da densidade de pixels no canvas para evitar superaquecimento de GPUs integradas.
- **Dynamic Resolution Scaling (DRS)**: Em quedas transitórias de FPS abaixo de 30 FPS, o renderizador reduz temporariamente a resolução interna em 20%.
- **Touch Interaction**: Gestos de toque (`pinch-to-zoom`, `two-finger-pan`) mapeados com amortecimento inercial.
