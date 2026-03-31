/**
 * Módulo: Croqui Dinâmico de Sinistros
 * Motor de desenho técnico para perícia rodoviária
 */

let CROQUI_ELEMENTS = [];
let CROQUI_SELECTED = null;
let CROQUI_SVG = null;

// Configurações de Arraste
let isDragging = false;
let startX, startY;
let currentX, currentY;

/**
 * Inicializa o Croqui
 */
function croqui_init() {
    CROQUI_SVG = document.getElementById('croqui-svg');
    if (!CROQUI_SVG) return;

    // Eventos de Mouse/Touch para o SVG
    CROQUI_SVG.addEventListener('mousedown', croqui_onStart);
    CROQUI_SVG.addEventListener('mousemove', croqui_onMove);
    CROQUI_SVG.addEventListener('mouseup', croqui_onEnd);

    CROQUI_SVG.addEventListener('touchstart', croqui_onStart, { passive: false });
    CROQUI_SVG.addEventListener('touchmove', croqui_onMove, { passive: false });
    CROQUI_SVG.addEventListener('touchend', croqui_onEnd, { passive: false });
}

/**
 * Adiciona uma geometria de via ao croqui
 */
function croqui_adicionarVia(tipo) {
    const g = document.getElementById('croqui-vias');
    const id = 'via-' + Date.now();
    let element = null;

    if (tipo === 'reta') {
        element = document.createElementNS("http://www.w3.org/2000/svg", "g");
        element.setAttribute('id', id);
        element.setAttribute('transform', 'translate(50, 150)');
        element.innerHTML = `
            <rect width="300" height="100" fill="#333" />
            <line x1="0" y1="50" x2="300" y2="50" stroke="yellow" stroke-width="2" stroke-dasharray="10,10" />
            <line x1="0" y1="5" x2="300" y2="5" stroke="white" stroke-width="2" />
            <line x1="0" y1="95" x2="300" y2="95" stroke="white" stroke-width="2" />
        `;
    } else if (tipo === 'curva') {
        element = document.createElementNS("http://www.w3.org/2000/svg", "g");
        element.setAttribute('id', id);
        element.setAttribute('transform', 'translate(100, 100)');
        element.innerHTML = `
            <path d="M 0 200 Q 0 0 200 0" fill="none" stroke="#333" stroke-width="100" />
            <path d="M 0 200 Q 0 0 200 0" fill="none" stroke="yellow" stroke-width="2" stroke-dasharray="10,10" />
        `;
    } else if (tipo === 'cruzamento') {
        element = document.createElementNS("http://www.w3.org/2000/svg", "g");
        element.setAttribute('id', id);
        element.setAttribute('transform', 'translate(100, 100)');
        element.innerHTML = `
            <rect x="80" y="0" width="100" height="260" fill="#333" />
            <rect x="0" y="80" width="260" height="100" fill="#333" />
            <line x1="130" y1="0" x2="130" y2="260" stroke="yellow" stroke-width="2" stroke-dasharray="10,10" />
            <line x1="0" y1="130" x2="260" y2="130" stroke="yellow" stroke-width="2" stroke-dasharray="10,10" />
        `;
    }

    if (element) {
        element.style.cursor = 'move';
        element.setAttribute('data-type', 'via');
        g.appendChild(element);
        croqui_selecionar(element);
    }
}

/**
 * Abre o modal de ícones
 */
function croqui_abrirModalIcones() {
    const modal = document.getElementById('croqui-modal-icones');
    if (modal) modal.classList.add('show');
}

function croqui_fecharModal() {
    const modal = document.getElementById('croqui-modal-icones');
    if (modal) modal.classList.remove('show');
}

function croqui_fecharModalOnBackdrop(e) {
    if (e.target.id === 'croqui-modal-icones') croqui_fecharModal();
}

function croqui_filtrarIcones(cat) {
    document.querySelectorAll('.croqui-icon-item').forEach(el => {
        el.classList.toggle('hidden', !el.classList.contains(cat));
    });
    const btns = document.querySelectorAll('.croqui-icon-tabs .btn');
    btns[0].classList.toggle('btn-primary', cat === 'veiculos');
    btns[1].classList.toggle('btn-primary', cat === 'sinistros');
}

/**
 * Insere um ícone de emoji (Veículo)
 */
function croqui_inserirIcone(tipo) {
    const g = document.getElementById('croqui-objetos');
    const id = 'obj-' + Date.now();
    const element = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    let emoji = "🚗";
    let color = "";
    if (tipo === 'v2') color = "filter: hue-rotate(90deg);";
    if (tipo === 'moto') emoji = "🏍️";
    if (tipo === 'caminhao') emoji = "🚚";

    element.setAttribute('id', id);
    element.setAttribute('transform', 'translate(150, 150)');
    element.innerHTML = `
        <g class="icon-body" transform="scale(1, 1)">
            <text y="10" font-size="40" text-anchor="middle" style="${color}">${emoji}</text>
        </g>
        <text y="-25" font-size="12" font-weight="bold" fill="white" text-anchor="middle" class="icon-label">${tipo.toUpperCase()}</text>
    `;
    
    element.style.cursor = 'move';
    element.setAttribute('data-type', 'objeto');
    g.appendChild(element);
    croqui_fecharModal();
    croqui_selecionar(element);
}

/**
 * Insere um ícone SVG (Sinistro)
 */
function croqui_inserirSvg(filename) {
    const g = document.getElementById('croqui-objetos');
    const id = 'svg-' + Date.now();
    const element = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    element.setAttribute('id', id);
    element.setAttribute('transform', 'translate(150, 150)');
    
    fetch(`img/sinistros/${filename}`)
        .then(response => response.text())
        .then(svgText => {
            const cleanSvg = svgText.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
            element.innerHTML = `
                <g class="icon-body" transform="scale(1.5, 1.5) translate(-15, -15)" style="filter: invert(1);">
                    ${cleanSvg}
                </g>
            `;
        });

    element.style.cursor = 'move';
    element.setAttribute('data-type', 'objeto');
    g.appendChild(element);
    croqui_fecharModal();
    croqui_selecionar(element);
}

/**
 * Lógica de Seleção e Arraste
 */
function croqui_selecionar(el) {
    if (CROQUI_SELECTED) {
        CROQUI_SELECTED.classList.remove('selected');
    }
    CROQUI_SELECTED = el;
    CROQUI_SELECTED.classList.add('selected');
}

function croqui_onStart(e) {
    const target = e.target.closest('g[id]');
    if (!target) {
        if (CROQUI_SELECTED) CROQUI_SELECTED.classList.remove('selected');
        CROQUI_SELECTED = null;
        return;
    }
    croqui_selecionar(target);
    isDragging = true;
    const coords = croqui_getCoords(e);
    startX = coords.x;
    startY = coords.y;
    const transform = target.getAttribute('transform') || 'translate(0,0)';
    const match = /translate\(([^, ]+)[, ]*([^)]+)\)/.exec(transform);
    if (match) {
        currentX = parseFloat(match[1]);
        currentY = parseFloat(match[2]);
    }
}

function croqui_onMove(e) {
    if (!isDragging || !CROQUI_SELECTED) return;
    e.preventDefault();
    const coords = croqui_getCoords(e);
    const dx = coords.x - startX;
    const dy = coords.y - startY;
    const newX = currentX + dx;
    const newY = currentY + dy;
    const currentTransform = CROQUI_SELECTED.getAttribute('transform') || '';
    const otherTransforms = currentTransform.replace(/translate\([^)]+\)/, '').trim();
    CROQUI_SELECTED.setAttribute('transform', `translate(${newX}, ${newY}) ${otherTransforms}`);
}

function croqui_onEnd() {
    isDragging = false;
}

function croqui_getCoords(e) {
    const svg = CROQUI_SVG;
    const CTM = svg.getScreenCTM();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - CTM.e) / CTM.a,
        y: (clientY - CTM.f) / CTM.d
    };
}

/**
 * Gira o elemento selecionado
 */
function croqui_girar() {
    if (!CROQUI_SELECTED) return;
    const transform = CROQUI_SELECTED.getAttribute('transform') || '';
    const rotateMatch = /rotate\(([^)]+)\)/.exec(transform);
    let angle = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
    angle = (angle + 15) % 360;
    const otherTransforms = transform.replace(/rotate\([^)]+\)/, '').trim();
    CROQUI_SELECTED.setAttribute('transform', `${otherTransforms} rotate(${angle})`);
}

/**
 * Inverte apenas o ícone (veículo), mantendo a legenda legível
 */
function croqui_espelhar() {
    if (!CROQUI_SELECTED) return;
    
    // Se for uma VIA, espelha o grupo todo
    if (CROQUI_SELECTED.getAttribute('data-type') === 'via') {
        const transform = CROQUI_SELECTED.getAttribute('transform') || '';
        const scaleMatch = /scale\(([^,)]+),?([^)]+)?\)/.exec(transform);
        let scaleX = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        scaleX = scaleX * -1;
        const otherTransforms = transform.replace(/scale\([^)]+\)/, '').trim();
        CROQUI_SELECTED.setAttribute('transform', `${otherTransforms} scale(${scaleX}, 1)`);
        return;
    }

    // Se for um OBJETO (veículo), espelha apenas o .icon-body
    const body = CROQUI_SELECTED.querySelector('.icon-body');
    if (!body) return;

    const transform = body.getAttribute('transform') || '';
    const scaleMatch = /scale\(([^, )]+)[, ]*([^)]+)?\)/.exec(transform);
    
    let scaleX = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    let scaleY = (scaleMatch && scaleMatch[2]) ? parseFloat(scaleMatch[2]) : (scaleMatch ? scaleX : 1);
    
    scaleX = scaleX * -1;
    const otherTransforms = transform.replace(/scale\([^)]+\)/, '').trim();
    body.setAttribute('transform', `scale(${scaleX}, ${scaleY}) ${otherTransforms}`);
}

function croqui_limpar() {
    if (confirm("Deseja limpar todo o croqui?")) {
        document.getElementById('croqui-vias').innerHTML = '';
        document.getElementById('croqui-objetos').innerHTML = '';
        CROQUI_SELECTED = null;
    }
}

async function croqui_exportar() {
    const svg = CROQUI_SVG;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = svg.clientWidth * 2;
    canvas.height = svg.clientHeight * 2;
    const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(svgBlob);
    img.onload = function() {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = "Croqui_Sinistro.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };
    img.src = url;
}

function croqui_whatsapp() {
    alert("Dica: Use 'Salvar Imagem' e anexe a foto no WhatsApp da Central/Grupo.");
}

window.croqui_adicionarVia = croqui_adicionarVia;
window.croqui_abrirModalIcones = croqui_abrirModalIcones;
window.croqui_fecharModal = croqui_fecharModal;
window.croqui_fecharModalOnBackdrop = croqui_fecharModalOnBackdrop;
window.croqui_filtrarIcones = croqui_filtrarIcones;
window.croqui_inserirIcone = croqui_inserirIcone;
window.croqui_inserirSvg = croqui_inserirSvg;
window.croqui_limpar = croqui_limpar;
window.croqui_exportar = croqui_exportar;
window.croqui_whatsapp = croqui_whatsapp;
window.croqui_init = croqui_init;
window.croqui_girar = croqui_girar;
window.croqui_espelhar = croqui_espelhar;

document.addEventListener('DOMContentLoaded', croqui_init);
