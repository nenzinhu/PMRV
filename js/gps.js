/**
 * Lógica de GPS para identificação de Rodovia e KM (PMRv)
 * Focada em Florianópolis, São José e Biguaçu
 */

const GPS_RODOVIAS = {
    "SC-401": [
        { km: 0, lat: -27.581512, lng: -48.513470 }, // Início Itacorubi
        { km: 1.5, lat: -27.568200, lng: -48.511800 }, // Subida do Cemitério
        { km: 3.2, lat: -27.551500, lng: -48.504200 }, // João Paulo
        { km: 5.8, lat: -27.528500, lng: -48.498500 }, // Monte Verde
        { km: 7.5, lat: -27.514000, lng: -48.495000 }, // Saco Grande (SC401 Square)
        { km: 10.2, lat: -27.491500, lng: -48.489500 }, // Cacupé / Santo Antônio
        { km: 13.5, lat: -27.466000, lng: -48.485500 }, // Ratones / Vargem Pequena
        { km: 16.2, lat: -27.447500, lng: -48.474500 }, // Vargem Grande
        { km: 19.3, lat: -27.434800, lng: -48.463500 }  // Canasvieiras (Trevo)
    ],
    "SC-405": [
        { km: 0, lat: -27.632100, lng: -48.514500 }, // Trevo da Seta
        { km: 1.2, lat: -27.643000, lng: -48.508000 }, // Ressacada
        { km: 2.8, lat: -27.656500, lng: -48.497500 }, // Rio Tavares (Trevo Erasmo)
        { km: 4.5, lat: -27.671000, lng: -48.489500 }  // Sentido Campeche
    ],
    "SC-406": [
        { km: 0, lat: -27.595000, lng: -48.438000 }, // Barra da Lagoa
        { km: 5.2, lat: -27.561000, lng: -48.423000 }, // Rio Vermelho (Início)
        { km: 10.5, lat: -27.521000, lng: -48.412000 }, // Rio Vermelho (Meio)
        { km: 15.8, lat: -27.485500, lng: -48.428500 }, // Ingleses (Muquém)
        { km: 21.0, lat: -27.448000, lng: -48.455500 }  // Santinho / Ingleses
    ],
    "SC-407": [
        { km: 0, lat: -27.494800, lng: -48.658200 }, // Biguaçu (Centro/BR-101)
        { km: 5.5, lat: -27.502000, lng: -48.711000 }, // Biguaçu (Interior)
        { km: 12.0, lat: -27.515500, lng: -48.775000 }  // Antônio Carlos
    ],
    "SC-281": [
        { km: 0, lat: -27.614500, lng: -48.636500 }, // São José (Continente Shopping/BR-101)
        { km: 4.2, lat: -27.605500, lng: -48.674500 }, // Picadas do Sul
        { km: 8.5, lat: -27.595500, lng: -48.718500 }, // Sertão do Maruim
        { km: 15.0, lat: -27.581500, lng: -48.783500 }, // São Pedro de Alcântara (Início)
        { km: 20.0, lat: -27.565500, lng: -48.835000 }  // São Pedro de Alcântara (Centro)
    ]
};

function gps_obterLocalizacao() {
    if (!navigator.geolocation) {
        alert("GPS não suportado pelo seu dispositivo.");
        return;
    }

    // Tentar identificar qual botão disparou a ação para dar feedback
    const btnHome = document.querySelector('.btn-gps-minimal[data-click="gps_obterLocalizacao()"]');
    const btnForm = document.getElementById('btn-gps-localizar');
    const activeBtn = btnForm || btnHome;
    
    let originalText = "";
    if (activeBtn) {
        originalText = activeBtn.innerHTML;
        activeBtn.innerHTML = '⌛ Localizando...';
        activeBtn.disabled = true;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            console.log(`GPS: Lat ${latitude}, Lng ${longitude}, Precisão ${accuracy}m`);

            const resultado = gps_identificarRodoviaKM(latitude, longitude);
            
            if (resultado) {
                const rodoviaEl = document.getElementById('pmrv_rodovia');
                const kmEl = document.getElementById('pmrv_km');
                
                // Formatar KM com 3 casas (ex: 12,200)
                const kmStr = resultado.km.toFixed(3).replace('.', ',');

                if (rodoviaEl) {
                    rodoviaEl.value = resultado.rodovia;
                    if (typeof pmrv_verificarRodovia === 'function') pmrv_verificarRodovia();
                }
                if (kmEl) {
                    kmEl.value = kmStr;
                    if (typeof pmrv_atualizar === 'function') pmrv_atualizar();
                }

                alert(`📍 Localização Identificada!\n\n🛣️ Rodovia: ${resultado.rodovia}\n🏁 KM: ${kmStr}\n\n🎯 Precisão: ${accuracy.toFixed(0)} metros.`);
            } else {
                alert(`Você está em:\nLat: ${latitude.toFixed(5)}\nLng: ${longitude.toFixed(5)}\n\nNenhuma rodovia estadual de SC foi identificada num raio de 1km.`);
            }

            if (activeBtn) {
                activeBtn.innerHTML = originalText;
                activeBtn.disabled = false;
            }
        },
        (err) => {
            let msg = "Erro ao obter GPS";
            if (err.code === 1) msg = "Permissão de GPS negada pelo usuário.";
            else if (err.code === 2) msg = "Posição indisponível (verifique se o GPS está ligado).";
            else if (err.code === 3) msg = "Tempo esgotado ao tentar obter localização.";
            
            alert(msg + " (" + err.message + ")");
            if (activeBtn) {
                activeBtn.innerHTML = originalText;
                activeBtn.disabled = false;
            }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

/**
 * Identifica a rodovia e interpola o KM baseado nas coordenadas
 */
function gps_identificarRodoviaKM(lat, lng) {
    let melhorRodovia = null;
    let melhorKm = 0;
    let menorDistancia = Infinity;

    // Tentar primeiro nos dados de SC (mapeamento completo)
    const bancoRodovias = window.GPS_RODOVIAS_SC || GPS_RODOVIAS;

    for (const rodovia in bancoRodovias) {
        const pontos = bancoRodovias[rodovia];
        
        for (let i = 0; i < pontos.length - 1; i++) {
            const p1 = pontos[i];
            const p2 = pontos[i+1];

            // Ponto projetado na reta entre p1 e p2
            const projetado = gps_projetarPonto(lat, lng, p1.lat, p1.lng, p2.lat, p2.lng);
            const dist = gps_distancia(lat, lng, projetado.lat, projetado.lng);

            if (dist < menorDistancia) {
                menorDistancia = dist;
                melhorRodovia = rodovia;
                
                // Cálculo do KM por interpolação linear entre os dois pontos de referência
                const d12 = gps_distancia(p1.lat, p1.lng, p2.lat, p2.lng);
                const d1p = gps_distancia(p1.lat, p1.lng, projetado.lat, projetado.lng);
                
                // Evitar divisão por zero se p1 e p2 forem iguais
                const proporcao = d12 > 0 ? (d1p / d12) : 0;
                melhorKm = p1.km + (p2.km - p1.km) * proporcao;
            }
        }
    }

    // Limite de 1.0 km para considerar que o usuário está na rodovia
    if (menorDistancia < 1.0) {
        return { rodovia: melhorRodovia, km: melhorKm };
    }
    return null;
}

/**
 * Distância entre dois pontos (Haversine) em KM
 */
function gps_distancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Projeta o ponto P no segmento de reta AB
 */
function gps_projetarPonto(px, py, ax, ay, bx, by) {
    const r2 = (bx-ax)*(bx-ax) + (by-ay)*(by-ay);
    if (r2 === 0) return { lat: ax, lng: ay };
    let t = ((px-ax)*(bx-ax) + (py-ay)*(by-ay)) / r2;
    t = Math.max(0, Math.min(1, t));
    return {
        lat: ax + t * (bx-ax),
        lng: ay + t * (by-ay)
    };
}

/**
 * Fun��o de TESTE: Simula uma localiza��o em uma das rodovias para fins de demonstra��o.
 */
function gps_simularLocalizacao() {
    // Lista de pontos de teste (Pontos reais nas rodovias mapeadas)
    const pontosTeste = [
        { lat: -27.5000, lng: -48.4900, msg: 'Simulando SC-401 KM 10.2 (Saco Grande)' },
        { lat: -27.6550, lng: -48.4980, msg: 'Simulando SC-405 KM 2.8 (Rio Tavares)' },
        { lat: -27.5955, lng: -48.7185, msg: 'Simulando SC-281 KM 8.5 (Sert�o do Maruim)' },
        { lat: -27.4948, lng: -48.6582, msg: 'Simulando SC-407 KM 0.0 (Bigua�u Centro)' }
    ];

    // Escolhe um ponto aleat�rio
    const ponto = pontosTeste[Math.floor(Math.random() * pontosTeste.length)];
    
    console.log('--- MODO TESTE ATIVADO ---');
    console.log(ponto.msg);

    const resultado = gps_identificarRodoviaKM(ponto.lat, ponto.lng);
    
    if (resultado) {
        // Preencher campos no formul�rio PMRv
        const rodoviaEl = document.getElementById('pmrv_rodovia');
        const kmEl = document.getElementById('pmrv_km');
        const localPatEl = document.getElementById('pat_local');
        
        if (rodoviaEl) {
            rodoviaEl.value = resultado.rodovia;
            if (typeof pmrv_verificarRodovia === 'function') pmrv_verificarRodovia();
        }
        if (kmEl) {
            kmEl.value = resultado.km.toFixed(3).replace('.', ',');
            if (typeof pmrv_atualizar === 'function') pmrv_atualizar();
        }
        if (localPatEl) {
            localPatEl.value = resultado.rodovia + ', KM ' + resultado.km.toFixed(1);
        }

        alert('?? MODO TESTE / SIMULAO\n\n' + ponto.msg + '\n\nRodovia: ' + resultado.rodovia + '\nKM: ' + resultado.km.toFixed(3));
        }
        }

        /**
        * Preenche os selects de rodovias do sistema com os dados carregados de SC.
        */
        function gps_preencherSelects() {
        const banco = window.GPS_RODOVIAS_SC;
        if (!banco) return;

        const selectIds = ['pmrv_rodovia', 'pat_manual_rodovia'];
        const rodovias = Object.keys(banco).sort();

        selectIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // Limpar opções atuais (mantendo apenas as essenciais se necessário)
        el.innerHTML = '';

        rodovias.forEach(rod => {
            const opt = document.createElement('option');
            opt.value = rod;
            opt.textContent = rod;
            el.appendChild(opt);
        });

        // Adicionar opção "OUTRA" se for o select de patrulhamento
        if (id === 'pat_manual_rodovia') {
            const optOutra = document.createElement('option');
            optOutra.value = 'OUTRA';
            optOutra.textContent = '✏️ Outra...';
            el.appendChild(optOutra);
        }
        });
        }

