/* ---------------------------------------------------------------
   INICIANDO O SERVIÇO - Lógica Otimizada (Namespace PMRV)
--------------------------------------------------------------- */
window.PMRV = window.PMRV || {};

PMRV.assuncao = (function() {
  const POLICIAIS_EFETIVO = [
    'Sub Ten JORGE LUIZ', 'Sub Ten OSORIO',
    '2º Sgt BARDT', '2º Sgt CAVALLAZZI', '3º Sgt DOUGLAS', '3º Sgt FIGUEIREDO', '3º Sgt FRANCISCO', '3º Sgt FRANCINE', '3º Sgt LEONARDO', '3º Sgt MARTINS', '3º Sgt WALTER',
    'Cb ADEMIR', 'Cb ANDRADE', 'Cb CABRAL', 'Cb DIEGO', 'Cb FABIANA', 'Cb JEFERSON', 'Cb JULIANA', 'Cb MATHEUS', 'Cb RODRIGUES', 'Cb SANTOS', 'Cb SCARABELOT', 'Cb SILVA', 'Cb THIAGO'
  ];

  // Estado Privado
  let isMesa = false;
  let currentVtr = '';
  let currentEscala = '';
  let selectedPols = [];
  let lotes = []; // {id, numero, tipo, policiais:[], horario, isMesa}

  function init() {
    renderPols();
    renderLotes();
    updateUI();
    currentEscala = '';
    const escalaWrap = document.getElementById('ass_escala_wrap');
    if (escalaWrap) escalaWrap.classList.add('hidden');
  }

  function setMode(mesaMode) {
    isMesa = mesaMode;
    if (isMesa) {
      currentVtr = 'MESA';
      currentEscala = '';
      const escalaWrap = document.getElementById('ass_escala_wrap');
      if (escalaWrap) escalaWrap.classList.add('hidden');
    } else {
      currentVtr = '';
    }
    
    const btnMesa = document.getElementById('btn-mode-mesa');
    const btnVtr = document.getElementById('btn-mode-vtr');
    if (btnMesa) btnMesa.className = isMesa ? 'btn btn-primary flex-1' : 'btn flex-1';
    if (btnVtr) btnVtr.className = !isMesa ? 'btn btn-primary flex-1' : 'btn flex-1';
    
    const vtrSelection = document.getElementById('ass_vtr_selection');
    if (vtrSelection) vtrSelection.classList.toggle('hidden', isMesa);
    
    const confirmBtn = document.getElementById('ass_confirm_btn');
    if (confirmBtn) confirmBtn.textContent = isMesa ? '➕ Adicionar Mesa' : '➕ Adicionar Viatura';
    
    updateUI();
  }

  function selectVtr(vtr) {
    currentVtr = vtr;
    const vtrManualWrap = document.getElementById('ass_vtr_manual_wrap');
    if (vtrManualWrap) vtrManualWrap.classList.add('hidden');
    
    const escalaWrap = document.getElementById('ass_escala_wrap');
    if (escalaWrap) escalaWrap.classList.remove('hidden');
    
    updateUI();
  }

  function toggleVtrManual() {
    const wrap = document.getElementById('ass_vtr_manual_wrap');
    if (!wrap) return;
    wrap.classList.toggle('hidden');
    if (!wrap.classList.contains('hidden')) {
      currentVtr = '__manual__';
      const input = document.getElementById('ass_vtr_input_manual');
      if (input) input.focus();
      const escalaWrap = document.getElementById('ass_escala_wrap');
      if (escalaWrap) escalaWrap.classList.remove('hidden');
    }
    updateUI();
  }

  function selectEscala(escala) {
    currentEscala = escala;
    const manualWrap = document.getElementById('ass_escala_manual_wrap');
    if (manualWrap) manualWrap.classList.add('hidden');
    
    if (escala === 'Ordinária') {
      const select = document.getElementById('ass_horario_select');
      if (select) {
        select.value = '07h às 07h';
        onHorarioChange();
      }
    }
    
    updateUI();
  }

  function toggleEscalaManual() {
    const wrap = document.getElementById('ass_escala_manual_wrap');
    if (!wrap) return;
    wrap.classList.toggle('hidden');
    if (!wrap.classList.contains('hidden')) {
      currentEscala = '__manual__';
      const input = document.getElementById('ass_escala_input_manual');
      if (input) input.focus();
    }
    updateUI();
  }

  function renderPols() {
    const grid = document.getElementById('ass_pol_grid');
    if (!grid) return;
    grid.innerHTML = '';
    POLICIAIS_EFETIVO.forEach(p => {
      const btn = document.createElement('button');
      const active = selectedPols.includes(p);
      btn.className = `pol-chip ${active ? 'active' : ''}`;
      btn.textContent = p;
      btn.onclick = () => togglePol(p);
      grid.appendChild(btn);
    });
  }

  function togglePol(p) {
    const idx = selectedPols.indexOf(p);
    if (idx > -1) selectedPols.splice(idx, 1);
    else selectedPols.push(p);
    renderPols();
  }

  function toggleManualPol() {
    const wrap = document.getElementById('ass_manual_pol_wrap');
    if (wrap) wrap.classList.toggle('hidden');
  }

  function addPolManual() {
    const gradEl = document.getElementById('ass_grad_manual');
    const nomeEl = document.getElementById('ass_nome_manual');
    if (!gradEl || !nomeEl) return;
    
    const grad = gradEl.value;
    const nome = nomeEl.value.trim().toUpperCase();
    if (!nome) return;
    const completo = grad + ' ' + nome;
    if (!selectedPols.includes(completo)) {
      selectedPols.push(completo);
      renderPols();
    }
    nomeEl.value = '';
  }

  function onHorarioChange() {
    const select = document.getElementById('ass_horario_select');
    const wrap = document.getElementById('ass_horario_manual_wrap');
    if (!select || !wrap) return;
    
    wrap.classList.toggle('hidden', select.value !== '__manual__');
    if (select.value === '__manual__') {
      const input = document.getElementById('ass_horario_input_manual');
      if (input) input.focus();
    }
  }

  function addLote() {
    if (selectedPols.length === 0) {
      alert('Selecione ao menos um policial.');
      return;
    }
    
    let vtrFinal = currentVtr;
    if (vtrFinal === '__manual__') {
      const input = document.getElementById('ass_vtr_input_manual');
      vtrFinal = input ? input.value.trim() : '';
      if (!vtrFinal) { alert('Informe o número da viatura.'); return; }
    }
    
    if (!isMesa && !vtrFinal) {
      alert('Selecione uma viatura.');
      return;
    }

    let escalaFinal = currentEscala;
    if (escalaFinal === '__manual__') {
      const input = document.getElementById('ass_escala_input_manual');
      escalaFinal = input ? input.value.trim() : '';
      if (!escalaFinal) { alert('Informe o nome do evento.'); return; }
    }
    
    if (!isMesa && !escalaFinal) {
      alert('Selecione o tipo de escala.');
      return;
    }

    const select = document.getElementById('ass_horario_select');
    let horarioFinal = select ? select.value : '';
    if (horarioFinal === '__manual__') {
      const input = document.getElementById('ass_horario_input_manual');
      horarioFinal = input ? input.value.trim() : '';
      if (!horarioFinal) { alert('Informe o horário manual.'); return; }
    }
    
    const newLote = {
      id: Date.now().toString(),
      numero: isMesa ? 'MESA' : vtrFinal,
      tipo: isMesa ? '' : escalaFinal,
      policiais: [...selectedPols],
      horario: horarioFinal,
      isMesa: isMesa
    };

    lotes.push(newLote);
    resetCurrent();
    renderLotes();
  }

  function resetCurrent() {
    selectedPols = [];
    currentVtr = isMesa ? 'MESA' : '';
    currentEscala = '';
    
    const idsToClear = ['ass_vtr_input_manual', 'ass_escala_input_manual', 'ass_horario_input_manual', 'ass_nome_manual'];
    idsToClear.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    const select = document.getElementById('ass_horario_select');
    if (select) select.value = '07h às 19h';
    
    const wrapsToHide = ['ass_vtr_manual_wrap', 'ass_escala_manual_wrap', 'ass_horario_manual_wrap', 'ass_manual_pol_wrap'];
    wrapsToHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    
    const escalaWrap = document.getElementById('ass_escala_wrap');
    if (!isMesa && escalaWrap) {
      escalaWrap.classList.add('hidden');
    }
    
    renderPols();
    updateUI();
    
    const target = document.querySelector('#screen-assumir .card');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }

  function clearAll() {
    if (confirm('Deseja limpar todo o relatório montado?')) {
      lotes = [];
      renderLotes();
      resetCurrent();
    }
  }

  function removeLote(id) {
    lotes = lotes.filter(l => l.id !== id);
    renderLotes();
  }

  function renderLotes() {
    const card = document.getElementById('ass_lotes_card');
    const container = document.getElementById('ass_lotes_container');
    if (!card || !container) return;
    
    if (lotes.length === 0) {
      card.classList.add('hidden');
      return;
    }
    
    card.classList.remove('hidden');
    container.innerHTML = '';
    
    lotes.forEach(l => {
      const div = document.createElement('div');
      div.className = 'lote-item';
      const infoVtr = l.isMesa ? '🪑 MESA P19' : `🚔 PM-${l.numero} — ${l.tipo}`;
      div.innerHTML = `
        <div style="flex:1">
          <div class="lote-title">
            ${infoVtr} 
            <span class="lote-horario">[${l.horario}]</span>
          </div>
          <div class="lote-pols">${l.policiais.join(' / ')}</div>
        </div>
        <button class="btn-remove" onclick="PMRV.assuncao.removeLote('${l.id}')">✕</button>
      `;
      container.appendChild(div);
    });
  }

  function updateUI() {
    document.querySelectorAll('#ass_vtr_grid .vtr-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent === currentVtr);
    });
    document.querySelectorAll('#ass_escala_grid .vtr-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent === currentEscala);
    });
  }

  function generateText() {
    const h = new Date().getHours();
    const saudacao = h >= 5 && h < 12 ? '☀️ Bom dia' : h >= 12 && h < 18 ? '🌤️ Boa tarde' : '🌙 Boa noite';
    let text = `${saudacao}! Guarnição iniciando serviço\n`;
    
    lotes.forEach(l => {
      if (l.isMesa) {
        text += `🔹 Na Recepção do P19 (${l.horario})\n🔹 *Policiais:* ${l.policiais.join(' / ')}\n`;
      } else {
        text += `🔹 *Viatura* PM-${l.numero} — ${l.tipo}\n🔹 *Policiais:* ${l.policiais.join(' / ')}\n🔹 *Horário:* ${l.horario}\n`;
      }
    });
    
    text += `🔹 *Local:* P19\nBom serviço a todos! 👮‍♂️🚓`;
    return text;
  }

  function copyText() {
    const text = generateText();
    navigator.clipboard.writeText(text).then(() => alert('Texto copiado!'));
  }

  function shareWhats() {
    const text = generateText();
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }

  return {
    init,
    setMode,
    selectVtr,
    toggleVtrManual,
    selectEscala,
    toggleEscalaManual,
    toggleManualPol,
    addPolManual,
    onHorarioChange,
    addLote,
    removeLote,
    clearAll,
    copyText,
    shareWhats
  };
})();

/* ---------------------------------------------------------------
   COMPATIBILIDADE (Aliases Globais)
--------------------------------------------------------------- */
window.ass_init = PMRV.assuncao.init;
window.ass_setMode = PMRV.assuncao.setMode;
window.ass_selectVtr = PMRV.assuncao.selectVtr;
window.ass_toggleVtrManual = PMRV.assuncao.toggleVtrManual;
window.ass_selectEscala = PMRV.assuncao.selectEscala;
window.ass_toggleEscalaManual = PMRV.assuncao.toggleEscalaManual;
window.ass_toggleManualPol = PMRV.assuncao.toggleManualPol;
window.ass_addPolManual = PMRV.assuncao.addPolManual;
window.ass_onHorarioChange = PMRV.assuncao.onHorarioChange;
window.ass_addLote = PMRV.assuncao.addLote;
window.ass_removeLote = PMRV.assuncao.removeLote;
window.ass_clearAll = PMRV.assuncao.clearAll;
window.ass_copyText = PMRV.assuncao.copyText;
window.ass_shareWhats = PMRV.assuncao.shareWhats;
