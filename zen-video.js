/* ═══════════════════════════════════════════════════════════════════════
   ZEN VIDEO BACKGROUND — Caravela HUB
   ═══════════════════════════════════════════════════════════════════════
   Sistema de fundo em vídeo (YouTube, sem UI) + carrossel de ambientes.

   ARQUITECTURA
   ───────────
   • Botão zen (extrema esquerda dos Sound Buttons, à esquerda do Vento).
     ÍCONE DEFAULT (v10): SVG minimalista — símbolo de PLAY no centro
     com um ARCO ORBITAL de ~1/3 da circunferência à volta (ver
     ICONS.default), desenhado na linguagem dos ícones de som ambiente
     (o PNG oficial Icone_Videos.png foi substituído a pedido — mantido
     em public/hub/ como backup histórico). O botão mostra SEMPRE o
     ícone da opção SELECCIONADA.
   • Carrossel (hover): minimalista, SEM background, apenas 2 ícones
     visíveis — o SELECCIONADO (centro = o próprio botão, com zoom) e
     o SUPERIOR (próxima opção, 40px acima):
     – scroll ↓  → o carrossel é puxado para baixo e a opção de CIMA
       fica seleccionada no centro (v12: PRÉ-VISUALIZAÇÃO apenas — ver
       "SELECÇÃO EM DOIS PASSOS" abaixo; já não muda o vídeo)
     – scroll ↑  → inverso
     – clique na opção superior → selecciona-a directamente (mesma
       pré-visualização do scroll — também não activa nada)
     – hover na opção superior → highlight
     – o CENTRO não é clicável (pointer-events:none): os cliques vão
       ao BOTÃO por baixo — é ESSE clique que CONFIRMA a selecção e
       activa o vídeo (ver "SELECÇÃO EM DOIS PASSOS" abaixo)
   • SELECÇÃO EM DOIS PASSOS (v12 — motivo: o Firefox só concede
     "activação do utilizador" a gestos como o clique, NUNCA a wheel/
     scroll; era por isso que o pedido de reprodução falhava
     especificamente no Firefox quando a selecção pelo carrossel
     activava logo o vídeo — o comando partia de um evento que o
     Firefox não reconhece como gesto válido). Agora: scroll/clique
     num item do carrossel SÓ move a selecção — nenhum comando de
     vídeo é emitido (selectOption já não chama activateOption/
     deactivateZen); a activação exige sempre um SEGUNDO gesto — um
     CLIQUE na opção JÁ seleccionada (cai no botão, como sempre, e o
     activateOption desse handler corre SÍNCRONO dentro do clique).
     Fechar o carrossel (mouse sai) sem esse clique de confirmação
     repõe a selecção na opção REALMENTE activa (o vídeo a tocar, se
     houver; a opção default, se não houver nada a tocar) — ver
     closeCarousel().
   • Fecho do carrossel (mouse sai, período de graça de 320ms — o dobro
     do anterior, para um fecho mais confortável):
     – com vídeo activo → MODO VÍDEO (body.zen-video-mode): o Main Hub
       Container desvanece com fade + leve escala + blur (~1.15s,
       suave e profissional — ver "6a" no zen-video.css); os botões de
       som ambiente passam para a coluna esquerda (#zenAmbientDock,
       popups horizontais) SÓ enquanto o hub está escondido — se o olho
       mostrar o hub, voltam à UI principal (fonte de verdade: classes
       do body + MutationObserver); olho "activado"
       (passa a mostrar/esconder APENAS o Main Hub); troca de fundo
       passa a trocar o VÍDEO.
     – sem vídeo activo → nada acontece.
   • ANTI-UI DO YOUTUBE (pré-roll fixo de 3,5s): a UI transitória do
     player (botão de play + escurecimento) só existe em estados
     NÃO-PLAYING (poster/carga, pausa, ecrã final) — mas pode persistir
     por uns instantes MESMO DEPOIS do evento PLAYING disparar. Por
     isso, em vez de revelar no instante do PLAYING, o sistema faz
     SEMPRE um pré-roll: o vídeo novo carrega e começa a TOCAR num slot
     INVISÍVEL (cover opacity 0) e MUDO — e só PRE_ROLL_MS (3500ms)
     DEPOIS do PLAYING é que a transição de revelação (crossfade do
     vídeo + fade-in do som, em conjunto) arranca. Este pré-roll é
     UNIFICADO: cobre os 3 pontos onde a UI do YouTube podia aparecer —
     1) selecção de uma categoria pela 1ª vez (vídeo entra por baixo do
        fundo estático normal do site);
     2) troca manual de vídeo pelo botão da UI (vídeo entra por baixo
        do vídeo anterior, que continua visível/a tocar sem interrupção);
     3) troca automática quando um vídeo termina (ENDED → mesmo
        mecanismo do caso 2, via playNextVideo).
     Os 3 casos passam todos pelo MESMO ponto: onState() no evento
     PLAYING → ver PRE_ROLL_MS abaixo. Durante o pré-roll o cover está
     sempre invisível (opacity:0) e o player sempre mudo — nada disto
     é visível/audível; ao fim do pré-roll, o crossfade CSS existente
     (0.9s/1.2s ease-in-out) e o fade-in de áudio (fadeInAudio) tratam
     da transição em si, sem alterações — só o MOMENTO em que arrancam
     é que muda.
   • SINCRONIZAÇÃO UI ↔ VÍDEO ("timer" da selecção): a UI (Main Hub)
     só se esconde DEPOIS do vídeo da selecção estar revelado — nunca
     antes, nunca com um "vazio" (hub escondido + ecrã parado). Como
     o pré-roll é sempre ≥3,5s, a UI nunca desaparece antes de esse
     tempo ter passado; e como o gatilho é a REVELAÇÃO real (não um
     timer cego), o vídeo entra e o hub desvanece NO MESMO instante
     (cinemático). Se o rato ainda estiver no carrossel quando a
     revelação chega, o comportamento mantém-se NORMAL: a UI só se
     esconde quando o carrossel fechar (requestEngage/engagePending/
     readyToEngage).
   • ÍCONE DE PAUSA NO HOVER (armado APÓS o 1.º fecho da UI): depois
     de o utilizador sair do carrossel e a UI se esconder pela 1.ª
     vez (engageVideoMode → pauseHintArmed), passar o rato no botão
     zen com um vídeo em reprodução mostra o ÍCONE CLÁSSICO DE PAUSA
     (quadrado cheio com duas barras vazias) no CENTRO do carrossel —
     sinal de que o clique vai PARAR o vídeo. O clique desliga o vídeo
     E REPÕE A SELECÇÃO NO DEFAULT (o botão volta ao ícone oficial,
     em vez de ficar "parado" no ícone da categoria em forma
     desactivada). O armar tardio garante que a pausa NUNCA substitui
     a roda durante a animação de espera (pré-roll) nem durante o 1.º
     ciclo de fecho.
   • FEEDBACK DE ESPERA (ícone — por opção, loadingAnim): a RODA do
     driving gira CONTINUAMENTE durante toda a espera — burst de 0,9s
     (feedback da selecção) + loop calmo; a PSP do jogos é "CLICADA
     DE LADO" com o polegar (1 clique forte à esquerda + 2 cliques à
     direita, volta ao normal e repete — ver zenPspTap no CSS); a
     CABEÇA HAZMAT do horror TREME e PISCA os olhos assustados (treme,
     pisca ×2, treme, pisca ×1, repete — ver zenHazmatShake/
     zenHazmatBlink); o BURACO NEGRO do espaço FLUTUA com o anel de
     acreção a RODAR (ver zenBlackholeFloat/zenBlackholeSpin); e as
     CHAMAS da lareira BAILAM (a chama exterior inclina-se para cada
     lado desde a base + o núcleo respira em contrafase — ver
     zenFireFlicker/zenFirePulse). Todas PÁRAM quando o vídeo se
     revela (stopWheel no becomeActive; também na desactivação) — e
     (v11) REVERTEM SUAVE até à pose inicial (wind-down: a pose actual
     é capturada como matriz e reanimada até 'none' — nunca um corte
     a meio do ciclo). A animação É o indicador de "a carregar".
     – o vídeo NOVO carrega num slot INVISÍVEL (cover opacity 0) e é
       revelado por crossfade PRE_ROLL_MS depois do PLAYING — áudio e
       vídeo entram JUNTOS nesse momento (sem desync);
     – o vídeo ANTERIOR NUNCA é pausado à vista: continua a TOCAR
       por baixo (áudio em fade-out rápido, ~350ms) até o novo o
       tapar por completo (crossfade sempre POR CIMA, z-index); só
       então pára — já invisível → ZERO UI de pausa/play em qualquer
       troca (arranque, carrossel, shuffle, ENDED);
     – vídeo termina (ENDED): em vez de congelar em pausa (que
       mostraria a UI), regressa ao INÍCIO e continua MUDO (loop
       silencioso — sem ecrã final, sem pausa, sem flash) enquanto
       o próximo vídeo carrega no outro slot.
   • Troca de vídeo (shuffle no modo vídeo): o vídeo actual CONTINUA
     a tocar (sem pausa!) enquanto o próximo carrega — a transição
     só acontece quando o próximo está a tocar.
   • BOTÕES AMBIENTE (chuva/secador/vento): os ORIGINAIS ficam SEMPRE
     na UI principal — desvanecem NATURALMENTE com o hub (nunca são
     arrancados em bloco); o dock (canto superior esquerdo) usa CLONES
     criados no 1.º modo vídeo: clique/volume são reencaminhados para
     os originais e o estado (classes sound-on, volume) é espelhado em
     tempo real (MutationObserver) — uma única fonte de verdade.
   • NIGHT MODE no dock: botão de lua monocromática (mesmo estilo dos
     ícones da aba de UI buttons), directamente abaixo do vento; só é
     visível em modo vídeo com o hub escondido (regras do dock). O
     clique é reencaminhado para o moonBtn original (main.js: tema,
     estrelas, cometas, localStorage) e o estado activo espelha a
     classe night-mode do body.
   • Som do vídeo (v14 — IGUAL em todos os browsers, ver STRICT_AUDIO no
     código): LIGADO por defeito, entra com FADE-IN suave (0 → volume,
     ~2s na 1.ª activação). Isto já foi POLÍTICA POR BROWSER: o Firefox
     arrancava sempre mudo, porque desmutar programaticamente FORA de um
     gesto faz o Firefox PAUSAR o vídeo a meio ("o vídeo fica parado no
     Firefox") — e a activação antiga nascia de um scroll no carrossel,
     sem clique nenhum. Desde que a activação passou a exigir um CLIQUE
     de confirmação (ver "SELECÇÃO EM DOIS PASSOS"), esse clique É o
     gesto que falta: o pedido de som corre SÍNCRONO dentro dele (mesma
     técnica do wantSound em switchVideo/loadVideoInto), por isso deixou
     de ser preciso mutar o Firefox à partida. Se o browser mesmo assim
     bloquear o unmute programático, o 1.º gesto seguinte (clique/tecla/
     scroll) retoma o áudio com o mesmo fade. Espírito do resto do hub:
     tudo por gesto.
     HINT DE SOM (Firefox): enquanto o utilizador NUNCA tiver clicado no
     botão de som/mute (marca PERSISTENTE em localStorage — sobrevive a
     refreshes), o ícone PULSA suavemente em VERMELHO sempre que fica
     visível no modo vídeo ("podes ligar o som"); o 1.º clique apaga a
     pulsação PARA SEMPRE. Em Chromium a classe nunca é aplicada.

   VÍDEOS (YouTube IFrame API)
   ───────────────────────────
   • COMPATIBILIDADE FIREFOX (3 camadas, ver secção própria no código):
     (1) o iframe gerado ganha SEMPRE allow="autoplay; encrypted-media…"
     — sem a delegação explícita da permissão o Firefox recusa
     reprodução programática dentro do iframe;
     (2) a API e o 1.º player são PRÉ-CARREGADOS no arranque da página
     (SEM tocar, SEM som) → o comando de reprodução do 1.º clique corre
     SINCRONO dentro do próprio gesto do utilizador; enfileirar a
     chamada para depois do onReady (a cadeia assíncrona download da
     API → criação do iframe → handshake) perde a ligação ao gesto — o
     motivo nº 1 de "o vídeo fica parado" no Firefox;
     (3) STRICT_AUDIO (v14): já não muda o DEFAULT do som — só continua
     a decidir COMO o som liga: nunca por um unMute() tardio/assíncrono
     fora de gesto (isso é que pausaria o vídeo), sempre por um pedido
     síncrono dentro de um clique real (activação ou troca) — ver
     wantSound em loadVideoInto/createPlayer/becomeActive.
     Browsers Chromium: comportamento INALTERADO (e a 1.ª activação
     fica ainda mais rápida graças à pré-carga).
   • Cada switch REUTILIZA o iframe via loadVideoById (rápido).
   • QUEUE DE VÍDEOS (v11): cada ACTIVAÇÃO embaralha os vídeos da
     categoria numa QUEUE aleatória (o vídeo inicial continua
     aleatório); a partir daí TODOS os avanços (botão de troca, ENDED
     automático, retentativas de falha) seguem a QUEUE POR ORDEM —
     nunca repetem um vídeo já mostrado até a queue dar a volta e
     regressar ao primeiro (fim da queue → ciclo). Nova activação →
     nova aleatoriedade. Se um vídeo falhar, é saltado (failedIds).
   • O slot escondido é sempre stopVideo() (poupa largura de banda).
   • QUALIDADE ADAPTATIVA (v10 — ver secção própria no código): o
     sistema pede SEMPRE a melhor qualidade disponível do vídeo e
     vigia silenciosamente a rede durante a reprodução; congestionamento
     real → fixa 1080p (o PISO — nunca abaixo, enquanto o vídeo tiver
     1080p) e volta a tentar o máximo passados 120s limpos.
   • VERIFICAÇÃO DE VÍDEOS (v10 — menu admin "Leo", botão "Verify All
     Videos"): testa a conectividade de TODOS os vídeos de TODAS as
     categorias em mini-players ocultos; falhas → relatório .txt
     organizado (categoria · título · link · motivo) descarregado
     automaticamente; tudo bem → mensagem simples.

   ═══ COMO ADICIONAR VÍDEOS / NOVAS OPÇÕES ═══
   Na lista ZEN_OPTIONS abaixo:
   • Novo vídeo:    { id: 'ID_DO_YOUTUBE', start: 123, end: 456,
                      ads: true, alt: 'ID_ALTERNATIVA' }
       – id    : parte de https://youtu.be/ID_DO_YOUTUBE
       – start : segundo onde COMEÇAR (opcional)  ex.: 1:09 → 69
       – end   : segundo onde TERMINAR (opcional) ex.: 7:43 → 463
       – ads   : true se o vídeo TEM anúncio (opcional — sem a chave
                 assume-se SEM anúncio; etiquetas do Quintas)
       – alt   : ID da alternativa de baixa qualidade (opcional) — o
                 MESMO vídeo re-carregado, NÃO LISTADO e sem anúncios,
                 no canal do Quintas (compressão dupla). Quem NÃO tem
                 adblock/Brave vê ESSA versão; quem tem, vê o
                 original. Os start/end aplicam-se IGUAL à
                 alternativa (é o mesmo vídeo). Ver zen-ads.js (v16).
   • Nova opção: bloco { id, name, titleKey, functional: true, hasAudio,
     loadingAnim, videos: [...] } + ícone SVG (ICONS) + chaves i18n
     (zenOptX no i18n.js, EN e PT). loadingAnim (opcional): 'wheel'
     (roda a girar), 'psp' (consola clicada de lado), 'hazmat' (cabeça
     que treme e pisca), 'blackhole' (flutua + anel a rodar) ou 'fire'
     (chamas a bailar — troncos parados) — a animação de espera do
     ícone durante o carregamento do vídeo; TODAS param com wind-down
     (revertem suave até à pose inicial na revelação — v11). A opção
     'default' (índice 0) é o website normal.
   ═══════════════════════════════════════════════════════════════════ */
(function() {
'use strict';

// ═════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO — OPÇÕES DE AMBIENTE (índice 0 = default/website normal)
// ═════════════════════════════════════════════════════════════════
const ZEN_OPTIONS = [
    {
        id: 'default',
        name: 'Default',
        titleKey: 'zenOptDefault',
        functional: false,
        videos: []
    },
    {
        id: 'driving',
        name: 'Driving',
        titleKey: 'zenOptDriving',
        functional: true,
        hasAudio: true,
        loadingAnim: 'wheel',   // RODA a girar durante a espera
        videos: [
            // (v16 · DUAS FACES — etiquetas REAIS do Quintas, 2026-09)
            // ads:true + alt → quem não tem adblock/Brave vê a
            // ALTERNATIVA (re-upload sem anúncios); ads:true sem alt →
            // fica fora da queue dessa face; sem ads → toca sempre o
            // original. Quem tem adblock/Brave vê sempre o ORIGINAL.
            // Ver zen-ads.js.
            { id: 'DatF_me_MFs', end: 463, ads: true, alt: 'B5nJtZKGbkE' },   // termina no minuto 7:43
            { id: 'gziLSxmaQks', end: 1250, ads: true, alt: 'iarN-UlG9k4' },  // termina no minuto 20:50
            { id: 'iuhXwVNdz4w', start: 69, ads: true },   // começa no minuto 1:09
            { id: 'c7Dpmg-PI4c', ads: true },              // completo
            { id: 'wmLGG5DYDWQ', end: 1571, ads: true, alt: 'GbgNFqLk0Es' },  // termina no minuto 26:11
            { id: 'iEzhkRQYJnk', ads: true, alt: 'FX3hnOJ3t3g' },             // completo (v9)
            { id: '8BB3CBx_yQU' },                        // completo (v10) — SEM anúncio
        ]
    },
    // JOGOS — categoria de gameplay (v9). Fica imediatamente A SEGUIR ao
    // Driving no carrossel (a PSP substitui o ícone que vinha nessa
    // posição — as restantes categorias descem um lugar). Animação de
    // espera: a PSP é "clicada" de lado com o polegar (ver .zen-psp-
    // group.spinning no zen-video.css).
    {
        id: 'games',
        name: 'Games',        // nome nativo EN (o PT vem via i18n zenOptGames)
        titleKey: 'zenOptGames',
        functional: true,
        hasAudio: true,
        loadingAnim: 'psp',     // PSP "tocada" de lado durante a espera
        videos: [
            { id: 'l1jxQl_U6R4', ads: true, alt: '_FvG3SGGWwQ' },             // completo
            { id: '0J55aRPrgOM', ads: true },               // completo
            { id: 'JWmL0M9wirs', start: 98, ads: true, alt: 'NMhQ1hSeSuA' },   // começa no minuto 1:38
            { id: 'XsaXfkpKPNM', start: 100, ads: true, alt: 'yL_OQTqT-FQ' },  // começa no minuto 1:40 (v11)
            { id: 'BseoafAH22k', ads: true, alt: 'csBWH8CSxek' },              // completo
            { id: 'kNlBSuTOSpY', ads: true },               // completo (v11)
        ]
    },
    // HORROR — categoria de terror (v10). SUBSTITUI o placeholder
    // "Ocean Waves" que ocupava esta posição (a opção ACIMA da
    // categoria de jogos no anel do carrossel — os placeholders vão
    // sendo substituídos por categorias reais à medida que o Quintas
    // as prepara; o desenho das waves está guardado na referência
    // para reposição futura). Animação de espera: a cabeça hazmat
    // TREME e PISCA os olhos assustados (ver .zen-hazmat-group
    // .spinning no zen-video.css).
    {
        id: 'horror',
        name: 'Horror',        // nome nativo EN (o PT vem via i18n zenOptHorror)
        titleKey: 'zenOptHorror',
        functional: true,
        hasAudio: true,
        loadingAnim: 'hazmat',   // cabeça a tremer + olhos a piscar
        videos: [
            { id: 'fZd6edx6ghQ', ads: true, alt: '50EPocTwNjA' },              // completo
            { id: 'h2RcW1tO-zQ', start: 32, ads: true },    // começa em 0:32
            { id: '70_SAcUuBbY', start: 265, ads: true },   // começa em 4:25
            { id: 'HACelcYTwU4', start: 68, end: 11261, ads: true },   // 1:08 → 3:07:41
        ]
    },
    // ESPAÇO — categoria de cosmos (v10). SUBSTITUI o placeholder
    // "Fireplace" que ocupava esta posição (a opção ACIMA do horror
    // no anel — mesma regra de substituição; desenho guardado na
    // referência). Animação de espera: o buraco negro FLUTUA e o
    // anel de acreção RODA (ver .zen-blackhole-group .spinning no
    // zen-video.css).
    {
        id: 'space',
        name: 'Space',         // nome nativo EN (o PT vem via i18n zenOptSpace)
        titleKey: 'zenOptSpace',
        functional: true,
        hasAudio: true,
        loadingAnim: 'blackhole',  // flutuar + anel de acreção a rodar
        videos: [
            // (v16) SEM alternativas por agora (limite de 24h de upload
            // do YouTube) → na face desprotegida a categoria fica
            // ESCONDIDA do carrossel até haver re-uploads (as etiquetas
            // chegam, o filtro actualiza-se sozinho — sem mudar código)
            { id: '8fhTHBh_iqk', ads: true },               // completo
            { id: 'wnhvanMdx4s', ads: true },               // completo
        ]
    },
    // LAREIRA — categoria de fogueira/lareira (v11). SUBSTITUI o ÚLTIMO
    // placeholder do carrossel ("Starry Skies" — a chave i18n zenOptSkies
    // fica guardada, como as waves, para reactivação futura): TODOS os 6
    // slots do anel são agora categorias REAIS. Animação de espera: as
    // CHAMAS da fogueira MEXEM-SE (bailam a partir da base onde assentam
    // nos troncos — zenFireFlicker/zenFirePulse; os troncos ficam
    // parados — ver .zen-fire-group .spinning no zen-video.css).
    {
        id: 'fireplace',
        name: 'Fireplace',   // nome nativo EN (o PT vem via i18n zenOptFire)
        titleKey: 'zenOptFire',
        functional: true,
        hasAudio: true,
        loadingAnim: 'fire',  // chamas a bailar durante a espera
        videos: [
            // (v16) SEM alternativas por agora — categoria escondida na
            // face desprotegida (mesma razão do Space acima)
            { id: 'Ux8xAuQBdkk', ads: true },               // completo
            { id: 'FJz0jEmoNAQ', ads: true },               // completo
            { id: 'VZBlOqt6cB4', ads: true },               // completo
            { id: '1ieNfIk3Ruo', ads: true },               // completo
        ]
    },
];
const DEFAULT_ID = 'default';
// (v10) O ícone default passou a SVG (ICONS.default — play + arco
// orbital). O antigo PNG oficial Icone_Videos.png permanece em
// public/hub/ como backup histórico (não é mais referenciado).

// Timings (ms) — afinados para um feel suave/profissional
const CLOSE_DELAY   = 320;   // período de graça do fecho do carrossel
                             // (o dobro do valor anterior, a pedido)
const FADE_OUT_MS   = 350;   // fade-out do áudio do vídeo ANTIGO quando
                             // o novo o substitui (handoff suave)
const HIDE_OLD_MS   = 1000;  // o antigo só perde .visible DEPOIS de o novo
                             // estar opaco (crossfade CSS 0.9s + margem)
const STOP_OLD_MS   = 1400;  // stopVideo do antigo (já invisível/tapado)
const FADE_FIRST_MS = 2200;  // fade-in do áudio na 1.ª activação
const FADE_SWAP_MS  = 1200;  // fade-in do áudio nas trocas de vídeo
const PRE_ROLL_MS   = 3500;  // ANTI-UI: tempo fixo que o vídeo novo passa
                             // a TOCAR, MUDO e INVISÍVEL, antes da
                             // transição de revelação arrancar (cobre os
                             // 3 casos — ver "ANTI-UI DO YOUTUBE" no topo
                             // do ficheiro). É também o tempo mínimo que
                             // a UI aguarda antes de se esconder (ver
                             // requestEngage) e durante o qual a roda do
                             // ícone gira (spinWheel/stopWheel).
                             // Ajustável se necessário.
const API_LOAD_TIMEOUT = 20000; // Rede de segurança da API do YouTube:
                             // se o script iframe_api não carregar DE TODO
                             // (rede cortada / bloqueador), o callback do
                             // loadYTApi nunca corre — sem isto a roda
                             // (agora em loop infinito) giraria ETERNAMENTE
                             // e o zen ficaria "ligado" sem vídeo. Aos 20s
                             // desliga limpo (fade + roda parada), como o
                             // ciclo de >5 erros de vídeo. (Subido de 12s:
                             // em produção — domínio público real, fora do
                             // servidor local — o handshake do iframe do
                             // YouTube fica sujeito a Enhanced Tracking
                             // Prevention / bloqueio de cookies de
                             // terceiros, que o localhost normalmente não
                             // aplica; 12s estava a disparar falsos
                             // positivos nesse cenário.)
const STALL_CHECK_MS = 6000; // 1ª fase do timer do slot (ver armSlotTimer,
                             // abaixo): se o player não der NENHUM sinal
                             // de vida (nem onReady nem qualquer
                             // onStateChange) neste tempo, está quase de
                             // certeza BLOQUEADO — não apenas lento — e
                             // falha-se já. É ISTO que reduz o delay a
                             // sério: quando o problema é sistémico
                             // (bloqueio, não rede lenta), 5 tentativas
                             // custam ~5×6s em vez de 5×SLOT_TIMEOUT_MS.
const SLOT_TIMEOUT_MS = 25000; // 2ª fase: só se chega aqui quando o player
                             // JÁ deu sinal de vida (está mesmo a
                             // carregar/bufferizar) mas ainda não tocou —
                             // aí sim vale a pena dar-lhe o tempo todo,
                             // porque é rede lenta a sério.

// ═══ POLÍTICA DE ÁUDIO POR BROWSER (compatibilidade Firefox) ═══
// O Firefox é rígido onde o Chromium é tolerante: desmutar PROGRA-
// MATICAMENTE um player YouTube em autoplay muted FORA da janela de
// gesto do utilizador faz o Firefox PAUSAR o vídeo — era exactamente
// o bug "o vídeo fica parado no Firefox" (o becomeActive desmutava
// ~4-5s depois do clique, já fora do gesto). Nesses browsers o som do
// vídeo arranca SEMPRE mudo (botão de som desligado, como os restantes
// botões de som ambiente do hub) e liga APENAS por clique no botão de
// som — o unmute síncrono DENTRO do handler do clique é sempre aceite
// por qualquer browser. Em browsers Chromium (Chrome/Edge/Brave/…) o
// comportamento mantém-se EXACTAMENTE o actual: som LIGADO por
// defeito com fade-in na revelação. Nota: browsers WebKit (Safari)
// têm política semelhante ao Firefox — se algum dia for preciso,
// basta acrescentar o teste de UA aqui.
// TROCAS DE VÍDEO com som já ligado (v13 — bug do bgShuffleBtn no
// Firefox): quando a troca é uma chamada directa a switchVideo()
// (clique real no botão de trocar fundo — ver window._zenCtrl.next em
// main.js), o vídeo novo é pedido JÁ SEM MUTE logo na construção/
// loadVideoById, ainda dentro desse gesto síncrono — em vez de nascer
// mudo à espera de um gesto futuro. Isto elimina o desync em que o
// botão de som mostrava "ligado" mas o vídeo ficava mudo até o
// utilizador clicar em qualquer lado da página. Quando a troca NÃO
// vem de um clique (avanço automático ao ENDED, recuperação de falha),
// mantém-se o comportamento seguro de sempre: entra mudo e o 1.º gesto
// do utilizador (clique/tecla/scroll — listener de fallback) retoma-o
// com fade — o vídeo NUNCA pára.
const UA = navigator.userAgent || '';
const STRICT_AUDIO = /firefox/i.test(UA);   // Firefox e forks (Gecko)

// ═════════════════════════════════════════════════════════════════
// ÍCONES SVG (fragmentos internos do <svg viewBox="0 0 24 24">)
// (v10) TODAS as opções têm SVG — incluindo a default (o antigo PNG
// oficial foi substituído pelo play + arco orbital, a pedido).
// ═════════════════════════════════════════════════════════════════
const ICONS = {
    // ÍCONE DEFAULT (v10) — botão de reprodução de vídeos de fundo:
    // minimalista — um símbolo de PLAY sólido no centro com um ARCO
    // ORBITAL de ~120° (33% da circunferência total) à volta, do topo
    // (12h) no sentido dos ponteiros até às 4h — a linguagem de um
    // progress ring de reprodução. Desenhado para viver em par com os
    // ícones de som ambiente da UI principal (mesmo stroke/caps da
    // família); substitui o PNG Icone_Videos.png a pedido do Quintas.
    default:
        '<g class="zen-play-group">' +
            '<path d="M12 2.5a9.5 9.5 0 0 1 8.23 14.25"/>' +
            '<path d="M9.7 7.5l7.2 4.5-7.2 4.5z" fill="currentColor" ' +
                 'stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>' +
        '</g>',

    // Roda de carro — UMA roda, nada mais (o grupo gira quando seleccionado)
    driving:
        '<g class="zen-wheel-group" stroke-width="1.6">' +
            '<circle cx="12" cy="12" r="8.6"/>' +
            '<circle cx="12" cy="12" r="6.2"/>' +
            '<line x1="12"    y1="9.9"  x2="12"   y2="5.8"/>' +
            '<line x1="14.0"  y1="11.35" x2="17.9" y2="10.08"/>' +
            '<line x1="13.23" y1="13.7"  x2="15.65" y2="17.02"/>' +
            '<line x1="10.77" y1="13.7"  x2="8.35" y2="17.02"/>' +
            '<line x1="10.0"  y1="11.35" x2="6.08" y2="10.08"/>' +
            '<circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>' +
        '</g>',

    // Consola PSP (Jogos) — corpo horizontal arredondado + ecrã central
    // + d-pad (cruz) à esquerda + 4 botões em losango à direita: o
    // retrato da consola. O grupo INCLINA-SE quando seleccionado (a
    // "clicada" de lado com o polegar — ver .zen-psp-group.spinning).
    games:
        '<g class="zen-psp-group" stroke-width="1.6">' +
            '<rect x="2.1" y="6.6" width="19.8" height="10.8" rx="3.4"/>' +
            '<rect x="8.2" y="8.8" width="7.6" height="6.4" rx="1.1"/>' +
            '<path d="M5.2 10.7v2.6M3.9 12h2.6"/>' +
            '<circle cx="18.8" cy="10.5" r="0.7" fill="currentColor" stroke="none"/>' +
            '<circle cx="20.3" cy="12"   r="0.7" fill="currentColor" stroke="none"/>' +
            '<circle cx="18.8" cy="13.5" r="0.7" fill="currentColor" stroke="none"/>' +
            '<circle cx="17.3" cy="12"   r="0.7" fill="currentColor" stroke="none"/>' +
        '</g>',

    // HORROR — cabeça de homem num fato HAZMAT: capuz, visor rectangular
    // e APENAS os olhos visíveis através do vidro — arregalados de medo
    // (dois círculos sólidos). O grupo TREME e o subgrupo dos olhos PISCA
    // na animação de espera (zenHazmatShake/zenHazmatBlink — ver
    // .zen-hazmat-group.spinning no CSS).
    // (v11) TOPO DA CABEÇA CIRCULAR: o capuz era desenho com curvas
    // Bézier altas (cúpula de 9,8 numa largura de 13,6 — cabeça OVAL,
    // a pedido corrigido pelo Quintas). Agora o domo é um SEMICÍRCULO
    // EXACTO (arco a6.8 sobre a corda 13.6 = 2r): raio = meia largura,
    // topo em y=6.4 (13.6×13.2 de silhueta ≈ redonda) e a transição
    // para os lados verticais é TANGENTE (ângulo natural, sem quinas).
    horror:
        '<g class="zen-hazmat-group" stroke-width="1.6">' +
            '<path d="M5.2 17.8v-4.6a6.8 6.8 0 0 1 13.6 0v4.6c0 1-.8 1.8-1.8 1.8H7c-1 0-1.8-.8-1.8-1.8z"/>' +
            '<rect x="7.1" y="9.6" width="9.8" height="6.6" rx="2.4"/>' +
            '<g class="zen-hazmat-eyes" fill="currentColor" stroke="none">' +
                '<circle cx="10.1" cy="12.9" r="1.45"/>' +
                '<circle cx="13.9" cy="12.9" r="1.45"/>' +
            '</g>' +
        '</g>',

    // ESPAÇO — buraco negro clássico: horizonte de eventos (disco
    // sólido central) + anel de acreção fino e inclinado à volta (as
    // pontas do anel são tapadas pelo disco — o look 2D de Gargantua).
    // Na animação de espera o conjunto FLUTUA e o anel RODA em torno
    // do centro (zenBlackholeFloat/zenBlackholeSpin — ver
    // .zen-blackhole-group.spinning no CSS).
    space:
        '<g class="zen-blackhole-group" stroke-width="1.6">' +
            '<g class="zen-blackhole-ring">' +
                '<ellipse cx="12" cy="12" rx="9.3" ry="3.3" transform="rotate(-18 12 12)"/>' +
            '</g>' +
            '<circle cx="12" cy="12" r="4.3" fill="currentColor" stroke="none"/>' +
        '</g>',

    // LAREIRA — fogueira clássica: CHAMAS por cima (chama exterior +
    // núcleo interior, dentro do subgrupo .zen-fire-flames) e 3 TRONCOS
    // na base (dois cruzados em X + um horizontal à frente, que atravessa
    // as pernas do X). Na animação de espera AS CHAMAS MEXEM-SE: a chama
    // exterior BAILA (inclina-se/skew para os dois lados a partir da
    // base) e o núcleo RESPIRA em contrafase (mais rápido) — o fogo
    // "dança" de forma orgânica; os troncos ficam parados (zenFireFlicker
    // + zenFirePulse — ver .zen-fire-group .spinning no CSS).
    fireplace:
        '<g class="zen-fire-group" stroke-width="1.6">' +
            '<g class="zen-fire-flames">' +
                '<path d="M12 3.4c2.4 2.5 4.2 4.7 4.2 7.5a4.2 4.2 0 1 1-8.4 0c0-2.8 1.8-5 4.2-7.5z"/>' +
            '</g>' +
            '<path class="zen-fire-core" d="M12 8.4c1 1.15 1.9 2.3 1.9 3.7a1.9 1.9 0 1 1-3.8 0c0-1.4.9-2.55 1.9-3.7z"/>' +
            '<path d="M5.2 19.8L18.8 14.2"/>' +   // tronco (diagonal ↗)
            '<path d="M18.8 19.8L5.2 14.2"/>' +   // tronco (diagonal ↘)
            '<path d="M6.2 18.9h11.6"/>' +        // tronco (horizontal, à frente)
        '</g>',

    // Céu estrelado (lua + sparkle) — GUARDADO (v11: o placeholder skies
    // foi substituído pela Lareira; desenso mantido para reactivação)
    skies:
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
        '<path d="M4 3.5v3"/><path d="M2.5 5h3"/>' +
        '<path d="M7 8.5v2"/><path d="M6 9.5h2"/>'
};

// ÍCONE CLÁSSICO DE PAUSA — quadrado cheio com duas barras VAZIAS no
// meio (fill-rule evenodd → as barras são furos transparentes que
// deixam ver o que está por baixo). Usado no CENTRO do carrossel em
// hover, com um vídeo em reprodução, APÓS o 1.º fecho da UI
// (pauseHintArmed) — sinal de que o clique para o vídeo.
// Quadrado 4..20 (rx 2) · barras 2.6 de largura, 9.2 de altura.
const PAUSE_PATH =
    'M6 4H18A2 2 0 0 1 20 6V18A2 2 0 0 1 18 20H6A2 2 0 0 1 4 18V6A2 2 0 0 1 6 4Z' +
    'M8.3 7.4H10.9V16.6H8.3Z' +
    'M13.1 7.4H15.7V16.6H13.1Z';

// ═════════════════════════════════════════════════════════════════
// REFERÊNCIAS DOM
// ═════════════════════════════════════════════════════════════════
const layer     = document.getElementById('bgVideoLayer');
const wrap      = document.getElementById('sndWrapZen');
const zenBtn    = document.getElementById('zenBtn');
const carousel  = document.getElementById('zenCarousel');
const track     = document.getElementById('zenCarouselTrack');
const audioWrap = document.getElementById('zenAudioWrap');
const audioBtn  = document.getElementById('zenAudioBtn');
const audioOffIc = audioBtn ? audioBtn.querySelector('.zen-audio-icon-off') : null;
const audioOnIc  = audioBtn ? audioBtn.querySelector('.zen-audio-icon-on')  : null;
const volSlider = document.getElementById('zenAudioVolSlider');
const dock      = document.getElementById('zenAmbientDock');
const eyeBtn    = document.getElementById('eyeBtn');
const nightDockWrap = document.getElementById('zenNightWrap'); // wrapper da lua
const nightDockBtn = document.getElementById('zenNightBtn');   // lua do dock
const moonBtn       = document.getElementById('moonBtn');       // original (UI principal)

if (!layer || !wrap || !zenBtn || !carousel || !track || !audioWrap || !audioBtn || !volSlider || !dock) return;

// Botões de som ambiente com CLONES no dock (modo vídeo). Os ORIGINAIS
// ficam SEMPRE na UI principal — desvanecem naturalmente com o hub
// (nunca são arrancados em bloco); o dock recebe CLONES criados no 1.º
// modo vídeo. Clique e volume dos clones são REENCAMINHADOS para os
// originais (o main.js continua a ser a única fonte de verdade) e o
// estado visual (classes sound-on no wrap e no botão) é espelhado em
// tempo real via MutationObserver — os clones nunca divergem.
const AMBIENT_IDS = ['sndWrapRain', 'sndWrapDryer', 'sndWrapWind'];
let ambientClones = null;    // [{ clone, sync }]
let dockVisible = false;     // estado anterior do dock (transições)

// ═════════════════════════════════════════════════════════════════
// ESTADO
// ═════════════════════════════════════════════════════════════════
let zenOn = false;            // modo zen activo (vídeo visível)
let activeOption = null;      // opção em reprodução (null = fundo de imagem)
let activeVideoId = null;     // id do vídeo em reprodução
let selectedIdx = 0;          // opção seleccionada no carrossel (0 = default)
let soundOn = true;           // som do vídeo — LIGADO por defeito em TODOS os
                              // browsers (fade-in na revelação). Antes o
                              // Firefox arrancava sempre MUDO (STRICT_AUDIO)
                              // porque a activação nascia de um scroll sem
                              // clique; agora a activação só acontece pelo
                              // CLIQUE de confirmação no centro do carrossel
                              // (ver zenBtn.addEventListener) — um gesto real,
                              // igual ao que já permite o unMute() síncrono
                              // nas trocas de vídeo (switchVideo/wantSound) —
                              // por isso deixou de haver motivo para a
                              // distinção por browser aqui.
let volume = parseInt(volSlider.value, 10);
if (isNaN(volume) || volume < 0) volume = 20;   // default: 20%
let carouselOpen = false;
let closeTimer = null;        // período de graça do fecho do carrossel
let fadeTimer = null;         // ramp de volume do fade-in do áudio
let audioStarted = false;     // 1.º fade-in de áudio já feito nesta sessão
let readyToEngage = false;    // o vídeo desta activação já foi REVELADO
                              // pelo menos uma vez (becomeActive já correu)
let engagePending = false;    // o carrossel já fechou e QUER esconder a UI,
                              // mas está à espera de readyToEngage ficar true
let pauseHintArmed = false;   // ÍCONE DE PAUSA: a UI já se escondeu ≥1 vez
                              // desde a activação (engageVideoMode) → o
                              // hover no botão zen pode mostrar a pausa.
                              // Falso durante a espera (pré-roll) para
                              // NUNCA substituir a roda a girar; reposto
                              // em cada nova activação/desactivação.

const players  = { A: null, B: null };   // instâncias YT.Player
const pReady   = { A: false, B: false }; // onReady já correu (comandos seguros)
let   preload  = null;                  // PRÉ-CARGA: { slot, video, option,
                                         // ready } — player criado no arranque
                                         // SEM tocar; pronto para o 1.º clique
const slotVideo = { A: null, B: null };  // vídeo carregado em cada slot
const slotState = { A: 'empty', B: 'empty' };
const slotTimers = { A: null, B: null };
const slotSawSignal = { A: false, B: false }; // ficou true ao 1º sinal de
                                               // vida do player (onReady OU
                                               // qualquer onStateChange)
                                               // desde o início da carga
                                               // actual — ver armSlotTimer
const revealTimers = { A: null, B: null };  // timers do pré-roll (PRE_ROLL_MS)
let apiWatchdog = null;                     // API do YT não chega? (20s)
let activeSlot = 'A';
let consecutiveErrors = 0;
// (v17 · RESILIÊNCIA) Falhas de vídeo com TTL: um vídeo que falha
// (player de erro — ex.: re-upload AINDA EM PROCESSAMENTO no YouTube,
// que durante o processamento não é reproduzível) fica fora da rotação
// APENAS por FAILED_TTL_MS, não para sempre: quando o YouTube terminar
// o processamento, o vídeo volta à rotação sozinho — SEM refresh.
// (Bug v16: uma categoria inteira em processamento morria ao 1.º clique
// — a fila esgotava, o botão desligava-se e os cliques seguintes na
// categoria morta activavam/desligavam no mesmo instante, sem nada
// visível — "botão preso até ao refresh".)
const FAILED_TTL_MS = 5 * 60 * 1000;   // 5 minutos (barato re-tentar)
const failedMap = new Map();           // id → instante em que volta a estar disponível
function markVideoFailed(id) { failedMap.set(id, Date.now() + FAILED_TTL_MS); }
function isVideoFailed(id) {
    const until = failedMap.get(id);
    if (until === undefined) return false;
    if (Date.now() >= until) { failedMap.delete(id); return false; }  // TTL expirou → volta à rotação
    return true;
}
function failedList() {   // (debug/consola — IDs ainda em falha)
    const now = Date.now(), out = [];
    failedMap.forEach(function(until, id) { if (now < until) out.push(id); });
    return out;
}

const YT_ENDED = 0, YT_PLAYING = 1, YT_PAUSED = 2, YT_BUFFERING = 3;

// ═════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════
function otherSlot(s)   { return s === 'A' ? 'B' : 'A'; }
function coverEl(s)     { return document.getElementById('vidCover' + s); }
function hubEl()        { return document.getElementById('parallax-box'); }
function firstFunctional() {
    // (v16 · DUAS FACES) salta categorias indisponíveis para o
    // utilizador actual (face desprotegida sem vídeos — ex.: Space
    // e Fireplace enquanto não houver re-uploads)
    for (let i = 0; i < ZEN_OPTIONS.length; i++)
        if (ZEN_OPTIONS[i].functional && categoryAllowedFor(ZEN_OPTIONS[i]))
            return ZEN_OPTIONS[i];
    return null;
}
function videoModeOn()  { return document.body.classList.contains('zen-video-mode'); }

// ═════════════════════════════════════════════════════════════
// QUALIDADE ADAPTATIVA — sempre a MELHOR disponível, piso 1080p (v10)
// ═════════════════════════════════════════════════════════════
// O website pede SEMPRE a melhor qualidade que cada vídeo oferece
// (modo 'max': setPlaybackQuality com o topo de getAvailableQuality-
// Levels — 'highres' quando não há lista). Durante a reprodução, uma
// vigilância LEVE e 100% SILICIOSA (eventos do player + UM timer de
// 10s — zero polling pesado) identifica se a Internet do utilizador
// aguenta o máximo:
//   • 3+ BUFFERINGs do vídeo ACTIVO (o visível — os slots em carga
//     invisível nunca contam) numa janela deslizante de 45s, OU
//   • uma queda ADAPTATIVA persistente abaixo de 1080p (o YouTube
//     começa baixo e sobe sozinho — só conta se AINDA estiver baixa
//     8s depois do evento onPlaybackQualityChange),
// → o sistema FIXA 1080p (modo 'floor'): o PISO pedido — o vídeo
// nunca é deixado abaixo de hd1080 ENQUANTO o vídeo tiver 1080p (um
// vídeo cujo máximo seja 720p fica obviamente no máximo que tem).
// RECUPERAÇÃO com histerese: 120s sem UM ÚNICO buffering → volta a
// tentar o máximo (se a rede não aguentar, o ciclo repete — o
// comportamento é sempre "a melhor qualidade que a rede suporta,
// nunca abaixo de 1080p").
// Nota honesta: o YouTube trata setPlaybackQuality como PREFERÊNCIA
// (a adaptação final é dele) — este sistema empurra a preferência
// para máximo/piso e REAGE aos eventos reais do player.
const Q_ORDER = ['small','medium','large','hd720','hd1080','hd1440','hd2160','highres'];
function qRank(q) { const i = Q_ORDER.indexOf(q); return i < 0 ? 0 : i; }

let qualityMode   = 'max';   // 'max' = sempre a melhor · 'floor' = piso
const bufferTimes = [];      // BUFFERINGs do vídeo activo (janela 45s)
let lastBufferAt  = 0;       // último buffering (histerese da recuperação)
const floorTimers = { A: null, B: null };   // enforcement do piso (8s)
// (v17 · FIX QUALIDADE) PICO de qualidade ATINGIDO por slot desde que
// o vídeo foi carregado — distingue a SUBIDA inicial do auto-DASH do
// YouTube (todo o vídeo começa em 360/480p e SOBE degrau a degrau,
// mesmo com Internet excelente) de uma QUEDA adaptativa REAL (rede
// congestionada a medio curso). Só a queda persistente abaixo de
// 1080p num vídeo que JÁ atingiu 1080p justifica o piso — sem isto,
// o aquecimento normal de um 4K (>8s por degrau) disparava o piso e
// CORTAVA o vídeo a 1080p para sempre (bug v16: "stream em 1080p em
// vez de 4K com Internet boa" — reproduzido com mock da API).
const slotPeakRank = { A: 0, B: 0 };
function resetQualityPeak(slot) { slotPeakRank[slot] = 0; }

// Melhor nível que o vídeo ACTUALMENTE oferece (lista do player).
// (v17) Robusto contra a ORDEM da lista: a API não garante ordenação
// — escolhemos explicitamente o de MAIOR rank em vez de confiar no
// list[0] (se a lista viesse desordenada, podíamos pedir 720p num
// vídeo 4K).
function bestAvailable(p) {
    try {
        const lv = p.getAvailableQualityLevels ? p.getAvailableQualityLevels() : null;
        if (lv && lv.length) {
            let best = null;
            for (let i = 0; i < lv.length; i++) {
                const q = lv[i];
                if (!q || q === 'auto') continue;
                if (best === null || qRank(q) > qRank(best)) best = q;
            }
            if (best) return best;
        }
    } catch (e) {}
    return null;
}

// Aplica a qualidade preferida do modo actual a um player:
// 'max' → a melhor disponível · 'floor' → hd1080 (piso) quando o vídeo
// tiver 1080p ou melhor; se o máximo do vídeo for inferior, fica no
// máximo que o vídeo tem (nunca pedimos ao YouTube o que não existe).
function applyPreferredQuality(p) {
    if (!p || !p.setPlaybackQuality) return;
    try {
        const best = bestAvailable(p);
        let target;
        if (best) {
            target = (qualityMode === 'floor' && qRank(best) > qRank('hd1080'))
                   ? 'hd1080' : best;
        } else {
            target = qualityMode === 'floor' ? 'hd1080' : 'highres';
        }
        p.setPlaybackQuality(target);
    } catch (e) {}
}

function setQualityMode(mode) {
    if (qualityMode === mode) return;
    qualityMode = mode;
    ['A','B'].forEach(function(s) {
        // aplica já aos players relevantes (a tocar ou a carregar)
        if (players[s] && (slotState[s] === 'playing' || slotState[s] === 'loading')) {
            applyPreferredQuality(players[s]);
        }
    });
}

// Um BUFFERING do vídeo ACTIVO — alimenta a janela de congestionamento
function recordBufferEvent() {
    const now = Date.now();
    bufferTimes.push(now);
    lastBufferAt = now;
    while (bufferTimes.length && now - bufferTimes[0] > 45000) bufferTimes.shift();
    if (bufferTimes.length >= 3) setQualityMode('floor');
}

// (v17 · FIX QUALIDADE) Queda adaptativa abaixo de 1080p
// (onPlaybackQualityChange) — reagir com uma GRAÇA de 8s, mas SÓ a
// QUEDAS REAIS:
//   • todo o vídeo começa em 360/480p (auto-DASH) e SOBE degrau a
//     degrau enquanto o buffer enche — isso NÃO é queda, é o
//     aquecimento normal; o vídeo que AINDA não atingiu 1080p nunca
//     dispara o piso (era o bug v16: 8s "abaixo de 1080" durante a
//     subida inicial cortava o 4K a 1080p com Internet boa);
//   • QUEDA de verdade = o vídeo JÁ atingiu 1080p+ (pico por slot) e
//     caiu abaixo — aí sim, persistente por 8s → fixar 1080p.
function onQualityChange(slot, q) {
    // Pré-carga (nunca tocou) e slots já parados: eventos irrelevantes
    if (slotState[slot] === 'idle' || slotState[slot] === 'stopped') return;
    if (!players[slot]) return;
    const rank = qRank(q);
    // Pico atingido neste vídeo — subidas contam (aquecimento incluído)
    if (rank > slotPeakRank[slot]) slotPeakRank[slot] = rank;
    // Qualidades ≥1080p: nada a fazer (nunca disparam o piso)
    if (rank >= qRank('hd1080')) return;
    // SUBIDA INICIAL: o vídeo nunca atingiu 1080p — o YouTube está a
    // aquecer e sobe sozinho; intervir aqui cortava o 4K de quem tem
    // Internet boa. O piso só faz sentido depois de uma QUEDA.
    if (slotPeakRank[slot] < qRank('hd1080')) return;
    // QUEDA REAL abaixo de 1080p → graça de 8s antes de fixar
    clearTimeout(floorTimers[slot]);
    floorTimers[slot] = setTimeout(function() {
        floorTimers[slot] = null;
        const p = players[slot];
        if (!p || !zenOn) return;
        let cur = '';
        try { cur = p.getPlaybackQuality() || ''; } catch (e) {}
        if (!cur || cur === 'auto') return;
        if (qRank(cur) >= qRank('hd1080')) return;   // subiu entretanto
        const best = bestAvailable(p);
        if (best && cur === best) return;            // já no máximo do vídeo
        // queda REAL e persistente abaixo do piso → fixar 1080p
        setQualityMode('floor');
        lastBufferAt = Date.now();   // trava a recuperação por 120s
        applyPreferredQuality(p);
    }, 8000);
}

// Recuperação (histerese): 120s sem UM único buffering → voltar ao máx
function recoverQualityIfStable() {
    if (!zenOn || qualityMode !== 'floor' || !activeOption) return;
    if (!lastBufferAt || Date.now() - lastBufferAt > 120000) setQualityMode('max');
}
// O preço disto: um timer de 10s que quase sempre faz RETURN imediato
setInterval(recoverQualityIfStable, 10000);

// Cobre o ecrã com 16:9 (o tamanho exacto é aplicado em px para os dois slots)
function sizeCovers() {
    const W = layer.clientWidth, H = layer.clientHeight;
    if (!W || !H) return;
    const AR = 16 / 9;
    let w = W, h = W / AR;
    if (h < H) { h = H; w = H * AR; }
    coverEl('A').style.width  = w + 'px';  coverEl('A').style.height = h + 'px';
    coverEl('B').style.width  = w + 'px';  coverEl('B').style.height = h + 'px';
}

// ═════════════════════════════════════════════════════════════════
// YOUTUBE IFRAME API — carregamento preguiçoso (só no 1.º uso)
// ═════════════════════════════════════════════════════════════════
let ytReady = false;
let ytLoadStarted = false;
const ytCallbacks = [];

function loadYTApi(cb) {
    if (ytReady) { cb(); return; }
    ytCallbacks.push(cb);
    if (ytLoadStarted) return;
    ytLoadStarted = true;

    window.onYouTubeIframeAPIReady = function() {
        ytReady = true;
        const cbs = ytCallbacks.splice(0);
        cbs.forEach(function(fn) { try { fn(); } catch (e) {} });
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.head.appendChild(s);

    // Robustez: se o callback global se perder, sondear pela API
    let tries = 0;
    const poll = setInterval(function() {
        if (ytReady) { clearInterval(poll); return; }
        if (window.YT && window.YT.Player) { clearInterval(poll); window.onYouTubeIframeAPIReady(); }
        else if (++tries > 50) { clearInterval(poll); }
    }, 300);
}

function playerVarsFor(video, idle, wantSound) {
    const pv = {
        autoplay: idle ? 0 : 1,  // idle (PRÉ-CARGA): NUNCA toca sozinho —
                              // o play é commandado pelo clique (gesto)
        mute: (idle || !wantSound) ? 1 : 0,  // v13: troca accionada por
                              // CLIQUE real (switchVideo) com soundOn já
                              // activo → pede-se SEM MUTE logo desde a
                              // construção do player, ainda dentro do
                              // gesto síncrono do clique (ver
                              // "SOM NAS TROCAS" em becomeActive). Todos
                              // os outros casos (1.ª activação, avanço
                              // automático ao ENDED, recuperação de
                              // falha) continuam mudos por defeito.
        controls: 0,
        disablekb: 1,
        rel: 0,
        fs: 0,
        iv_load_policy: 3,
        playsinline: 1,
        origin: window.location.origin,
        cc_load_policy: 0,   // LEGENDAS SEMPRE DESLIGADAS — mesmo que o
                              // utilizador tenha legendas activas de
                              // sessões anteriores do YouTube (a prefê-
                              // rencia viaja no cookie do YT e seria
                              // herdada pelo embed); o killCaptions()
                              // abaixo reforça isto a cada vídeo
    };
    if (video.start) pv.start = video.start;
    if (video.end)   pv.end   = video.end;
    return pv;
}

// ═════════════════════════════════════════════════════════════════
// LEGENDAS — NUNCA activas (a pedido do Quintas)
// ═════════════════════════════════════════════════════════════════
// cc_load_policy:0 (em playerVarsFor) desliga as legendas por defeito,
// mas o YouTube pode (re)activá-las pela preferência de sessão do
// utilizador (cookie herdado de sessões anteriores) ou ao trocar de
// vídeo (o loadVideoById volta a montar o módulo de captions). O
// unloadModule('captions') — chamado no onReady e em cada estado
// relevante (BUFFERING/PLAYING, sempre ANTES da revelação: o vídeo
// ainda está invisível, as legendas nunca chegam a renderizar) —
// garantia que o módulo fica desmontado. Com controls=0 o utilizador
// também não as consegue ligar manualmente → IMPOSSÍVEL ter legendas.
function killCaptions(p) {
    try { if (p && p.unloadModule) p.unloadModule('captions'); } catch (e) {}
}

// O widget do YouTube costuma criar o iframe já com allow="autoplay…",
// mas depende da versão — REFORÇAR aqui garante que a permissão de
// autoplay/encrypted-media está SEMPRE delegada ao iframe. Sem a
// delegação explícita, o Firefox recusa reprodução programática no
// iframe mesmo com gesto do utilizador na página (a comunicação é
// toda por postMessage: a permissão tem de estar delegada).
function ensureIframeAllow(p) {
    try {
        const f = p && p.getIframe && p.getIframe();
        if (f) f.setAttribute('allow',
            'accelerometer; autoplay; clipboard-write; encrypted-media; ' +
            'gyroscope; picture-in-picture; web-share');
    } catch (e) {}
}

// Cria um player NOVO para o slot. Com idle=true é a PRÉ-CARGA (ver
// createIdlePlayer): nasce muted, autoplay:0, SEM tocar e SEM timers —
// existe apenas para que o 1.º clique encontre o iframe pronto e o
// loadVideoById/playVideo corram SINCRONAMENTE dentro do gesto.
function createPlayer(slot, video, idle, wantSound) {
    const cover = coverEl(slot);
    cover.innerHTML = '';
    const ph = document.createElement('div');
    cover.appendChild(ph);
    const p = new YT.Player(ph, {
        width: '100%',
        height: '100%',
        // (v16 · DUAS FACES) ID efectivo: na face desprotegida, vídeos
        // com anúncio tocam na ALTERNATIVA de baixa qualidade (o mesmo
        // vídeo re-carregado, sem anúncios — os start/end abaixo são os
        // do MESMO objecto, aplicam-se igual); nas restantes situações
        // toca sempre o ORIGINAL.
        videoId: playbackVideoIdOf(video),
        host: 'https://www.youtube-nocookie.com',   // v13: modo de
                              // privacidade oficial do YouTube — o
                              // embed passa a ser servido a partir
                              // deste domínio em vez de youtube.com,
                              // que não define os cookies de
                              // rastreamento/personalização de terceiros
                              // (o site nunca precisou deles — é vídeo
                              // de fundo, sem sign-in nem histórico).
                              // Menos cookies de terceiros = menos para
                              // a Enhanced Tracking Prevention (Firefox,
                              // Edge, Brave — todas ligadas por defeito;
                              // o Chrome puro não tem nada equivalente)
                              // bloquear/particionar durante o handshake
                              // inicial do iframe — o suspeito principal
                              // por trás dos 15-35s de demora nesses
                              // browsers versus o Chrome instantâneo.
        playerVars: playerVarsFor(video, idle, wantSound),
        events: {
            onReady: function() {
                pReady[slot] = true;
                slotSawSignal[slot] = true;   // 1º sinal de vida (ver armSlotTimer)
                if (preload && preload.slot === slot) preload.ready = true;
                killCaptions(p);        // legendas desmontadas desde o arranque
                ensureIframeAllow(p);   // delegação de autoplay (Firefox)
                try {
                    if (wantSound && !idle) { p.unMute(); p.setVolume(0); }
                    else                    { p.mute();   p.setVolume(0); }
                    if (idle) p.pauseVideo();   // pré-carga: fica no poster
                    else     p.playVideo();
                } catch (e) {}
            },
            onStateChange: function(ev) { onState(slot, ev.data); },
            onPlaybackQualityChange: function(ev) { onQualityChange(slot, ev.data); },
            onError: function() { onErrorEvt(slot); }
        }
    });
    players[slot]   = p;
    slotVideo[slot] = video;
    slotState[slot] = idle ? 'idle' : 'loading';
    resetQualityPeak(slot);   // (v17) vídeo novo no slot → pico a zero
    clearRevealTimer(slot);
    if (!idle) armSlotTimer(slot);   // o idle nunca falha — sem rede de
                                     // segurança (não há espera nenhuma)
}

// PRÉ-CARGA (compatibilidade Firefox — 2.ª camada): cria o player do
// slot A em BACKGROUND pouco depois do arranque da página, SEM tocar
// (autoplay:0, muted — apenas o poster/metadata, sem streaming). Assim,
// no 1.º clique no botão zen o loadVideoById+playVideo correm já
// SINCRONOS dentro do handler do clique — a ligação ao gesto do
// utilizador mantém-se intacta (enfileirar após um onReady assíncrono
// é o motivo nº 1 de "o vídeo fica parado" no Firefox). Nos browsers
// Chromium a pré-carga simplesmente torna a 1.ª activação mais rápida.
function createIdlePlayer(slot, video, option) {
    createPlayer(slot, video, true);
    preload = { slot: slot, video: video, option: option, ready: false };
}

function startPreload() {
    loadYTApi(function() {
        if (players.A || preload) return;   // player/pré-carga já existem
        const opt = firstFunctional();
        if (!opt) return;
        // (v11) A pré-carga é um PALPITE aleatório (não a queue — a queue
        // só nasce na ACTIVAÇÃO); se o utilizador activar esta categoria,
        // o vídeo pré-carregado passa para a FRENTE da queue (buildQueue)
        const video = randomVideoOf(opt);
        if (!video) return;
        createIdlePlayer('A', video, opt);
    });
}

function loadVideoInto(slot, video, wantSound) {
    slotVideo[slot] = video;
    slotState[slot] = 'loading';
    resetQualityPeak(slot);   // (v17) vídeo novo no slot → o pico de
                              // qualidade recomeça (o auto-DASH parte
                              // sempre de baixo — não é queda)
    clearRevealTimer(slot);
    const p = players[slot];
    if (p && p.loadVideoById && pReady[slot]) {
        // Reutiliza o iframe existente — troca instantânea, sem criar novo.
        // v13: se wantSound (troca por CLIQUE real com soundOn já activo)
        // desmuta-se AQUI, síncrono, ainda dentro do gesto — exactamente
        // como o playVideo() a seguir (ver nota abaixo). Sem wantSound,
        // arranca muted a 0: o becomeActive desmuda com fade-in quando o
        // vídeo estiver a tocar (o utilizador nunca ouve um salto).
        const args = { videoId: playbackVideoIdOf(video) };   // (v16) duas
        // faces — o mesmo objecto vídeo, o ID resolve-se conforme a
        // face (alternativa de baixa qualidade quando aplicável); os
        // start/end abaixo são sempre os do vídeo ORIGINAL (o re-upload
        // é o mesmo vídeo: os tempos aplicam-se IGUAL)
        if (video.start) args.startSeconds = video.start;
        if (video.end)   args.endSeconds   = video.end;
        // ⚠ O playVideo() extra é o coração da compatibilidade Firefox:
        // quando isto corre DENTRO do handler do clique (API pré-carregada
        // + player pronto desde o arranque), o comando de reprodução
        // chega ao iframe AINDA DENTRO do gesto do utilizador — qualquer
        // browser o aceita. Enfileirar a chamada para depois de um
        // onReady assíncrono quebraria essa ligação (Firefox: parado).
        try {
            if (wantSound) { p.unMute(); p.setVolume(0); } else { p.mute(); }
            p.loadVideoById(args);
            p.playVideo();
        }
        catch (e) { createPlayer(slot, video, false, wantSound); return; }
    } else {
        createPlayer(slot, video, false, wantSound);
        return;
    }
    armSlotTimer(slot);
}

// Rede de segurança EM DUAS FASES (ver STALL_CHECK_MS / SLOT_TIMEOUT_MS
// acima) — desenhada para reduzir o delay a sério, não só tolerá-lo:
//   1) aos STALL_CHECK_MS: sem NENHUM sinal de vida do player → falha já
//      (cobre o caso de bloqueio silencioso — vários vídeos presos
//      seguidos, sem nunca disparar um erro explícito do YouTube — que
//      era o que estava a causar os "1 a 2 minutos" de delay);
//   2) só quando HOUVE sinal de vida → dá-se o resto do tempo até
//      SLOT_TIMEOUT_MS (rede lenta a bufferizar, não bloqueio).
function armSlotTimer(slot) {
    clearSlotTimer(slot);
    slotSawSignal[slot] = false;
    slotTimers[slot] = setTimeout(function() {
        if (slotState[slot] !== 'loading') return;
        if (!slotSawSignal[slot]) {
            handleVideoFailure(slot);   // zero sinal → falha rápida
            return;
        }
        slotTimers[slot] = setTimeout(function() {
            if (slotState[slot] === 'loading') handleVideoFailure(slot);
        }, SLOT_TIMEOUT_MS - STALL_CHECK_MS);
    }, STALL_CHECK_MS);
}
function clearSlotTimer(slot) {
    if (slotTimers[slot]) { clearTimeout(slotTimers[slot]); slotTimers[slot] = null; }
}
function clearRevealTimer(slot) {
    if (revealTimers[slot]) { clearTimeout(revealTimers[slot]); revealTimers[slot] = null; }
}

// Rede de segurança da API (ver API_LOAD_TIMEOUT): só tem efeito na 1.ª
// carga (ytReady=false e sem players) — depois disso os callbacks do
// loadYTApi são síncronos e os erros de VÍDEO já têm o próprio ciclo de
// falhas (handleVideoFailure → 14s por slot / >5 erros → desactivar).
function armApiWatchdog() {
    clearApiWatchdog();
    if (ytReady) return;                 // API já pronta → nada a vigiar
    apiWatchdog = setTimeout(function() {
        apiWatchdog = null;
        if (!zenOn) return;              // desligado entretanto
        if (ytReady) return;             // chegou entretanto (cb corre/vai correr)
        if (players.A || players.B) return;  // players existem → API ok
        deactivateZen();                 // API indisponível → desligar limpo
    }, API_LOAD_TIMEOUT);
}
function clearApiWatchdog() {
    if (apiWatchdog) { clearTimeout(apiWatchdog); apiWatchdog = null; }
}

// ═════════════════════════════════════════════════════════════════
// QUEUE DE VÍDEOS (v11) — pedido do Quintas: «faz com que o botão de
// troca de video não escolha um video random… escolha sempre um video
// novo, e não repita o que já foi mostrado até ter que voltar ao
// primeiro video por falta de videos para reproduzir, o fim da queue,
// basicamente cria uma queue random sempre que o utilizador ativa o
// modo de video de background».
//   • ACTIVAÇÃO (cada vez que o modo vídeo liga, ou muda de categoria):
//     a categoria é EMBARALHADA (Fisher-Yates) numa QUEUE — o vídeo
//     INICIAL continua aleatório (a cabeça da queue), como sempre.
//   • AVANÇOS (botão de troca, ENDED automático, retentativa de falha):
//     TODOS seguem a QUEUE POR ORDEM — nunca repetem um vídeo já
//     mostrado até a queue dar a volta e regressar ao PRIMEIRO (fim da
//     queue → ciclo). Vídeos falhados (failedIds) são saltados.
//   • Nova activação → nova aleatoriedade (re-embaralha).
// ═════════════════════════════════════════════════════════════════
let videoQueue = [];   // queue activa (objectos vídeo da opção activa)
let queueIdx = 0;      // posição da PRÓXIMA a servir (cicla no fim)

// Fisher-Yates — embaralha a lista em sítio (uniforme, sem enviesar)
function shuffleList(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
}

// (v15/v16 · DUAS FACES) Vídeo disponível para ESTE utilizador?
// Enquanto a detecção de adblock/Brave não conclui (ou concluiu
// "protegido"), TUDO é disponível — comportamento inalterado. Sem
// adblock e sem Brave: os vídeos COM anúncio só contam se tiverem
// ALTERNATIVA de baixa qualidade (nesse caso é essa versão que o
// player recebe — ver playbackVideoIdOf); os `ads:true` SEM
// alternativa ficam fora da queue.
// (zen-ads.js carrega ANTES deste ficheiro — ZenAds existe sempre
// aqui; a ausência dele devolve true: site degradável, nunca bloqueia)
function videoAllowedFor(v) {
    return window.ZenAds ? window.ZenAds.videoAllowed(v) : true;
}

// (v16 · DUAS FACES) ID efectivo para o PLAYER (original ou
// alternativa de baixa qualidade, conforme a face — ver
// playbackIdOf no zen-ads.js).
function playbackVideoIdOf(v) {
    return (window.ZenAds && window.ZenAds.playbackIdOf)
        ? window.ZenAds.playbackIdOf(v) : v.id;
}

// (v16 · DUAS FACES) categoria disponível para ESTE utilizador?
// (pendente/protegido → sempre true; desprotegido → pelo menos 1
// vídeo disponível — usada pelo firstFunctional e pelo filtro que
// esconde categorias do carrossel)
function categoryAllowedFor(opt) {
    return window.ZenAds ? window.ZenAds.categoryAvailable(opt) : true;
}

// (v17 · RESILIÊNCIA) Aviso de categoria temporariamente indisponível:
// a fila morreu porque TODOS os vídeos da categoria falharam (ex.:
// re-uploads ainda em processamento no YouTube, que durante o
// processamento não são reproduzíveis). Reusa o toast do zen-ads.js
// com texto próprio (i18n zenCatUnavailable) — o throttle anti-spam
// (15s) vive no zen-ads.js; o zen desliga-se limpo logo a seguir.
function notifyCategoryEmpty() {
    if (!window.ZenAds || !window.ZenAds.notifyText) return;
    var t = (window._i18n && window._i18n.get)
        ? window._i18n.get('zenCatUnavailable') : null;
    if (t && typeof t === 'string') window.ZenAds.notifyText(t);
}

// Escolha ALEATÓRIA simples — usada APENAS pela pré-carga de arranque
// (um PALPITE de categoria: se o 1.º clique do utilizador for essa
// categoria, o vídeo pré-carregado passa para a FRENTE da queue — ver
// buildQueue; a ordem segue igualmente aleatória a partir dele).
function randomVideoOf(opt) {
    const pool = opt.videos.filter(function(v) {
        return !isVideoFailed(v.id) && videoAllowedFor(v);   // (v15/v17) faces+TTL
    });
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

// Constrói a queue aleatória da opção — CADA ACTIVAÇÃO re-embaralha.
// firstVideo (opcional): vídeo JÁ EM CARGA (pré-carga Firefox) que passa
// para a frente — a queue continua aleatória, só ARRANCA nele (garante
// que o hit da pré-carga e a ordem da queue são coerentes).
function buildQueue(opt, firstVideo) {
    const pool = opt.videos.filter(function(v) {
        return !isVideoFailed(v.id) && videoAllowedFor(v);   // (v15/v17) faces+TTL
    });
    shuffleList(pool);
    let startIdx = 0;
    if (firstVideo) {
        const i = pool.indexOf(firstVideo);
        if (i > 0) { const fv = pool.splice(i, 1)[0]; pool.unshift(fv); }
        // firstVideo (hit da pré-carga) já está a ser exibido — a queue
        // tem de começar a SEGUIR dele (posição 1). Sem isto, o 1.º avanço
        // (botão de troca / _zenCtrl.next) serve de volta videoQueue[0],
        // que é o MESMO vídeo já no ecrã — o utilizador via "nada mudar"
        // no 1.º clique e só ao 2.º clique é que avançava de facto.
        if (i >= 0) startIdx = 1;
    }
    videoQueue = pool;
    queueIdx = startIdx;
}

// Serve o PRÓXIMO vídeo da queue, POR ORDEM: nunca repete um já
// mostrado até a queue dar a volta (regressa ao primeiro vídeo — o fim
// da queue). Vídeos falhados são saltados na passagem. Sem vídeos
// úteis → null (o chamador desliga o zen, como antes).
function serveNextVideo() {
    const n = videoQueue.length;
    for (let k = 0; k < n; k++) {
        const idx = (queueIdx + k) % n;        // procura desde a posição actual
        const v = videoQueue[idx];
        if (!isVideoFailed(v.id) && videoAllowedFor(v)) {   // (v15/v17) faces+TTL
            queueIdx = (idx + 1) % n;          // ponteiro avança (cicla)
            return v;
        }
    }
    return null;   // todos os vídeos falharam nesta sessão
}

// ═════════════════════════════════════════════════════════════════
// MÁQUINA DE ESTADOS DOS SLOTS
// ═════════════════════════════════════════════════════════════════
function onState(slot, state) {
    if (!zenOn) {
        // Chegou tarde — o modo já foi desligado
        if (state === YT_PLAYING && players[slot]) {
            try { players[slot].stopVideo(); } catch (e) {}
        }
        return;
    }
    // Player de PRÉ-CARGA (idle): nunca toca, nunca se revela — qualquer
    // evento seu é irrelevante (erros do idle são tratados à parte no
    // onErrorEvt; as legendas já foram desmontadas no seu onReady)
    if (slotState[slot] === 'idle') return;
    slotSawSignal[slot] = true;   // qualquer evento real = player vivo
                                   // (ver armSlotTimer) — cobre também o
                                   // caso de loadVideoById num player já
                                   // existente, cujo onReady já disparou
                                   // há muito nesta sessão
    // Legendas: o YT pode (re)montar o módulo de captions a cada vídeo
    // → desmontá-lo em cada estado relevante (antes de qualquer reveal)
    if (state === YT_BUFFERING || state === YT_PLAYING) {
        killCaptions(players[slot]);
    }
    if (state === YT_PLAYING) {
        if (slotState[slot] === 'stopped') return;   // evento obsoleto
        consecutiveErrors = 0;
        slotState[slot] = 'playing';
        clearSlotTimer(slot);
        applyPreferredQuality(players[slot]);   // QUALIDADE: sempre a
                                                // melhor disponível
                                                // (modo floor: 1080p)
        if (slot !== activeSlot || !layer.classList.contains('on')) {
            // PRÉ-ROLL: o vídeo já está a tocar, mudo e invisível — só
            // revelamos (crossfade + som, em conjunto) PRE_ROLL_MS depois,
            // para garantir que a UI residual do YouTube (thumbnail/play/
            // escurecer) já desapareceu por completo. A animação de
            // crossfade em si mantém-se idêntica — só o MOMENTO em que
            // arranca é que é adiado.
            clearRevealTimer(slot);
            revealTimers[slot] = setTimeout(function() {
                revealTimers[slot] = null;
                // Revalidar: o estado pode ter mudado durante a espera
                // (desactivação, vídeo substituído por cima, erro, etc.)
                if (!zenOn) return;
                if (slotState[slot] !== 'playing') return;
                becomeActive(slot);
            }, PRE_ROLL_MS);
        }
    } else if (state === YT_ENDED) {
        slotState[slot] = 'ended';
        clearSlotTimer(slot);
        if (slot === activeSlot && activeOption) {
            // SEM ecrã final, SEM pausa (a UI do YouTube só existe fora
            // do PLAYING): o vídeo regressa ao início e continua MUDO —
            // loop silencioso com movimento contínuo — enquanto o
            // próximo carrega no outro slot.
            loopSilently(slot);
            // Se o outro slot já tem uma troca em curso — quer esteja
            // ainda a CARREGAR, quer já esteja a tocar em pré-roll
            // (armado no revealTimers, à espera dos 3,5s) — não recarregar
            // por cima: isso cancelaria uma troca que já estava quase
            // pronta a revelar-se.
            const other = otherSlot(slot);
            if (slotState[other] !== 'loading' && !revealTimers[other]) playNextVideo();
        }
    } else if (state === YT_BUFFERING) {
        // QUALIDADE (vigilância silenciosa): só o buffering do vídeo
        // ACTIVO (o visível — os slots em carga/pré-roll invisíveis
        // não contam) alimenta a janela de congestionamento; 3 numa
        // janela de 45s → fixar 1080p (o piso)
        if (slot === activeSlot) recordBufferEvent();
    }
    // PAUSED / UNSTARTED → sem acção
}

// ENDED → regressa ao início e continua MUDO (zero UI: sem ecrã final,
// sem pausa) enquanto o próximo vídeo carrega no outro slot. O ecrã
// final do YT nunca chega a renderizar (o seek é imediato ao evento).
function loopSilently(slot) {
    const p = players[slot];
    if (!p) return;
    try {
        p.mute();
        const v = slotVideo[slot];
        p.seekTo((v && typeof v.start === 'number') ? v.start : 0, true);
        p.playVideo();
    } catch (e) {}
}

function becomeActive(slot) {
    activeSlot = slot;
    activeVideoId = slotVideo[slot] ? slotVideo[slot].id : null;
    sizeCovers();

    // Primeira activação: fade-in da camada (a imagem de fundo fica por baixo)
    layer.classList.add('on');

    // ── SINCRONIZAÇÃO COM A UI (Main Hub) ──
    // O vídeo acabou de ser revelado — a partir de agora é seguro esconder
    // o Main Hub (o botão zen está DENTRO do hub-container, por isso não
    // pode esconder-se antes disto ou desaparece sem nada para mostrar no
    // lugar). Se o carrossel já tinha fechado entretanto (engagePending),
    // esconde-se AGORA, em sincronia com o vídeo — nunca antes. Se o rato
    // ainda estiver no carrossel, o pedido AGUARDA o fecho (comportamento
    // normal: o closeCarousel volta a chamar requestEngage e encontra
    // readyToEngage=true).
    readyToEngage = true;
    stopWheel();   // a espera acabou → o feedback da roda termina JUNTO
                   // com a revelação (vídeo entra, roda pára, hub desvanece)
    zenBtn.classList.remove('zen-busy');   // espera terminada → clicável
    if (engagePending && !carouselOpen) {
        engagePending = false;
        if (zenOn && activeOption) engageVideoMode();
    }
    updateZenBtnTitle();   // sai de "A carregar" → categoria / "Parar"

    // ── SOM (fade-in suave) ──
    // Browsers Chromium: o áudio entra LIGADO mas sempre a subir do 0
    // (nunca assusta). O player arranca muted (autoplay policy); o
    // unmute é imediato e, se o browser o bloquear, o 1.º gesto do
    // utilizador retoma-o (fallback na secção SOM DO VÍDEO, abaixo).
    // Revelação e áudio acontecem NO MESMO instante (o PLAYING) → sem
    // desync entre som e imagem.
    // STRICT_AUDIO (Firefox): NUNCA desmutar AQUI fora de um gesto — o
    // Firefox PAUSA o vídeo quando um autoplay muted é desmutado
    // programaticamente fora da janela de gesto do utilizador (era
    // exactamente o bug "o vídeo fica parado"). O som liga pelo botão
    // (setSound — clique directo, síncrono) ou pelo 1.º gesto (listener
    // de fallback) se já estava pedido.
    // v13 — excepção deliberada: numa TROCA por CLIQUE real com soundOn
    // já activo (switchVideo/wantSound), o vídeo já foi pedido SEM MUTE
    // logo na construção/loadVideoById — ainda dentro desse gesto (ver
    // loadVideoInto/createPlayer). Chegando aqui, isMuted()===false
    // confirma que esse pedido síncrono resultou (o browser não o
    // recusou) — então só falta o fade suave, NUNCA um unMute() tardio
    // (que É o gesto perdido que causa a pausa). Se por qualquer razão
    // ainda estiver muted (pedido síncrono recusado/ignorado), cai no
    // comportamento seguro de sempre: fica mudo, à espera de um gesto.
    const p = players[slot];
    if (p) {
        try {
            if (soundOn && !STRICT_AUDIO) {
                p.setVolume(0);
                p.unMute();
                fadeInAudio(p, audioStarted ? FADE_SWAP_MS : FADE_FIRST_MS);
                audioStarted = true;
            } else if (soundOn && STRICT_AUDIO && p.isMuted && !p.isMuted()) {
                p.setVolume(0);
                fadeInAudio(p, audioStarted ? FADE_SWAP_MS : FADE_FIRST_MS);
                audioStarted = true;
            } else {
                p.mute();
            }
        } catch (e) {}
    }

    // ── CROSSFADE (anti-UI: só se vê um player a TOCAR) ──
    // O NOVO vídeo já está PLAYING (fora do PLAYING o YouTube mostra
    // poster/pausa/ecrã final — aqui nunca) → revela-se JÁ, sempre POR
    // CIMA do anterior (z-index) → crossfade verdadeiro (0.9s CSS).
    // O ANTERIOR NÃO é pausado: continua a TOCAR por baixo (áudio em
    // fade-out rápido) até o novo o tapar por completo — só então,
    // já INVISÍVEL, perde .visible e pára. Nenhuma pausa à vista em
    // nenhuma troca (arranque, carrossel, shuffle, ENDED) → a UI de
    // pausa/play do YouTube nunca é visível.
    const cover    = coverEl(slot);
    const old      = otherSlot(slot);
    const oldCover = coverEl(old);
    cover.style.zIndex    = '2';   // o novo fica por cima na transição
    oldCover.style.zIndex = '1';
    // Trocas rápidas: se este cover ainda estava visível do papel
    // ANTERIOR (saída), repor o ponto de partida SEM transição — o
    // crossfade anima então de facto (em vez de um corte duro).
    if (cover.classList.contains('visible')) {
        cover.style.transition = 'none';
        cover.classList.remove('visible');
        void cover.offsetWidth;          // reflow → aplica já o estado
        cover.style.transition = '';
    }
    cover.classList.add('visible');   // resposta imediata ao PLAYING

    // Handoff do áudio: o antigo desce a volume 0 (~350ms) e fica mudo
    const op = players[old];
    if (op) fadeOutAudio(op, FADE_OUT_MS);

    // O antigo só desvanece/para DEPOIS de o novo estar totalmente
    // opaco (está tapado → a troca é invisível; o stop poupa bandwidth).
    setTimeout(function() {
        if (!zenOn || activeSlot !== slot) return;
        oldCover.classList.remove('visible');
    }, HIDE_OLD_MS);
    setTimeout(function() {
        if (!zenOn || activeSlot !== slot) return;
        // Se o slot antigo foi REUTILIZADO para um carregamento pendente
        // (troca rápida), NÃO o parar — o seu próprio reveal tratará dele
        if (slotState[old] === 'loading') return;
        if (players[old]) { try { players[old].stopVideo(); } catch (e) {} }
        slotState[old] = 'stopped';
    }, STOP_OLD_MS);
}

function playNextVideo(wantSound) {
    if (!zenOn || !activeOption) return;
    // (v11) segue a QUEUE por ordem (ENDED automático / troca manual /
    // recuperação de falha do vídeo activo) — nunca aleatório
    const video = serveNextVideo();
    if (!video) { deactivateZen(); return; }
    loadVideoInto(otherSlot(activeSlot), video, wantSound);
}

// Troca de vídeo (botão de troca de fundo no modo vídeo): o vídeo
// ACTUAL continua a tocar (nunca é pausado à vista — zero UI) enquanto
// o próximo carrega no outro slot; crossfade quando estiver a tocar.
// Se já houver uma troca em curso, apenas substitui o vídeo PENDENTE
// (o ecrã não muda nada entretanto — trocas rápidas ficam limpas).
// (v11) A troca segue a QUEUE por ordem: cada clique avança uma
// posição — sem repetir nenhum vídeo mostrado até a queue dar a volta.
// Cliques rápidos substituem o vídeo PENDENTE pelo seguinte da queue
// (os saltados regressam na volta seguinte — nunca foram mostrados).
// v13 — SOM NAS TROCAS (bug do bgShuffleBtn no Firefox): switchVideo()
// só é chamada a partir de um CLIQUE real (bgShuffleBtn → _zenCtrl.next
// → aqui, tudo síncrono). Se soundOn já estava activo (o utilizador já
// tinha carregado no botão de som antes), pede-se o próximo vídeo JÁ
// SEM MUTE (wantSound=true) — ainda dentro do gesto deste clique. Sem
// isto, o becomeActive() forçava sempre mute nos browsers STRICT_AUDIO
// (Firefox) em CADA troca, independentemente de soundOn, porque por
// essa altura (~15-35s de carregamento + 3,5s de pré-roll depois) o
// gesto original já expirou — o vídeo ficava mudo, mas soundOn e o
// botão de som continuavam a mostrar "ligado": o desync reportado.
function switchVideo() {
    if (!zenOn || !activeOption) return;
    const wantSound = soundOn;
    const other = otherSlot(activeSlot);
    if (slotState[other] === 'loading') {
        const video = serveNextVideo();
        if (!video) return;
        loadVideoInto(other, video, wantSound);
        return;
    }
    playNextVideo(wantSound);
}

function onErrorEvt(slot) {
    // Erro do player de PRÉ-CARGA (nunca revelado, nunca pedido): apenas
    // marcar o vídeo como indisponível para o picker o evitar — sem
    // tocar no ciclo de falhas da activação em curso (noutro slot)
    if (slotState[slot] === 'idle') {
        const iv = slotVideo[slot];
        if (iv) markVideoFailed(iv.id);
        return;
    }
    // Evento obsoleto de um slot já parado/tapado (troca concluída ou
    // desactivação) → ignorar: revivê-lo provocaria um reveal indevido
    // do slot morto por cima do vídeo actual
    if (slot !== activeSlot && slotState[slot] === 'stopped') return;
    const v = slotVideo[slot];
    if (v) markVideoFailed(v.id);   // indisponível → fora da rotação durante o TTL
    slotState[slot] = 'error';
    handleVideoFailure(slot);
}

function handleVideoFailure(slot) {
    if (!zenOn || !activeOption) return;
    // Rede de segurança do timer de 14s: slot já parado/tapado → não o
    // ressuscitar (mesma protecção do onErrorEvt, para a via directa)
    if (slot !== activeSlot && slotState[slot] === 'stopped') return;
    consecutiveErrors++;
    if (consecutiveErrors > 5) { deactivateZen(); return; }
    if (slot === activeSlot) {
        // O vídeo activo morreu → carregar outro já no outro slot (crossfade)
        playNextVideo();
    } else {
        // O vídeo em carregamento falhou → tentar outro no MESMO slot
        // (v11: o próximo da queue — o falhado fica em falha (TTL v17)
        // e é saltado até o TTL expirar)
        const video = serveNextVideo();
        if (!video) { notifyCategoryEmpty(); deactivateZen(); return; }
        loadVideoInto(slot, video);
    }
}

// ═════════════════════════════════════════════════════════════════
// ACTIVAR / DESACTIVAR
// ═════════════════════════════════════════════════════════════════
function activateOption(opt) {
    if (!opt || !opt.functional || !opt.videos || !opt.videos.length) return;
    if (zenOn && activeOption === opt) return;   // já está a tocar

    // SINCRONIZAÇÃO UI/VÍDEO: um NOVO vídeo está a caminho (pré-roll de
    // 3,5s) → até ele REVELAR, a UI não se pode esconder (o botão zen
    // está DENTRO do hub — escondê-lo antes deixaria um "vazio"). Numa
    // nova sessão limpa-se também o pedido pendente; numa TROCA de opção
    // o pedido herdado (engagePending) MANTÉM-se — a nova espera herda a
    // intenção de esconder a UI.
    readyToEngage = false;
    if (!zenOn) engagePending = false;

    // ÍCONE DE PAUSA desarmado: durante TODA a espera (roda a girar /
    // animação de selecção) o hover mostra sempre o ícone da CATEGORIA —
    // a pausa só se arma depois de a UI se esconder pela 1.ª vez
    // (engageVideoMode), para nunca substituir a roda sem querer
    pauseHintArmed = false;

    zenOn = true;
    activeOption = opt;

    // (v15/v16 · DUAS FACES) sem adblock e sem Brave (JÁ confirmado
    // pela detecção): a notificação informativa aparece na 1.ª categoria
    // ACTIVADA da sessão de página — trocar de categoria já não a mostra;
    // o refresh repõe-na (o zen-ads.js trata da duplicação: 1× por
    // sessão, sempre no fundo centro do ecrã, 10 segundos)
    if (window.ZenAds) window.ZenAds.notifyIfUnprotected();

    // Sincronizar a selecção do carrossel com a opção activada
    const idx = ZEN_OPTIONS.indexOf(opt);
    if (idx >= 0) selectedIdx = idx;

    updateZenBtn();
    updateAudioWrap();

    // Rede de segurança: se a API nunca carregar, o callback abaixo não
    // corre — o watchdog desliga o zen limpo (roda incluída)
    armApiWatchdog();
    loadYTApi(function() {
        clearApiWatchdog();            // API pronta → vigiar deixa de fazer sentido
        if (!zenOn) return;            // desligado durante a carga da API
        let video, slot;
        if (preload && preload.ready && preload.option === opt &&
            !isVideoFailed(preload.video.id) &&
            videoAllowedFor(preload.video)) {   // (v15) HIT só se permitido
            // PRÉ-CARGA HIT: o player deste slot já existe e está PRONTO
            // desde o arranque → o loadVideoById + playVideo do
            // loadVideoInto correm SINCRONOS dentro do gesto do clique
            // (a ligação ao gesto mantém-se — o Firefox aceita o play)
            video = preload.video;
            slot  = preload.slot;
        } else {
            video = null;
            slot  = otherSlot(activeSlot);
        }
        preload = null;                // a pré-carga é de uso único (a partir
                                        // daqui os players já existem — todos
                                        // os comandos futuros são síncronos)
        // QUEUE (v11): cada ACTIVAÇÃO embaralha a categoria — o vídeo
        // INICIAL continua aleatório (a cabeça da queue); com HIT da
        // pré-carga, o vídeo já em carga passa para a frente e a queue
        // segue aleatória A PARTIR dele (ordem coerente com o que já
        // está a carregar — zero desperdício da pré-carga)
        buildQueue(opt, video);
        if (!video) video = serveNextVideo();
        if (!video) { notifyCategoryEmpty(); deactivateZen(); return; }
        // v14: mesma lógica de "SOM NAS TROCAS" do switchVideo — este
        // loadVideoInto ainda corre dentro do gesto síncrono do clique de
        // confirmação (zenBtn), quer reutilize o player pré-carregado
        // (unMute síncrono) quer tenha de criar um player novo (unMute no
        // onReady de createPlayer — o mesmo caminho que o 1.º switchVideo
        // da sessão já usa hoje, com sucesso, para o slot ainda sem player)
        loadVideoInto(slot, video, soundOn);
    });
}

function deactivateZen() {
    zenOn = false;
    activeOption = null;
    activeVideoId = null;
    readyToEngage = false;
    engagePending = false;
    pauseHintArmed = false;   // nova sessão → a pausa só volta a armar
                              // depois do próximo 1.º fecho da UI
    videoQueue = [];          // (v11) a queue morre com a sessão — a
    queueIdx = 0;             // próxima activação volta a embaralhar
    clearRevealTimer('A');
    clearRevealTimer('B');
    clearApiWatchdog();   // desligou durante a carga da API → cancelar a
                          // rede de segurança (dupla protecção: o watchdog
                          // também verifica !zenOn)
    stopWheel();   // a roda pode estar a girar (espera interrompida) —
                   // sem isto continuaria infinitamente no carrossel
    // Áudio: muta já (o vídeo vai parar) e repõe o DEFAULT — a próxima
    // activação volta a começar com som LIGADO + fade-in, igual em
    // todos os browsers (ver nota em "let soundOn" sobre o fim da
    // distinção Firefox/Chromium).
    stopFadeAudio();
    // QUALIDADE: limpar as amostras desta sessão de reprodução (o modo
    // max/floor mantém-se — a rede não mudou por desligar o vídeo; a
    // recuperação de 120s continua a vigiar)
    bufferTimes.length = 0;
    lastBufferAt = 0;
    clearTimeout(floorTimers.A);
    clearTimeout(floorTimers.B);
    floorTimers.A = floorTimers.B = null;
    resetQualityPeak('A');   // (v17) próximos vídeos recomeçam o pico
    resetQualityPeak('B');   // (subida auto-DASH ≠ queda)
    ['A', 'B'].forEach(function(s) {
        const p = players[s];
        if (p && p.mute) { try { p.mute(); } catch (e) {} }
    });
    soundOn = true;
    audioStarted = false;
    applySoundVisual(soundOn);   // visual coerente com o novo default (ligado)
    // (v17 · RESILIÊNCIA) Repor a SELECÇÃO no default: se o zen morreu
    // porque a categoria activa esgotou a fila (vídeos todos em falha —
    // ex.: re-uploads ainda em processamento no YouTube), deixar o
    // selectedIdx preso na categoria morta fazia os cliques seguintes
    // (no botão ou no ícone centrado) activarem/desligarem no mesmo
    // instante — "botão preso até ao refresh". Com a reposição, o botão
    // volta logo ao default e o utilizador pode escolher outra
    // categoria (ou re-tentar a mesma — os failedIds têm TTL de 5min).
    selectedIdx = 0;
    disengageVideoMode();   // restaura hub + botões IMEDIATAMENTE
    updateZenBtn();
    updateAudioWrap();
    layer.classList.remove('on');
    setTimeout(function() {
        if (zenOn) return;   // foi reactivado entretanto
        ['A', 'B'].forEach(function(s) {
            clearSlotTimer(s);
            coverEl(s).classList.remove('visible');
            slotState[s] = 'stopped';
            if (players[s]) { try { players[s].stopVideo(); } catch (e) {} }
        });
    }, 1300);
}

// ═════════════════════════════════════════════════════════════════
// MODO VÍDEO (após o carrossel fechar com um vídeo activo)
// ═════════════════════════════════════════════════════════════════
function setEyeState(hidden) {
    if (window._setEyeIcons) window._setEyeIcons(hidden);
    if (eyeBtn) eyeBtn.classList.toggle('active', hidden);
}

// ── CLONES dos botões ambiente (dock) ──────────────────────────────
// Criados UMA vez (no 1.º modo vídeo), vivem permanentemente no dock —
// a VISIBILIDADE é 100% CSS (regras #zenAmbientDock do zen-video.css:
// opacity 0 fora do modo vídeo / com o hub mostrado). Os originais
// ficam na UI principal e desvanecem com o hub. Delegação de eventos
// no próprio clone → o estado interno nunca se perde.
function ensureAmbientClones() {
    if (ambientClones) return;
    ambientClones = [];
    AMBIENT_IDS.forEach(function(id) {
        const origWrap = document.getElementById(id);
        if (!origWrap) return;
        const clone = origWrap.cloneNode(true);
        // Clones NUNCA duplicam ids (HTML inválido + lookups frágeis):
        // o dock identifica-os por data-attribute
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach(function(n) { n.removeAttribute('id'); });
        clone.setAttribute('data-ambient-clone', id);

        const origBtn    = origWrap.querySelector('button');
        const origSlider = origWrap.querySelector('input[type=range]');
        const cloneBtn   = clone.querySelector('button');
        const cloneSlider= clone.querySelector('input[type=range]');

        // Espelho do estado: classes sound-on (wrap + botão) e volume —
        // corrido a cada mutação de classe nos originais, qualquer que
        // seja o caminho (clique no clone, clique no original com o hub
        // visível, game-launcher, arranque). NOTA: cloneNode copia o
        // ATRIBUTO value do slider, não a propriedade actual → copiar
        // à mão.
        function syncClone() {
            clone.classList.toggle('sound-on', origWrap.classList.contains('sound-on'));
            if (cloneBtn && origBtn) {
                cloneBtn.classList.toggle('sound-on', origBtn.classList.contains('sound-on'));
                cloneBtn.title = origBtn.title;   // i18n actualizado no original
            }
            if (cloneSlider && origSlider) cloneSlider.value = origSlider.value;
        }
        syncClone();
        const mo = new MutationObserver(syncClone);
        mo.observe(origWrap, { attributes: true, attributeFilter: ['class'] });
        if (origBtn) mo.observe(origBtn, { attributes: true, attributeFilter: ['class'] });

        // Clique no clone → botão ORIGINAL (mesma função, mesmo estado —
        // o clique programático ignora o pointer-events do hub escondido)
        clone.addEventListener('click', function(e) {
            if (!e.target.closest('button') || !origBtn) return;
            e.stopPropagation();
            origBtn.click();
        });
        // Volume no clone → slider ORIGINAL (o handler do main.js aplica
        // o volume ao <audio> — continua a ser a única fonte de verdade)
        clone.addEventListener('input', function(e) {
            if (e.target !== cloneSlider || !origSlider) return;
            origSlider.value = e.target.value;
            origSlider.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // No dock: chuva/secador/vento por ordem e, no FIM, o night mode
        // (directamente abaixo do vento). A âncora é o WRAPPER da lua
        // (zenNightWrap) — o botão em si já não é filho directo do dock;
        // sem wrapper cai para o botão, e sem lua para o fim da coluna
        dock.insertBefore(clone, nightDockWrap || nightDockBtn || null);
        ambientClones.push({ clone: clone, sync: syncClone });
    });
}

// Re-dispara a micro-animação de entrada (zenDockIn) em TODOS os filhos
// do dock numa transição para DOCK VISÍVEL — as clones já cá vivem
// permanentemente, pelo que sem isto a animação só correria no 1.º modo
// vídeo (nas re-entradas ficaria apenas o fade do dock)
function restartDockAnimations() {
    Array.prototype.forEach.call(dock.children, function(el) {
        el.style.animation = 'none';
        void el.offsetWidth;   // reflow → reinicia a animação CSS
        el.style.animation = '';
    });
}

// ── NIGHT MODE no dock (lua monocromática, abaixo do vento) ────────
// Mesma função do moonBtn da UI principal: o clique é reencaminhado
// para o botão ORIGINAL (main.js: tema mono, estrelas, cometas,
// localStorage — uma única fonte de verdade) e o estado activo espelha
// a classe night-mode do body, qualquer que seja o caminho que a altere.
if (nightDockBtn && moonBtn) {
    nightDockBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        moonBtn.click();
    });
    const syncNight = function() {
        nightDockBtn.classList.toggle('active',
            document.body.classList.contains('night-mode'));
    };
    new MutationObserver(syncNight).observe(document.body, {
        attributes: true, attributeFilter: ['class']
    });
    syncNight();
}

// Fonte única de verdade para o dock: as CLASSES do body. O dock mostra-
// se em modo vídeo COM o hub escondido; quando o olho mostra o hub, o
// dock desvanece (CSS) — os ORIGINAIS já estão na UI principal, nada se
// move. Em cada transição para VISÍVEL: re-sincroniza as clones (ex.:
// volume ajustado no original enquanto o hub esteve visível) e
// re-dispara a micro-animação de entrada.
function syncAmbientDock() {
    const dockWanted = videoModeOn() && !document.body.classList.contains('zen-hub-shown');
    if (dockWanted) ensureAmbientClones();
    if (dockWanted !== dockVisible) {
        dockVisible = dockWanted;
        dock.setAttribute('aria-hidden', dockWanted ? 'false' : 'true');
        if (dockWanted && ambientClones) {
            ambientClones.forEach(function(c) { c.sync(); });
            restartDockAnimations();
        }
    }
}

// ⚠ O parallax (main.js) escreve style.transition INLINE no hub ('none'
// com o rato dentro, 'transform .5s' no mouseleave) — o inline ANULARIA
// as transições CSS do modo vídeo (opacity/scale/filter). O parallax
// RETOMA quando o olho revela o hub (zen-hub-shown) e volta a escrever
// o inline; por isso, SEMPRE que as classes zen-* do body mudam, o
// inline é limpo → a transição CSS anima o esconder/mostrar do hub.
function clearHubInlineTransition(recs) {
    const cl = document.body.classList;
    const zenNow = cl.contains('zen-video-mode') || cl.contains('zen-hub-shown') ||
                   cl.contains('zen-hub-anim');
    let zenBefore = false;
    if (recs) {
        for (let i = 0; i < recs.length; i++) {
            if ((recs[i].oldValue || '').indexOf('zen-') !== -1) { zenBefore = true; break; }
        }
    }
    if (!zenNow && !zenBefore) return;
    const hub = hubEl();
    if (hub) hub.style.transition = '';
}

new MutationObserver(function(recs) {
    syncAmbientDock();
    clearHubInlineTransition(recs);
}).observe(document.body, {
    attributes: true, attributeFilter: ['class'], attributeOldValue: true
});

function engageVideoMode() {
    if (videoModeOn()) return;
    // Se o hidden-mode normal estiver activo, limpá-lo — no modo vídeo o
    // olho controla APENAS o Main Hub
    document.body.classList.remove('hidden-mode');
    document.body.classList.remove('zen-hub-shown');
    // ⚠ O parallax (main.js) escreve style.transition INLINE no hub ('none'
    // enquanto o rato está dentro da página) — o que ANULARIA o fade CSS.
    // Limpar o inline e deixar as transições do zen-video.css comandarem
    // (o parallax está suspenso enquanto o hub está escondido — guards no
    // main.js; o observer acima volta a limpar a cada troca de classe zen).
    const hub = hubEl();
    if (hub) hub.style.transition = '';
    document.body.classList.add('zen-video-mode');
    // A UI fechou-se (pela 1.ª vez desde a activação) → ARMAR o ícone
    // de pausa: a partir de agora, hover no botão zen com o vídeo em
    // reprodução mostra a pausa (a roda já parou — nunca há conflito)
    pauseHintArmed = true;
    updateZenBtnTitle();   // label passa a "Parar" (hover = pausa)
    setEyeState(true);          // hub escondido → olho "activado"
    updateAudioWrap();
    // (botões ambiente → dock: o MutationObserver acima reage à classe)
}

function disengageVideoMode() {
    if (!videoModeOn()) return;
    document.body.classList.remove('zen-video-mode');
    document.body.classList.remove('zen-hub-shown');
    // ⚠ Limpar o inline transition ANTES do retorno: o parallax já está
    // ACTIVO de novo (zen-video-mode saiu do body) e pode ter escrito
    // 'none' enquanto o hub estava visível — sem isto, o reaparecer
    // seria instantâneo em vez do fade suave.
    const hub = hubEl();
    if (hub) hub.style.transition = '';
    // Classe transitória: mantém a transição CSS do hub durante o RETORNO
    // ao normal (opacity/scale/blur animam suavemente ao voltar), removida
    // depois de a animação terminar (~1.5s).
    document.body.classList.add('zen-hub-anim');
    setTimeout(function() { document.body.classList.remove('zen-hub-anim'); }, 1500);
    setEyeState(false);
    updateAudioWrap();
    // (botões ambiente → casa: o MutationObserver acima reage à classe)
}

// ═════════════════════════════════════════════════════════════════
// SOM DO VÍDEO — LIGADO por defeito, SEMPRE com fade-in suave
// ═════════════════════════════════════════════════════════════════
// Ramp de volume 0 → alvo em passos pequenos (o alvo é relido a cada
// passo — o slider pode mudar a meio) — o som nunca "salta".
function stopFadeAudio() {
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
}
function fadeInAudio(p, ms) {
    stopFadeAudio();
    if (!p || !p.setVolume) return;
    const steps = 22;
    const stepMs = Math.max(40, Math.round(ms / steps));
    let i = 0;
    fadeTimer = setInterval(function() {
        i++;
        if (!zenOn) { stopFadeAudio(); return; }
        const target = volume;      // alvo vivo (o slider pode mudar)
        const v = Math.round(Math.min(i / steps, 1) * target);
        try { p.setVolume(v); } catch (e) { stopFadeAudio(); return; }
        if (i >= steps || v >= target) {
            try { p.setVolume(target); } catch (e) {}
            stopFadeAudio();
        }
    }, stepMs);
}

// Fade-out rápido do áudio do vídeo ANTIGO no handoff (crossfade de
// som): o player continua a TOCAR (mudo — mutar NÃO mostra qualquer
// UI, ao contrário da pausa) até ser tapado/parado mais tarde.
// Timer local (não interfere com o fadeInAudio do novo vídeo).
function fadeOutAudio(p, ms) {
    if (!p || !p.setVolume) return;
    try {
        if (p.isMuted && p.isMuted()) return;   // já silencioso
        let from = 100;
        try { from = Math.min(100, Math.max(0, p.getVolume())); } catch (e) {}
        if (from <= 0) { try { p.mute(); } catch (e) {} return; }
        const steps = 8;
        const stepMs = Math.max(30, Math.round(ms / steps));
        let i = 0;
        const t = setInterval(function() {
            i++;
            try { p.setVolume(Math.round(from * (1 - i / steps))); }
            catch (e) { clearInterval(t); return; }
            if (i >= steps) { clearInterval(t); try { p.mute(); } catch (e) {} }
        }, stepMs);
    } catch (e) {}
}

// Fallback por gesto: alguns browsers bloqueiam o unmute programático
// de autoplays (o player continua muted, sem erro). O primeiro clique /
// tecla / scroll do utilizador retoma o áudio — com fade a partir do 0,
// para nunca assustar. Listener permanente e barato (guards rápidos).
['pointerdown', 'keydown', 'wheel'].forEach(function(evt) {
    document.addEventListener(evt, function() {
        if (!zenOn || !soundOn) return;
        const p = players[activeSlot];
        if (!p || !p.unMute || !p.isMuted) return;
        try {
            if (p.isMuted()) {
                p.setVolume(0);
                p.unMute();
                fadeInAudio(p, 1600);
            }
        } catch (e) {}
    }, { capture: true, passive: evt === 'wheel' });
});

function applySoundVisual(on) {
    audioBtn.classList.toggle('sound-on', on);
    audioWrap.classList.toggle('sound-on', on);
    if (audioOffIc) audioOffIc.style.display = on ? 'none'  : 'block';
    if (audioOnIc)  audioOnIc.style.display  = on ? 'block' : 'none';
    updateSoundHint();
}

function setSound(on) {
    soundOn = on;
    applySoundVisual(on);
    const p = players[activeSlot];
    if (!p || !p.setVolume) return;
    try {
        if (on) { p.setVolume(0); p.unMute(); fadeInAudio(p, 1600); }
        else    { stopFadeAudio(); p.mute(); }
    } catch (e) {}
}

// ── HINT DE SOM (Firefox) ─────────────────────────────────────
// Nos browsers STRICT_AUDIO o som do vídeo arranca MUDO e só liga pelo
// botão — mas o utilizador pode nem perceber que o botão EXISTE. Enquanto
// NUNCA tiver clicado no botão de som/mute, o ícone PULSA suavemente em
// VERMELHO sempre que fica visível (modo vídeo activo). A marca é
// PERSISTENTE (localStorage — sobrevive a refreshes): se o utilizador
// não clicar, a pulsação volta sempre; o 1.º clique apaga-a PARA SEMPRE.
// Em browsers Chromium a marca nasce "feita" → o efeito nunca existe.
const SOUND_HINT_KEY = 'zen_ffx_sound_hint';
let soundHintDone = !STRICT_AUDIO || (function() {
    try { return localStorage.getItem(SOUND_HINT_KEY) === '1'; }
    catch (e) { return false; }
})();

function updateSoundHint() {
    const visible = audioWrap.classList.contains('visible');
    audioBtn.classList.toggle('hint-pulse',
        visible && STRICT_AUDIO && !soundHintDone && !soundOn);
}

// O botão de som só é VISÍVEL no MODO VÍDEO (após o carrossel fechar),
// mas o som existe desde a 1.ª reprodução (default ligado, com fade-in)
// — o estado (on/off/volume) sobrevive à visibilidade do botão.
function updateAudioWrap() {
    const show = !!(videoModeOn() && zenOn && activeOption && activeOption.hasAudio !== false);
    audioWrap.classList.toggle('visible', show);
    updateSoundHint();
}

audioBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    // 1.º clique no botão de som/mute (Firefox): o hint desaparece PARA
    // SEMPRE — marca persistente, sobrevive a refreshes (a pulsação nunca
    // mais aparece, mesmo em sessões futuras)
    if (STRICT_AUDIO && !soundHintDone) {
        soundHintDone = true;
        try { localStorage.setItem(SOUND_HINT_KEY, '1'); } catch (err) {}
        audioBtn.classList.remove('hint-pulse');
    }
    setSound(!soundOn);
});

// Ajuste manual do volume: aplica-se na hora (cancela um fade em curso —
// o controlo manual do utilizador tem sempre prioridade)
volSlider.addEventListener('input', function() {
    volume = parseInt(this.value, 10);
    if (isNaN(volume)) volume = 0;
    stopFadeAudio();
    const p = players[activeSlot];
    if (p && p.setVolume) { try { p.setVolume(volume); } catch (e) {} }
});

// ═════════════════════════════════════════════════════════════════
// VERIFICAÇÃO DE CONECTIVIDADE DOS VÍDEOS (menu admin "Leo" — v10)
// ═════════════════════════════════════════════════════════════════
// Botão "Verify All Videos" do Mod Tab (o menu de admin que abre ao
// escrever "Leo"). Percorre TODOS os vídeos de TODAS as categorias —
// DINAMICAMENTE (vídeos/categorias adicionados no futuro entram na
// verificação sem qualquer alteração) — carregando cada um num
// mini-player OCULTO (offscreen, mudo, 320×180, 3 em paralelo) e
// observando a resposta REAL do YouTube:
//   • BUFFERING/PLAYING            → ONLINE (existe e transmite)
//   • onError 2/5/100/101/150      → offline, com o motivo exacto
//   • 15s sem qualquer resposta    → timeout (rede lenta/bloqueada)
// Se algum vídeo falhar, o website gera e descarrega AUTOMATICAMENTE
// um relatório .txt ORGANIZADO (categoria · título real do vídeo ·
// link directo · motivo). Se estiver tudo bem, uma mensagem simples
// diz-o. Se TODOS falharem, o relatório/overlay avisam que o mais
// provável é o YouTube estar inalcançável (rede/adblock) — e não
// que todos os vídeos morreram.
const CHECK_POOL    = 3;      // mini-players em paralelo
const CHECK_TIMEOUT = 15000;  // por vídeo
const YT_ERR_TEXT = {
    2:   'Invalid video ID (error 2)',
    5:   'HTML5 player error (error 5)',
    100: 'Video removed or private (error 100)',
    101: 'Embedding disabled by owner (error 101)',
    150: 'Embedding disabled by owner (error 150)'
};
let checkRunning = false;
let lastCheckReport = '';     // último relatório gerado (debug/consola)

// Strings do verificador (i18n — entregues pelo i18n.js via
// window._zenSyncLang, mesmo padrão das zenLabels; fallback EN até o
// i18n arrancar). Os MOTIVOS técnicos (YT_ERR_TEXT) e o RELATÓRIO .txt
// ficam em inglês — são literais técnicos/ficheiro de sistema.
let checkLabels = {
    title:        '\uD83D\uDCFA Video Check',
    loading:      'Loading the YouTube API...',
    checking:     'Checking',
    checkingBtn:  'Checking...',
    allOk:        'All {n} videos are online — everything is fine.',
    problems:     '{n} of {total} videos have problems — report downloaded.',
    close:        'Close',
    apiFail:      'Could not load the YouTube API — check the connection.',
    noVideos:     'No videos to check.',
    warn:         'YouTube unreachable? Check network/adblock — every video failed.',
    timeoutReason:'No response within 15s'
};
function checkFill(key, n, total) {
    return checkLabels[key].replace('{n}', n).replace('{total}', total);
}

const checkOverlay = document.getElementById('zenCheckOverlay');
const checkTitleEl = document.getElementById('zenCheckTitle');
const checkStatus  = document.getElementById('zenCheckStatus');
const checkList    = document.getElementById('zenCheckList');
const checkBarFill = document.getElementById('zenCheckBarFill');
const checkClose   = document.getElementById('zenCheckClose');

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
}

function openCheckOverlay() {
    if (!checkOverlay) return;
    if (checkList) checkList.innerHTML = '';
    if (checkBarFill) checkBarFill.style.width = '0%';
    if (checkClose) {
        checkClose.textContent = checkLabels.checkingBtn;
        checkClose.classList.add('disabled');
    }
    if (checkStatus) checkStatus.textContent = checkLabels.loading;
    checkOverlay.classList.add('open');
    checkOverlay.setAttribute('aria-hidden', 'false');
}

function closeCheckOverlay() {
    if (!checkOverlay) return;
    checkOverlay.classList.remove('open');
    checkOverlay.setAttribute('aria-hidden', 'true');
}

function setCheckDone() {
    checkRunning = false;
    if (checkClose) {
        checkClose.textContent = checkLabels.close;
        checkClose.classList.remove('disabled');
    }
    if (checkBarFill) checkBarFill.style.width = '100%';
}

function runVideoCheck() {
    if (checkRunning) return;
    // Tarefas DINÂMICAS: tudo o que existir nas opções no momento do
    // clique (vídeos do futuro entram sozinhos — zero manutenção)
    const tasks = [];
    ZEN_OPTIONS.forEach(function(opt) {
        if (!opt.functional || !opt.videos || !opt.videos.length) return;
        opt.videos.forEach(function(v) { tasks.push({ opt: opt, video: v }); });
    });
    if (!tasks.length) {
        if (checkStatus) checkStatus.textContent = checkLabels.noVideos;
        return;
    }
    checkRunning = true;
    openCheckOverlay();
    let started = false;
    loadYTApi(function() {
        started = true;
        runCheckPool(tasks);
    });
    // Rede de segurança: a API do YT não chega → desistir limpo (sem
    // isto o overlay ficaria eternamente em "Loading the API...")
    setTimeout(function() {
        if (checkRunning && !started && !ytReady) {
            setCheckDone();
            if (checkStatus) checkStatus.textContent = checkLabels.apiFail;
        }
    }, API_LOAD_TIMEOUT + 4000);
}

function runCheckPool(tasks) {
    const results = [];
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
        'position:fixed;left:-9999px;top:0;width:320px;height:540px;' +
        'pointer-events:none;overflow:hidden;';
    document.body.appendChild(host);
    let next = 0, done = 0, active = 0;

    function updateProgress(task) {
        if (checkStatus) checkStatus.textContent =
            checkLabels.checking + ' ' + done + '/' + tasks.length +
            ' — ' + task.opt.name;
        if (checkBarFill) {
            checkBarFill.style.width = Math.round(done / tasks.length * 100) + '%';
        }
    }

    function checkOne(task) {
        const div = document.createElement('div');
        div.style.cssText = 'width:320px;height:180px;';
        host.appendChild(div);
        let settled = false, player = null;
        const to = setTimeout(function() { settle('timeout', 0); }, CHECK_TIMEOUT);
        function settle(status, code) {
            if (settled) return;
            settled = true;
            clearTimeout(to);
            let title = '';
            try {
                const vd = player.getVideoData && player.getVideoData();
                if (vd) title = vd.title || '';
            } catch (e) {}
            results.push({ cat: task.opt.name, id: task.video.id, title: title,
                           status: status, code: code });
            done++; active--;
            try { if (player && player.destroy) player.destroy(); } catch (e) {}
            if (div.parentNode) div.parentNode.removeChild(div);
            updateProgress(task);
            pump();
        }
        player = new YT.Player(div, {
            width: '320', height: '180',
            videoId: task.video.id,
            host: 'https://www.youtube-nocookie.com',   // v13: consistente
                          // com createPlayer — sem isto o verificador
                          // testava um cenário (cookies de youtube.com)
                          // diferente do que os visitantes realmente
                          // recebem
            playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1,
                          rel: 0, fs: 0, iv_load_policy: 3, playsinline: 1,
                          cc_load_policy: 0, origin: window.location.origin },
            events: {
                onStateChange: function(ev) {
                    // BUFFERING(3)/PLAYING(1) → o vídeo EXISTE e transmite
                    if (ev.data === 1 || ev.data === 3) settle('ok', 0);
                },
                onError: function(ev) { settle('error', ev.data); }
            }
        });
    }

    function pump() {
        if (done >= tasks.length) { finishCheck(results, host); return; }
        while (active < CHECK_POOL && next < tasks.length) {
            active++;
            checkOne(tasks[next++]);
        }
    }
    pump();
}

function finishCheck(results, host) {
    if (host && host.parentNode) host.parentNode.removeChild(host);
    setCheckDone();
    const failed = results.filter(function(r) { return r.status !== 'ok'; });

    if (!failed.length) {
        if (checkStatus) checkStatus.textContent =
            checkFill('allOk', results.length, 0);
        if (checkList) checkList.innerHTML = '';
        return;
    }

    // Relatório .txt organizado + download automático
    const allFailed = failed.length === results.length;
    const txt = buildCheckReport(results, failed, allFailed);
    lastCheckReport = txt;
    downloadTextFile('hub-videos-offline-' + reportStamp() + '.txt', txt);

    if (checkStatus) checkStatus.textContent =
        checkFill('problems', failed.length, results.length);
    renderCheckList(results, allFailed);
}

function reportStamp() {
    const d = new Date();
    const p = function(n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           '_' + p(d.getHours()) + p(d.getMinutes());
}

// O relatório é agrupado por CATEGORIA (apenas as afectadas), com o
// título real do vídeo (lido do player, quando alcançável), o link
// directo e o motivo exacto da falha — tudo em texto simples e legível
function buildCheckReport(results, failed, allFailed) {
    const d = new Date();
    const L = [];
    L.push('============================================================');
    L.push(' CARAVELA HUB — VIDEO CONNECTIVITY REPORT');
    L.push('============================================================');
    L.push(' Generated : ' + d.toLocaleString());
    L.push(' Videos    : ' + results.length + ' checked · ' +
          (results.length - failed.length) + ' online · ' +
          failed.length + ' with problems');
    if (allFailed) {
        L.push('');
        L.push(' NOTE: EVERY video failed — this almost always means the');
        L.push(' YouTube API was unreachable (network blocked, adblock or');
        L.push(' offline) rather than every video being gone.');
    }
    ZEN_OPTIONS.forEach(function(opt) {
        const catResults = results.filter(function(r) { return r.cat === opt.name; });
        const bad = catResults.filter(function(r) { return r.status !== 'ok'; });
        if (!bad.length) return;
        L.push('');
        L.push(' CATEGORY: ' + opt.name + ' (' + bad.length + ' of ' +
               catResults.length + ' videos affected)');
        L.push('------------------------------------------------------------');
        bad.forEach(function(r) {
            L.push(' [OFFLINE] ' + (r.title ? r.title : '(no title)'));
            L.push('           https://youtu.be/' + r.id);
            if (r.status === 'timeout') {
                L.push('           Reason: no response within 15s (slow or blocked network)');
            } else {
                L.push('           Reason: ' +
                       (YT_ERR_TEXT[r.code] || ('player error ' + r.code)));
            }
        });
    });
    L.push('');
    L.push('============================================================');
    L.push(' Titles come from the videos themselves when reachable.');
    L.push('============================================================');
    return L.join('\n');
}

function downloadTextFile(name, text) {
    try {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 800);
    } catch (e) {}
}

function renderCheckList(results, allFailed) {
    if (!checkList) return;
    const rows = results.filter(function(r) { return r.status !== 'ok'; })
        .map(function(r) {
            const reason = r.status === 'timeout'
                ? checkLabels.timeoutReason
                : (YT_ERR_TEXT[r.code] || ('player error ' + r.code));
            return '<div class="zen-check-item">' +
                '<span class="zen-check-cat">' + escapeHtml(r.cat) + '</span>' +
                '<span class="zen-check-link">' +
                    escapeHtml(r.title || ('https://youtu.be/' + r.id)) + '</span>' +
                '<span class="zen-check-reason">' + escapeHtml(reason) + '</span>' +
                '</div>';
        }).join('');
    checkList.innerHTML =
        (allFailed
            ? '<div class="zen-check-warn">' + escapeHtml(checkLabels.warn) + '</div>'
            : '') + rows;
}

// Wiring: botão do Mod Tab + fecho do overlay (bloqueado durante a
// verificação — os resultados chegam ao painel, não se perde nada)
if (checkOverlay) {
    const btn = document.getElementById('modBtnCheckVideos');
    if (btn) btn.addEventListener('click', function() { runVideoCheck(); });
    if (checkClose) checkClose.addEventListener('click', function() {
        if (checkRunning) return;
        closeCheckOverlay();
    });
    checkOverlay.addEventListener('click', function(e) {
        if (e.target !== checkOverlay || checkRunning) return;
        closeCheckOverlay();
    });
}
window._zenVerifyVideos = runVideoCheck;   // chamada directa (consola)

// ═════════════════════════════════════════════════════════════════
// BOTÃO PRINCIPAL + CARROSSEL
// ═════════════════════════════════════════════════════════════════
// HTML do ícone de uma opção NO CARROSSEL — TODAS as opções são SVG
// (v10: o default também — o antigo PNG oficial foi substituído pelo
// play + arco, na mesma família visual dos restantes ícones)
function optIconHtml(opt) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
           ((opt && ICONS[opt.id]) || ICONS.default) + '</svg>';
}

// Ícone CLÁSSICO DE PAUSA para o CENTRO do carrossel (hover com um
// vídeo em reprodução, APÓS o 1.º fecho da UI — pauseHintArmed)
function pauseIconHtml() {
    return '<svg class="zen-pause-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none">' +
           '<path fill-rule="evenodd" d="' + PAUSE_PATH + '"/></svg>';
}

// ── LABEL DINÂMICA do botão zen (tooltip ao lado do rato) ──
// Cada estado tem a SUA label (a pedido do Quintas):
//   • espera do vídeo (roda a girar)     → "A carregar"
//   • vídeo em play + pausa armada       → "Parar" (o clique pára)
//   • categoria seleccionada (sem vídeo)  → nome da categoria (i18n)
//   • default                             → "Video de fundo" (sem "Zen")
// As strings vêm do i18n.js (window._zenSyncLang — mesmo padrão do
// _suikaSyncLang/_fnSyncLang), com fallback EN até o i18n arrancar; o
// nome da categoria é lido do title do item do carrossel correspondente
// (aplicado pelo i18n via data-i18n-key) — uma única fonte de verdade.
let zenLabels = { loading: 'Loading', stop: 'Stop', videoBg: 'Video Background' };
window._zenSyncLang = function(t) {
    if (!t) return;
    if (t.zenLoading) zenLabels.loading = t.zenLoading;
    if (t.zenStop)    zenLabels.stop    = t.zenStop;
    if (t.zenVideoBg) zenLabels.videoBg = t.zenVideoBg;
    // ── Verificador de vídeos (v10): strings dinâmicas + elementos
    // estáticos do overlay (o botão Close só quando NÃO está a
    // verificar — para não atropelar o estado "A verificar...") ──
    if (t.zenCheckTitle)       checkLabels.title         = t.zenCheckTitle;
    if (t.zenCheckLoading)     checkLabels.loading       = t.zenCheckLoading;
    if (t.zenCheckChecking)    checkLabels.checking      = t.zenCheckChecking;
    if (t.zenCheckCheckingBtn) checkLabels.checkingBtn   = t.zenCheckCheckingBtn;
    if (t.zenCheckAllOk)       checkLabels.allOk         = t.zenCheckAllOk;
    if (t.zenCheckProblems)    checkLabels.problems      = t.zenCheckProblems;
    if (t.zenCheckClose)       checkLabels.close         = t.zenCheckClose;
    if (t.zenCheckApiFail)     checkLabels.apiFail       = t.zenCheckApiFail;
    if (t.zenCheckNoVideos)    checkLabels.noVideos      = t.zenCheckNoVideos;
    if (t.zenCheckWarn)        checkLabels.warn          = t.zenCheckWarn;
    if (t.zenCheckNoResponse)  checkLabels.timeoutReason = t.zenCheckNoResponse;
    if (checkTitleEl) checkTitleEl.textContent = checkLabels.title;
    if (checkClose && !checkRunning) checkClose.textContent = checkLabels.close;
    updateZenBtnTitle();
};

function updateZenBtnTitle() {
    let label;
    if (zenOn && !readyToEngage) {
        label = zenLabels.loading;          // pré-roll/roda a girar
    } else if (zenOn && pauseHintArmed && activeOption) {
        label = zenLabels.stop;             // hover mostra a pausa
    } else {
        const opt  = ZEN_OPTIONS[selectedIdx];
        const item = track.children[selectedIdx];
        label = (opt && opt.id !== DEFAULT_ID && item && item.title)
            ? item.title                    // nome traduzido da categoria
            : zenLabels.videoBg;            // default: "Video de fundo"
    }
    zenBtn.title = label;
    zenBtn.setAttribute('aria-label', label);
}

function setBtnIcon(opt) {
    zenBtn.innerHTML =
        '<svg class="zen-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        ((opt && ICONS[opt.id]) || ICONS.default) + '</svg>';
}

function updateZenBtn() {
    zenBtn.classList.toggle('sound-on', zenOn);
    // Espera do vídeo em curso (roda a girar) → o botão NÃO é clicável
    // (o clique seria ignorado) e o cursor deixa de prometer acção
    zenBtn.classList.toggle('zen-busy', zenOn && !readyToEngage);
    setBtnIcon(ZEN_OPTIONS[selectedIdx]);
    if (zenOn && activeOption && activeOption.loadingAnim) spinWheel();
    renderCarousel();
    updateZenBtnTitle();
}

// ── ANIMAÇÕES DE ESPERA (ícone) ──
// Instâncias do ícone da opção ACTIVA (botão + item CENTRO do
// carrossel) que têm grupo de animação de carga: a RODA do driving
// (gira), a PSP do jogos (é "clicada" de lado), o HAZMAT do horror
// (treme e pisca), o BURACO NEGRO do espaço (flutua e roda) ou as
// CHAMAS da lareira (bailam). Os restantes itens do carrossel NUNCA
// animam — o ícone do jogo ficar visível no slot .near não significa
// que esteja a carregar (trocar de opção para cima deixava a animação
// antiga a correr no item de baixo, visível).
function loadingIconGroups() {
    const list = [];
    function collect(root) {
        if (!root) return;
        root.querySelectorAll('.zen-wheel-group, .zen-psp-group, ' +
                              '.zen-hazmat-group, .zen-blackhole-group, ' +
                              '.zen-fire-group')
            .forEach(function(g) { list.push(g); });
    }
    collect(zenBtn);
    if (activeOption) {
        const idx = ZEN_OPTIONS.indexOf(activeOption);
        collect(idx >= 0 ? track.children[idx] : null);
    }
    return list;
}

// Arranca a animação de espera do ícone da opção activa (roda do
// driving / PSP do jogos / hazmat / buraco negro / chamas): anima desde
// a SELECÇÃO até o vídeo REVELAR (pré-roll ≥3,5s). Primeiro limpa TODAS
// as animações de carga (trocas de opção deixam .spinning obsoleto
// noutros itens) e CANCELA wind-downs pendentes (uma animação WAAPI de
// paragem suave sobrepõe-se à animação CSS recém-ligada).
function spinWheel() {
    stopWheel();
    cancelWindDowns();
    loadingIconGroups().forEach(function(g) {
        void g.getBoundingClientRect();   // reflow → reinicia a animação
        g.classList.add('spinning');
    });
}

// ── PARAGEM SUAVE DAS ANIMAÇÕES (wind-down, v11) ──
// Pedido do Quintas: «a animação corta, faz uma transição mais smooth
// para a animação não simplesmente cortar a meio, podes fazer com que a
// animação reverta, e pare quando chegar ao ponto inicial, e caso outras
// animações tenham o mesmo problema, faz as mesmas soluções». Quando o
// vídeo REVELA (becomeActive) ou o zen se desliga, em vez de remover a
// classe .spinning a meio de um ciclo (pose arbitrária → CORTE seco
// até à pose neutra), a pose ACTUAL de cada elemento animado (grupo /
// olhos / anel / chamas) é CAPTURADA como matriz (getComputedStyle,
// ANTES de a classe sair — a computed style inclui a animação CSS) e
// reanimada com Web Animations até 'none' — a POSE INICIAL — com um
// ease-out de 600ms: a animação REVERTE visivelmente até ao ponto de
// partida, sincronizada com o crossfade de revelação (0,9s). O
// el.animate() arranca no MESMO frame em que a classe sai → nunca há
// flash. Browsers sem WAAPI → corte clássico (comportamento pré-v11).
let windDowns = [];   // animações WAAPI de wind-down activas

function windDownElement(el, pose) {
    const t = pose || 'none';
    if (!t || t === 'none') return;   // já está na pose neutra
    try {
        const a = el.animate(
            [{ transform: t }, { transform: 'none' }],
            { duration: 600, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' }
        );
        windDowns.push(a);
        a.addEventListener('finish', function() {
            const i = windDowns.indexOf(a);
            if (i >= 0) windDowns.splice(i, 1);
        }, { once: true });
    } catch (e) {}
}

function cancelWindDowns() {
    // Uma NOVA espera de vídeo (spinWheel) arranca → o wind-down pendente
    // é CANCELADO: uma animação WAAPI criada por animate() sobrepõe-se à
    // animação CSS re-ligada (ordem de composição) e bloquearia a nova
    // animação de espera. Ao trocar de opção o ícone é re-renderizado de
    // qualquer forma (updateZenBtn/setBtnIcon) — o corte aqui é invisível.
    windDowns.slice().forEach(function(a) { try { a.cancel(); } catch (e) {} });
    windDowns.length = 0;
}

// A espera terminou (vídeo revelado) ou o zen desligou-se → as animações
// de espera REVERTEM suavemente até à pose inicial (wind-down) em vez de
// cortarem a meio do ciclo. A roda/PSP/hazmat/buraco negro/chamas usam
// TODAS o mesmo caminho — a solução é genérica (a pose de cada elemento
// animado é capturada e devolvida ao neutro).
// ⚠ ORDEM CRÍTICA: as poses são lidas ANTES de a classe .spinning sair —
// a computed style SÓ inclui a animação CSS enquanto a classe existe
// (depois da remoção o transform recalcula já para a base 'none' e não
// haveria nada para reverter).
function stopWheel() {
    wrap.querySelectorAll('.zen-wheel-group.spinning, .zen-psp-group.spinning, ' +
                          '.zen-hazmat-group.spinning, .zen-blackhole-group.spinning, ' +
                          '.zen-fire-group.spinning')
        .forEach(function(g) {
            // Elementos com animação PRÓPRIA dentro deste ícone (grupo +
            // olhos do hazmat / anel do buraco negro / chamas+núcleo da
            // fogueira)
            const els = [g];
            g.querySelectorAll('.zen-hazmat-eyes, .zen-blackhole-ring, ' +
                              '.zen-fire-flames, .zen-fire-core')
                .forEach(function(el) { els.push(el); });
            // 1) CAPTURAR as poses actuais (a animação CSS ainda está
            //    aplicada — é ESTE valor que vai reverter)
            const poses = els.map(function(el) {
                try { return getComputedStyle(el).transform; }
                catch (e) { return 'none'; }
            });
            // 2) a classe sai → as animações CSS cancelam
            g.classList.remove('spinning');
            // 3) cada pose capturada REVERTE suave até 'none' (pose inicial)
            els.forEach(function(el, i) { windDownElement(el, poses[i]); });
        });
}

// CONFIRMAÇÃO DE SELECÇÃO (v15) — ponto único partilhado pelo clique
// directo num ícone do carrossel E pelo clique no zenBtn (centro/botão
// fechado). Substitui a antiga distinção "só pré-visualiza vs. só o
// botão confirma": agora QUALQUER clique real (num ícone concreto ou
// no botão) confirma de imediato — a diferença entre os dois pontos de
// entrada é só o `fallbackToFirst`.
//   • opt === activeOption (já a tocar) → pausa/desliga (repõe default);
//     ainda protegido por readyToEngage — nunca cancela uma carga em curso.
//   • opt funcional e diferente do que está activo → activa/TROCA logo
//     para essa categoria (activateOption já trata o resto).
//   • opt é o "default" (functional:false) → desliga se algo estiver a
//     tocar; se nada estiver activo, fica no default (ou arranca a 1.ª
//     categoria funcional quando fallbackToFirst=true — caso do zenBtn
//     fechado, clique rápido sem abrir o carrossel).
function confirmSelection(opt, fallbackToFirst) {
    if (zenOn && opt === activeOption) {
        if (!readyToEngage) return;   // carga em curso — ignora o clique
        selectedIdx = 0;
        deactivateZen();
        return;
    }
    if (opt && opt.functional) {
        activateOption(opt);
        return;
    }
    if (zenOn) {
        if (!readyToEngage) return;
        selectedIdx = 0;
        deactivateZen();
    } else if (fallbackToFirst) {
        const first = firstFunctional();
        if (first) activateOption(first);
    } else {
        selectedIdx = 0;
        updateZenBtn();
    }
}

// Construção das opções do carrossel (v10: TODAS as opções são SVG,
// incluindo a default — o PNG oficial foi substituído pelo play+arco).
// --csc = escala do item CENTRO no estado FECHADO: parte EXACTAMENTE do
// tamanho do ícone do BOTÃO (SVG 92%·30px/32px = 0.86, igual em todas
// as opções) → a troca botão↔centro é um crossfade SEM SALTO e a
// abertura um zoom-in suave (ver secção 3 do zen-video.css)
// (v16 · DUAS FACES) extraído para FUNÇÃO: o filtro de categorias
// (applyZenAdsCategoryFilter) RECONSTRÓI os botões depois de remover
// do ZEN_OPTIONS as categorias sem vídeos para o utilizador — a
// correspondência ZEN_OPTIONS[i] ↔ track.children[i] (usada pelo
// render, ícones, títulos e animações) tem de se manter 1:1.
function buildCarouselButtons() {
    track.innerHTML = '';
    ZEN_OPTIONS.forEach(function(opt, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'zen-opt';
        b.title = opt.name;
        b.setAttribute('aria-label', opt.name);
        if (opt.titleKey) b.setAttribute('data-i18n-key', opt.titleKey);
        b.style.setProperty('--csc', '0.86');   // v10: TODAS as opções são
                                                // SVG (92%·30px/32px) — o
                                                // crossfade botão↔centro é
                                                // sem salto em qualquer opção
        b.innerHTML = optIconHtml(opt);
        // v15: clique DIRECTO num ícone do carrossel — este handler só chega
        // a correr para o ícone SUPERIOR (o centro tem pointer-events:none e
        // os cliques aí caem no zenBtn por baixo). É um clique real e síncrono
        // sobre um elemento concreto, exactamente o mesmo tipo de gesto que o
        // Firefox já aceita na confirmação — por isso já não precisa de passar
        // pelo passo de pré-visualização: selecciona E confirma no mesmo
        // gesto (ver confirmSelection). Antes disto chamava só selectOption(i),
        // o que deixava a categoria "presa" numa pré-visualização que o fecho
        // do carrossel desfazia se o utilizador não voltasse a clicar.
        b.addEventListener('click', function(e) {
            e.stopPropagation();
            confirmSelection(ZEN_OPTIONS[i], false);
        });
        track.appendChild(b);
    });
}
buildCarouselButtons();

// (v16 · DUAS FACES) Remove do carrossel as categorias SEM NENHUM
// vídeo disponível para a face desprotegida (todos os vídeos com
// anúncio e SEM alternativa — ex.: Space e Fireplace enquanto os
// re-uploads não existirem). Corre UMA vez, mal a detecção confirma
// desprotecção (ver onUnprotected, no fim do ficheiro) — e NUNCA na
// face protegida: quem tem adblock/Brave vê o carrossel COMPLETO.
//   • o ZEN_OPTIONS perde as opções vazias e os botões são
//     RECONSTRUÍDOS (buildCarouselButtons) — a correspondência
//     ZEN_OPTIONS[i] ↔ track.children[i] mantém-se 1:1;
//   • uma categoria ACTIVA que fique vazia (activada antes da
//     detecção concluir) desliga o zen limpo (a queue já não tem
//     nada para este utilizador);
//   • o refresh repõe tudo (a detecção volta a correr do zero).
// Quando as alternativas em falta chegarem (re-uploads do canal do
// Quintas), basta acrescentar `alt` aos vídeos — as categorias
// reaparecem SOZINHAS, sem tocar no código.
let zenAdsFilterDone = false;
function applyZenAdsCategoryFilter() {
    if (zenAdsFilterDone) return;
    zenAdsFilterDone = true;
    const removed = ZEN_OPTIONS.filter(function(o) {
        return o.functional && !categoryAllowedFor(o);
    });
    if (!removed.length) return;
    if (zenOn && activeOption && removed.indexOf(activeOption) >= 0) {
        deactivateZen();   // categoria activa ficou vazia → sair limpo
    }
    for (let i = 0; i < removed.length; i++) {
        const k = ZEN_OPTIONS.indexOf(removed[i]);
        if (k >= 0) ZEN_OPTIONS.splice(k, 1);
    }
    buildCarouselButtons();   // índices/closures voltam a ser coerentes
    selectedIdx = (zenOn && activeOption)
        ? ZEN_OPTIONS.indexOf(activeOption) : 0;
    if (selectedIdx < 0) selectedIdx = 0;
    updateZenBtn();           // ícone + renderCarousel + título
}

// Posiciona cada opção no anel: --s = slot vertical (-1 acima · 0 centro;
// TUDO o resto fica fora da janela — apenas 2 ícones visíveis). ACIMA fica
// sempre a PRÓXIMA opção do anel — o scroll para baixo "puxa" o carrossel
// para baixo e a opção de cima entra no centro (botão); a opção que sai
// pelo fundo simplesmente desvanece.
//
// ÍCONE DE PAUSA: com a feature ARMADA (a UI já se escondeu ≥1 vez desde
// a activação) e um vídeo em reprodução, o CENTRO mostra o ícone de
// pausa em vez do ícone da categoria — sinal de que o clique vai PARAR o
// vídeo (e repor o default). O dataset.pauseMode evita re-escrever o HTML
// quando o estado não muda; a condição NÃO depende de carouselOpen para
// que o fecho (item a desvanecer-se) NÃO troque pausa→categoria a meio
// do fade (a troca só acontece no próximo render com outro estado).
function renderCarousel() {
    const n = ZEN_OPTIONS.length;
    const items = track.children;
    // v15: só mostra o ícone de pausa quando a opção CENTRADA é
    // realmente a que está a tocar — antes disparava sempre que ALGO
    // estava activo, mesmo com outra categoria em pré-visualização no
    // centro (scroll), fazendo parecer que o clique ia pausar em vez de
    // trocar de categoria.
    const showPause = pauseHintArmed && zenOn && !!activeOption &&
        ZEN_OPTIONS[selectedIdx] === activeOption;
    for (let i = 0; i < items.length; i++) {
        let d = (i - selectedIdx + n) % n;
        if (d > n / 2) d -= n;
        const s = -d;
        const el = items[i];
        el.style.setProperty('--s', s);
        el.classList.toggle('center', s === 0);
        el.classList.toggle('near', s === -1);   // apenas o SUPERIOR
        el.classList.toggle('far', s !== 0 && s !== -1);
        el.classList.toggle('playing', !!(zenOn && activeOption === ZEN_OPTIONS[i]));
        if (s === 0 && showPause) {
            if (!el.dataset.pauseMode) {
                el.innerHTML = pauseIconHtml();
                el.dataset.pauseMode = '1';
            }
        } else if (el.dataset.pauseMode) {
            el.innerHTML = optIconHtml(ZEN_OPTIONS[i]);
            delete el.dataset.pauseMode;
        }
    }
}

// Abrir/fechar com período de graça (evita flicker ao cruzar os espaços
// entre o botão e as opções — o contentor é pointer-events:none)
function openCarousel() {
    if (carouselOpen) return;
    carouselOpen = true;
    carousel.classList.add('open');
    zenBtn.classList.add('icon-hidden');   // o CENTRO do carrossel exibe
    renderCarousel();
}
function closeCarousel() {
    if (!carouselOpen) return;
    carouselOpen = false;
    carousel.classList.remove('open');
    zenBtn.classList.remove('icon-hidden');
    // v12: se a selecção ficou numa PRÉ-VISUALIZAÇÃO nunca confirmada
    // com um clique (ver selectOption), sair do carrossel repõe-na na
    // opção REALMENTE activa — o vídeo a tocar, se houver, ou o default
    // se não houver nada a tocar. Sem isto o botão ficava "preso" a
    // mostrar uma categoria que nunca chegou a arrancar.
    const confirmedIdx = (zenOn && activeOption) ? ZEN_OPTIONS.indexOf(activeOption) : 0;
    if (selectedIdx !== confirmedIdx) {
        selectedIdx = confirmedIdx;
        updateZenBtn();   // já chama renderCarousel() internamente
    } else {
        renderCarousel();
    }
    // Efeito de fecho: só com um vídeo ACTIVO é que o Main Hub desvanece
    // e os botões passam ao modo vídeo. Se o utilizador voltou à opção
    // default, nada acontece (website normal). A UI só se esconde depois
    // do vídeo já estar revelado — ver requestEngage().
    if (zenOn && activeOption) requestEngage();
}

// "TIMER" DA SELECÇÃO (sincronização UI ↔ vídeo): só esconde o Main Hub
// depois do vídeo desta activação já ter sido REVELADO (becomeActive
// define readyToEngage=true — e como a revelação só acontece
// PRE_ROLL_MS depois do PLAYING, a UI nunca se esconde antes de os 3,5s
// terem passado). Se o utilizador tirar o rato do carrossel antes disso,
// a UI fica visível até o vídeo estar pronto — nunca há um "vazio" (hub
// já escondido, vídeo ainda invisível/mudo). Se o rato AINDA estiver no
// carrossel quando o vídeo revela, o pedido aguarda o fecho normal. E se
// o vídeo já tiver revelado (o utilizador demorou a sair), o
// comportamento é o normal: esconde-se de imediato no fecho.
function requestEngage() {
    if (readyToEngage) { engageVideoMode(); return; }
    engagePending = true;
}

wrap.addEventListener('mouseenter', function() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    openCarousel();
});
wrap.addEventListener('mouseleave', function() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(function() {
        closeTimer = null;
        closeCarousel();
    }, CLOSE_DELAY);
});

// Selecção (scroll, clique) — v12: PRÉ-VISUALIZAÇÃO apenas. Só move
// selectedIdx e re-renderiza; NUNCA chama activateOption/deactivateZen
// (isso ficou reservado ao clique de confirmação no botão — ver
// zenBtn.addEventListener('click') e a nota "SELECÇÃO EM DOIS PASSOS"
// no topo do ficheiro).
function selectOption(i) {
    if (i === selectedIdx) return;   // centro → os cliques vão ao botão
    selectedIdx = i;
    updateZenBtn();
}

function rotate(dir) {
    const n = ZEN_OPTIONS.length;
    selectOption((selectedIdx + dir + n) % n);
}

// Scroll do rato: para BAIXO puxa o carrossel para baixo (a opção de
// cima fica seleccionada); para cima é o inverso
wrap.addEventListener('wheel', function(e) {
    e.preventDefault();
    rotate(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

// Clique no botão principal (centro do carrossel): com um vídeo ACTIVO,
// desliga-o e REPÕE A SELECÇÃO NO DEFAULT — o botão volta ao ícone
// oficial (em vez de ficar "parado" no ícone da categoria em forma
// desactivada); desligado → liga (opção seleccionada/1ª funcional)
zenBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    // v15: usa confirmSelection com o que estiver CENTRADO no momento —
    // cobre tanto o botão fechado (selectedIdx = opção activa ou 0) como
    // o centro do carrossel aberto depois de uma pré-visualização por
    // scroll (selectedIdx pode já não ser a opção activa — nesse caso
    // troca de categoria em vez de pausar, ver confirmSelection).
    confirmSelection(ZEN_OPTIONS[selectedIdx], true);
});

// ═════════════════════════════════════════════════════════════════
// ARRANQUE
// ═════════════════════════════════════════════════════════════════
applySoundVisual(true);   // som LIGADO por defeito (fade-in ao activar),
                          // igual em todos os browsers
renderCarousel();
updateZenBtnTitle();      // label inicial do botão (estado default)
sizeCovers();
setTimeout(sizeCovers, 400);   // após o zoom do body assentar

// PRÉ-CARGA em background (compatibilidade Firefox — ver createIdle-
// Player): a API do YouTube e o 1.º player ficam prontos pouco depois
// do arranque, SEM tocar nada (não viola o espírito "nada de autoplay"
// do hub — o vídeo só arranca mesmo por clique). Assim, o 1.º clique
// no botão zen executa o play SINCRONAMENTE dentro do gesto — em vez
// de o perder na cadeia assíncrona download→onReady→playVideo. Nos
// Chromium a pré-carga torna a 1.ª activação mais rápida.
setTimeout(startPreload, 800);

// (v16 · DUAS FACES) A detecção confirmou DESPROTECÇÃO (sem adblock
// e sem Brave) — pode acontecer a qualquer momento: no page load (o
// normal — o fetch de publicidade responde em meros milissegundos
// quando não há bloqueio) ou já com o zen ACTIVO (queue construída
// durante a pendência da detecção). Três acções, nesta ordem:
//   1. CATEGORIAS VAZIAS saem do carrossel (applyZenAdsCategoryFilter
//      — categorias cujos vídeos têm TODOS anúncio sem alternativa);
//   2. com o zen ACTIVO: notifica já (a 1.ª categoria activada da
//      sessão pode ter corrido antes da detecção responder) — o aviso
//      é 1× por sessão de página, o zen-ads.js trata da duplicação;
//   3. se o vídeo ACTIVO for um ads:true (só possível quando a queue
//      nasceu durante a pendência), troca já para o próximo vídeo
//      disponível pela MESMA via da troca manual (crossfade limpo —
//      nunca corte a preto): um vídeo sem anúncio, ou a ALTERNATIVA
//      de baixa qualidade de outro vídeo (o playbackVideoIdOf do
//      loadVideoInto resolve o ID). Sem mais vídeos → o zen desliga
//      sozinho (comportamento normal de queue vazia).
if (window.ZenAds) {
    window.ZenAds.onUnprotected(function() {
        applyZenAdsCategoryFilter();
        if (!zenOn) return;
        window.ZenAds.notifyIfUnprotected();
        if (activeSlot && slotVideo[activeSlot] &&
            slotVideo[activeSlot].ads) {
            playNextVideo();
        }
    });
}
let rszT = null;
window.addEventListener('resize', function() {
    if (rszT) clearTimeout(rszT);
    rszT = setTimeout(sizeCovers, 120);
});

// API de depuração/extensão (consola): window._zenCtrl
window._zenCtrl = {
    options: ZEN_OPTIONS,
    state: function() {
        return {
            zenOn: zenOn, activeOption: activeOption ? activeOption.id : null,
            activeVideoId: activeVideoId, activeSlot: activeSlot,
            selectedIdx: selectedIdx, soundOn: soundOn, volume: volume,
            strictAudio: STRICT_AUDIO, qualityMode: qualityMode,
            videoMode: videoModeOn(), carouselOpen: carouselOpen,
            pauseHintArmed: pauseHintArmed, failedIds: failedList(),
        };
    },
    isActive: function() { return !!(zenOn && activeOption); },
    activate: activateOption,
    deactivate: deactivateZen,
    setSound: setSound,
    next: switchVideo,
    // ── QUALIDADE ADAPTATIVA (v10) — introspecção/debug/consola ──
    qualityMode: function() { return qualityMode; },
    // (v17) Diagnóstico COMPLETO de qualidade (consola): o que o player
    // está a servir, o que o vídeo oferece e o que o motor decidiu.
    // Distingue "o YouTube ainda está a processar o 4K do re-upload"
    // (available SEM hd2160 → nada a fazer, sobe sozinho quando o
    // processamento terminar) de "o site limitou" (mode 'floor' +
    // playing 'hd1080' num vídeo com hd2160 disponível).
    qualityInfo: function() {
        const p = activeSlot && players[activeSlot];
        let cur = null, levels = null;
        try {
            if (p) {
                if (p.getPlaybackQuality)     cur    = p.getPlaybackQuality();
                if (p.getAvailableQualityLevels) levels = p.getAvailableQualityLevels();
            }
        } catch (e) {}
        return {
            mode: qualityMode,            // 'max' (nunca corta) | 'floor' (1080)
            activeSlot: activeSlot,
            playing: cur,                 // qualidade que o player serve AGORA
            peakRank: slotPeakRank[activeSlot],  // pico atingido (subida conta)
            available: levels             // o que ESTE vídeo oferece
        };
    },
    qualityForce: setQualityMode,              // debug: 'max' | 'floor'
    qualityRecover: recoverQualityIfStable,    // tick manual da recuperação
    // ── QUEUE DE VÍDEOS (v11) — introspecção/debug/consola ──
    queue: function() {
        return {
            order: videoQueue.map(function(v) { return v.id; }),
            next: queueIdx
        };
    },
    // ── VERIFICAÇÃO DE VÍDEOS (v10) ──
    verifyVideos: runVideoCheck,
    lastCheckReport: function() { return lastCheckReport; }
};

})();
