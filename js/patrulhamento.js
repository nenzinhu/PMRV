/**
 * Módulo: Patrulhamento de Trânsito SC
 * Desenvolvido para registro rápido de infrações durante o patrulhamento.
 */

let PAT_VEICULOS = [];

// Mapeamento das 13 infrações rápidas
const PAT_QUICK_INFRACOES = {
    '518-51': { nome: 'Cinto (Condutor)', codigo: '518-51', gravidade: 'Grave', artigo: 'Art. 167' },
    '518-52': { nome: 'Cinto (Passageiro)', codigo: '518-52', gravidade: 'Grave', artigo: 'Art. 167' },
    '663-71': { nome: 'Equipam. em Desacordo', codigo: '663-71', gravidade: 'Grave', artigo: 'Art. 230, X' },
    '581-96': { nome: 'Desobedecer Agente', codigo: '581-96', gravidade: 'Grave', artigo: 'Art. 195' },
    '659-92': { nome: 'Não Licenciado/Registrado', codigo: '659-92', gravidade: 'Gravíssima', artigo: 'Art. 230, V' },
    '736-62': { nome: 'Celular (Fone/Viva-voz)', codigo: '736-62', gravidade: 'Média', artigo: 'Art. 252, VI' },
    '763-31': { nome: 'Celular (Segurar/Teclar)', codigo: '763-31', gravidade: 'Gravíssima', artigo: 'Art. 252, P.U.' },
    '596-70': { nome: 'Ultrapassar Linha Contínua', codigo: '596-70', gravidade: 'Gravíssima (5x)', artigo: 'Art. 203, V' },
    '550-90': { nome: 'Estacionar Acostamento', codigo: '550-90', gravidade: 'Leve', artigo: 'Art. 181, VII' },
    '545-23': { nome: 'Estac. Jardim Público', codigo: '545-23', gravidade: 'Grave', artigo: 'Art. 181, VIII' },
    '682-32': { nome: 'Restrição Peso/Dimensão', codigo: '682-32', gravidade: 'Grave', artigo: 'Art. 231, IV' },
    '667-00': { nome: 'Lanterna/Luz Placa Queimada', codigo: '667-00', gravidade: 'Média', artigo: 'Art. 230, XXII' },
    '658-00': { nome: 'Placa Ilegível/Sem Visib.', codigo: '658-00', gravidade: 'Gravíssima', artigo: 'Art. 230, VI' }
};

/**
 * Inicializa a tela de patrulhamento
 */
document.addEventListener('DOMContentLoaded', () => {
    setInterval(pat_atualizarDataHora, 30000);
});

/**
 * Atualiza campos de data e hora automaticamente
 */
function pat_atualizarDataHora() {
    const dataInput = document.getElementById('pat_data');
    const horaInput = document.getElementById('pat_hora');
    if (!dataInput || !horaInput) return;

    const agora = new Date();
    dataInput.value = agora.toLocaleDateString('pt-BR');
    horaInput.value = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Alterna entre modo de placa Manual e OCR
 */
function pat_setModoPlaca(modo) {
    const manualWrap = document.getElementById('pat_placa_manual_wrap');
    const ocrWrap = document.getElementById('pat_placa_ocr_wrap');
    
    if (modo === 'manual') {
        manualWrap.classList.remove('hidden');
        ocrWrap.classList.add('hidden');
    } else {
        manualWrap.classList.add('hidden');
        ocrWrap.classList.remove('hidden');
    }
}

/**
 * Alterna entre modo de localização GPS e Manual
 */
function pat_setModoLocal(modo) {
    const gpsBox = document.getElementById('pat_local_gps_box');
    const manualBox = document.getElementById('pat_local_manual_box');
    const btnGps = document.getElementById('btn-pat-local-gps');
    const btnManual = document.getElementById('btn-pat-local-manual');

    if (modo === 'gps') {
        gpsBox.classList.remove('hidden');
        manualBox.classList.add('hidden');
        btnGps.classList.add('btn-primary');
        btnManual.classList.remove('btn-primary');
    } else {
        gpsBox.classList.add('hidden');
        manualBox.classList.remove('hidden');
        btnGps.classList.remove('btn-primary');
        btnManual.classList.add('btn-primary');
    }
}

/**
 * Lida com a mudança no select de rodovia manual
 */
function pat_onRodoviaManualChange() {
    const sel = document.getElementById('pat_manual_rodovia');
    const outraWrap = document.getElementById('pat_manual_rodovia_outra');
    if (sel.value === 'OUTRA') {
        outraWrap.classList.remove('hidden');
    } else {
        outraWrap.classList.add('hidden');
    }
}

/**
 * Simula a leitura de placa via OCR
 */
function pat_simularOCR(input) {
    if (!input.files || !input.files[0]) return;
    
    const placaInput = document.getElementById('pat_placa');
    placaInput.value = "PROCESSANDO...";
    pat_setModoPlaca('manual');

    setTimeout(() => {
        const letras = "ABCDE";
        const numeros = "0123456789";
        let mockPlaca = letras[Math.floor(Math.random() * 5)] + letras[Math.floor(Math.random() * 5)] + letras[Math.floor(Math.random() * 5)];
        mockPlaca += numeros[Math.floor(Math.random() * 10)] + letras[Math.floor(Math.random() * 5)] + numeros[Math.floor(Math.random() * 10)] + numeros[Math.floor(Math.random() * 10)];
        placaInput.value = mockPlaca;
        alert("Placa detectada via OCR: " + mockPlaca);
    }, 1500);
}

/**
 * Seleciona uma infração do guia rápido
 */
function pat_selectQuick(codigo) {
    const manualBox = document.getElementById('pat_infra_manual_box');
    const displayInput = document.getElementById('pat_infracao_display');
    const dataInput = document.getElementById('pat_infracao_data');

    document.querySelectorAll('.infra-quick-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.infra-quick-card[data-click*="${codigo}"]`);
    if (card) card.classList.add('active');

    if (codigo === 'MANUAL') {
        manualBox.classList.remove('hidden');
        displayInput.value = "Digitando manualmente...";
        dataInput.value = "";
        pat_vincularEventosManuais();
    } else {
        manualBox.classList.add('hidden');
        const infra = PAT_QUICK_INFRACOES[codigo];
        if (infra) {
            displayInput.value = `${infra.nome} (${infra.codigo})`;
            dataInput.value = JSON.stringify(infra);
        }
    }
}

/**
 * Vincula eventos de input aos campos manuais para atualização em tempo real
 */
function pat_vincularEventosManuais() {
    const campos = ['pat_manual_infra_nome', 'pat_manual_infra_codigo', 'pat_manual_infra_artigo'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.dataset.bound) {
            el.dataset.bound = "true";
            el.addEventListener('input', pat_atualizarDadosManuais);
        }
    });
}

/**
 * Atualiza o display e o input hidden com os dados digitados manualmente
 */
function pat_atualizarDadosManuais() {
    const nome = document.getElementById('pat_manual_infra_nome').value;
    const codigo = document.getElementById('pat_manual_infra_codigo').value;
    const artigo = document.getElementById('pat_manual_infra_artigo').value;

    const infra = {
        nome: nome || "Nova Infração",
        codigo: codigo || "000-00",
        artigo: artigo || "Art. 000",
        gravidade: "N/I"
    };

    document.getElementById('pat_infracao_display').value = `${infra.nome} (${infra.codigo})`;
    document.getElementById('pat_infracao_data').value = JSON.stringify(infra);
}

/**
 * Formata a placa para o padrão (ABC1234 ou ABC1D23)
 */
function pat_formatarPlaca(el) {
    let val = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 7) val = val.substring(0, 7);
    el.value = val;
}

/**
 * Obtém a localização via GPS para o patrulhamento
 */
function pat_obterGPS() {
    const localInput = document.getElementById('pat_local');
    localInput.value = "⌛ Localizando...";

    if (!navigator.geolocation) {
        alert("GPS não suportado pelo navegador.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            if (typeof gps_identificarRodoviaKM === 'function') {
                const res = gps_identificarRodoviaKM(latitude, longitude);
                if (res) {
                    // Formatar KM com 3 casas decimais (ex: 12,200)
                    const kmFormatado = res.km.toFixed(3).replace('.', ',');
                    localInput.value = `${res.rodovia}, KM ${kmFormatado}`;
                } else {
                    localInput.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                    alert("Você está fora das rodovias mapeadas. Mostrando coordenadas brutas.");
                }
            } else {
                localInput.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            }
        },
        (err) => {
            localInput.value = "";
            alert("Erro ao obter GPS: " + err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

/**
 * Salva o veículo na lista temporária
 */
function pat_salvarVeiculo() {
    const placa = document.getElementById('pat_placa').value;
    const data = document.getElementById('pat_data').value;
    const hora = document.getElementById('pat_hora').value;
    const infracaoJson = document.getElementById('pat_infracao_data').value;

    // Determina o local baseado no modo ativo
    let local = "";
    const isManualLocal = !document.getElementById('pat_local_manual_box').classList.contains('hidden');
    
    if (isManualLocal) {
        let rod = document.getElementById('pat_manual_rodovia').value;
        if (rod === 'OUTRA') rod = document.getElementById('pat_manual_rodovia_outra').value;
        const km = document.getElementById('pat_manual_km').value;
        
        if (!rod || !km) {
            alert("Preencha a Rodovia e o KM corretamente.");
            return;
        }
        local = `${rod}, KM ${km}`;
    } else {
        local = document.getElementById('pat_local').value;
        if (!local || local.includes("Clique")) {
            alert("Obtenha a localização via GPS ou use o modo Manual.");
            return;
        }
    }

    if (!placa || placa.length < 7) {
        alert("Informe uma placa válida.");
        return;
    }

    if (!infracaoJson) {
        alert("Selecione uma infração no Guia Rápido.");
        return;
    }

    const infracaoData = JSON.parse(infracaoJson);

    const veiculo = {
        placa,
        local,
        data,
        hora,
        infracao: infracaoData
    };

    PAT_VEICULOS.push(veiculo);
    pat_renderizarLista();
    pat_limparFormulario();
    
    document.getElementById('pat_lista_card').classList.remove('hidden');
    pat_atualizarDataHora();
}

/**
 * Renderiza a lista de veículos salvos na tela
 */
function pat_renderizarLista() {
    const container = document.getElementById('pat_lista_container');
    container.innerHTML = "";

    PAT_VEICULOS.forEach((v, index) => {
        const item = document.createElement('div');
        item.className = "lote-item";
        item.style.borderLeft = "4px solid var(--primary)";
        item.style.background = "rgba(255,255,255,0.03)";
        item.style.padding = "10px";
        item.style.borderRadius = "8px";
        item.style.marginBottom = "8px";

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <strong style="color:var(--primary); font-size:16px;">🚗 ${v.placa}</strong> 
                    <span style="font-size:12px; color:var(--muted); margin-left:8px;">🕒 ${v.hora}</span><br>
                    <div style="margin-top:4px; font-size:13px;">📍 ${v.local}</div>
                    <div style="margin-top:2px; font-size:13px; color:var(--text-bright);">📑 ${v.infracao.nome}</div>
                    <div style="font-size:11px; color:var(--muted);">Código: ${v.infracao.codigo} | ${v.infracao.artigo}</div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="pat_removerVeiculo(${index})" style="padding:2px 8px;">✕</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function pat_removerVeiculo(index) {
    PAT_VEICULOS.splice(index, 1);
    pat_renderizarLista();
    if (PAT_VEICULOS.length === 0) {
        document.getElementById('pat_lista_card').classList.add('hidden');
        document.getElementById('pat_result_area').classList.add('hidden');
    }
}

function pat_limparFormulario() {
    document.getElementById('pat_placa').value = "";
    document.getElementById('pat_infracao_display').value = "Nenhuma selecionada";
    document.getElementById('pat_infracao_data').value = "";
    document.querySelectorAll('.infra-quick-card').forEach(c => c.classList.remove('active'));
}

function pat_limparTudo() {
    if (confirm("Deseja limpar todos os veículos registrados no lote?")) {
        PAT_VEICULOS = [];
        pat_renderizarLista();
        document.getElementById('pat_lista_card').classList.add('hidden');
        document.getElementById('pat_result_area').classList.add('hidden');
    }
}

function pat_gerarRelatorio() {
    if (PAT_VEICULOS.length === 0) return;

    let txt = `🚨 *RELATÓRIO DE PATRULHAMENTO - PMRv SC*\n`;
    txt += `📅 Data: ${PAT_VEICULOS[0].data}\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    PAT_VEICULOS.forEach((v, i) => {
        txt += `*${i + 1}. VEÍCULO [${v.placa}]*\n`;
        txt += `🕒 Hora: ${v.hora}\n`;
        txt += `📍 Local: ${v.local}\n`;
        txt += `📑 Infração: ${v.infracao.nome}\n`;
        txt += `🔢 Enquadramento: ${v.infracao.codigo}\n`;
        txt += `⚖️ Amparo Legal: ${v.infracao.artigo}\n`;
        txt += `──────────────────────────\n\n`;
    });

    txt += `_Gerado via PMRv Operacional_`;

    document.getElementById('pat_result_text').innerText = txt;
    document.getElementById('pat_result_area').classList.remove('hidden');
    document.getElementById('pat_result_area').scrollIntoView({ behavior: 'smooth' });
}

function pat_whatsapp() {
    const txt = document.getElementById('pat_result_text').innerText;
    const url = "https://api.whatsapp.com/send?text=" + encodeURIComponent(txt);
    window.open(url, '_blank');
}

function pat_downloadTXT() {
    const txt = document.getElementById('pat_result_text').innerText;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patrulhamento_Lote_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Inicializa data/hora ao carregar o script
pat_atualizarDataHora();

// Exportar funções globais
window.pat_formatarPlaca = pat_formatarPlaca;
window.pat_obterGPS = pat_obterGPS;
window.pat_setModoPlaca = pat_setModoPlaca;
window.pat_setModoLocal = pat_setModoLocal;
window.pat_onRodoviaManualChange = pat_onRodoviaManualChange;
window.pat_simularOCR = pat_simularOCR;
window.pat_selectQuick = pat_selectQuick;
window.pat_salvarVeiculo = pat_salvarVeiculo;
window.pat_removerVeiculo = pat_removerVeiculo;
window.pat_limparTudo = pat_limparTudo;
window.pat_gerarRelatorio = pat_gerarRelatorio;
window.pat_whatsapp = pat_whatsapp;
window.pat_downloadTXT = pat_downloadTXT;
window.pat_atualizarDataHora = pat_atualizarDataHora;

console.log("Módulo de Patrulhamento atualizado: Localização Manual disponível.");
