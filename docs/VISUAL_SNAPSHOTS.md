# Visual Snapshots e Restauração Não-Destrutiva — ArqVértice Studio (D08)

## 1. O que é um Visual Snapshot?

Um **Visual Snapshot** é o congelamento pontual e integral de todo o estado visual de um ambiente ou projeto em um marco específico do desenvolvimento (ex: *Aprovação de Estudo Preliminar*, *Fechamento de Conceito com Cliente*).

Ao executar `CREATE VISUAL SNAPSHOT`, o sistema consolida e persiste:
1. **Referências Visuais Ativas:** Conjuntos primários e secundários em vigor;
2. **Estado dos 11 Locks Categóricos & Element Locks:** Configuração ativa de travas de geometria, layout, câmera, materiais, etc.;
3. **Câmera:** Parâmetros técnicos do enquadramento;
4. **Render:** Imagem fotorrealista e metadados de geração;
5. **Materiais:** Linguagem global e exceções locais vigentes;
6. **Mobiliário:** Lista de móveis aprovados;
7. **Conceito & Contexto:** Paleta, estilo, briefing e diretrizes.

---

## 2. Restauração Não-Destrutiva: "USE AS BASE"

Caso o cliente ou arquiteto queira explorar novas alternativas partindo de uma versão antiga ou descartada:

1. O usuário aciona a ação **"USE AS BASE"** na versão histórica desejada;
2. O sistema **NÃO edita nem sobrescreve** a versão histórica;
3. É gerada uma nova versão incremental (`V0n+1`):
   - Atributo `parentVersionId` apontando para a versão histórica;
   - Status inicial `IN_REVIEW`;
   - Parâmetros técnicos, câmera e locks herdados como ponto de partida;
   - Notas de rastreabilidade: *"Derivado como base a partir da versão histórica V0x"*;
4. A versão histórica permanece intacta para fins de auditoria e prestação de contas.
