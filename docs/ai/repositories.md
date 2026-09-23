# ARQVERTICE STUDIO — MATRIZ DE ADOÇÃO DE REPOSITÓRIOS E LIBS (I19 & I22)
## Governança de Dependências, Critérios de Adoção e Alternativas Avaliadas

---

## 1. Princípio de Governança

> **"Nenhuma dependência é instalada apenas por conveniência estética ou modismo. Toda biblioteca externa deve justificar sua presença através de resolução de problemas técnicos concretos, compatibilidade de licença e impacto zero na segurança."**

---

## 2. Matriz de Bibliotecas Adotadas e Avaliadas

| Biblioteca / Repositório | Versão / Tag | Licença | Propósito no ArqVértice | Alternativa Avaliada | Rollback / Mitigação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`Three.js`** | r128 (CDN) | MIT | Renderização 3D, viewer de geometrias e canvas. | Babylon.js | Fallback para render estático 2D |
| **`web-ifc` / That Open** | 0.0.50+ | Mozilla MPL 2.0 | Parsing de modelos IFC e extração de propriedades. | Autoria direta em Revit | Ingestão de JSON estruturado |
| **`Remotion`** | 4.0+ | Custom / Commercial | Motor de composição de vídeo frame-a-frame determinístico. | FFmpeg puro / Canvas manual | Síntese de frames PNG + áudio |
| **`Vanilla CSS & Tokens`** | 2.1.0 | Proprietária | Design system de alta fidelidade sem overhead de build. | Tailwind CSS / Bootstrap | CSS nativo não possui vendor lock-in |
| **`Node.js Native HTTP`** | LTS | MIT | Servidor estático e gateway de API local seguro. | Express / Fastify | Dependências zero no servidor base |

---

## 3. Checklist Obrigatório para Novas Dependências
Antes de incorporar qualquer pacote ao ecossistema:
1. **Razão:** Qual problema específico ele resolve que não pode ser resolvido com 50 linhas de JS puro?
2. **Licença:** É permissiva (MIT, Apache 2.0, BSD)? Vetadas licenças GPL em bibliotecas proprietárias.
3. **Manutenção:** O projeto é ativamente mantido e tem comunidade estabelecida?
4. **Impacto:** Qual o aumento em KB no bundle do cliente e na superfície de ataque?
5. **Alternativa:** Foi avaliada uma alternativa nativa do navegador?
6. **Rollback:** É possível desacoplar a biblioteca em menos de 1 dia de trabalho caso seja descontinuada?
