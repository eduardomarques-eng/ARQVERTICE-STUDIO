# ArqVértice Studio — Sistema de Visual Locks (D07)

## 0. Visão Geral

Os **Visual Locks** são mecanismos de controle rígido que fixam parâmetros e elementos do projeto, impedindo alterações acidentais ou alucinações de modelos generativos de IA.

---

## 1. Os 11 Locks Categóricos Canônicos

| Lock | Escopo Padrão | Finalidade Arquitetônica |
| :--- | :--- | :--- |
| `GEOMETRY` | `ENVIRONMENT` | Preserva alvenarias estruturais, proporções espaciais e pé-direito. |
| `LAYOUT` | `ENVIRONMENT` | Preserva posição de móveis estruturais, circulação e zoneamento. |
| `OPENINGS` | `ENVIRONMENT` | Preserva caixilhos, esquadrias, janelas e portas de correr. |
| `CAMERA` | `ENVIRONMENT` | Preserva ângulo, distância focal (ex: 24mm) e enquadramento. |
| `MATERIALS` | `ENVIRONMENT` | Preserva revestimentos de piso, parede, forro e bancadas. |
| `COLORS` | `PROJECT` | Preserva paleta cromática mineral e tonalidades homologadas. |
| `LIGHTING` | `ENVIRONMENT` | Preserva temperatura de cor e intenção luminotécnica aprovada. |
| `FURNITURE` | `ENVIRONMENT` | Preserva peças de mobiliário aprovadas no ambiente. |
| `DECOR` | `ENVIRONMENT` | Preserva objetos de decoração, tapeçaria e adornos. |
| `LANDSCAPE` | `PROJECT` | Preserva vegetação externa e paisagismo integrado. |
| `COMPOSITION` | `ENVIRONMENT` | Preserva composição estética global e equilíbrio de massas. |

---

## 2. Atributos de Estado de Cada Lock

Cada registro de lock contém:
- `enabled`: `true` ou `false`;
- `scope`: `ENVIRONMENT`, `PROJECT`, `ELEMENT`;
- `source`: `USER`, `PROJECT_BRIEF`, `APPROVED_DECISION`, `AI_SUGGESTION`;
- `version`: Versão do ambiente no momento do bloqueio;
- `created_at` e `updated_at`: Timestamps de auditoria.

---

## 3. Locks por Elemento Específico (Element-Level Locks)

Sempre que um elemento específico for homologado (ex: o sofá ou o painel ripado da TV), o sistema permite criar um lock granular:
- `SOFA_LOCKED`: *"Sofá curvo 4 lugares em linho cru homologado na C01"*;
- `PAINEL_LOCKED`: *"Painel de madeira carvalho ripado com nicho inferior"*;
- `PISO_LOCKED`: *"Piso de mármore travertino navona levigado 120x120cm"*.

> [!NOTE]
> O lock por elemento é superior ao lock de categoria ampla, pois permite que outros móveis livres sejam ajustados sem alterar o elemento travado.

---

## 4. Detecção e Resolução de Conflitos de Lock

Caso o usuário solicite:

> *"Troque o sofá."*

Enquanto a trava `FURNITURE` ou `SOFA_LOCKED` estiver ativa:
1. O motor **não desbloqueia automaticamente**;
2. É emitido um aviso estruturado:
   > *"O mobiliário está bloqueado para este ambiente. Deseja desbloquear temporariamente o elemento selecionado?"*
3. O usuário pode optar por cancelar ou autorizar um desbloqueio temporário assistido.
