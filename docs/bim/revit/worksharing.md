# Revit Worksharing & Collaboration Safety

## 1. Princípios de Segurança em Modelos Compartilhados

Em ambientes de produção corporativos, modelos BIM não operam como arquivos isolados, mas sim como ecossistemas colaborativos multiusuário com **Worksharing** habilitado.

A manipulação automatizada por agentes de inteligência artificial em modelos compartilhados deve obedecer estritamente aos estados de posse, empréstimo e bloqueio do modelo:

1. **Reconhecimento de Topologia**:
   - `Central`: Arquivo mestre no servidor local ou Revit Server.
   - `Local`: Cópia de trabalho do usuário conectado.
   - `Cloud Model`: Modelo colaborativo hospedado na nuvem Autodesk Construction Cloud (ACC) ou BIM 360.
2. **Worksets & Ownership**: Elementos pertencem a worksets específicos e podem estar "emprestados" (*borrowed*) por outros projetistas.
3. **Não Violabilidade**: Nenhuma automação deve forçar a tomada de posse ou alterar elementos sob controle de outro arquiteto sem consentimento.

---

## 2. Fluxo de Inspeção de Editabilidade

Antes de qualquer tentativa de abertura de transação ou envio de comando de modificação (`modify_element`, `set_parameter`), o módulo `RevitWorksharingSafety` executa a checagem preliminar:

```text
Target Element ID
       │
       ▼
Is Document Workshared? ──(No)──► Permitir escrita direta
       │ (Yes)
       ▼
Check Element Ownership
       ├─► Owner == CurrentUser ──────────► Permitir
       ├─► Owner == "" (Disponível) ──────► Requisitar empréstimo temporário
       └─► Owner == "OutroUsuário" ───────► REJEITAR IMEDIATAMENTE
                                            Código: ELEMENT_NOT_EDITABLE
```

### Resposta de Rejeição Padronizada:

```json
{
  "status": "REJECTED",
  "code": "ELEMENT_NOT_EDITABLE",
  "elementId": 984123,
  "worksetName": "Arquitetura - Interiores",
  "owner": "bruno.costa@studio.com",
  "message": "Operação abortada: o elemento está reservado por outro arquiteto."
}
```

---

## 3. Política Estrita: "Sync With Central"

A sincronização com o modelo central (`SynchronizeWithCentral`) é um ponto crítico de consistência do projeto. 

**Regras Fundamentais**:
- O agente **NUNCA** dispara sincronização com central de forma automática ou silenciosa em segundo plano.
- Sincronização requer solicitação e confirmação explícita do operador humano.
- O agente nunca altera a hierarquia de worksets, nomes ou permissões globais de compartilhamento.
- Para modelos em nuvem (`Cloud Worksharing`), o fluxo respeita as diretivas do Autodesk Platform Services (APS), tratando latências e estados de reconciliação de forma assíncrona.
