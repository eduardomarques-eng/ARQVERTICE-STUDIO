# ARQVERTICE STUDIO — AUDITORIA DE DEPENDÊNCIAS & SUPPLY CHAIN (K03)

> **Documento de Auditoria de Pacotes, Licenças e Segurança de Supply Chain**  
> **Versão:** 1.0.0 | **Ambiente:** Produção / CI/CD

---

## 1. Inventário de Dependências

O projeto adota uma política de **Dependências Mínimas e Estritas**, utilizando bibliotecas nativas e CDNs imutáveis para reduzir ao máximo a superfície de ataque e o tempo de compilação.

| Pacote | Versão | Licença | Finalidade | Status / Auditoria |
| :--- | :--- | :--- | :--- | :---: |
| **Node.js Runtime** | `>=20.0.0` (LTS) | MIT | Execução de backend, scripts e workers | Homologado |
| **Three.js** | `0.160.0` | MIT | Motor de renderização 3D WebGL2 / WebGPU | Homologado (Sem CVEs) |
| **Caddy Server** | `2.8-alpine` | Apache 2.0 | Gateway e terminação TLS com HTTP/3 | Homologado |
| **Alpine Linux Base**| `3.20` | MIT / BSD | Imagem base enxuta com tini supervisor | Homologado |

---

## 2. Auditoria de Duplicações

- **Múltiplas Bibliotecas de UI:** Nenhuma. A interface utiliza o design system proprietário Apple Receded Chrome com CSS modular.
- **Múltiplas Bibliotecas de Ícones:** Nenhuma. Uso unificado de Lucide Icons.
- **Múltiplos Clientes HTTP:** Nenhum. Uso de `fetch` nativo no cliente e módulo `http` nativo no servidor.
- **Múltiplos Gerenciadores de Estado:** Nenhum. Uso exclusivo de `js/state.js` com governança unificada.

---

## 3. Política de Atualização de Dependências (Update Policy)

```
┌─────────────────┬────────────────────────────────────────────────────────┐
│ Nível           │ Diretriz de Atualização                                │
├─────────────────┼────────────────────────────────────────────────────────┤
│ SAFE UPDATE     │ Patches de segurança (sem alteração de API).           │
│                 │ Aplicado automaticamente no CI com testes verdes.      │
├─────────────────┼────────────────────────────────────────────────────────┤
│ MINOR UPDATE    │ Novas funcionalidades retrocompatíveis.                │
│                 │ Exige aprovação de PR e passagem de todos os testes.   │
├─────────────────┼────────────────────────────────────────────────────────┤
│ MAJOR UPDATE    │ Mudança de versão maior com possíveis breaking changes.│
│                 │ Exige branch dedicada, benchmark e plano de migração.  │
├─────────────────┼────────────────────────────────────────────────────────┤
│ BREAKING CHANGE │ Requer validação em staging e aprovação formal de SRE. │
└─────────────────┴────────────────────────────────────────────────────────┘
```

---

## 4. Segurança do Supply Chain & GitHub Actions

1. **Permissões Mínimas (`permissions`):**
   - Workflow de CI: `contents: read`.
   - Workflow de Release: `contents: read`, `packages: write`.
2. **Fixação de Versões em Actions:**
   - `actions/checkout@v4`
   - `actions/setup-node@v4`
   - `docker/setup-buildx-action@v3`
   - `docker/login-action@v3`
   - `docker/build-push-action@v5`
   - `gitleaks/gitleaks-action@v2`
3. **Varredura Contínua:**
   - Scan de segredos via Gitleaks em todo commit.
   - Auditoria de pacotes via `npm audit --audit-level=high`.
