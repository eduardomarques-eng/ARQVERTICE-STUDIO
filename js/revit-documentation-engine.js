/**
 * ArqVértice Studio — Bloco J: J24 — Revit Views, Sheets, Documentation e Export
 * 
 * Conecta o Autodesk Revit ao Sistema de Pranchas e Apresentação do ArqVértice.
 * Gerencia Vistas, View Templates, Pranchas (Carimbo NBR 6492), Tabelas/Schedules,
 * Anotações e Exportação Multiformato (PDF, DWG, IFC, CSV).
 * Princípio: Uma prancha preparada pelo ArqVértice continua sendo um objeto Revit editável.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitDocumentationEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Formatos Físicos de Prancha segundo a NBR 6492
     */
    const SHEET_FORMATS = Object.freeze({
        A0: { widthMm: 1189, heightMm: 841, marginMm: 10, titleBlockWidthMm: 178 },
        A1: { widthMm: 841, heightMm: 594, marginMm: 10, titleBlockWidthMm: 178 },
        A2: { widthMm: 594, heightMm: 420, marginMm: 10, titleBlockWidthMm: 178 },
        A3: { widthMm: 420, heightMm: 297, marginMm: 10, titleBlockWidthMm: 178 }
    });

    /**
     * Tipos de Vistas Suportadas
     */
    const VIEW_TYPES = Object.freeze([
        'FloorPlan',
        'CeilingPlan',
        'Section',
        'Elevation',
        'ThreeD',
        'Drafting',
        'Detail'
    ]);

    class RevitDocumentationEngine {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j24';
            this.connector = connector;
            this.debug = !!options.debug;

            this.sheets = [];
            this.viewTemplates = new Map();
            this.schedules = [];

            this._seedInitialDocumentation();
        }

        _seedInitialDocumentation() {
            // View Templates padrão
            this.viewTemplates.set('ARQ_Planta_Executiva', {
                discipline: 'Architecture',
                scale: 50,
                detailLevel: 'Fine',
                modelDisplay: 'HiddenLine'
            });
            this.viewTemplates.set('ARQ_Apresentacao_Humanizada', {
                discipline: 'Architecture',
                scale: 50,
                detailLevel: 'Fine',
                modelDisplay: 'Realistic'
            });
        }

        /**
         * 1. CRIAÇÃO DE PRANCHA TÉCNICA EXECUTIVA NO REVIT
         */
        createSheet({
            sheetNumber = 'A-101',
            sheetName = 'Plantas Baixas e Layout Executivo',
            format = 'A1',
            titleBlockFamily = 'Carimbo_ArqVertice_NBR6492'
        }) {
            const formatData = SHEET_FORMATS[format] || SHEET_FORMATS.A1;

            const sheet = {
                id: `sheet_${this.sheets.length + 100}`,
                sheetNumber,
                sheetName,
                format,
                dimensionsMm: { width: formatData.widthMm, height: formatData.heightMm },
                titleBlock: {
                    family: titleBlockFamily,
                    projectNumber: 'ARQ-2026-08',
                    client: 'Família Mendonça',
                    content: sheetName,
                    scale: '1:50',
                    date: new Date().toLocaleDateString('pt-BR')
                },
                viewports: [],
                status: 'DRAFT',
                isRevitEditable: true,
                createdAt: new Date().toISOString()
            };

            this.sheets.push(sheet);
            return sheet;
        }

        /**
         * 2. INSERÇÃO DE VIEWPORT NA PRANCHA
         */
        placeViewport(sheetNumber, viewName, position = { xMm: 120, yMm: 100 }, scale = 50) {
            const sheet = this.sheets.find(s => s.sheetNumber === sheetNumber);
            if (!sheet) {
                throw new Error(`[DocumentationEngine] Prancha "${sheetNumber}" não encontrada.`);
            }

            const viewport = {
                id: `vp_${sheet.viewports.length + 1}`,
                viewName,
                scale: `1:${scale}`,
                positionMm: position,
                viewportTitle: viewName.toUpperCase(),
                hasTitle: true
            };

            sheet.viewports.push(viewport);
            return viewport;
        }

        /**
         * 3. CRIAÇÃO E CONSULTA DE TABELAS (SCHEDULES)
         */
        createSchedule(category, fields = ['FamilyAndType', 'Count', 'Area', 'Comments']) {
            const schedule = {
                id: `sched_${this.schedules.length + 1}`,
                category,
                name: `Tabela de ${category}`,
                fields,
                filter: 'None',
                sortField: fields[0],
                rowCount: 12,
                rows: [
                    { FamilyAndType: 'Porta Pivotante 1.20m', Count: 1, Area: '2.88m²', Comments: 'Entrada' },
                    { FamilyAndType: 'Porta de Giro 0.80m', Count: 6, Area: '1.68m²', Comments: 'Quartos e Banhos' }
                ]
            };

            this.schedules.push(schedule);
            return schedule;
        }

        /**
         * 4. PREPARAÇÃO DE PACOTES DE EXPORTAÇÃO (PDF, DWG, IFC, CSV)
         */
        prepareExportPackage(packageType = 'DOCUMENTATION', format = 'PDF') {
            const validFormats = ['PDF', 'DWG', 'IFC', 'CSV'];
            if (!validFormats.includes(format.toUpperCase())) {
                throw new Error(`[DocumentationEngine] Formato "${format}" inválido. Formatos suportados: ${validFormats.join(', ')}.`);
            }

            const pkg = {
                packageId: `pkg_${Date.now()}`,
                packageType, // 'DOCUMENTATION', 'PRESENTATION', 'VISUAL'
                format: format.toUpperCase(),
                sheetsIncluded: this.sheets.map(s => s.sheetNumber),
                schedulesIncluded: this.schedules.map(s => s.name),
                archiveName: `ARQVERTICE_${packageType}_${format.toUpperCase()}_v1.0.zip`,
                generatedAt: new Date().toISOString()
            };

            return pkg;
        }
    }

    RevitDocumentationEngine.SHEET_FORMATS = SHEET_FORMATS;
    RevitDocumentationEngine.VIEW_TYPES = VIEW_TYPES;

    return RevitDocumentationEngine;
}));
