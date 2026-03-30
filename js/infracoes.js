// infracoes.js - Versão otimizada para mobile
(function () {
  // Estados da aplicação
  const state = {
    initialized: false,
    loading: false,
    records: [],
    categories: [],
    measures: [],
    elements: null
  };

  // Configurações de busca
  const SEARCH_CONFIG = {
    SYNONYMS: [
      // ... (mesmo conteúdo do original)
    ],
    INTENT_RULES: [
      // ... (mesmo conteúdo do original)
    ],
    CODE_SHORTCUTS: [
      // ... (mesmo conteúdo do original)
    ]
  };

  // Funções auxiliares
  const Utils = {
    // Repara texto com caracteres quebrados
    repairBrokenText(text) {
      // ... (mesmo conteúdo do original)
    },

    // Normaliza texto para busca
    normalizeSearchText(value) {
      // ... (mesmo conteúdo do original)
    },

    // Formata moeda
    formatCurrency(value) {
      // ... (mesmo conteúdo do original)
    },

    // Escapa HTML
    escapeHtml(value) {
      // ... (mesmo conteúdo do original)
    }
  };

  // Manipulação do DOM
  const DOM = {
    // Cache de elementos do DOM
    getElements() {
      // ... (mesmo conteúdo do original)
    },

    // Preenche selects
    fillSelect(select, values, emptyLabel) {
      // ... (mesmo conteúdo do original)
    },

    // Mostra aba
    showTab(tab) {
      // ... (mesmo conteúdo do original)
    }
  };

  // Processamento de dados
  const DataProcessor = {
    // Parse CSV
    parseCsv(text) {
      // ... (mesmo conteúdo do original)
    },

    // Mapeia registros
    mapRecords(rows) {
      // ... (mesmo conteúdo do original)
    },

    // Mescla registros
    mergeRecords(...sources) {
      // ... (mesmo conteúdo do original)
    }
  };

  // Busca e filtros
  const SearchEngine = {
    // Constrói índice de busca
    buildSearchIndex(record) {
      // ... (mesmo conteúdo do original)
    },

    // Expande intenções de busca
    expandSearchIntent(term) {
      // ... (mesmo conteúdo do original)
    },

    // Resolve atalhos de código
    resolveCodeShortcut(term) {
      // ... (mesmo conteúdo do original)
    },

    // Aplica filtros
    applyFilters() {
      const elements = DOM.getElements();
      const term = Utils.normalizeSearchText(elements.search.value);
      const category = elements.category.value;
      const measure = elements.measure.value;

      const termParts = term ? SearchEngine.expandSearchIntent(term) : [];
      const forcedCode = SearchEngine.resolveCodeShortcut(term);

      const filtered = state.records.filter(record => {
        if (forcedCode && record.codigo !== forcedCode) return false;
        if (!forcedCode && termParts.length && !termParts.every(part => record.search.includes(part))) return false;
        if (category && record.categoria !== category) return false;
        if (measure && record.medida !== measure) return false;
        return true;
      });

      Renderer.render(filtered);
    }
  };

  // Renderização
  const Renderer = {
    // Atualiza estatísticas
    updateStats(records, filtered) {
      const elements = DOM.getElements();
      elements.totalCount.textContent = records.length.toLocaleString('pt-BR');
      elements.filteredCount.textContent = filtered.length.toLocaleString('pt-BR');
      elements.categoryCount.textContent = state.categories.length.toLocaleString('pt-BR');
    },

    // Renderiza tabela
    render(records) {
      const elements = DOM.getElements();
      this.updateStats(state.records, records);

      if (!records.length) {
        elements.tableBody.innerHTML = '';
        elements.emptyState.hidden = false;
        elements.status.textContent = 'Nenhum resultado encontrado';
        elements.summary.textContent = 'Ajuste os filtros para ampliar a pesquisa na base local.';
        return;
      }

      elements.emptyState.hidden = true;
      elements.status.textContent = `${records.length.toLocaleString('pt-BR')} infrações listadas`;
      elements.summary.textContent = state.records.length === records.length
        ? 'Base completa carregada para consulta local.'
        : `Resultados filtrados sobre ${state.records.length.toLocaleString('pt-BR')} registros da base.`;

      elements.tableBody.innerHTML = records.map(record => `
        <tr>
          <td class="infra-code">${Utils.escapeHtml(record.codigo)}</td>
          <td class="infra-description">${Utils.escapeHtml(record.descricao)}</td>
          <td class="infra-muted-cell">${Utils.escapeHtml(record.artigo || 'Não informado')}</td>
          <td class="infra-muted-cell">${Utils.escapeHtml(record.infrator || 'Não informado')}</td>
          <td><span class="infra-badge ${this.categoryClass(record.categoria)}">${Utils.escapeHtml(record.categoria)}</span></td>
          <td><span class="infra-measure ${this.measureClass(record.medida)}">${Utils.escapeHtml(record.medida || 'Sem medida')}</span></td>
          <td class="infra-code">${Utils.escapeHtml(Utils.formatCurrency(record.valor))}</td>
        </tr>
      `).join('');
    },

    // Classes CSS para categorias
    categoryClass(value) {
      // ... (mesmo conteúdo do original)
    },

    // Classes CSS para medidas
    measureClass(value) {
      // ... (mesmo conteúdo do original)
    }
  };

  // Eventos
  const Events = {
    // Liga eventos
    bindEvents() {
      const elements = DOM.getElements();
      if (!elements.search || elements.search.dataset.bound === 'true') return;

      elements.search.dataset.bound = 'true';
      elements.search.addEventListener('input', SearchEngine.applyFilters);
      elements.category.addEventListener('change', SearchEngine.applyFilters);
      elements.measure.addEventListener('change', SearchEngine.applyFilters);
      
      elements.clear.addEventListener('click', () => {
        elements.search.value = '';
        elements.category.value = '';
        elements.measure.value = '';
        Renderer.render(state.records);
      });
    }
  };

  // Inicialização
  const App = {
    async init() {
      const elements = DOM.getElements();
      if (!elements.search) return;

      Events.bindEvents();
      DOM.showTab('consulta');

      if (state.initialized || state.loading) {
        if (state.initialized) Renderer.render(state.records);
        return;
      }

      state.loading = true;
      elements.status.textContent = 'Carregando base...';
      elements.summary.textContent = 'Lendo a base local de infrações.';

      try {
        const [csvText, fishText] = await this.loadCsv();
        const rows = DataProcessor.parseCsv(csvText);
        const fishRows = fishText ? DataProcessor.parseCsv(fishText) : [];
        
        state.records = DataProcessor.mergeRecords(
          DataProcessor.mapRecords(rows), 
          DataProcessor.mapFishRecords(fishRows)
        );
        
        this.processData();
        Renderer.render(state.records);
      } catch (error) {
        this.handleError(error);
      } finally {
        state.loading = false;
      }
    },

    processData() {
      state.categories = [...new Set(state.records.map(r => r.categoria).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
      
      state.measures = [...new Set(state.records.map(r => r.medida).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

      const elements = DOM.getElements();
      DOM.fillSelect(elements.category, state.categories, 'Todas');
      DOM.fillSelect(elements.measure, state.measures, 'Todas');
      state.initialized = true;
    },

    async loadCsv() {
      const basePromise = window.INFRACOES_CSV_BASE64
        ? Promise.resolve(this.decodeBase64(window.INFRACOES_CSV_BASE64))
        : fetch('./infracoes/infracoes.csv.txt', { cache: 'no-store' })
            .then(res => res.ok ? res.arrayBuffer() : Promise.reject('Falha ao carregar CSV'))
            .then(buffer => new TextDecoder('utf-8').decode(buffer));

      const fishPromise = this.loadOptionalText(['./fish.cleaned.csv', './fish.csv']);
      return Promise.all([basePromise, fishPromise]);
    },

    decodeBase64(base64) {
      return new TextDecoder('utf-8').decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)));
    },

    async loadOptionalText(paths) {
      for (const path of (Array.isArray(paths) ? paths : [paths])) {
        try {
          const response = await fetch(path, { cache: 'no-store' });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            return new TextDecoder('utf-8').decode(buffer);
          }
        } catch {}
      }
      return '';
    },

    handleError(error) {
      const elements = DOM.getElements();
      elements.status.textContent = 'Falha ao carregar a base';
      elements.summary.textContent = error?.message || 'Não foi possível ler a base local.';
      elements.emptyState.hidden = false;
      elements.tableBody.innerHTML = '';
    }
  };

  // Expondo funções globais
  window.infra_init = () => App.init();
  window.infra_showTab = tab => DOM.showTab(tab);
  window.infra_applyShortcut = term => {
    const elements = DOM.getElements();
    if (!elements.search) return;
    
    elements.search.value = term;
    DOM.showTab('consulta');
    SearchEngine.applyFilters();
  };
})();
