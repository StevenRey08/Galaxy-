(function () {
  /* ============ PERSONALIZACIÓN ============ */
  var CONFIG = {
    nombre: '',   // su nombre, por ejemplo 'Valeria'. Vacío = "Para ti"
    firma: ''     // tu nombre, por ejemplo 'Rey'. Vacío = sin firma
  };
  var MESSAGES = [
    'Entre todas las estrellas que existen, tú eres la única que de verdad miro.',
    'Hay galaxias enteras a millones de años luz, y aun así lo más hermoso que conozco está cerca de mí: tú.',
    'Contigo, hasta los días normales tienen luz propia.',
    'Si me dieran a elegir otra vez, te elegiría en todos los universos.',
    'Tu risa es mi sonido favorito. Ninguna estrella suena tan bonito.',
    'No sé cuántas estrellas hay en el cielo, pero sé que ninguna brilla como tú cuando sonríes.',
    'Gracias por ser mi calma cuando el mundo hace demasiado ruido.',
    'Mi lugar favorito no aparece en ningún mapa. Queda donde estés tú.',
    'Hay luz que tarda siglos en llegar a su destino. Yo te encontré a ti, y fue lo mejor que me ha pasado.',
    'Quiero ser tu casa cuando estés cansada y tu aventura cuando quieras volar.',
    'Cada vez que pienso en ti se enciende una estrella nueva. Mira cuántas ya hay.',
    'Prometo cuidarte, hacerte reír y buscarte en cada versión del futuro.',
    'Si el amor fuera una galaxia, la mía tendría tu nombre en cada brazo.',
    'Eres mi casualidad favorita y mi destino más bonito.'
  ];
  var NH = MESSAGES.length;
  var nombre = (CONFIG.nombre || '').trim();
  var firma = (CONFIG.firma || '').trim();
  /* ========================================= */

  var stage = document.getElementById('stage');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var $ = function (id) { return document.getElementById(id); };

  $('dedic').textContent = nombre ? 'Para ' + nombre : 'Para ti';

  function reveal(el, text, base, step) {
    el.textContent = '';
    text.split(' ').forEach(function (w, i, arr) {
      var s = document.createElement('span');
      s.className = 'w';
      s.style.animationDelay = (base + i * step) + 's';
      s.textContent = w;
      el.appendChild(s);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  function fail(msgText) {
    var d = document.createElement('div'); d.className = 'err'; d.textContent = msgText; document.body.appendChild(d);
  }
  if (!window.THREE) { fail('No se pudo cargar el motor 3D. Revisa tu conexión a internet.'); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { fail('Tu navegador no permite WebGL, necesario para ver la galaxia.'); return; }
  renderer.setClearColor(0x020203, 1);
  stage.appendChild(renderer.domElement);
  var canvas = renderer.domElement;
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); }, false);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  var R = 6;
  var uniforms = {
    uTime: { value: 0 }, uPixel: { value: 1 }, uMorph: { value: 0 }, uBeat: { value: 0 }, uAppear: { value: 0 }
  };

  /* ---------- Shaders ---------- */
  var vert = [
    'attribute vec3 aHeart;',
    'attribute float aRadius;',
    'attribute float aSize;',
    'attribute float aAlpha;',
    'attribute float aRand;',
    'attribute float aFlare;',
    'uniform float uTime;',
    'uniform float uPixel;',
    'uniform float uMorph;',
    'uniform float uBeat;',
    'uniform float uAppear;',
    'varying float vAlpha;',
    'varying float vFlare;',
    'void main() {',
    '  vec3 p = position;',
    '  float ang = uTime * 0.5 / (0.7 + aRadius * 0.5);',
    '  float c = cos(ang); float s = sin(ang);',
    '  p = vec3(p.x * c - p.z * s, p.y + sin(uTime * 0.7 + aRand * 6.2831) * 0.03, p.x * s + p.z * c);',
    '  vec3 h = aHeart * (1.0 + uBeat * 0.06);',
    '  h.z += sin(uTime * 0.9 + aRand * 6.2831) * 0.05;',
    '  vec3 q = mix(p, h, uMorph);',
    '  vec4 mv = modelViewMatrix * vec4(q, 1.0);',
    '  gl_Position = projectionMatrix * mv;',
    '  float ap = clamp(uAppear * 1.8 - min(aRadius / 6.0, 1.0) * 0.8, 0.0, 1.0);',
    '  float hero = aFlare > 0.5 ? 1.0 : 0.0;',
    '  float pulse = 1.0 + hero * (aFlare > 1.5 ? 0.1 : 0.22) * sin(uTime * 1.8 + aRand * 6.2831);',
    '  float sz = aSize * pulse * (0.4 + 0.6 * ap) * uPixel * (14.0 / -mv.z);',
    '  gl_PointSize = max(sz, 3.0 * uPixel);',
    '  float tw = 0.8 + 0.2 * sin(uTime * 2.0 + aRand * 60.0);',
    '  vAlpha = aAlpha * (hero > 0.5 ? 1.0 : tw) * ap;',
    '  vFlare = aFlare;',
    '}'
  ].join('\n');

  var frag = [
    'varying float vAlpha;',
    'varying float vFlare;',
    'void main() {',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float d = length(c);',
    '  float f = vFlare > 0.5 ? 1.0 : 0.0;',
    '  float f2 = vFlare > 1.5 ? 1.0 : 0.0;',
    '  float dd = d * (1.0 + f * 2.6);',
    '  float dotv = 1.0 - smoothstep(0.17, 0.25, dd);',
    '  float halo = pow(max(0.0, 1.0 - d * 2.0), 3.0) * 0.28;',
    '  float sp = (exp(-abs(c.x) * 70.0) * exp(-abs(c.y) * 6.0) + exp(-abs(c.y) * 70.0) * exp(-abs(c.x) * 6.0)) * 0.95 * f;',
    '  vec2 r = vec2(c.x + c.y, c.x - c.y) * 0.7071;',
    '  float dg = (exp(-abs(r.x) * 70.0) * exp(-abs(r.y) * 9.0) + exp(-abs(r.y) * 70.0) * exp(-abs(r.x) * 9.0)) * 0.7 * f2;',
    '  float a = clamp(dotv + halo + sp + dg, 0.0, 1.0) * vAlpha;',
    '  if (a < 0.01) discard;',
    '  gl_FragColor = vec4(1.0, 1.0, 1.0, a);',
    '}'
  ].join('\n');

  var material = new THREE.ShaderMaterial({
    uniforms: uniforms, vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });

  /* ---------- Galaxia ---------- */
  var galaxy = null;
  var BULGE = 240, ARM = 2160;
  var COUNT = BULGE + ARM;
  var PERM = [5, 11, 2, 8, 13, 0, 9, 4, 12, 6, 1, 10, 3, 7];
  var heroIdx = [];
  var P, H3, RAD, RND, FLR;
  var found = [], foundNo = [], order = [];
  for (var q0 = 0; q0 < NH; q0++) { found[q0] = false; foundNo[q0] = 0; }

  function gauss() { return (Math.random() + Math.random() + Math.random()) / 1.5 - 1; }

  function heartPoint(i, hk) {
    var sc = 0.27;
    if (hk >= 0) {
      var th = (PERM[hk] + 0.5) / NH * Math.PI * 2;
      return [16 * Math.pow(Math.sin(th), 3) * sc, (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) * sc + 0.65, gauss() * 0.08];
    }
    var t = Math.random() * Math.PI * 2;
    var hx = 16 * Math.pow(Math.sin(t), 3);
    var hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    var edge = i % 100 < 52;
    var k = edge ? 1 : Math.sqrt(Math.random()) * 0.93;
    var jit = edge ? 0.05 : 0;
    return [hx * sc * k + gauss() * jit, hy * sc * k + 0.65 + gauss() * jit, gauss() * 0.28 * (0.4 + k * 0.6)];
  }

  function build(arms) {
    if (galaxy) { scene.remove(galaxy); galaxy.geometry.dispose(); }
    P = new Float32Array(COUNT * 3); H3 = new Float32Array(COUNT * 3);
    RAD = new Float32Array(COUNT); RND = new Float32Array(COUNT); FLR = new Float32Array(COUNT);
    var size = new Float32Array(COUNT), alpha = new Float32Array(COUNT);
    var heroOf = new Int16Array(COUNT);
    for (var z0 = 0; z0 < COUNT; z0++) heroOf[z0] = -1;
    for (var k = 0; k < NH; k++) { heroIdx[k] = BULGE + Math.floor((k + 0.5) * ARM / NH); heroOf[heroIdx[k]] = k; }
    var spin = 1.05;

    for (var i = 0; i < COUNT; i++) {
      var x, y, z, r, hk = heroOf[i];
      if (i < BULGE) {
        var br = Math.abs(gauss()) * 1.35, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        x = br * Math.sin(ph) * Math.cos(th); y = br * Math.cos(ph) * 0.6; z = br * Math.sin(ph) * Math.sin(th);
        r = Math.sqrt(x * x + z * z);
      } else if (hk >= 0) {
        r = 1.1 + (PERM[hk] + 0.5) / NH * (R - 1.6);
        var a0 = (i % arms) / arms * Math.PI * 2 + r * spin;
        x = Math.cos(a0) * r; z = Math.sin(a0) * r; y = gauss() * 0.04;
      } else {
        r = Math.pow(Math.random(), 1.25) * R + 0.35;
        var a = (i % arms) / arms * Math.PI * 2 + r * spin;
        var spread = 0.04 + r * 0.045;
        x = Math.cos(a) * r + gauss() * spread * 2.4;
        z = Math.sin(a) * r + gauss() * spread * 2.4;
        y = gauss() * spread * 0.9;
        r = Math.sqrt(x * x + z * z);
      }
      var sz = 3.0 + Math.pow(Math.random(), 2.2) * 3.6, al = 0.6 + Math.random() * 0.4, fl = 0;
      if (hk >= 0) { sz = 26 + (hk % 3) * 4; al = 1; fl = found[hk] ? 2 : 1; }
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
      var hp = heartPoint(i, hk);
      H3[i * 3] = hp[0]; H3[i * 3 + 1] = hp[1]; H3[i * 3 + 2] = hp[2];
      RAD[i] = r; size[i] = sz; alpha[i] = al; RND[i] = Math.random(); FLR[i] = fl;
    }

    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('aHeart', new THREE.BufferAttribute(H3, 3));
    g.setAttribute('aRadius', new THREE.BufferAttribute(RAD, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    g.setAttribute('aRand', new THREE.BufferAttribute(RND, 1));
    g.setAttribute('aFlare', new THREE.BufferAttribute(FLR, 1));
    galaxy = new THREE.Points(g, material);
    galaxy.frustumCulled = false;
    scene.add(galaxy);
  }

  /* ---------- Fondo ---------- */
  var bgMat;
  (function () {
    var n = 650, p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), d = 60 + Math.random() * 40;
      p[i * 3] = d * Math.sin(ph) * Math.cos(th); p[i * 3 + 1] = d * Math.cos(ph); p[i * 3 + 2] = d * Math.sin(ph) * Math.sin(th);
      var k = 0.3 + Math.random() * 0.7; c[i * 3] = k; c[i * 3 + 1] = k; c[i * 3 + 2] = k;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    bgMat = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    scene.add(new THREE.Points(g, bgMat));
  })();

  /* ---------- Resplandor del núcleo ---------- */
  var glow;
  (function () {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.2, 'rgba(255,255,255,0.3)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(3.4, 3.4, 1);
    scene.add(glow);
  })();

  /* ---------- Estrella fugaz ---------- */
  var TRAIL = 16;
  var shootPos = new Float32Array(TRAIL * 3), shootCol = new Float32Array(TRAIL * 3);
  var sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(shootPos, 3));
  sg.setAttribute('color', new THREE.BufferAttribute(shootCol, 3));
  var shooter = new THREE.Points(sg, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  shooter.frustumCulled = false; shooter.visible = false;
  scene.add(shooter);
  var shoot = { active: false, head: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0 };
  var nextShoot = 9;
  function spawnShoot() {
    var fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    var right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    var up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    var sgn = Math.random() < 0.5 ? 1 : -1;
    shoot.head.copy(camera.position).addScaledVector(fwd, 16).addScaledVector(right, sgn * (5 + Math.random() * 3)).addScaledVector(up, 2.5 + Math.random() * 3);
    shoot.vel.set(0, 0, 0).addScaledVector(right, -sgn).addScaledVector(up, -0.45).normalize().multiplyScalar(13 + Math.random() * 4);
    shoot.life = 1.25; shoot.active = true; shooter.visible = true;
  }
  function updateShoot(dt) {
    if (!shoot.active) return;
    shoot.life -= dt;
    shoot.head.addScaledVector(shoot.vel, dt);
    var dir = shoot.vel.clone().normalize(), fade = Math.max(0, Math.min(1, shoot.life / 0.5));
    for (var i = 0; i < TRAIL; i++) {
      var tp = shoot.head.clone().addScaledVector(dir, -i * 0.28);
      shootPos[i * 3] = tp.x; shootPos[i * 3 + 1] = tp.y; shootPos[i * 3 + 2] = tp.z;
      var k = Math.pow(1 - i / TRAIL, 1.6) * fade;
      shootCol[i * 3] = k; shootCol[i * 3 + 1] = k; shootCol[i * 3 + 2] = k;
    }
    sg.attributes.position.needsUpdate = true; sg.attributes.color.needsUpdate = true;
    if (shoot.life <= 0) { shoot.active = false; shooter.visible = false; }
  }

  /* ---------- Sonido ---------- */
  var AC = window.AudioContext || window.webkitAudioContext;
  var actx = null, master = null, bus = null, soundOn = true;
  var SCALE = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73];
  function initAudio() {
    if (!AC || actx) return;
    try {
      actx = new AC();
      master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination);
      var len = actx.sampleRate * 3, ir = actx.createBuffer(2, len, actx.sampleRate);
      for (var ch = 0; ch < 2; ch++) { var dta = ir.getChannelData(ch); for (var i = 0; i < len; i++) dta[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      var conv = actx.createConvolver(); conv.buffer = ir;
      var wet = actx.createGain(); wet.gain.value = 0.55; conv.connect(wet); wet.connect(master);
      var dry = actx.createGain(); dry.gain.value = 0.6; dry.connect(master);
      bus = actx.createGain(); bus.connect(conv); bus.connect(dry);
      master.gain.setTargetAtTime(soundOn ? 0.7 : 0, actx.currentTime, 1.2);
      var filt = actx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 700; filt.connect(bus);
      [110, 164.81, 220, 277.18, 329.63].forEach(function (f, n) {
        [-4, 4].forEach(function (det) {
          var o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = det;
          var g = actx.createGain(); g.gain.value = 0.03;
          var lfo = actx.createOscillator(); lfo.frequency.value = 0.04 + n * 0.017; var lg = actx.createGain(); lg.gain.value = 0.02;
          lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(filt); o.start(); lfo.start();
        });
      });
    } catch (e) { actx = null; }
  }
  function chime(freq, delay, vol) {
    if (!actx || !soundOn) return;
    var now = actx.currentTime + (delay || 0);
    [[freq, 'sine', 1], [freq * 2, 'triangle', 0.22], [freq * 3.01, 'sine', 0.07]].forEach(function (p, n) {
      var o = actx.createOscillator(); o.type = p[1]; o.frequency.value = p[0];
      var g = actx.createGain(), peak = (vol || 0.2) * p[2], dec = n === 2 ? 1.2 : 3.2;
      g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(peak, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0005, now + dec);
      o.connect(g); g.connect(bus); o.start(now); o.stop(now + dec + 0.1);
    });
  }
  function playStar(n) { chime(SCALE[(n - 1) % SCALE.length], 0, 0.22); chime(SCALE[(n + 1) % SCALE.length] / 2, 0.12, 0.09); }
  function playHeart() { [440, 554.37, 659.25, 880, 1108.73, 1318.51].forEach(function (f, i) { chime(f, i * 0.2, 0.17); }); }
  function playBack() { chime(880, 0, 0.15); chime(659.25, 0.25, 0.14); chime(440, 0.5, 0.14); }

  var soundBtn = $('sound');
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.textContent = soundOn ? 'Sonido' : 'Silencio';
    if (master) master.gain.setTargetAtTime(soundOn ? 0.7 : 0, actx.currentTime, 0.15);
  });

  /* ---------- Mensajes ---------- */
  var msgEl = $('msg'), eyebrowEl = $('eyebrow'), mtextEl = $('mtext'), msigEl = $('msig');
  var msgOpen = false, activeStar = -1, finalePending = false, finaleDone = false, finaleTimer = 0, heartTimer = 0;
  var sub = $('sub'), hint = $('hint');

  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function updateSub() { sub.textContent = fmt(COUNT) + ' estrellas · ' + order.length + ' de ' + NH + ' descubiertas'; }
  updateSub();

  function showMsg(eyebrow, text, sig, star) {
    msgOpen = true; activeStar = star;
    eyebrowEl.textContent = eyebrow;
    reveal(mtextEl, text, 0.2, 0.11);
    msigEl.textContent = sig || '';
    msgEl.classList.add('show'); msgEl.setAttribute('aria-hidden', 'false');
  }
  function closeMsg(skipFinale) {
    if (!msgOpen) return;
    msgOpen = false; activeStar = -1;
    msgEl.classList.remove('show'); msgEl.setAttribute('aria-hidden', 'true');
    if (finalePending && !skipFinale) {
      finalePending = false; clearTimeout(finaleTimer);
      setTimeout(function () { if (!heartOn) setHeart(true, true); }, 1100);
    }
  }
  $('mclose').addEventListener('click', function () { closeMsg(); });

  function openStar(k) {
    if (!ready) return;
    hint.classList.remove('show');
    if (heartTimer) { clearTimeout(heartTimer); heartTimer = 0; }
    if (!found[k]) {
      found[k] = true; order.push(k); foundNo[k] = order.length;
      FLR[heroIdx[k]] = 2; galaxy.geometry.attributes.aFlare.needsUpdate = true;
      updateSub();
    }
    playStar(foundNo[k]);
    showMsg('Estrella ' + foundNo[k] + ' de ' + NH, MESSAGES[k], '', k);
    if (order.length === NH && !finaleDone) {
      finaleDone = true; finalePending = true;
      finaleTimer = setTimeout(function () { closeMsg(); }, 12000);
    }
  }

  /* ---------- Corazón ---------- */
  var heartOn = false, morph = 0;
  var heartBtn = $('heart');
  var yaw = -1.3, pitch = 0.62, dist = 34, fit = 1;
  var tYaw = yaw, tPitch = pitch, tDist = dist;

  function setHeart(on, final) {
    finalePending = false; clearTimeout(finaleTimer); clearTimeout(heartTimer);
    closeMsg(true);
    heartOn = on;
    heartBtn.setAttribute('aria-pressed', String(on));
    heartBtn.textContent = on ? 'Volver a la galaxia' : 'Formar corazón';
    if (on) {
      var turns = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2;
      yaw -= turns; tYaw = 0; tPitch = 0.08; tDist = 11.5;
      playHeart();
      heartTimer = setTimeout(function () {
        var nm = nombre ? ', ' + nombre : '';
        var text = final
          ? 'Las encontraste todas. Cada una era una razón, y juntas forman lo único que sí alcanza para decirlo: te amo' + nm + '.'
          : 'Si pudiera ordenar todas las estrellas del cielo, las pondría así: formando lo único que quiero decirte. Te amo' + nm + '.';
        showMsg(nombre || 'Para ti', text, firma ? '— ' + firma : '', -1);
      }, 2600);
    } else {
      tPitch = 0.62; tDist = 12.5;
      playBack();
      heartTimer = setTimeout(function () {
        showMsg('Siempre', 'Aunque el corazón se deshaga en estrellas, sigue siendo tuyo.', '', -1);
      }, 1800);
    }
  }
  heartBtn.addEventListener('click', function () { setHeart(!heartOn, false); });

  /* ---------- Brazos, velocidad, pausa ---------- */
  var armsWrap = $('arms'), armBtns = [];
  function setArms(n) {
    build(n);
    armBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.textContent === n)); });
  }
  [2, 3, 4, 5].forEach(function (n) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = n;
    b.addEventListener('click', function () { setArms(n); });
    armsWrap.appendChild(b); armBtns.push(b);
  });
  var speedEl = $('speed'), pauseEl = $('pause');
  var speed = reduce ? 0.2 : 1, paused = false;
  speedEl.value = speed;
  speedEl.addEventListener('input', function () { speed = +speedEl.value; });
  pauseEl.addEventListener('click', function () {
    paused = !paused;
    pauseEl.setAttribute('aria-pressed', String(paused));
    pauseEl.textContent = paused ? 'Reanudar' : 'Pausa';
  });

  /* ---------- Cámara y punteros ---------- */
  var pointers = {}, lastPinch = 0, idle = 0, camK = 0.0015;
  var down = null, multi = false;
  var W = 1, Hh = 1, viewY = 0;
  var ready = false;
  var TAP_R = coarse ? 46 : 38, HOVER_R = 30;
  function clampPitch(v) { return Math.max(-1.35, Math.min(1.35, v)); }
  function clampDist(v) { return Math.max(3, Math.min(30, v)); }

  var heroScr = [];
  for (var hs = 0; hs < NH; hs++) heroScr.push({ x: 0, y: 0, vis: false });
  var tmpV = new THREE.Vector3();
  var t = 0;
  function heroPos(k, out) {
    var i = heroIdx[k], x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], r = RAD[i], rn = RND[i];
    var ang = t * 0.5 / (0.7 + r * 0.5), c = Math.cos(ang), s = Math.sin(ang);
    var sx = x * c - z * s, sy = y + Math.sin(t * 0.7 + rn * 6.2831) * 0.03, sz = x * s + z * c;
    var bt = 1 + uniforms.uBeat.value * 0.06;
    var hx = H3[i * 3] * bt, hy = H3[i * 3 + 1] * bt, hz = H3[i * 3 + 2] * bt + Math.sin(t * 0.9 + rn * 6.2831) * 0.05;
    var m = uniforms.uMorph.value;
    out.set(sx + (hx - sx) * m, sy + (hy - sy) * m, sz + (hz - sz) * m);
  }
  function updateHeroScreens() {
    camera.updateMatrixWorld(true);
    for (var k = 0; k < NH; k++) {
      heroPos(k, tmpV); tmpV.project(camera);
      var o = heroScr[k];
      o.x = (tmpV.x * 0.5 + 0.5) * W; o.y = (-tmpV.y * 0.5 + 0.5) * Hh;
      o.vis = tmpV.z < 1 && tmpV.z > -1;
    }
  }
  function nearestStar(px, py, maxd) {
    var best = -1, bd = maxd;
    for (var k = 0; k < NH; k++) {
      var o = heroScr[k]; if (!o.vis) continue;
      var d = Math.hypot(o.x - px, o.y - py);
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }

  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    canvas.classList.add('drag');
    idle = 0;
    var ids = Object.keys(pointers);
    if (ids.length === 1) { down = { x: e.clientX, y: e.clientY, time: performance.now() }; multi = false; }
    else { multi = true; }
    if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; lastPinch = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pointers[e.pointerId];
    if (!p) {
      if (ready && !coarse) canvas.style.cursor = nearestStar(e.clientX, e.clientY, HOVER_R) >= 0 ? 'pointer' : '';
      return;
    }
    var ids = Object.keys(pointers);
    if (ids.length === 1) {
      tYaw -= (e.clientX - p.x) * 0.006;
      tPitch = clampPitch(tPitch + (e.clientY - p.y) * 0.006);
    } else if (ids.length === 2) {
      p.x = e.clientX; p.y = e.clientY;
      var a = pointers[ids[0]], b = pointers[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinch > 0) tDist = clampDist(tDist * (lastPinch / d));
      lastPinch = d;
    }
    p.x = e.clientX; p.y = e.clientY; idle = 0;
  });
  function endPointer(e, cancelled) {
    delete pointers[e.pointerId];
    if (!Object.keys(pointers).length) canvas.classList.remove('drag');
    lastPinch = 0;
    if (!cancelled && down && !multi && ready) {
      var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.time;
      if (moved < 9 && dt < 600) {
        var k = nearestStar(e.clientX, e.clientY, TAP_R);
        if (k >= 0) openStar(k); else if (msgOpen) closeMsg();
      }
    }
    if (!Object.keys(pointers).length) down = null;
  }
  canvas.addEventListener('pointerup', function (e) { endPointer(e, false); });
  canvas.addEventListener('pointercancel', function (e) { endPointer(e, true); });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    tDist = clampDist(tDist * Math.exp(e.deltaY * 0.0012));
    idle = 0;
  }, { passive: false });

  /* ---------- Tamaño: cualquier pantalla ---------- */
  var panel = $('panel');
  var prCap = 2;
  function resize() {
    W = stage.clientWidth || window.innerWidth; Hh = stage.clientHeight || window.innerHeight;
    var pr = Math.min(window.devicePixelRatio || 1, prCap);
    renderer.setPixelRatio(pr);
    renderer.setSize(W, Hh, false);
    var aspect = W / Hh;
    camera.aspect = aspect;
    camera.fov = aspect < 1 ? 55 + (1 - aspect) * 38 : 55;   /* más ángulo en pantallas altas */
    fit = aspect < 1 ? 1 + (1 - aspect) * 0.35 : 1;           /* más distancia en pantallas altas */
    camera.updateProjectionMatrix();
    uniforms.uPixel.value = pr * Math.max(0.75, Math.min(1.8, Hh / 800));
    document.documentElement.style.setProperty('--panel-h', (panel.offsetHeight || 120) + 'px');
  }
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { resize(); });
    ro.observe(stage); ro.observe(panel);
  } else {
    window.addEventListener('resize', resize);
  }
  window.addEventListener('orientationchange', function () { setTimeout(resize, 250); });
  resize();
  setArms(3);

  /* ---------- Entrada ---------- */
  reveal($('i1'), 'Buenos días, bb,', 0.8, 0.28);
  reveal($('i2'), 'que tengas un hermoso día.', 2.0, 0.3);
  setTimeout(function () { $('enterwrap').classList.add('show'); }, reduce ? 300 : 5200);

  var appearStart = 0, entered = false;
  $('enter').addEventListener('click', function () {
    if (entered) return;
    entered = true;
    initAudio();
    if (actx && actx.state === 'suspended') actx.resume();
    $('intro').classList.add('out');
    setTimeout(function () { var i = $('intro'); if (i) i.style.display = 'none'; }, 2600);
    appearStart = performance.now();
    tYaw = 0.4; tPitch = 0.62; tDist = 12.5;
    camK = reduce ? 0.0015 : 0.18;
    setTimeout(function () { camK = 0.0015; }, 8000);
    setTimeout(function () { $('title').classList.add('on'); }, reduce ? 100 : 3000);
    setTimeout(function () { panel.classList.add('on'); ready = true; resize(); }, reduce ? 200 : 6500);
    setTimeout(function () { hint.classList.add('show'); }, reduce ? 400 : 8000);
    setTimeout(function () { hint.classList.remove('show'); }, reduce ? 9000 : 17000);
  });

  /* ---------- Bucle ---------- */
  var web = { path: $('constel'), ringg: $('ringg'), r0: $('ring0'), r1: $('ring1') };
  var last = performance.now(), rt = 0, perfAcc = 0, perfN = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; rt += dt;
    if (!paused) t += dt * speed;
    uniforms.uTime.value = t;

    var ap = 0;
    if (entered) {
      var u = Math.min(1, (now - appearStart) / (reduce ? 600 : 5500));
      ap = u * u * (3 - 2 * u);
    }
    uniforms.uAppear.value = ap;
    bgMat.opacity = 0.9 * ap;

    morph += ((heartOn ? 1 : 0) - morph) * (1 - Math.pow(0.12, dt));
    var em = morph * morph * (3 - 2 * morph);
    uniforms.uMorph.value = em;
    uniforms.uBeat.value = (reduce || paused) ? 0 : Math.pow(Math.abs(Math.sin(rt * 2.6)), 14) * em;

    idle += dt;
    if (!reduce && !heartOn && ready && idle > 2.5 && !Object.keys(pointers).length) tYaw += dt * 0.05;

    var k = 1 - Math.pow(camK, dt);
    yaw += (tYaw - yaw) * k; pitch += (tPitch - pitch) * k; dist += (tDist - dist) * k;
    var d = dist * fit;
    camera.position.set(d * Math.cos(pitch) * Math.sin(yaw), d * Math.sin(pitch), d * Math.cos(pitch) * Math.cos(yaw));
    camera.lookAt(0, 0, 0);

    var vyT = msgOpen ? Hh * 0.13 : 0;
    viewY += (vyT - viewY) * (1 - Math.pow(0.02, dt));
    camera.setViewOffset(W, Hh, 0, viewY, W, Hh);

    glow.material.opacity = 0.55 * ap * (1 - em * 0.85);
    var pulse = 1 + Math.sin(t * 1.3) * 0.05;
    glow.scale.set(3.4 * pulse, 3.4 * pulse, 1);

    if (ready && !reduce) {
      nextShoot -= dt;
      if (nextShoot <= 0 && !shoot.active) { spawnShoot(); nextShoot = 6 + Math.random() * 5; }
      updateShoot(dt);
    }

    if (entered) {
      updateHeroScreens();
      /* constelación */
      if (order.length > 1) {
        var path = '', pen = false;
        for (var n = 0; n < order.length; n++) {
          var o = heroScr[order[n]];
          if (!o.vis) { pen = false; continue; }
          path += (pen ? 'L' : 'M') + o.x.toFixed(1) + ' ' + o.y.toFixed(1) + ' ';
          pen = true;
        }
        web.path.setAttribute('d', path);
      }
      /* anillo de la estrella activa */
      if (activeStar >= 0 && heroScr[activeStar].vis) {
        var s = heroScr[activeStar];
        web.ringg.setAttribute('visibility', 'visible');
        web.r0.setAttribute('cx', s.x.toFixed(1)); web.r0.setAttribute('cy', s.y.toFixed(1));
        web.r1.setAttribute('cx', s.x.toFixed(1)); web.r1.setAttribute('cy', s.y.toFixed(1));
      } else {
        web.ringg.setAttribute('visibility', 'hidden');
      }

      /* ajuste automático de calidad en equipos lentos */
      if (ready) {
        perfAcc += dt; perfN++;
        if (perfN >= 90) {
          if (perfAcc / perfN > 0.034 && prCap > 1) { prCap = Math.max(1, prCap - 0.25); resize(); }
          perfAcc = 0; perfN = 0;
        }
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
