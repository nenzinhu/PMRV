/* ---------------------------------------------------------------
   NAMESPACE GLOBAL PMRV
--------------------------------------------------------------- */
window.PMRV = window.PMRV || {};

/* ---------------------------------------------------------------
   THUMBS DAS ABAS — copia src das imagens v360 para os thumbnails
--------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function(){
  const map = {
    'dan-thumb-frente':   'v360-img-frente',
    'dan-thumb-tras':     'v360-img-tras',
    'dan-thumb-direita':  'v360-img-direita',
    'dan-thumb-esquerda': 'v360-img-esquerda'
  };
  Object.keys(map).forEach(function(thumbId){
    const src = document.getElementById(map[thumbId]);
    const thumb = document.getElementById(thumbId);
    if (src && thumb) thumb.src = src.src;
  });
  PMRV.core.bindDeclarativeHandlers();
  PMRV.core.registerServiceWorker();
  if (typeof window.gps_preencherSelects === 'function') {
    window.gps_preencherSelects();
  }
});

/* ---------------------------------------------------------------
   MÓDULO CORE
--------------------------------------------------------------- */
PMRV.core = (function() {
  const SCREENS = ['home','assumir','envolvidos','pmrv','danos','relatorio','infracoes','help','ended','docs','patrulhamento'];

  function go(name) {
    SCREENS.forEach(id => {
      const el = document.getElementById('screen-' + id);
      if (el) el.classList.toggle('active', id === name);
    });
    const app = document.querySelector('.app');
    if (app) app.classList.toggle('app-wide', name === 'infracoes');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Inicializar telas que precisam de setup
    if (name === 'patrulhamento' && typeof window.pat_atualizarDataHora === 'function') {
      window.pat_atualizarDataHora();
    }
    if (name === 'assumir' && typeof window.ass_init === 'function') {
      window.ass_init();
    }
    if (name === 'envolvidos' && document.getElementById('env_lista').children.length === 0) {
      if (typeof window.env_adicionar === 'function') window.env_adicionar();
    }
    if (name === 'danos') {
      if (typeof window.danPrepararTela === 'function') window.danPrepararTela();
    }
    if (name === 'pmrv') {
      if (typeof window.pmrv_verificarRodovia === 'function') window.pmrv_verificarRodovia();
      if (typeof window.pmrv_mudarSubtipo === 'function') window.pmrv_mudarSubtipo();
      if (typeof window.pmrv_atualizar === 'function') window.pmrv_atualizar();
    }
    if (name === 'relatorio') {
      const envLista = document.getElementById('env_lista');
      document.getElementById('rel-count-env').textContent = envLista ? envLista.querySelectorAll('.person-card').length : '0';
      document.getElementById('rel-count-dan').textContent = (window.danVeiculosSalvos && window.danVeiculosSalvos.length) || '0';
      document.getElementById('rel-result-area').style.display = 'none';
    }
    if (name === 'infracoes' && typeof window.infra_init === 'function') {
      window.infra_init();
    }
  }

  function capFirst(input) {
    const v = input.value;
    if (v.length > 0) input.value = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  }

  function copiar(elId, btn) {
    const el = document.getElementById(elId);
    if (!el) return;
    const texto = el.textContent;
    navigator.clipboard.writeText(texto).then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = '✅ Copiado!';
      btn.classList.add('btn-success');
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('btn-success');
      }, 2000);
    });
  }

  function whatsapp(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    const texto = el.textContent;
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
  }

  function mascaraTelefone(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else                v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    input.value = v;
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./service_worker.js').catch(function() {});
    }, { once: true });
  }

  function bindDeclarativeHandlers() {
    const events = [
      { type: 'click', attr: 'data-click' },
      { type: 'change', attr: 'data-change' },
      { type: 'input', attr: 'data-input' },
      { type: 'pointerdown', attr: 'data-pointerdown' }
    ];

    events.forEach(ev => {
      document.addEventListener(ev.type, function(event) {
        const el = event.target.closest('[' + ev.attr + ']');
        if (!el) return;
        event.declarativeTarget = el;
        invokeDeclarativeExpression(el.getAttribute(ev.attr), el, event);
      });
    });

    document.addEventListener('keydown', function(event) {
      const el = event.target.closest('[data-keydown-enter]');
      if (!el || event.key !== 'Enter') return;
      invokeDeclarativeExpression(el.getAttribute('data-keydown-enter'), el, event);
    });
  }

  function resolveFunction(path) {
    return path.split('.').reduce((obj, prop) => obj && obj[prop], window);
  }

  function invokeDeclarativeExpression(expr, el, event) {
    if (!expr) return;
    const match = expr.trim().match(/^([A-Za-z_$][\w$.]*)\((.*)\)$/);
    if (!match) return;

    const fn = resolveFunction(match[1]);
    if (typeof fn !== 'function') {
      console.warn('Função não encontrada:', match[1]);
      return;
    }

    const args = parseDeclarativeArgs(match[2], el, event);
    fn.apply(el, args); // 'this' agora aponta para o elemento
  }

  function parseDeclarativeArgs(rawArgs, el, event) {
    const args = [];
    let current = '';
    let quote = null;

    for (let i = 0; i < rawArgs.length; i++) {
      const ch = rawArgs[i];
      const prev = rawArgs[i - 1];

      if (quote) {
        current += ch;
        if (ch === quote && prev !== '\\') quote = null;
        continue;
      }

      if (ch === '\'' || ch === '"') {
        quote = ch;
        current += ch;
        continue;
      }

      if (ch === ',') {
        args.push(resolveDeclarativeToken(current.trim(), el, event));
        current = '';
        continue;
      }

      current += ch;
    }

    if (current.trim() || rawArgs.trim()) {
      args.push(resolveDeclarativeToken(current.trim(), el, event));
    }

    return args;
  }

  function resolveDeclarativeToken(token, el, event) {
    if (token === '' || token === 'undefined') return undefined;
    if (token === 'this') return el;
    if (token === 'event') return event;
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (token === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);

    const quoted = token.match(/^(['"])(.*)\1$/);
    if (quoted) {
      return quoted[2]
        .replace(/\\'/g, '\'')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }

    return token;
  }

  function limparCache() {
    if (confirm('Atenção!\n\nEsta ação limpará todos os dados salvos temporariamente no aplicativo e forçará a atualização para a versão mais recente.\n\nDeseja continuar?')) {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => {
          for (let name of names) caches.delete(name);
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) registration.unregister();
        });
      }
      alert('Cache limpo com sucesso!\nO aplicativo será reiniciado.');
      window.location.reload(true);
    }
  }

  // Exportar API pública do core
  return {
    go,
    capFirst,
    copiar,
    whatsapp,
    mascaraTelefone,
    registerServiceWorker,
    bindDeclarativeHandlers,
    limparCache
  };
})();

/* ---------------------------------------------------------------
   COMPATIBILIDADE (Aliases Globais)
--------------------------------------------------------------- */
window.go = PMRV.core.go;
window.capFirst = PMRV.core.capFirst;
window.copiar = PMRV.core.copiar;
window.whatsapp = PMRV.core.whatsapp;
window.mascaraTelefone = PMRV.core.mascaraTelefone;
window.core_limparCache = PMRV.core.limparCache;

