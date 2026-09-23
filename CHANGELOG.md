# CHANGELOG — ARQVERTICE STUDIO

Todas as alterações notáveis neste projeto são documentadas neste arquivo seguindo o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e versionamento semântico [SemVer](https://semver.org/lang/pt-BR/).

---

## [1.0.0] — 2026-09-23

### Adicionado
- **Motor 3D Realtime PBR (5 Tiers)**: Suporte híbrido a WebGPU e WebGL2 com shadow caching e materiais foto-realistas.
- **Universal BIM & ThatOpen Engine**: Integração com arquivos IFC 2x3/4, extração geométrica e compatibilização Revit.
- **Gaussian Splat Pipeline**: Suporte nativo a formatos PLY, SOG, SPZ e visualização contínua.
- **AI 3D Command Engine**: Parser de linguagem natural para ações 3D determinísticas com resolução de ambiguidades e salvaguardas estruturais.
- **Remotion Audiovisual**: Renderização frame-a-frame de storyboards cinematográficos e apresentações técnicas.
- **Production Engine (K01 — K23)**:
  - Deploy Zero-Downtime Blue-Green e rollback instantâneo sub-segundo.
  - Hardening completo de containers Docker (`read_only: true`, `cap_drop: ALL`).
  - Sanitização de uploads 3D por Magic Bytes e blindagem de rotas por UUIDv4.
  - Suíte de 89 testes automatizados cobrindo unitários, integração, E2E, A11y e regressão visual.
  - Endpoints de observabilidade e telemetria anônima de performance (`/api/health`, `/healthz/ready`, `/healthz/gpu`).

### Segurança
- Headers de proteção OWASP (CSP estrito, HSTS 2 anos, nosniff, SAMEORIGIN).
- Mascaramento e redação automática de credenciais nos logs com `[REDACTED]`.
- Bloqueio de métodos HTTP inseguros (`TRACE`, `TRACK`, `CONNECT`).
