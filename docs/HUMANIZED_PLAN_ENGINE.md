# ArqVertice Studio — Motor de Planta Humanizada (D03)

## 1. Visão Geral e Objetivo
O **Motor de Planta Humanizada (HUMANIZED_PLAN_ENGINE)** do ArqVertice Studio implementa o pipeline de transformação estética de plantas baixas de arquitetura e interiores. 

Seu objetivo é gerar imagens de apresentação visual com alto valor estético, texturas fotorrealistas de materiais, sombras suaves e ambientação acolhedora para clientes e investidores, preservando a integridade das decisões arquitetônicas registradas no modelo BIM (Autodesk Revit).

---

## 2. Limitação Fundamental e Princípio da Não-Substituição
> **Regra de Ouro:** A planta humanizada **NÃO é um desenho executivo** e **NÃO substitui o modelo técnico do Revit**.

* **Proibido Inventar Paredes ou Vãos:** O motor não altera alvenarias, portas, janelas, desníveis ou vãos de circulação.
* **Proibido Inventar Dimensões:** Toda proporção espacial é extraída da geometria do Revit ou do levantamento técnico (C02).
* **Rastreabilidade Obrigatória:** Toda versão gerada (`HUMANIZED_PLAN_VERSION`) mantém o identificador de sua fonte (`SOURCE_PLAN_VERSION`).

---

## 3. Os Dois Modos de Geração Arquitetônica

O motor foi arquitetado para operar em dois modos complementares, reconhecendo que a geração raster direta por difusão pura nem sempre preserva a precisão de linhas técnicas finas:

```
                  ┌──────────────────────────────────────────────┐
                  │          PLANTA TÉCNICA (REVIT BIM)          │
                  └──────────────────────┬───────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
   ┌─────────────────────────────────┐       ┌─────────────────────────────────┐
   │             MODO A              │       │             MODO B              │
   │      Transformação Visual       │       │       Composição Híbrida        │
   │        sobre Imagem-Base        │       │           Estruturada           │
   └────────────────┬────────────────┘       └────────────────┬────────────────┘
                    │                                         │
                    │ • Renderização direta                   │ • Traçado vetorial mestre
                    │ • Texturas e materiais nos pisos        │ • Máscaras de pisos / zonas
                    │ • Projeção de sombras suaves            │ • Camada de mobiliário
                    │ • Iluminação natural difusa             │ • Ambientação e vegetação
                    ▼                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                         PLANTA HUMANIZADA FINAL                           │
   └───────────────────────────────────────────────────────────────────────────┘
```

### Modo A — Transformação Visual sobre Imagem-base (`MODE_A_TRANSFORMATION`)
* Aplicação de texturas de piso, iluminação ambiente, mobiliário contemporâneo e sombras diretamente a partir da imagem rasterizada da planta técnica.
* Ideal para estudos preliminares, variações rápidas de moodboard e apresentações de conceito.

### Modo B — Composição Híbrida Estruturada (`MODE_B_HYBRID_COMPOSITION`)
* Composição estratificada por camadas:
  1. **Linhas Mestras (Line Art):** Alvenarias e esquadrias isoladas e preservadas como camada imutável.
  2. **Zoneamento de Pisos:** Aplicação controlada de materiais com máscaras geométricas.
  3. **Mobiliário e Blocos:** Inserção de blocos fiéis às referências homologadas (D02).
  4. **Camada de Sombras e Oclusão:** Cálculo de sombras suaves a 45 graus projetadas de vãos.
  5. **Acabamento Gráfico:** Ajuste cromático e pós-produção estética.

---

## 4. Hierarquia Rigorosa de Camadas de Renderização
Para assegurar legibilidade técnica e beleza gráfica, o motor processa os elementos na seguinte ordem de prioridade:

$$\text{Geometria (Base)} \longrightarrow \text{Layout} \longrightarrow \text{Materialidade} \longrightarrow \text{Mobiliário} \longrightarrow \text{Decoração} \longrightarrow \text{Sombras} \longrightarrow \text{Acabamento Gráfico}$$

1. **Geometria:** Alvenarias, aberturas e esquadrias (Prioridade Máxima).
2. **Layout:** Circulação e zonas funcionais de cada ambiente.
3. **Materialidade:** Pisos frios, assoalhos de madeira, pedras naturais e carpetes.
4. **Mobiliário:** Sofás, mesas, cadeiras e bancadas fixas com escala apropriada.
5. **Decoração & Vegetação:** Tapetes, vasos, plantas internas e adornos de bancada.
6. **Sombras:** Oclusão de contato e projeção suave de luz natural.
7. **Acabamento Gráfico:** Contraste, temperatura de cor e nitidez de linha.

---

## 5. Governança de IA e Segurança de Credenciais
* **Auditoria Completa (`humanized_plan_generations`):** Toda execução registra provider, model, prompt sintetizado, parâmetros (sampling steps, cfg scale, line preservation weight), versão de contexto e duração em milissegundos.
* **Segurança Absoluta:** Nenhuma chave de API ou credencial sensível é injetada ou exposta no frontend. Toda comunicação ocorre via serviços de backend protegidos.
* **Resiliência a Falhas (Item 14):**
  - Falhas de rede ou timeout de GPU registram status `FAILED` no log com mensagem de erro.
  - A versão anterior estável permanece ativa sem degradação.
  - O sistema **nunca** marca como aprovada uma versão que falhou na geração.
  - Disponibilização de fluxo de retry automático com recuperação de contexto.

---

## 6. Modos de Comparação Visual
A interface disponibiliza split-screen comparativo em dois modos de inspeção:
1. **Original Revit vs Humanizada:** Permite ao cliente e arquiteto validar que nenhuma parede ou porta foi deslocada durante a humanização.
2. **Versão vs Versão (V01 vs V02):** Comparativo visual direto entre propostas de acabamentos e variações de mobiliário.
