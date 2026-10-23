/* ============================================================
   APNA AI COACH — Interactive Frontend Engine
   script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAudioSystem();
  initNavigation();
  initHeroPoseCanvas();
  initBiomechanicalSimulator();
  initGalleryAndLightbox();
  initVideoControls();
  initWorkoutQuiz();
  initScrollEffects();
});

/* ── 1. WEB AUDIO API SYNTHESIZER FOR UI SOUNDS ── */
let audioCtx = null;
let soundEnabled = false;

function initAudioSystem() {
  const audioBtn = document.getElementById('audioToggleBtn');
  if (!audioBtn) return;

  audioBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled && !audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    
    audioBtn.classList.toggle('active', soundEnabled);
    audioBtn.setAttribute('title', soundEnabled ? 'Mute Interface Audio' : 'Enable Cyber UI Sound Effects');
    
    if (soundEnabled) {
      playUiBeep(620, 0.08, 'sine');
      showToast('🔊 Cyber Sound Effects Enabled');
    } else {
      showToast('🔇 Audio Muted');
    }
  });

  // Attach hover sound to clickable buttons
  document.querySelectorAll('button, .nav-link, .btn-hero-primary, .social-action-btn, .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (soundEnabled) playUiBeep(780, 0.03, 'triangle', 0.04);
    });
    el.addEventListener('click', () => {
      if (soundEnabled) playUiBeep(520, 0.06, 'sine', 0.08);
    });
  });
}

function playUiBeep(freq = 440, duration = 0.05, type = 'sine', volume = 0.06) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error('Audio playback error', e);
  }
}

/* ── 2. NAVIGATION & MOBILE DRAWER ── */
function initNavigation() {
  const navbar = document.querySelector('.nav-header');
  const menuToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky nav blur transition
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      mobileDrawer.classList.toggle('open');
      document.body.style.overflow = mobileDrawer.classList.contains('open') ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        mobileDrawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active section scroll spy
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}

/* ── 3. HERO POSE ESTIMATION HUD CANVAS (SQUAT / CURL SIMULATION) ── */
let heroAnimId = null;
let heroPaused = false;
let heroMode = 'squat'; // 'squat' or 'curl'

function initHeroPoseCanvas() {
  const canvas = document.getElementById('heroPoseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const telemetryAngle = document.getElementById('hudAngleVal');
  const telemetryReps = document.getElementById('hudRepVal');
  const telemetryDepth = document.getElementById('hudDepthVal');
  const coachMsg = document.getElementById('hudCoachMsg');
  const pauseBtn = document.getElementById('heroPauseBtn');
  const modeBtn = document.getElementById('heroModeToggleBtn');

  let repCount = 7;
  let animTime = 0;
  let lastPhase = 'standing';

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      heroPaused = !heroPaused;
      pauseBtn.textContent = heroPaused ? 'RESUME HUD' : 'PAUSE HUD';
    });
  }

  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      heroMode = heroMode === 'squat' ? 'curl' : 'squat';
      modeBtn.textContent = heroMode === 'squat' ? 'EXERCISE: SQUATS' : 'EXERCISE: BICEP CURLS';
    });
  }

  function renderHeroFrame() {
    if (!heroPaused) {
      animTime += 0.035;
    }

    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    // Draw Grid overlay inside canvas
    ctx.strokeStyle = 'rgba(0, 245, 160, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 28;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const centerX = w * 0.48;
    const groundY = h * 0.88;

    if (heroMode === 'squat') {
      // Squat kinematics
      const cycle = (Math.sin(animTime) + 1) / 2; // 0 (standing) to 1 (full depth)
      const kneeAngle = Math.round(175 - cycle * 90); // 175° down to 85°
      const hipDrop = cycle * 68;

      if (telemetryAngle) telemetryAngle.textContent = `${kneeAngle}°`;
      
      let phaseText = 'ASCENT';
      let statusColor = '#00f5a0';

      if (cycle > 0.88) {
        phaseText = 'DEPTH: OPTIMAL';
        statusColor = '#00f5a0';
        if (lastPhase !== 'bottom') {
          lastPhase = 'bottom';
          repCount++;
          if (telemetryReps) telemetryReps.textContent = `${repCount < 10 ? '0' + repCount : repCount}/12`;
          if (coachMsg) coachMsg.textContent = 'Excellent depth! Drive up through mid-foot.';
        }
      } else if (cycle > 0.4) {
        phaseText = 'ECCENTRIC';
        statusColor = '#00e5ff';
        lastPhase = 'moving';
      } else {
        phaseText = 'STANDING';
        statusColor = '#94a3b8';
        lastPhase = 'standing';
      }

      if (telemetryDepth) {
        telemetryDepth.textContent = phaseText;
        telemetryDepth.style.color = statusColor;
      }

      // Kinematic coordinates
      const headY = groundY - 170 + hipDrop * 0.9;
      const shoulderY = headY + 30;
      const hipY = shoulderY + 58 + hipDrop;
      const hipX = centerX - cycle * 12; // slight hip hinge back
      const kneeY = groundY - 45 - cycle * 8;
      const kneeX = centerX + 18 + cycle * 10;
      const ankleX = centerX + 14;
      const ankleY = groundY;

      drawSkeletonStick(ctx, centerX, headY, shoulderY, hipX, hipY, kneeX, kneeY, ankleX, ankleY, kneeAngle);
    } else {
      // Bicep curl kinematics
      const cycle = (Math.sin(animTime * 1.2) + 1) / 2;
      const elbowAngle = Math.round(160 - cycle * 115); // 160° down to 45°
      if (telemetryAngle) telemetryAngle.textContent = `${elbowAngle}°`;

      if (cycle > 0.88) {
        if (telemetryDepth) telemetryDepth.textContent = 'PEAK CONTRACTION';
        if (lastPhase !== 'contract') {
          lastPhase = 'contract';
          repCount++;
          if (telemetryReps) telemetryReps.textContent = `${repCount < 10 ? '0' + repCount : repCount}/12`;
          if (coachMsg) coachMsg.textContent = 'Solid squeeze! Control the eccentric descent.';
        }
      } else {
        if (telemetryDepth) telemetryDepth.textContent = cycle > 0.3 ? 'CURLING' : 'START POSITION';
        lastPhase = 'curling';
      }

      drawBicepCurlStick(ctx, centerX, groundY, cycle, elbowAngle);
    }

    heroAnimId = requestAnimationFrame(renderHeroFrame);
  }

  renderHeroFrame();
}

function drawSkeletonStick(ctx, cx, headY, shoulderY, hipX, hipY, kneeX, kneeY, ankleX, ankleY, angle) {
  // Head
  ctx.fillStyle = '#00f5a0';
  ctx.shadowColor = 'rgba(0, 245, 160, 0.8)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(cx, headY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Torso
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY);
  ctx.lineTo(hipX, hipY);
  ctx.stroke();

  // Arms (Crossed / Guarded)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY);
  ctx.lineTo(cx + 25, shoulderY + 22);
  ctx.lineTo(cx + 8, shoulderY + 38);
  ctx.stroke();

  // Upper Leg (Femur)
  ctx.strokeStyle = angle < 95 ? '#00f5a0' : '#ffaa00';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kneeX, kneeY);
  ctx.stroke();

  // Lower Leg (Tibia)
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(kneeX, kneeY);
  ctx.lineTo(ankleX, ankleY);
  ctx.stroke();

  // Foot
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ankleX, ankleY);
  ctx.lineTo(ankleX + 22, ankleY);
  ctx.stroke();

  // Joint Landmark Nodes
  const joints = [
    { x: cx, y: shoulderY, color: '#00e5ff' },
    { x: hipX, y: hipY, color: '#00f5a0' },
    { x: kneeX, y: kneeY, color: angle < 95 ? '#00f5a0' : '#ffaa00' },
    { x: ankleX, y: ankleY, color: '#00e5ff' }
  ];

  joints.forEach(j => {
    ctx.fillStyle = j.color;
    ctx.shadowColor = j.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(j.x, j.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Angle callout arc
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0, 245, 160, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(kneeX, kneeY, 22, 1.2 * Math.PI, 1.8 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = '#00f5a0';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillText(`${angle}°`, kneeX - 35, kneeY - 8);
}

function drawBicepCurlStick(ctx, cx, groundY, cycle, angle) {
  const headY = groundY - 170;
  const shoulderY = headY + 30;
  const hipY = shoulderY + 70;

  // Head
  ctx.fillStyle = '#00f5a0';
  ctx.shadowColor = 'rgba(0, 245, 160, 0.8)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(cx, headY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Spine
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY);
  ctx.lineTo(cx, hipY);
  ctx.stroke();

  // Legs
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx - 10, groundY);
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + 10, groundY);
  ctx.stroke();

  // Upper Arm (Humerus - pinned to side)
  const elbowX = cx + 18;
  const elbowY = shoulderY + 45;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.stroke();

  // Forearm (Moving through flexion)
  const forearmLen = 42;
  const rad = 0.5 * Math.PI + cycle * (1.1 * Math.PI);
  const wristX = elbowX + Math.cos(rad) * forearmLen;
  const wristY = elbowY - Math.sin(rad) * forearmLen;

  ctx.strokeStyle = '#00f5a0';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(wristX, wristY);
  ctx.stroke();

  // Dumbbell
  ctx.fillStyle = '#ffaa00';
  ctx.shadowColor = 'rgba(255, 170, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.rect(wristX - 8, wristY - 5, 16, 10);
  ctx.fill();

  // Joints
  const joints = [
    { x: cx, y: shoulderY, color: '#00e5ff' },
    { x: elbowX, y: elbowY, color: '#00f5a0' },
    { x: wristX, y: wristY, color: '#ffaa00' }
  ];
  joints.forEach(j => {
    ctx.fillStyle = j.color;
    ctx.shadowColor = j.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(j.x, j.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#00f5a0';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillText(`${angle}°`, elbowX + 10, elbowY + 4);
}

/* ── 4. BIOMECHANICAL FORM SIMULATOR PLAYGROUND ── */
function initBiomechanicalSimulator() {
  const canvas = document.getElementById('simPoseCanvas');
  const slider = document.getElementById('simAngleSlider');
  const valReadout = document.getElementById('simValReadout');
  const statusBadge = document.getElementById('simStatusBadge');
  const adviceText = document.getElementById('simAdviceText');
  const audioCta = document.getElementById('simAudioCta');
  const tabBtns = document.querySelectorAll('.sim-tab-btn');

  if (!canvas || !slider) return;
  const ctx = canvas.getContext('2d');

  let currentExercise = 'squat';

  function resizeSimCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    renderSimulator(slider.value);
  }
  resizeSimCanvas();
  window.addEventListener('resize', resizeSimCanvas);

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentExercise = btn.dataset.exercise;
      
      // Update slider bounds depending on exercise
      if (currentExercise === 'squat') {
        slider.min = '60';
        slider.max = '180';
        slider.value = '90';
      } else if (currentExercise === 'curl') {
        slider.min = '35';
        slider.max = '165';
        slider.value = '90';
      } else if (currentExercise === 'press') {
        slider.min = '65';
        slider.max = '180';
        slider.value = '140';
      }
      updateSimUI(slider.value);
    });
  });

  slider.addEventListener('input', (e) => {
    updateSimUI(e.target.value);
  });

  function updateSimUI(val) {
    const angle = parseInt(val, 10);
    valReadout.textContent = `${angle}°`;
    renderSimulator(angle);

    let status = 'optimal';
    let label = 'OPTIMAL FORM';
    let advice = '';

    if (currentExercise === 'squat') {
      if (angle > 115) {
        status = 'warning';
        label = 'TOO SHALLOW (ABOVE PARALLEL)';
        advice = 'Form alert: You are cutting your depth short. Push your hips back and descend until hips are crease-level with knees.';
      } else if (angle >= 80 && angle <= 115) {
        status = 'optimal';
        label = 'PERFECT DEPTH (PARALLEL)';
        advice = 'Excellent biomechanics! Full recruitment of quads and glutes with neutral spine stability.';
      } else {
        status = 'optimal';
        label = 'DEEP OLYMPIC SQUAT';
        advice = 'Impressive mobility. Keep chest upright and avoid posterior pelvic tilt (butt wink).';
      }
    } else if (currentExercise === 'curl') {
      if (angle > 130) {
        status = 'warning';
        label = 'STARTING EXTENSION';
        advice = 'Initiate the concentric phase without swinging your torso or recruiting anterior deltoids.';
      } else if (angle >= 45 && angle <= 75) {
        status = 'optimal';
        label = 'PEAK BICEP CONTRACTION';
        advice = 'Maximum tension achieved on biceps brachii. Hold for 0.5s before a controlled 3s eccentric negative.';
      } else {
        status = 'critical';
        label = 'OVER-FLEXION / ELBOW FLARE';
        advice = 'Keep elbows pinned to ribcage. Avoid hiking your elbows forward to relieve tension.';
      }
    } else {
      // Overhead press
      if (angle > 165) {
        status = 'optimal';
        label = 'LOCKED OUT OVERHEAD';
        advice = 'Bar aligned over glenohumeral joint and mid-foot. Core tight, ribs pulled down.';
      } else if (angle >= 90) {
        status = 'warning';
        label = 'MID-PRESS ASCENT';
        advice = 'Drive elbows slightly forward, do not over-arch lumbar spine.';
      } else {
        status = 'critical';
        label = 'START POSITION (RACK)';
        advice = 'Resting at clavicle level. Squeeze glutes and press vertically in a straight path.';
      }
    }

    statusBadge.className = `status-indicator-badge ${status}`;
    statusBadge.textContent = label;
    adviceText.textContent = advice;
  }

  function renderSimulator(angle) {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const groundY = h * 0.85;

    if (currentExercise === 'squat') {
      const norm = (180 - angle) / (180 - 60); // 0 (standing) to 1 (deep)
      const headY = groundY - 180 + norm * 80;
      const shoulderY = headY + 30;
      const hipY = shoulderY + 60 + norm * 75;
      const hipX = cx - norm * 25;
      const kneeY = groundY - 45 - norm * 10;
      const kneeX = cx + 20 + norm * 15;
      const ankleX = cx + 15;
      const ankleY = groundY;

      drawSkeletonStick(ctx, cx, headY, shoulderY, hipX, hipY, kneeX, kneeY, ankleX, ankleY, angle);
    } else {
      const norm = (165 - angle) / (165 - 35);
      drawBicepCurlStick(ctx, cx, groundY, norm, angle);
    }
  }

  // Audio Speech Cue
  if (audioCta) {
    audioCta.addEventListener('click', () => {
      if ('speechSynthesis' in window) {
        const text = adviceText.textContent;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
        showToast('🎙️ AI Coach: Speaking Audio Cue');
      } else {
        showToast('⚠️ Speech Synthesis not supported in this browser.');
      }
    });
  }

  updateSimUI(slider.value);
}

/* ── 5. GALLERY FILTER & LIGHTBOX MODAL ── */
function initGalleryAndLightbox() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.gallery-card');
  const modal = document.getElementById('lightboxModal');
  const closeBtn = document.getElementById('lightboxCloseBtn');
  const modalImg = document.getElementById('lightboxImg');
  const modalTitle = document.getElementById('lightboxTitle');
  const modalDesc = document.getElementById('lightboxDesc');
  const modalTags = document.getElementById('lightboxTags');

  // Filter tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.filter;

      cards.forEach(card => {
        if (category === 'all' || card.dataset.category.includes(category)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Open Lightbox
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      const title = card.querySelector('.gallery-card-title').textContent;
      const desc = card.querySelector('.gallery-card-desc').textContent;
      const tags = card.dataset.tags ? card.dataset.tags.split(',') : ['Computer Vision', 'Real-time'];

      modalImg.src = img.src;
      modalImg.alt = title;
      modalTitle.textContent = title;
      modalDesc.textContent = desc;

      modalTags.innerHTML = '';
      tags.forEach(t => {
        const pill = document.createElement('span');
        pill.className = 'lightbox-pill';
        pill.textContent = t.trim();
        modalTags.appendChild(pill);
      });

      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ── 6. VIDEO PLAYER CONTROLS & CHAPTERS ── */
function initVideoControls() {
  const video = document.getElementById('demoVideoPlayer');
  if (!video) return;

  const chapterBtns = document.querySelectorAll('.chapter-jump-btn');
  const speedBtns = document.querySelectorAll('.speed-btn');

  chapterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const time = parseFloat(btn.dataset.time || '0');
      video.currentTime = time;
      video.play().catch(() => {});
      showToast(`⏩ Jumped to ${btn.textContent.trim()}`);
    });
  });

  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const speed = parseFloat(btn.dataset.speed || '1.0');
      video.playbackRate = speed;
      showToast(`⚡ Playback Speed: ${speed}x`);
    });
  });
}

/* ── 7. WORKOUT BENCHMARK QUIZ ── */
function initWorkoutQuiz() {
  const liftSelect = document.getElementById('quizLift');
  const levelSelect = document.getElementById('quizLevel');
  const focusSelect = document.getElementById('quizFocus');

  const resAngle = document.getElementById('quizResAngle');
  const resTempo = document.getElementById('quizResTempo');
  const resSets = document.getElementById('quizResSets');
  const resAudio = document.getElementById('quizResAudio');

  if (!liftSelect || !resAngle) return;

  function recalculatePlan() {
    const lift = liftSelect.value;
    const level = levelSelect.value;
    const focus = focusSelect.value;

    let targetAngle = '80° - 90° (Parallel)';
    let tempo = '3-1-1s (Controlled)';
    let setsReps = '3 Sets × 10 Reps';
    let audioSensitivity = 'High (Every Rep)';

    if (lift === 'curl') {
      targetAngle = '45° - 60° (Flexion Peak)';
      tempo = '2-1-3s (Strict Negative)';
      setsReps = focus === 'hypertrophy' ? '4 Sets × 12 Reps' : '3 Sets × 8 Reps';
    } else if (lift === 'press') {
      targetAngle = '165° - 180° (Full Lockout)';
      tempo = '2-0-1s (Explosive)';
      setsReps = focus === 'strength' ? '5 Sets × 5 Reps' : '3 Sets × 10 Reps';
    } else if (lift === 'deadlift') {
      targetAngle = '15° - 25° (Spine Hinge Angle)';
      tempo = '2-1-2s (Hips Driven)';
      setsReps = '3 Sets × 5 Reps';
    }

    if (level === 'beginner') {
      audioSensitivity = 'Continuous Proactive Verbal Warnings';
    } else if (level === 'elite') {
      audioSensitivity = 'Failure / Breakdown Only';
    }

    resAngle.textContent = targetAngle;
    resTempo.textContent = tempo;
    resSets.textContent = setsReps;
    resAudio.textContent = audioSensitivity;
  }

  [liftSelect, levelSelect, focusSelect].forEach(select => {
    select.addEventListener('change', recalculatePlan);
  });

  recalculatePlan();
}

/* ── 8. SCROLL EFFECTS & UTILITIES ── */
function initScrollEffects() {
  // Back to top button
  const topBtn = document.getElementById('backToTopBtn');
  if (topBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        topBtn.classList.add('visible');
      } else {
        topBtn.classList.remove('visible');
      }
    });

    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Copy email button
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = 'kagatharaprashilkumar1526@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast('📋 Email copied to clipboard!');
      }).catch(() => {
        showToast(`Email: ${email}`);
      });
    });
  }
}

/* Toast Notice Helper */
function showToast(msg) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}
