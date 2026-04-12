const PLANET_POOL = [
  "/assets/planets/neptune.jpg",
  "/assets/planets/mercury.jpg",
  "/assets/planets/moon.jpg",
  "/assets/planets/earth_day.jpg",
  "/assets/planets/jupiter.jpg",
  "/assets/planets/mars.jpg",
  "/assets/planets/saturn.jpg",
  "/assets/planets/uranus.jpg",
  "/assets/planets/sun.jpg",
  "/assets/planets/venus_surface.jpg",
  "/assets/planets/venus_atmosphere.jpg",
  "/assets/planets/eris.jpg",
  "/assets/planets/ceres.jpg",
  "/assets/planets/haumea.jpg",
  "/assets/planets/makemake.jpg",
];

const DEFAULT_CATEGORY_NAMES = ["AI Coding", "面试经验", "待行动", "产品运营", "工具指南"];
const HASH_VIEW_MAP = {
  "#home": "home",
  "#collections": "galaxy",
  "#organize": "organize",
  "#relax": "relax",
  "#export": "export",
};

const state = {
  mode: "link",
  categories: [],
  categoryRecords: [],
  contents: [],
  config: {
    readOnlyMode: false,
    readOnlyMessage: "当前为 demo 预览版本，非本人不可新增、修改或删除内容。",
  },
  draft: null,
  categoryPlanetMap: {},
  selectedPlanet: PLANET_POOL[0],
  currentView: "home",
  galaxyFilter: "all",
  galaxyRotation: 0,
  organizeFilter: "all",
  organizeSelectedId: null,
  organizeDraft: null,
  organizeTitleEditingId: null,
  organizeCategoryDraft: [],
  organizeRenamingId: null,
  organizeRenameValue: "",
  organizeMenuId: null,
  categoryModalMode: "create",
  categoryModalReturnMode: "create",
  exportScope: "all",
  exportFormat: "xlsx",
  exportCategorySelection: [],
};

const el = {
  landingHero: document.getElementById("landing-hero"),
  draftScreen: document.getElementById("draft-screen"),
  pageShell: document.querySelector(".page-shell"),
  homeParticles: document.getElementById("home-particles"),
  hero: document.querySelector(".hero"),
  composerPanel: document.querySelector(".composer-panel"),
  importInput: document.getElementById("import-input"),
  importHint: document.getElementById("import-hint"),
  modeManual: document.getElementById("mode-manual"),
  modeLink: document.getElementById("mode-link"),
  organizeBtn: document.getElementById("organize-btn"),
  instructionInput: document.getElementById("instruction-input"),
  feedback: document.getElementById("feedback"),
  suggestionStrip: document.querySelector(".suggestion-strip"),
  navHome: document.getElementById("nav-home"),
  navCollections: document.getElementById("nav-collections"),
  navOrganize: document.getElementById("nav-organize"),
  navRelax: document.getElementById("nav-relax"),
  navExport: document.getElementById("nav-export"),
  saveDraftBtn: document.getElementById("save-draft-btn"),
  draftTitle: document.getElementById("draft-title"),
  draftBody: document.getElementById("draft-body"),
  draftNote: document.getElementById("draft-note"),
  draftSource: document.getElementById("draft-source"),
  draftCategories: document.getElementById("draft-categories"),
  newCategoryInput: document.getElementById("new-category-input"),
  addCategoryBtn: document.getElementById("add-category-btn"),
  draftFeedback: document.getElementById("draft-feedback"),
  categoryModal: document.getElementById("category-modal"),
  categoryModalBackdrop: document.getElementById("category-modal-backdrop"),
  closeCategoryModal: document.getElementById("close-category-modal"),
  planetPicker: document.getElementById("planet-picker"),
  categoryCreatePanel: document.getElementById("category-create-panel"),
  categoryManagePanel: document.getElementById("category-manage-panel"),
  closeManageCategoryModal: document.getElementById("close-manage-category-modal"),
  manageCategoryGrid: document.getElementById("manage-category-grid"),
  applyManageCategoriesBtn: document.getElementById("apply-manage-categories-btn"),
  readOnlyModal: document.getElementById("readonly-modal"),
  readOnlyModalBackdrop: document.getElementById("readonly-modal-backdrop"),
  closeReadOnlyModal: document.getElementById("close-readonly-modal"),
  readOnlyModalTitle: document.getElementById("readonly-modal-title"),
  readOnlyModalMessage: document.getElementById("readonly-modal-message"),
  readOnlyModalConfirm: document.getElementById("readonly-modal-confirm"),
  galaxyScreen: document.getElementById("galaxy-screen"),
  galaxyStack: document.getElementById("galaxy-stack"),
  galaxyFilters: document.getElementById("galaxy-filters"),
  relaxScreen: document.getElementById("relax-screen"),
  relaxCanvas: document.getElementById("relax-canvas"),
  relaxScore: document.getElementById("relax-score"),
  relaxBest: document.getElementById("relax-best"),
  relaxNextPlanet: document.getElementById("relax-next-planet"),
  relaxNextLabel: document.getElementById("relax-next-label"),
  relaxStartBtn: document.getElementById("relax-start-btn"),
  relaxRestartBtn: document.getElementById("relax-restart-btn"),
  relaxSequence: document.getElementById("relax-sequence"),
  relaxStatus: document.getElementById("relax-status"),
  organizeScreen: document.getElementById("organize-screen"),
  organizeCategories: document.getElementById("organize-categories"),
  organizeList: document.getElementById("organize-list"),
  exportScreen: document.getElementById("export-screen"),
  exportScopeAll: document.getElementById("export-scope-all"),
  exportScopeCategories: document.getElementById("export-scope-categories"),
  exportFormatXlsx: document.getElementById("export-format-xlsx"),
  exportFormatMd: document.getElementById("export-format-md"),
  exportSubmitBtn: document.getElementById("export-submit-btn"),
  exportFeedback: document.getElementById("export-feedback"),
  exportCategories: document.getElementById("export-categories"),
};

const hasRelaxGame = Boolean(el.relaxCanvas);
const hasOverviewScreen = Boolean(el.overviewScreen && el.overviewField);

const planetMotion = {
  items: [],
  frameId: null,
  lastTime: 0,
};

const particleMotion = {
  particles: [],
  frameId: null,
  lastTime: 0,
  ctx: null,
  dpr: 1,
  pointer: {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    active: false,
    radius: 220,
  },
};

const galaxyMotion = {
  timerId: null,
  clickTimerId: null,
  hovered: false,
  track: null,
  renderKey: "",
};

const overviewMotion = {
  items: [],
  frameId: null,
  lastTime: 0,
};

const relaxMotion = {
  frameId: null,
  lastTime: 0,
  accumulator: 0,
  ctx: null,
  dpr: 1,
  width: 420,
  height: 680,
  pointerX: 210,
  spawnY: 104,
  wallPadding: 18,
  floorPadding: 18,
  dangerLine: 124,
  gravity: 1560,
  balls: [],
  effects: [],
  imageCache: new Map(),
  score: 0,
  best: 0,
  nextLevel: 0,
  ballId: 1,
  sequence: [],
  mode: "idle",
  statusText: "点击开始一局，把你的分类星球合成到更大。",
  dropCooldown: 0,
  dangerTimer: 0,
};

function setFeedback(message, tone = "info") {
  el.feedback.textContent = message || "";
  el.feedback.dataset.tone = tone;
}

function setDraftFeedback(message, tone = "info") {
  el.draftFeedback.textContent = message || "";
  el.draftFeedback.dataset.tone = tone;
}

function setExportFeedback(message, tone = "info") {
  el.exportFeedback.textContent = message || "";
  el.exportFeedback.dataset.tone = tone;
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.fallback = data.fallback;
    error.isReadOnly = Boolean(data.read_only || data.code === "READ_ONLY_MODE");
    throw error;
  }
  return data;
}

function isReadOnlyMode() {
  return Boolean(state.config?.readOnlyMode);
}

function getReadOnlyMessage(actionLabel = "") {
  const baseMessage =
    state.config?.readOnlyMessage || "当前为 demo 预览版本，非本人不可新增、修改或删除内容。";
  return actionLabel ? `${actionLabel}暂不可用。${baseMessage}` : baseMessage;
}

function openReadOnlyModal(actionLabel = "") {
  if (!el.readOnlyModal) {
    window.alert(getReadOnlyMessage(actionLabel));
    return;
  }
  if (el.readOnlyModalTitle) {
    el.readOnlyModalTitle.textContent = actionLabel ? `${actionLabel}暂不可用` : "当前为 Demo 预览版本";
  }
  if (el.readOnlyModalMessage) {
    el.readOnlyModalMessage.textContent = getReadOnlyMessage(actionLabel);
  }
  el.readOnlyModal.classList.remove("hidden");
  el.readOnlyModal.setAttribute("aria-hidden", "false");
}

function closeReadOnlyModal() {
  if (!el.readOnlyModal) return;
  el.readOnlyModal.classList.add("hidden");
  el.readOnlyModal.setAttribute("aria-hidden", "true");
}

function guardReadOnly(actionLabel = "") {
  if (!isReadOnlyMode()) return false;
  openReadOnlyModal(actionLabel);
  return true;
}

function switchMode(mode) {
  state.mode = mode;
  el.modeManual.classList.toggle("active", mode === "manual");
  el.modeLink.classList.toggle("active", mode === "link");
  if (mode === "manual") {
    el.importInput.placeholder = "把原文粘贴到这里，StarVault 会先帮你整理。";
    el.importHint.textContent = "直接粘贴原文，效果会更稳定。";
    if (el.instructionInput) {
      el.instructionInput.placeholder = "可选，例如：保留作者原本的步骤结构；重点提炼可执行方法。";
    }
  } else {
    el.importInput.placeholder = "把小红书或公众号链接粘贴到这里，StarVault 会尝试抓取正文。";
    el.importHint.textContent = "链接模式目前支持小红书分享链接和公众号文章链接。";
    if (el.instructionInput) {
      el.instructionInput.placeholder = "可选，例如：保留详细的面试问题；重点提取图片里的清单；弱化宣传语。";
    }
  }
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getPlanetForCategory(name) {
  if (!state.categoryPlanetMap[name]) {
    const index = hashString(name) % PLANET_POOL.length;
    state.categoryPlanetMap[name] = PLANET_POOL[index];
  }
  return state.categoryPlanetMap[name];
}

function getPlanetLabel(path) {
  return path
    .split("/")
    .pop()
    .replace(/\.[a-z]+$/i, "")
    .replace(/_/g, " ");
}

function getHomePlanetCategories() {
  const names = state.categoryRecords.length
    ? state.categoryRecords.map((item) => item.name)
    : DEFAULT_CATEGORY_NAMES.slice();
  return Array.from(new Set(names)).filter(Boolean);
}

function getQuickFillNodes() {
  return Array.from(el.suggestionStrip.querySelectorAll(".quick-fill"));
}

function renderHomePlanets() {
  const names = getHomePlanetCategories();
  el.suggestionStrip.innerHTML = names
    .map((name, index) => {
      const planet = getPlanetForCategory(name);
      const size = 58 + ((hashString(name) + index * 7) % 24);
      const duration = 22 + ((hashString(name) + index * 3) % 15);
      return `
        <button
          class="planet-chip quick-fill"
          type="button"
          data-category-name="${escapeHTML(name)}"
          data-planet-size="${size}"
        >
          <span class="planet-visual" style="--planet-texture:url('${planet}'); --spin-duration:${duration}s;"></span>
          <span>${escapeHTML(name)}</span>
        </button>
      `;
    })
    .join("");
}

function stopParticleMotion() {
  if (particleMotion.frameId) {
    cancelAnimationFrame(particleMotion.frameId);
    particleMotion.frameId = null;
  }
  particleMotion.lastTime = 0;
}

function getParticleBounds() {
  const rect = el.pageShell.getBoundingClientRect();
  return {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  };
}

function resizeParticleCanvas() {
  const canvas = el.homeParticles;
  const { width, height } = getParticleBounds();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  particleMotion.dpr = dpr;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  particleMotion.ctx = canvas.getContext("2d");
  if (particleMotion.ctx) {
    particleMotion.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function buildParticles() {
  const { width, height } = getParticleBounds();
  const count = Math.max(200, Math.min(360, Math.round((width * height) / 5600)));
  particleMotion.particles = Array.from({ length: count }, (_, index) => {
    const sizeBias = Math.random() ** 1.8;
    const radius = 0.35 + sizeBias * 1.8;
    const speed = 5.2 + Math.random() * 10.8;
    const angle = Math.random() * Math.PI * 2;
    const tint = Math.random() > 0.8 ? "blue" : "white";
    const glow = 12 + radius * 16 + Math.random() * 18;
    const linkRadius = 124 + Math.random() * 52;
    const baseAlpha = 0.26 + Math.random() * 0.34;
    return {
      id: index,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      drift: 0.1 + Math.random() * 0.28,
      radius,
      alpha: baseAlpha,
      baseAlpha,
      glow,
      tint,
      linkRadius,
      magnetism: 30 + Math.random() * 52,
      focus: 0,
      twinkleSpeed: 0.55 + Math.random() * 1.35,
      twinkleOffset: Math.random() * Math.PI * 2,
      flare: radius > 1.2 ? 0.5 + Math.random() * 0.9 : 0,
    };
  });
}

function drawParticles() {
  const ctx = particleMotion.ctx;
  if (!ctx) return;
  const { width, height } = getParticleBounds();
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < particleMotion.particles.length; i += 1) {
    const a = particleMotion.particles[i];
    for (let j = i + 1; j < particleMotion.particles.length; j += 1) {
      const b = particleMotion.particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);
      const linkDistance = Math.min(a.linkRadius, b.linkRadius);
      if (distance > linkDistance) continue;
      const focusBoost = Math.max(a.focus, b.focus) * 0.12;
      const alpha = (1 - distance / linkDistance) * (0.085 + focusBoost);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle =
        a.tint === "blue" || b.tint === "blue"
          ? `rgba(148, 186, 255, ${alpha})`
          : `rgba(236, 239, 245, ${alpha * 0.92})`;
      ctx.lineWidth = 0.5 + Math.max(a.focus, b.focus) * 0.5;
      ctx.stroke();
    }
  }

  if (particleMotion.pointer.active) {
    const pointer = particleMotion.pointer;
    particleMotion.particles.forEach((particle) => {
      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const distance = Math.hypot(dx, dy);
      if (distance > pointer.radius * 0.7) return;
      const alpha = (1 - distance / (pointer.radius * 0.7)) * (0.09 + particle.focus * 0.12);
      ctx.beginPath();
      ctx.moveTo(pointer.x, pointer.y);
      ctx.lineTo(particle.x, particle.y);
      ctx.strokeStyle = `rgba(172, 203, 255, ${alpha})`;
      ctx.lineWidth = 0.28 + particle.focus * 0.55;
      ctx.stroke();
    });
  }

  particleMotion.particles.forEach((particle) => {
    const glowColor =
      particle.tint === "blue"
        ? [118, 166, 255]
        : [255, 248, 236];
    const starColor =
      particle.tint === "blue"
        ? `rgba(236, 244, 255, ${particle.alpha})`
        : `rgba(255, 254, 250, ${particle.alpha})`;
    const halo = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      particle.glow
    );
    halo.addColorStop(0, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${particle.alpha * 0.34})`);
    halo.addColorStop(0.16, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${particle.alpha * 0.18})`);
    halo.addColorStop(0.48, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${particle.alpha * 0.07})`);
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.beginPath();
    ctx.fillStyle = halo;
    ctx.arc(particle.x, particle.y, particle.glow, 0, Math.PI * 2);
    ctx.fill();

    if (particle.flare > 0) {
      const flareAlpha = particle.alpha * 0.18 * particle.flare;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(248, 249, 255, ${flareAlpha})`;
      ctx.lineWidth = 0.5;
      ctx.moveTo(particle.x - particle.glow * 0.42, particle.y);
      ctx.lineTo(particle.x + particle.glow * 0.42, particle.y);
      ctx.moveTo(particle.x, particle.y - particle.glow * 0.42);
      ctx.lineTo(particle.x, particle.y + particle.glow * 0.42);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.fillStyle = starColor;
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function animateParticles(timestamp) {
  if (!particleMotion.lastTime) particleMotion.lastTime = timestamp;
  const delta = Math.min((timestamp - particleMotion.lastTime) / 1000, 0.032);
  particleMotion.lastTime = timestamp;
  const { width, height } = getParticleBounds();
  const pointer = particleMotion.pointer;
  const pointerEase = pointer.active ? 0.24 : 0.1;
  pointer.x += (pointer.targetX - pointer.x) * pointerEase;
  pointer.y += (pointer.targetY - pointer.y) * pointerEase;

  particleMotion.particles.forEach((particle) => {
    particle.vx += (Math.random() - 0.5) * particle.drift;
    particle.vy += (Math.random() - 0.5) * particle.drift;

    const twinkle =
      0.82 +
      Math.sin(timestamp * 0.001 * particle.twinkleSpeed + particle.twinkleOffset) * 0.18;

    if (pointer.active) {
      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      if (distance < pointer.radius) {
        const influence = 1 - distance / pointer.radius;
        const pull = influence * particle.magnetism;
        particle.vx += (dx / distance) * pull * delta;
        particle.vy += (dy / distance) * pull * delta;
        particle.focus = Math.min(1, particle.focus + influence * 0.11);
      } else {
        particle.focus = Math.max(0, particle.focus - 0.05);
      }
    } else {
      particle.focus = Math.max(0, particle.focus - 0.04);
    }

    particle.alpha = Math.min(1, particle.baseAlpha * twinkle + particle.focus * 0.38);

    particle.vx *= 0.991 - particle.focus * 0.014;
    particle.vy *= 0.991 - particle.focus * 0.014;

    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;

    if (particle.x < 0) particle.x += width;
    if (particle.x > width) particle.x -= width;
    if (particle.y < 0) particle.y += height;
    if (particle.y > height) particle.y -= height;
  });

  drawParticles();
  particleMotion.frameId = requestAnimationFrame(animateParticles);
}

function updateParticlePointer(clientX, clientY) {
  const rect = el.homeParticles.getBoundingClientRect();
  const nextX = clamp(clientX - rect.left, 0, rect.width);
  const nextY = clamp(clientY - rect.top, 0, rect.height);
  particleMotion.pointer.targetX = nextX;
  particleMotion.pointer.targetY = nextY;
  if (!particleMotion.pointer.active) {
    particleMotion.pointer.x = nextX;
    particleMotion.pointer.y = nextY;
  }
  particleMotion.pointer.active = true;
}

function releaseParticlePointer() {
  particleMotion.pointer.active = false;
}

function setupParticleMotion() {
  stopParticleMotion();
  resizeParticleCanvas();
  buildParticles();
  drawParticles();
  particleMotion.lastTime = 0;
  particleMotion.frameId = requestAnimationFrame(animateParticles);
}

function getRelaxCategoryNames() {
  return Array.from(
    new Set([
      ...state.categoryRecords.map((item) => item.name),
      ...state.categories,
      ...DEFAULT_CATEGORY_NAMES,
    ]),
  )
    .filter(Boolean)
    .slice(0, 8);
}

function getRelaxBallRadius(level) {
  const radii = [22, 30, 40, 52, 66, 82, 100, 122];
  return radii[Math.min(level, radii.length - 1)];
}

function getRelaxSpawnPoolSize() {
  return Math.max(2, Math.min(5, relaxMotion.sequence.length - 1));
}

function getRandomRelaxLevel() {
  const poolSize = getRelaxSpawnPoolSize();
  return Math.floor(Math.random() * poolSize);
}

function buildRelaxSequence() {
  return getRelaxCategoryNames().map((name, index) => ({
    level: index,
    name,
    planet: getPlanetForCategory(name),
    radius: getRelaxBallRadius(index),
  }));
}

function ensureRelaxPlanetImage(src) {
  if (!relaxMotion.imageCache.has(src)) {
    const image = new Image();
    image.src = src;
    relaxMotion.imageCache.set(src, image);
  }
  return relaxMotion.imageCache.get(src);
}

function setRelaxStatus(message) {
  relaxMotion.statusText = message;
  if (el.relaxStatus) {
    el.relaxStatus.textContent = message;
  }
}

function updateRelaxHUD() {
  if (!hasRelaxGame) return;
  el.relaxScore.textContent = String(relaxMotion.score);
  el.relaxBest.textContent = String(relaxMotion.best);
  const next = relaxMotion.sequence[relaxMotion.nextLevel] || relaxMotion.sequence[0];
  if (next) {
    el.relaxNextPlanet.src = next.planet;
    el.relaxNextPlanet.alt = next.name;
    el.relaxNextLabel.textContent = next.name;
  }
  el.relaxStartBtn.textContent = relaxMotion.mode === "playing" ? "新开一局" : "开始一局";
}

function renderRelaxSequence() {
  if (!el.relaxSequence) return;
  el.relaxSequence.innerHTML = relaxMotion.sequence
    .map(
      (item) => `
        <div class="relax-sequence-item">
          <img src="${item.planet}" alt="${escapeHTML(item.name)}" />
          <div>
            <div class="relax-sequence-rank">Lv.${item.level + 1}</div>
            <div class="relax-sequence-name">${escapeHTML(item.name)}</div>
          </div>
        </div>
      `,
    )
    .join("");
}

function syncRelaxGameData() {
  if (!hasRelaxGame) return;
  relaxMotion.sequence = buildRelaxSequence();
  if (!relaxMotion.sequence.length) return;

  relaxMotion.balls.forEach((ball) => {
    ball.level = Math.min(ball.level, relaxMotion.sequence.length - 1);
    ball.radius = getRelaxBallRadius(ball.level);
  });
  relaxMotion.nextLevel = Math.min(relaxMotion.nextLevel, relaxMotion.sequence.length - 1);
  relaxMotion.sequence.forEach((item) => ensureRelaxPlanetImage(item.planet));
  renderRelaxSequence();
  updateRelaxHUD();
  renderRelaxGame();
}

function resizeRelaxCanvas() {
  if (!el.relaxCanvas) return;
  const canvas = el.relaxCanvas;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  relaxMotion.dpr = dpr;
  relaxMotion.width = rect.width;
  relaxMotion.height = rect.height;
  relaxMotion.spawnY = Math.max(88, Math.min(112, relaxMotion.height * 0.13));
  relaxMotion.dangerLine = relaxMotion.spawnY + 36;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  relaxMotion.ctx = canvas.getContext("2d");
  if (relaxMotion.ctx) {
    relaxMotion.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const previewRadius = getRelaxBallRadius(relaxMotion.nextLevel || 0);
  relaxMotion.pointerX = clamp(
    relaxMotion.pointerX || rect.width / 2,
    relaxMotion.wallPadding + previewRadius,
    rect.width - relaxMotion.wallPadding - previewRadius,
  );
  renderRelaxGame();
}

function stopRelaxMotion() {
  if (relaxMotion.frameId) {
    cancelAnimationFrame(relaxMotion.frameId);
    relaxMotion.frameId = null;
  }
  relaxMotion.lastTime = 0;
  relaxMotion.accumulator = 0;
}

function startRelaxMotion() {
  if (!hasRelaxGame) return;
  if (relaxMotion.frameId) return;
  resizeRelaxCanvas();
  relaxMotion.lastTime = 0;
  relaxMotion.accumulator = 0;
  relaxMotion.frameId = requestAnimationFrame(animateRelaxGame);
}

function resetRelaxRound(mode = "idle") {
  relaxMotion.balls = [];
  relaxMotion.effects = [];
  relaxMotion.score = 0;
  relaxMotion.nextLevel = getRandomRelaxLevel();
  relaxMotion.pointerX = relaxMotion.width / 2;
  relaxMotion.dropCooldown = 0;
  relaxMotion.dangerTimer = 0;
  relaxMotion.mode = mode;
  setRelaxStatus(
    mode === "playing"
      ? "移动鼠标或手指决定位置，点击画布投放星球。"
      : "点击开始一局，把你的分类星球合成到更大。",
  );
  updateRelaxHUD();
  renderRelaxGame();
}

function startRelaxRound() {
  syncRelaxGameData();
  resetRelaxRound("playing");
}

function endRelaxRound() {
  relaxMotion.mode = "over";
  relaxMotion.best = Math.max(relaxMotion.best, relaxMotion.score);
  updateRelaxHUD();
  setRelaxStatus(`星球堆满啦，本轮得分 ${relaxMotion.score}。点击重新开始再来一局。`);
  renderRelaxGame();
}

function createRelaxBall(level, x, y, options = {}) {
  return {
    id: relaxMotion.ballId++,
    level,
    x,
    y,
    vx: options.vx || 0,
    vy: options.vy || 0,
    radius: getRelaxBallRadius(level),
    mergeCooldown: options.mergeCooldown ?? 0.16,
  };
}

function dropRelaxBall() {
  if (relaxMotion.mode !== "playing" || relaxMotion.dropCooldown > 0 || !relaxMotion.sequence.length) return;
  const level = relaxMotion.nextLevel;
  const radius = getRelaxBallRadius(level);
  const x = clamp(
    relaxMotion.pointerX,
    relaxMotion.wallPadding + radius,
    relaxMotion.width - relaxMotion.wallPadding - radius,
  );
  relaxMotion.balls.push(createRelaxBall(level, x, relaxMotion.spawnY, { mergeCooldown: 0.14 }));
  relaxMotion.nextLevel = getRandomRelaxLevel();
  relaxMotion.dropCooldown = 0.16;
  updateRelaxHUD();
}

function addRelaxEffect(x, y, radius) {
  relaxMotion.effects.push({
    x,
    y,
    radius,
    alpha: 0.36,
  });
}

function updateRelaxEffects(delta) {
  relaxMotion.effects = relaxMotion.effects
    .map((effect) => ({
      ...effect,
      radius: effect.radius + delta * 64,
      alpha: effect.alpha - delta * 1.25,
    }))
    .filter((effect) => effect.alpha > 0.01);
}

function resolveRelaxWallCollisions(ball) {
  if (ball.x - ball.radius < relaxMotion.wallPadding) {
    ball.x = relaxMotion.wallPadding + ball.radius;
    ball.vx = Math.abs(ball.vx) * 0.22;
  } else if (ball.x + ball.radius > relaxMotion.width - relaxMotion.wallPadding) {
    ball.x = relaxMotion.width - relaxMotion.wallPadding - ball.radius;
    ball.vx = -Math.abs(ball.vx) * 0.22;
  }

  if (ball.y + ball.radius > relaxMotion.height - relaxMotion.floorPadding) {
    ball.y = relaxMotion.height - relaxMotion.floorPadding - ball.radius;
    ball.vy = Math.abs(ball.vy) < 48 ? 0 : -Math.abs(ball.vy) * 0.18;
    ball.vx *= 0.97;
    if (Math.abs(ball.vx) < 4) ball.vx = 0;
  }
}

function resolveRelaxBallContacts() {
  const removedIds = new Set();
  const merges = [];

  for (let i = 0; i < relaxMotion.balls.length; i += 1) {
    const a = relaxMotion.balls[i];
    if (removedIds.has(a.id)) continue;
    for (let j = i + 1; j < relaxMotion.balls.length; j += 1) {
      const b = relaxMotion.balls[j];
      if (removedIds.has(b.id)) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);
      const minDistance = a.radius + b.radius;
      if (distance >= minDistance) continue;

      if (
        a.level === b.level &&
        a.level < relaxMotion.sequence.length - 1 &&
        a.mergeCooldown <= 0 &&
        b.mergeCooldown <= 0
      ) {
        removedIds.add(a.id);
        removedIds.add(b.id);
        merges.push({
          level: a.level + 1,
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
          vx: (a.vx + b.vx) * 0.18,
          vy: Math.min(a.vy, b.vy) * 0.12,
          radius: getRelaxBallRadius(a.level + 1),
        });
        addRelaxEffect((a.x + b.x) / 2, (a.y + b.y) / 2, getRelaxBallRadius(a.level + 1) * 0.8);
        relaxMotion.score += (a.level + 1) * 18;
        relaxMotion.best = Math.max(relaxMotion.best, relaxMotion.score);
        continue;
      }

      if (!distance) {
        distance = 0.001;
        dx = 0.001;
        dy = 0;
      }

      const overlap = minDistance - distance + 0.35;
      const nx = dx / distance;
      const ny = dy / distance;
      const aMass = a.radius * a.radius;
      const bMass = b.radius * b.radius;
      const totalMass = aMass + bMass || 1;
      const aShare = bMass / totalMass;
      const bShare = aMass / totalMass;
      a.x -= nx * overlap * aShare;
      a.y -= ny * overlap * aShare;
      b.x += nx * overlap * bShare;
      b.y += ny * overlap * bShare;

      const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (relativeVelocity < 0) {
        const impulse = -relativeVelocity * 0.28;
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;
      }
      resolveRelaxWallCollisions(a);
      resolveRelaxWallCollisions(b);
    }
  }

  if (merges.length) {
    relaxMotion.balls = relaxMotion.balls.filter((ball) => !removedIds.has(ball.id));
    merges.forEach((merge) => {
      const ball = createRelaxBall(
        merge.level,
        clamp(
          merge.x,
          relaxMotion.wallPadding + merge.radius,
          relaxMotion.width - relaxMotion.wallPadding - merge.radius,
        ),
        merge.y,
        { vx: merge.vx, vy: merge.vy, mergeCooldown: 0.2 },
      );
      ball.y = Math.min(ball.y, relaxMotion.height - relaxMotion.floorPadding - ball.radius);
      relaxMotion.balls.push(ball);
    });
    updateRelaxHUD();
  }
}

function updateRelaxBalls(delta) {
  const drag = Math.pow(0.996, delta * 60);
  relaxMotion.balls.forEach((ball) => {
    ball.mergeCooldown = Math.max(0, ball.mergeCooldown - delta);
    ball.vy = Math.min(ball.vy + relaxMotion.gravity * delta, 1600);
    ball.vx *= drag;
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;
    resolveRelaxWallCollisions(ball);
  });

  for (let iteration = 0; iteration < 5; iteration += 1) {
    resolveRelaxBallContacts();
    relaxMotion.balls.forEach((ball) => {
      resolveRelaxWallCollisions(ball);
      if (ball.y + ball.radius >= relaxMotion.height - relaxMotion.floorPadding - 0.5 && Math.abs(ball.vy) < 140) {
        ball.vy = 0;
      }
    });
  }
}

function updateRelaxDanger(delta) {
  const crowded = relaxMotion.balls.some(
    (ball) => ball.y - ball.radius < relaxMotion.dangerLine && Math.abs(ball.vy) < 110,
  );
  if (crowded) {
    relaxMotion.dangerTimer += delta;
  } else {
    relaxMotion.dangerTimer = Math.max(0, relaxMotion.dangerTimer - delta * 1.4);
  }
  if (relaxMotion.dangerTimer > 1.35) {
    endRelaxRound();
  }
}

function updateRelaxGame(delta) {
  updateRelaxEffects(delta);
  if (relaxMotion.mode !== "playing") return;
  relaxMotion.dropCooldown = Math.max(0, relaxMotion.dropCooldown - delta);
  updateRelaxBalls(delta);
  updateRelaxDanger(delta);
}

function drawRelaxRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawRelaxBall(ctx, ball, alpha = 1) {
  const def = relaxMotion.sequence[ball.level];
  if (!def) return;
  const image = ensureRelaxPlanetImage(def.planet);
  const glow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 1.8);
  glow.addColorStop(0, `rgba(188, 220, 255, ${0.18 * alpha})`);
  glow.addColorStop(0.55, `rgba(188, 220, 255, ${0.08 * alpha})`);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.beginPath();
  ctx.fillStyle = glow;
  ctx.arc(ball.x, ball.y, ball.radius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.clip();
  if (image?.complete) {
    ctx.drawImage(image, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
  } else {
    const fill = ctx.createLinearGradient(ball.x - ball.radius, ball.y - ball.radius, ball.x + ball.radius, ball.y + ball.radius);
    fill.addColorStop(0, "rgba(238, 245, 255, 0.92)");
    fill.addColorStop(1, "rgba(110, 148, 214, 0.82)");
    ctx.fillStyle = fill;
    ctx.fillRect(ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
  }
  const shade = ctx.createLinearGradient(ball.x - ball.radius, ball.y - ball.radius, ball.x + ball.radius, ball.y + ball.radius);
  shade.addColorStop(0, "rgba(255, 255, 255, 0.2)");
  shade.addColorStop(0.45, "rgba(255, 255, 255, 0)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.3)");
  ctx.fillStyle = shade;
  ctx.fillRect(ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
  ctx.restore();

  ctx.beginPath();
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 * alpha})`;
  ctx.lineWidth = 1;
  ctx.arc(ball.x, ball.y, ball.radius - 0.5, 0, Math.PI * 2);
  ctx.stroke();

  if (ball.radius >= 30) {
    const label = def.name.length > 6 ? `${def.name.slice(0, 6)}…` : def.name;
    ctx.font = `${Math.max(10, Math.round(ball.radius * 0.32))}px "SF Pro Display", "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(255, 255, 255, ${0.92 * alpha})`;
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.42 * alpha})`;
    ctx.lineWidth = 3;
    ctx.strokeText(label, ball.x, ball.y);
    ctx.fillText(label, ball.x, ball.y);
  }
}

function renderRelaxGame() {
  const ctx = relaxMotion.ctx;
  if (!ctx) return;
  const { width, height } = relaxMotion;
  ctx.clearRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#0b1020");
  background.addColorStop(0.45, "#090d17");
  background.addColorStop(1, "#05070c");
  ctx.fillStyle = background;
  drawRelaxRoundedRect(ctx, 0, 0, width, height, 26);
  ctx.fill();

  for (let i = 0; i < 36; i += 1) {
    const x = ((i * 97) % 100) / 100 * width;
    const y = ((i * 53) % 100) / 100 * height;
    const radius = 0.6 + (i % 4) * 0.3;
    ctx.beginPath();
    ctx.fillStyle = i % 5 === 0 ? "rgba(143, 184, 255, 0.42)" : "rgba(255, 255, 255, 0.28)";
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const pitX = 18;
  const pitY = 34;
  const pitWidth = width - 36;
  const pitHeight = height - 52;
  const pitGradient = ctx.createLinearGradient(0, pitY, 0, pitY + pitHeight);
  pitGradient.addColorStop(0, "rgba(18, 22, 32, 0.92)");
  pitGradient.addColorStop(1, "rgba(7, 10, 16, 0.96)");
  ctx.fillStyle = pitGradient;
  drawRelaxRoundedRect(ctx, pitX, pitY, pitWidth, pitHeight, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  drawRelaxRoundedRect(ctx, pitX, pitY, pitWidth, pitHeight, 24);
  ctx.stroke();

  ctx.beginPath();
  ctx.setLineDash([8, 8]);
  ctx.moveTo(pitX + 12, relaxMotion.dangerLine);
  ctx.lineTo(pitX + pitWidth - 12, relaxMotion.dangerLine);
  ctx.strokeStyle = `rgba(255, 162, 162, ${0.2 + Math.min(0.45, relaxMotion.dangerTimer * 0.18)})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  const next = relaxMotion.sequence[relaxMotion.nextLevel];
  if (next) {
    ctx.beginPath();
    ctx.moveTo(relaxMotion.pointerX, relaxMotion.spawnY - 28);
    ctx.lineTo(relaxMotion.pointerX, height - relaxMotion.floorPadding - 6);
    ctx.strokeStyle = "rgba(173, 202, 255, 0.14)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawRelaxBall(
      ctx,
      {
        x: relaxMotion.pointerX,
        y: relaxMotion.spawnY - 28,
        radius: getRelaxBallRadius(relaxMotion.nextLevel) * 0.86,
        level: relaxMotion.nextLevel,
      },
      0.88,
    );
  }

  relaxMotion.effects.forEach((effect) => {
    const ring = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, effect.radius);
    ring.addColorStop(0, `rgba(188, 219, 255, ${effect.alpha})`);
    ring.addColorStop(0.45, `rgba(188, 219, 255, ${effect.alpha * 0.26})`);
    ring.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.beginPath();
    ctx.fillStyle = ring;
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  relaxMotion.balls
    .slice()
    .sort((a, b) => a.y - b.y)
    .forEach((ball) => {
      ctx.beginPath();
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.ellipse(ball.x, ball.y + ball.radius * 0.9, ball.radius * 0.76, ball.radius * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      drawRelaxBall(ctx, ball);
    });

  if (relaxMotion.mode !== "playing") {
    ctx.fillStyle = "rgba(5, 7, 12, 0.62)";
    drawRelaxRoundedRect(ctx, pitX + 26, height * 0.36, pitWidth - 52, 130, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    drawRelaxRoundedRect(ctx, pitX + 26, height * 0.36, pitWidth - 52, 130, 22);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#f5f6fa";
    ctx.font = '600 24px "SF Pro Display", "Segoe UI", sans-serif';
    ctx.fillText(relaxMotion.mode === "over" ? "星球拥挤警报" : "星球合合乐", width / 2, height * 0.43);
    ctx.font = '14px "SF Pro Display", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(235, 235, 235, 0.78)";
    ctx.fillText(relaxMotion.statusText, width / 2, height * 0.49);
    ctx.fillText("点击左侧按钮或轻触画布开始", width / 2, height * 0.53);
  }
}

function animateRelaxGame(timestamp) {
  if (!relaxMotion.lastTime) relaxMotion.lastTime = timestamp;
  const delta = Math.min((timestamp - relaxMotion.lastTime) / 1000, 0.032);
  relaxMotion.lastTime = timestamp;
  relaxMotion.accumulator += delta;
  while (relaxMotion.accumulator >= 1 / 60) {
    updateRelaxGame(1 / 60);
    relaxMotion.accumulator -= 1 / 60;
  }
  renderRelaxGame();
  relaxMotion.frameId = requestAnimationFrame(animateRelaxGame);
}

function getRelaxCanvasPoint(event) {
  if (!el.relaxCanvas) {
    return { x: 0, y: 0 };
  }
  const rect = el.relaxCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * relaxMotion.width,
    y: ((event.clientY - rect.top) / rect.height) * relaxMotion.height,
  };
}

function updateRelaxPointer(clientX) {
  if (!el.relaxCanvas) return;
  const rect = el.relaxCanvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * relaxMotion.width;
  const previewRadius = getRelaxBallRadius(relaxMotion.nextLevel || 0);
  relaxMotion.pointerX = clamp(
    x,
    relaxMotion.wallPadding + previewRadius,
    relaxMotion.width - relaxMotion.wallPadding - previewRadius,
  );
  renderRelaxGame();
}

function renderRelaxGameToText() {
  return JSON.stringify({
    coordinate_system: "origin at top-left, x increases right, y increases down",
    mode: relaxMotion.mode,
    score: relaxMotion.score,
    best: relaxMotion.best,
    next: relaxMotion.sequence[relaxMotion.nextLevel]?.name || null,
    pointer_x: Math.round(relaxMotion.pointerX),
    danger_line_y: Math.round(relaxMotion.dangerLine),
    balls: relaxMotion.balls.map((ball) => ({
      level: ball.level,
      name: relaxMotion.sequence[ball.level]?.name || "",
      x: Math.round(ball.x),
      y: Math.round(ball.y),
      r: Math.round(ball.radius),
      vx: Number(ball.vx.toFixed(2)),
      vy: Number(ball.vy.toFixed(2)),
    })),
  });
}

function getHashForView(view) {
  return (
    Object.entries(HASH_VIEW_MAP).find(([, mappedView]) => mappedView === view)?.[0] ||
    "#home"
  );
}

function getViewFromHash() {
  return HASH_VIEW_MAP[window.location.hash] || "home";
}

function toggleRelaxFullscreen() {
  if (!el.relaxCanvas) return;
  const container = el.relaxCanvas.closest(".relax-canvas-shell");
  if (!document.fullscreenElement) {
    container?.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

window.render_game_to_text = renderRelaxGameToText;
window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) {
    updateRelaxGame(1 / 60);
  }
  renderRelaxGame();
};

async function bootstrap() {
  try {
    const data = await apiFetch("/api/bootstrap", { method: "GET" });
    state.config = {
      ...state.config,
      ...(data.config || {}),
    };
    state.categoryRecords = data.categories || [];
    const categoryNames = state.categoryRecords.map((item) => item.name) || [];
    state.categories = Array.from(new Set([...DEFAULT_CATEGORY_NAMES, ...categoryNames]));
    state.contents = data.contents || [];
  } catch {
    state.categories = DEFAULT_CATEGORY_NAMES.slice();
    state.categoryRecords = [];
    state.contents = [];
  }
  renderHomePlanets();
  renderGalaxyFilters();
  renderGalaxyStack();
  if (hasOverviewScreen) {
    renderOverviewField();
  }
  if (hasRelaxGame) {
    syncRelaxGameData();
    resetRelaxRound();
  }
  setupParticleMotion();
  showView(getViewFromHash());
}

async function refreshCollectionsFromServer() {
  const data = await apiFetch("/api/bootstrap", { method: "GET" });
  state.config = {
    ...state.config,
    ...(data.config || {}),
  };
  state.categoryRecords = data.categories || [];
  const categoryNames = state.categoryRecords.map((item) => item.name) || [];
  state.categories = Array.from(new Set([...DEFAULT_CATEGORY_NAMES, ...categoryNames]));
  state.contents = data.contents || [];
  renderHomePlanets();
  syncRelaxGameData();
  if (state.currentView === "overview") {
    setupOverviewMotion();
  } else {
    renderOverviewField();
  }
}

function stopPlanetMotion() {
  if (planetMotion.frameId) {
    cancelAnimationFrame(planetMotion.frameId);
    planetMotion.frameId = null;
  }
  planetMotion.lastTime = 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function circlesOverlap(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < a.radius + b.radius + 8;
}

function intersectsSafeRect(item, safeRect) {
  const nearestX = clamp(item.x, safeRect.left, safeRect.right);
  const nearestY = clamp(item.y, safeRect.top, safeRect.bottom);
  const dx = item.x - nearestX;
  const dy = item.y - nearestY;
  return dx * dx + dy * dy < item.radius * item.radius;
}

function getSafeRect() {
  const heroRect = el.hero.getBoundingClientRect();
  const composerRect = el.composerPanel.getBoundingClientRect();
  return {
    left: composerRect.left - heroRect.left - 46,
    right: composerRect.right - heroRect.left + 46,
    top: composerRect.top - heroRect.top - 38,
    bottom: composerRect.bottom - heroRect.top + 72,
  };
}

function placePlanets() {
  const shellWidth = el.hero.clientWidth;
  const shellHeight = el.hero.clientHeight;
  const safeRect = getSafeRect();
  const padding = 18;
  const quickFillNodes = getQuickFillNodes();

  planetMotion.items = quickFillNodes.map((node, index) => {
    const radius = Number(node.dataset.planetSize || 64) / 2;
    let x = padding + radius + (index * 120);
    let y = shellHeight - 120 - ((index % 2) * 26);
    const speed = 20 + index * 2;
    let attempts = 0;

    do {
      x = padding + radius + Math.random() * Math.max(20, shellWidth - radius * 2 - padding * 2);
      y = padding + radius + Math.random() * Math.max(20, shellHeight - radius * 2 - padding * 2);
      attempts += 1;
    } while (
      (intersectsSafeRect({ x, y, radius }, safeRect) ||
        planetMotion.items.some((item) => circlesOverlap({ x, y, radius }, item))) &&
      attempts < 200
    );

    const angle = (Math.PI * 2 * (index + 1)) / (quickFillNodes.length + 1);
    return {
      node,
      radius,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    };
  });
}

function renderPlanets() {
  planetMotion.items.forEach((item) => {
    item.node.style.setProperty("--planet-size", String(item.radius * 2));
    item.node.style.left = `${item.x - item.radius}px`;
    item.node.style.top = `${item.y - item.radius}px`;
  });
}

function bounceOffSafeRect(item, safeRect) {
  if (!intersectsSafeRect(item, safeRect)) return;

  const leftGap = Math.abs(item.x - safeRect.left);
  const rightGap = Math.abs(safeRect.right - item.x);
  const topGap = Math.abs(item.y - safeRect.top);
  const bottomGap = Math.abs(safeRect.bottom - item.y);
  const minGap = Math.min(leftGap, rightGap, topGap, bottomGap);

  if (minGap === leftGap) {
    item.x = safeRect.left - item.radius - 2;
    item.vx = -Math.abs(item.vx);
  } else if (minGap === rightGap) {
    item.x = safeRect.right + item.radius + 2;
    item.vx = Math.abs(item.vx);
  } else if (minGap === topGap) {
    item.y = safeRect.top - item.radius - 2;
    item.vy = -Math.abs(item.vy);
  } else {
    item.y = safeRect.bottom + item.radius + 2;
    item.vy = Math.abs(item.vy);
  }
}

function resolvePlanetCollisions() {
  for (let i = 0; i < planetMotion.items.length; i += 1) {
    for (let j = i + 1; j < planetMotion.items.length; j += 1) {
      const a = planetMotion.items[i];
      const b = planetMotion.items[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      const minDistance = a.radius + b.radius + 8;
      if (distance >= minDistance) continue;

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = (minDistance - distance) / 2;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;

      const av = a.vx * nx + a.vy * ny;
      const bv = b.vx * nx + b.vy * ny;
      const delta = bv - av;
      a.vx += delta * nx;
      a.vy += delta * ny;
      b.vx -= delta * nx;
      b.vy -= delta * ny;
    }
  }
}

function animatePlanets(timestamp) {
  if (!planetMotion.lastTime) planetMotion.lastTime = timestamp;
  const delta = Math.min((timestamp - planetMotion.lastTime) / 1000, 0.032);
  planetMotion.lastTime = timestamp;

  if (window.innerWidth <= 960 || el.landingHero.classList.contains("hidden")) {
    planetMotion.frameId = requestAnimationFrame(animatePlanets);
    return;
  }

  const width = el.hero.clientWidth;
  const height = el.hero.clientHeight;
  const safeRect = getSafeRect();
  const padding = 18;

  planetMotion.items.forEach((item) => {
    item.x += item.vx * delta;
    item.y += item.vy * delta;

    if (item.x - item.radius < padding) {
      item.x = padding + item.radius;
      item.vx = Math.abs(item.vx);
    }
    if (item.x + item.radius > width - padding) {
      item.x = width - padding - item.radius;
      item.vx = -Math.abs(item.vx);
    }
    if (item.y - item.radius < padding) {
      item.y = padding + item.radius;
      item.vy = Math.abs(item.vy);
    }
    if (item.y + item.radius > height - padding) {
      item.y = height - padding - item.radius;
      item.vy = -Math.abs(item.vy);
    }

    bounceOffSafeRect(item, safeRect);
  });

  resolvePlanetCollisions();
  renderPlanets();
  planetMotion.frameId = requestAnimationFrame(animatePlanets);
}

function setupPlanetMotion() {
  stopPlanetMotion();
  renderHomePlanets();
  placePlanets();
  renderPlanets();
  planetMotion.lastTime = 0;
  planetMotion.frameId = requestAnimationFrame(animatePlanets);
}

function stopOverviewMotion() {
  if (overviewMotion.frameId) {
    cancelAnimationFrame(overviewMotion.frameId);
    overviewMotion.frameId = null;
  }
  overviewMotion.lastTime = 0;
}

function getOverviewCategories() {
  const counts = new Map();
  state.contents.forEach((item) => {
    (item.categories || []).forEach((name) => {
      counts.set(name, (counts.get(name) || 0) + 1);
    });
  });

  return Array.from(new Set([...DEFAULT_CATEGORY_NAMES, ...state.categories]))
    .filter(Boolean)
    .map((name, index) => {
      const count = counts.get(name) || 0;
      const size = 62 + Math.min(count, 8) * 7 + (index % 3) * 6;
      return {
        name,
        count,
        size,
        planet: getPlanetForCategory(name),
        ringThickness: Math.max(4, Math.min(18, 4 + count * 2)),
      };
    });
}

function renderOverviewField() {
  if (!hasOverviewScreen) return;
  const items = getOverviewCategories();
  el.overviewField.innerHTML = items
    .map(
      (item) => `
        <button
          class="overview-planet-chip"
          type="button"
          data-overview-category="${escapeHTML(item.name)}"
          data-planet-size="${item.size}"
          style="--planet-size:${item.size}; --ring-thickness:${item.ringThickness}px;"
        >
          <span class="overview-planet-shell">
            <span class="overview-planet-belt back"></span>
            <span class="planet-visual overview-planet-visual" style="--planet-texture:url('${item.planet}'); --spin-duration:${24 + (item.size % 11)}s;"></span>
            <span class="overview-planet-belt front"></span>
          </span>
          <span class="overview-planet-name">${escapeHTML(item.name)}</span>
        </button>
      `,
    )
    .join("");
}

function placeOverviewPlanets() {
  if (!hasOverviewScreen) return;
  const nodes = Array.from(el.overviewField.querySelectorAll(".overview-planet-chip"));
  const width = el.overviewField.clientWidth;
  const height = el.overviewField.clientHeight;
  const padding = 32;
  overviewMotion.items = nodes.map((node, index) => {
    const radius = Number(node.dataset.planetSize || 70) / 2;
    let x = width / 2;
    let y = height / 2;
    let attempts = 0;
    while (attempts < 300) {
      x = padding + radius + Math.random() * Math.max(1, width - padding * 2 - radius * 2);
      y = padding + radius + Math.random() * Math.max(1, height - padding * 2 - radius * 2);
      const probe = { x, y, radius };
      if (!overviewMotion.items.some((item) => circlesOverlap(probe, item))) {
        break;
      }
      attempts += 1;
    }
    return {
      node,
      x,
      y,
      radius,
      vx: (Math.random() * 22 + 18) * (index % 2 === 0 ? 1 : -1),
      vy: (Math.random() * 18 + 12) * (index % 3 === 0 ? 1 : -1),
    };
  });
}

function renderOverviewPlanets() {
  if (!hasOverviewScreen) return;
  overviewMotion.items.forEach((item) => {
    item.node.style.left = `${item.x}px`;
    item.node.style.top = `${item.y}px`;
    item.node.style.setProperty("--planet-size", String(item.radius * 2));
  });
}

function resolveOverviewCollisions() {
  for (let i = 0; i < overviewMotion.items.length; i += 1) {
    for (let j = i + 1; j < overviewMotion.items.length; j += 1) {
      const a = overviewMotion.items[i];
      const b = overviewMotion.items[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      const minimum = a.radius + b.radius + 18;
      if (distance >= minimum) continue;
      const overlap = (minimum - distance) / 2;
      const nx = dx / distance;
      const ny = dy / distance;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
      const avx = a.vx;
      const avy = a.vy;
      a.vx = b.vx * 0.985;
      a.vy = b.vy * 0.985;
      b.vx = avx * 0.985;
      b.vy = avy * 0.985;
    }
  }
}

function animateOverviewPlanets(timestamp) {
  if (!hasOverviewScreen) return;
  if (!overviewMotion.lastTime) overviewMotion.lastTime = timestamp;
  const delta = Math.min((timestamp - overviewMotion.lastTime) / 1000, 0.032);
  overviewMotion.lastTime = timestamp;

  const width = el.overviewField.clientWidth;
  const height = el.overviewField.clientHeight;
  const padding = 18;

  overviewMotion.items.forEach((item) => {
    item.x += item.vx * delta;
    item.y += item.vy * delta;

    if (item.x - item.radius < padding) {
      item.x = padding + item.radius;
      item.vx = Math.abs(item.vx);
    }
    if (item.x + item.radius > width - padding) {
      item.x = width - padding - item.radius;
      item.vx = -Math.abs(item.vx);
    }
    if (item.y - item.radius < padding) {
      item.y = padding + item.radius;
      item.vy = Math.abs(item.vy);
    }
    if (item.y + item.radius > height - padding) {
      item.y = height - padding - item.radius;
      item.vy = -Math.abs(item.vy);
    }
  });

  resolveOverviewCollisions();
  renderOverviewPlanets();
  overviewMotion.frameId = requestAnimationFrame(animateOverviewPlanets);
}

function setupOverviewMotion() {
  if (!hasOverviewScreen) return;
  stopOverviewMotion();
  renderOverviewField();
  placeOverviewPlanets();
  renderOverviewPlanets();
  overviewMotion.lastTime = 0;
  overviewMotion.frameId = requestAnimationFrame(animateOverviewPlanets);
}

function stopGalaxyRotation() {
  if (galaxyMotion.timerId) {
    clearInterval(galaxyMotion.timerId);
    galaxyMotion.timerId = null;
  }
}

function startGalaxyRotation() {
  stopGalaxyRotation();
  const items = getFilteredGalaxyContents();
  if (items.length <= 1 || galaxyMotion.hovered) return;
  galaxyMotion.timerId = setInterval(() => {
    state.galaxyRotation = (state.galaxyRotation + 1) % items.length;
    renderGalaxyStack();
  }, 3200);
}

function showView(view) {
  if (view === "overview" && !hasOverviewScreen) {
    view = "home";
  }
  state.currentView = view;
  updateNavState(view);
  const nextHash = getHashForView(view);
  if (window.location.hash !== nextHash) {
    history.replaceState(null, "", nextHash);
  }
  el.landingHero.classList.toggle("hidden", view !== "home");
  el.draftScreen.classList.toggle("hidden", view !== "draft");
  el.galaxyScreen.classList.toggle("hidden", view !== "galaxy");
  if (el.overviewScreen) {
    el.overviewScreen.classList.toggle("hidden", view !== "overview");
  }
  el.relaxScreen.classList.toggle("hidden", view !== "relax");
  el.organizeScreen.classList.toggle("hidden", view !== "organize");
  el.exportScreen.classList.toggle("hidden", view !== "export");

  if (view === "home") {
    el.pageShell.classList.add("home-mode");
    stopRelaxMotion();
    stopPlanetMotion();
    stopOverviewMotion();
    stopGalaxyRotation();
  } else if (view === "galaxy") {
    el.pageShell.classList.remove("home-mode");
    releaseParticlePointer();
    stopRelaxMotion();
    stopPlanetMotion();
    stopOverviewMotion();
    renderGalaxyFilters();
    renderGalaxyStack();
    startGalaxyRotation();
  } else if (view === "overview") {
    el.pageShell.classList.remove("home-mode");
    releaseParticlePointer();
    stopRelaxMotion();
    stopPlanetMotion();
    stopGalaxyRotation();
    setupOverviewMotion();
  } else if (view === "relax") {
    el.pageShell.classList.remove("home-mode");
    releaseParticlePointer();
    stopPlanetMotion();
    stopOverviewMotion();
    stopGalaxyRotation();
    syncRelaxGameData();
    startRelaxMotion();
  } else if (view === "organize") {
    el.pageShell.classList.remove("home-mode");
    releaseParticlePointer();
    stopRelaxMotion();
    stopPlanetMotion();
    stopOverviewMotion();
    stopGalaxyRotation();
    renderOrganizeCategories();
    renderOrganizeList();
  } else if (view === "export") {
    el.pageShell.classList.remove("home-mode");
    releaseParticlePointer();
    stopRelaxMotion();
    stopPlanetMotion();
    stopOverviewMotion();
    stopGalaxyRotation();
    renderExportScreen();
  } else {
    el.pageShell.classList.remove("home-mode");
    releaseParticlePointer();
    stopRelaxMotion();
    stopPlanetMotion();
    stopOverviewMotion();
    stopGalaxyRotation();
  }

  if (!particleMotion.frameId) {
    setupParticleMotion();
  }
}

function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function getFilteredGalaxyContents() {
  if (state.galaxyFilter === "all") {
    return state.contents.slice();
  }
  return state.contents.filter((item) => item.categories?.includes(state.galaxyFilter));
}

function getGalaxyRenderKey(items) {
  return items.map((item) => item.id).join("|");
}

function getTrackGap() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--galaxy-gap").trim();
  return Number.parseFloat(value) || 28;
}

function ensureGalaxyTrack(items) {
  const key = getGalaxyRenderKey(items);
  if (!galaxyMotion.track) {
    galaxyMotion.track = document.createElement("div");
    galaxyMotion.track.className = "galaxy-track";
    el.galaxyStack.appendChild(galaxyMotion.track);
  }

  if (galaxyMotion.renderKey === key) {
    return;
  }

  galaxyMotion.renderKey = key;
  galaxyMotion.track.innerHTML = items
    .map((item, index) => {
      const preview = (item.body || "").replace(/\n+/g, " ").trim();
      const snippet = preview.length > 220 ? `${preview.slice(0, 220)}...` : preview;
      const categories = (item.categories || [])
        .slice(0, 3)
        .map((name) => `<span>${name}</span>`)
        .join("");
      const note = item.note ? item.note.replace(/\n+/g, " ").trim() : "";
      return `
        <article class="galaxy-card" data-content-id="${item.id}" data-track-index="${index}">
          <div class="galaxy-card-header">
            <h3 class="galaxy-card-title">${item.title || "未命名卡片"}</h3>
            <span class="galaxy-card-date">${formatShortDate(item.created_at)}</span>
          </div>
          <p class="galaxy-card-body">${snippet || "暂无内容"}</p>
          <div class="galaxy-card-meta">
            <div class="galaxy-card-categories">${categories}</div>
            <span class="galaxy-card-note">${note || ""}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateGalaxyTrackPosition(items) {
  if (!galaxyMotion.track || !items.length) return;
  const cards = Array.from(galaxyMotion.track.querySelectorAll(".galaxy-card"));
  if (!cards.length) return;

  const safeIndex = ((state.galaxyRotation % items.length) + items.length) % items.length;
  state.galaxyRotation = safeIndex;

  const firstCard = cards[0];
  const cardWidth = firstCard.getBoundingClientRect().width;
  const gap = getTrackGap();
  const viewportWidth = el.galaxyStack.clientWidth;
  const translateX = viewportWidth / 2 - (cardWidth / 2 + safeIndex * (cardWidth + gap));
  galaxyMotion.track.style.transform = `translate3d(${translateX}px, 0, 0)`;

  cards.forEach((card, index) => {
    const distance = index - safeIndex;
    if (distance < -2 || distance > 2) {
      card.dataset.distance = "far";
    } else {
      card.dataset.distance = String(distance);
    }
  });
}

function renderGalaxyStack() {
  const filtered = getFilteredGalaxyContents();
  if (!filtered.length) {
    galaxyMotion.renderKey = "";
    if (galaxyMotion.track) {
      galaxyMotion.track.remove();
      galaxyMotion.track = null;
    }
    el.galaxyStack.innerHTML = `<div class="galaxy-empty">这个星系里还没有知识卡片</div>`;
    return;
  }

  const emptyNode = el.galaxyStack.querySelector(".galaxy-empty");
  if (emptyNode) emptyNode.remove();
  ensureGalaxyTrack(filtered);
  window.requestAnimationFrame(() => updateGalaxyTrackPosition(filtered));
}

function renderGalaxyFilters() {
  const allCount = state.contents.length;
  const categoryNames = Array.from(new Set([...DEFAULT_CATEGORY_NAMES, ...state.categories])).filter(Boolean);
  const items = [
    {
      name: "全部",
      count: allCount,
      planet: "/assets/planets/earth_day.jpg",
      active: state.galaxyFilter === "all",
    },
    ...categoryNames.map((name) => ({
      name,
      count: state.contents.filter((item) => item.categories?.includes(name)).length,
      planet: getPlanetForCategory(name),
      active: state.galaxyFilter === name,
    })),
  ];

  el.galaxyFilters.innerHTML = items
    .map(
      (item) => `
        <button class="galaxy-filter ${item.active ? "active" : ""}" type="button" data-galaxy-filter="${item.name}">
          <span class="galaxy-filter-planet-wrap" aria-hidden="true">
            <span class="galaxy-filter-planet-shadow"></span>
            <span class="galaxy-filter-planet" style="--planet-texture:url('${item.planet}')"></span>
          </span>
          <span class="galaxy-filter-copy">
            <span class="galaxy-filter-name">${item.name}</span>
            <span class="galaxy-filter-count">${item.count} 张卡片</span>
          </span>
        </button>
      `,
    )
    .join("");
}

function openGalaxyScreen() {
  closeCategoryModal();
  showView("galaxy");
}

function openOverviewScreen() {
  closeCategoryModal();
  showView("home");
}

function openOrganizeScreen() {
  closeCategoryModal();
  showView("organize");
}

function openOrganizeDetail(contentId) {
  const target = state.contents.find((item) => item.id === contentId);
  if (!target) return;
  closeCategoryModal();
  state.organizeFilter = "all";
  state.organizeSelectedId = contentId;
  state.organizeDraft = null;
  state.organizeTitleEditingId = null;
  state.organizeMenuId = null;
  state.organizeRenamingId = null;
  state.organizeRenameValue = "";
  showView("organize");
}

function openExportScreen() {
  closeCategoryModal();
  showView("export");
}

function openRelaxScreen() {
  closeCategoryModal();
  showView("relax");
}

function updateNavState(view) {
  const activeView = view === "draft" ? "home" : view;
  const navMap = {
    home: el.navHome,
    galaxy: el.navCollections,
    organize: el.navOrganize,
    relax: el.navRelax,
    export: el.navExport,
  };
  Object.entries(navMap).forEach(([key, node]) => {
    if (!node) return;
    const isActive = key === activeView;
    node.classList.toggle("active", isActive);
    if (isActive) {
      node.setAttribute("aria-current", "page");
    } else {
      node.removeAttribute("aria-current");
    }
  });
}

function openDraftScreen(draft) {
  state.draft = draft;
  showView("draft");
  el.draftTitle.value = draft.title || "";
  el.draftBody.value = draft.body || "";
  el.draftNote.value = draft.note || "";
  setDraftFeedback("");

  if (draft.source_url) {
    el.draftSource.classList.remove("hidden");
    el.draftSource.innerHTML = `原始链接：<a href="${draft.source_url}" target="_blank" rel="noreferrer">${draft.source_url}</a>`;
  } else {
    el.draftSource.classList.add("hidden");
    el.draftSource.innerHTML = "";
  }

  renderDraftCategories();
}

function closeDraftScreen() {
  closeCategoryModal();
  state.draft = null;
  showView("home");
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getOrganizeFilteredContents() {
  if (state.organizeFilter === "all") {
    return state.contents.slice();
  }
  return state.contents.filter((item) => item.categories?.includes(state.organizeFilter));
}

function getOrganizeCurrentItems() {
  return getOrganizeFilteredContents();
}

function getOrganizeSelectedItem() {
  return state.contents.find((item) => item.id === state.organizeSelectedId) || null;
}

function renderOrganizeCategories() {
  const allCount = state.contents.length;
  const items = [
    { name: "all", label: "全部卡片", count: allCount },
    ...state.categoryRecords.map((item) => ({
      id: item.id,
      name: item.name,
      label: item.name,
      count: item.item_count,
    })),
  ];

  el.organizeCategories.innerHTML = items
    .map((item, index) => {
      if (item.name === "all") {
        return `
          <div class="organize-category-item">
            <button class="organize-category-btn ${state.organizeFilter === item.name ? "active" : ""}" type="button" data-organize-filter="${item.name}">
              <span>${escapeHTML(item.label)}</span>
              <span>${item.count}</span>
            </button>
          </div>
        `;
      }

      if (state.organizeRenamingId === item.id) {
        return `
          <div class="organize-category-item renaming" data-category-id="${item.id}">
            <input class="organize-category-rename-input" type="text" value="${escapeHTML(state.organizeRenameValue || item.label)}" data-rename-input="${item.id}" />
            <button class="organize-category-rename-save" type="button" data-rename-save="${item.id}">保存</button>
          </div>
        `;
      }

      const isMenuOpen = state.organizeMenuId === item.id;
      const shouldOpenUp = index >= items.length - 2;
      const menuPositionClass = shouldOpenUp ? "open-up" : "open-down";

      return `
        <div class="organize-category-item ${isMenuOpen ? "menu-open" : ""}" data-category-id="${item.id}">
          <button class="organize-category-btn ${state.organizeFilter === item.name ? "active" : ""}" type="button" data-organize-filter="${item.name}">
            <span>${escapeHTML(item.label)}</span>
            <span>${item.count}</span>
          </button>
          <button class="organize-category-more" type="button" aria-label="重命名分类" data-rename-category="${item.id}">···</button>
          ${
            isMenuOpen
              ? `
                <div class="organize-category-menu ${menuPositionClass}">
                  <button type="button" data-menu-rename="${item.id}">重命名</button>
                  <button type="button" data-menu-delete="${item.id}">删除分类</button>
                </div>
              `
              : ""
          }
        </div>
      `;
    })
    .join("");

  const activeInput = el.organizeCategories.querySelector("[data-rename-input]");
  if (activeInput) {
    activeInput.focus();
    activeInput.select();
  }
}

function renderOrganizeList() {
  const items = getOrganizeCurrentItems();
  if (state.organizeSelectedId && !items.some((item) => item.id === state.organizeSelectedId)) {
    state.organizeSelectedId = null;
    state.organizeDraft = null;
    state.organizeTitleEditingId = null;
  }

  if (!items.length) {
    el.organizeList.innerHTML = `<div class="organize-empty">这里还没有可整理的卡片</div>`;
    return;
  }

  if (!state.organizeSelectedId) {
    state.organizeTitleEditingId = null;
    el.organizeList.innerHTML = items
      .map((item) => {
        const categoryText = (item.categories || []).join("、") || "未分类";
        return `
          <article class="organize-entry" data-content-id="${item.id}">
            <button class="organize-entry-toggle" type="button" data-entry-toggle="${item.id}">
              <span>
                <h4 class="organize-entry-title">${escapeHTML(item.title)}</h4>
                <div class="organize-entry-sub">${escapeHTML(categoryText)}</div>
              </span>
              <span class="organize-entry-date">${escapeHTML(formatShortDate(item.created_at))}</span>
            </button>
          </article>
        `;
      })
      .join("");
    return;
  }

  const item = getOrganizeSelectedItem();
  if (!item) {
    state.organizeSelectedId = null;
    state.organizeDraft = null;
    return renderOrganizeList();
  }

  if (!state.organizeDraft || state.organizeDraft.id !== item.id) {
    state.organizeDraft = {
      id: item.id,
      title: item.title || "",
      body: item.body || "",
      note: item.note || "",
      categories: [...(item.categories || [])],
      source_url: item.source_url || "",
    };
  }

  const currentIndex = items.findIndex((entry) => entry.id === item.id);
  const showPrev = currentIndex > 0;
  const showNext = currentIndex >= 0 && currentIndex < items.length - 1;
  const isTitleEditing = state.organizeTitleEditingId === item.id;
  const categoryLine = (state.organizeDraft.categories || [])
    .map((name) => {
      const planet = getPlanetForCategory(name);
      return `
        <span class="organize-category-pill">
          <img src="${planet}" alt="${name}" />
          <span>${name}</span>
        </span>
      `;
    })
    .join("");

  el.organizeList.innerHTML = `
    <article class="organize-detail" data-content-id="${item.id}">
      <div class="organize-detail-head">
        <div class="organize-title-wrap ${isTitleEditing ? "editing" : ""}">
          ${
            isTitleEditing
              ? `<input class="organize-title-input organize-title-hero" type="text" value="${escapeHTML(state.organizeDraft.title)}" data-title-editing="${item.id}" />`
              : `<button class="organize-title-display organize-title-hero" type="button" data-organize-title-display="${item.id}">${escapeHTML(
                  state.organizeDraft.title || "未命名卡片",
                )}</button>`
          }
        </div>
        <div class="organize-detail-nav">
          ${showPrev ? '<button class="organize-nav-btn" type="button" data-organize-prev>上一个</button>' : ""}
          <button class="organize-nav-btn" type="button" data-organize-back>返回</button>
          ${showNext ? '<button class="organize-nav-btn" type="button" data-organize-next>下一个</button>' : ""}
        </div>
      </div>

      <div class="organize-field body-field detail-body-field">
        <textarea class="organize-body-input">${escapeHTML(state.organizeDraft.body)}</textarea>
        ${
          state.organizeDraft.source_url
            ? `
              <div class="organize-source-inline">
                <label>原文链接</label>
                <a href="${escapeHTML(state.organizeDraft.source_url)}" target="_blank" rel="noreferrer">${escapeHTML(state.organizeDraft.source_url)}</a>
              </div>
            `
            : ""
        }
        <div class="organize-note-inline">
          <label>备注</label>
          <textarea class="organize-note-input">${escapeHTML(state.organizeDraft.note || "")}</textarea>
        </div>
      </div>

      <div class="organize-actions detail-actions">
        <div class="organize-category-row">
          ${categoryLine}
          <button class="organize-category-add" type="button" data-open-organize-categories>+</button>
        </div>
        <div class="organize-btn-row">
          <button class="organize-delete-btn" type="button" data-delete-content="${item.id}">删除</button>
          <button class="organize-save-btn" type="button" data-save-content="${item.id}">保存修改</button>
        </div>
      </div>

      <div class="organize-status" data-organize-status="${item.id}"></div>
    </article>
  `;

  const activeTitleInput = el.organizeList.querySelector("[data-title-editing]");
  if (activeTitleInput) {
    activeTitleInput.focus();
    activeTitleInput.select();
  }
}

function renderExportCategories() {
  el.exportCategories.innerHTML = state.categoryRecords
    .map((item) => {
      const checked = state.exportCategorySelection.includes(item.name) ? "checked" : "";
      return `
        <label class="export-category">
          <input type="checkbox" value="${escapeHTML(item.name)}" ${checked} data-export-category="${escapeHTML(item.name)}" />
          <span class="export-category-copy">
            <span class="export-category-name">${escapeHTML(item.name)}</span>
            <span class="export-category-count">${item.item_count} 张卡片</span>
          </span>
        </label>
      `;
    })
    .join("");
}

function renderExportScreen() {
  el.exportScopeAll.checked = state.exportScope === "all";
  el.exportScopeCategories.checked = state.exportScope === "categories";
  el.exportFormatXlsx.checked = state.exportFormat === "xlsx";
  el.exportFormatMd.checked = state.exportFormat === "md";
  renderExportCategories();
  setExportFeedback("");
}

function buildExportUrl() {
  const params = new URLSearchParams();
  params.set("format", state.exportFormat);
  params.set("scope", state.exportScope);
  if (state.exportScope === "categories") {
    state.exportCategorySelection.forEach((name) => params.append("name", name));
  }
  return `/api/export?${params.toString()}`;
}

function submitExport() {
  if (state.exportScope === "categories" && !state.exportCategorySelection.length) {
    setExportFeedback("请先至少勾选一个分类。", "error");
    return;
  }
  const link = document.createElement("a");
  link.href = buildExportUrl();
  link.click();
  setExportFeedback("导出任务已开始。", "success");
}

function beginRenameCategory(categoryId) {
  const record = state.categoryRecords.find((item) => item.id === categoryId);
  if (!record) return;
  state.organizeMenuId = null;
  state.organizeRenamingId = categoryId;
  state.organizeRenameValue = record.name;
  renderOrganizeCategories();
}

function cancelRenameCategory() {
  state.organizeRenamingId = null;
  state.organizeRenameValue = "";
  renderOrganizeCategories();
}

function toggleCategoryMenu(categoryId) {
  state.organizeMenuId = state.organizeMenuId === categoryId ? null : categoryId;
  renderOrganizeCategories();
}

async function saveRenameCategory(categoryId) {
  if (guardReadOnly("重命名分类")) return;
  const name = state.organizeRenameValue.trim();
  if (!name) return;
  const existing = state.categoryRecords.find((item) => item.id === categoryId);
  try {
    await apiFetch(`/api/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    await refreshCollectionsFromServer();
    if (existing && state.organizeFilter === existing.name) {
      state.organizeFilter = name;
    }
    state.organizeRenamingId = null;
    state.organizeRenameValue = "";
    renderGalaxyFilters();
    renderGalaxyStack();
    renderOrganizeCategories();
    renderOrganizeList();
  } catch (error) {
    if (error.isReadOnly) {
      openReadOnlyModal("重命名分类");
      return;
    }
    cancelRenameCategory();
  }
}

async function deleteCategoryRecord(categoryId) {
  if (guardReadOnly("删除分类")) return;
  const record = state.categoryRecords.find((item) => item.id === categoryId);
  if (!record) return;
  const confirmed = window.confirm(`确定删除分类「${record.name}」吗？此操作会把相关卡片从该分类中移出。`);
  if (!confirmed) return;

  try {
    const data = await apiFetch(`/api/categories/${categoryId}`, { method: "DELETE" });
    state.organizeMenuId = null;
    state.organizeRenamingId = null;
    state.organizeRenameValue = "";
    if (state.organizeFilter === record.name) {
      state.organizeFilter = "all";
      state.organizeSelectedId = null;
      state.organizeDraft = null;
    }
    if (data.categories) {
      state.categoryRecords = data.categories;
      const categoryNames = data.categories.map((item) => item.name);
      state.categories = Array.from(new Set([...DEFAULT_CATEGORY_NAMES, ...categoryNames]));
    }
    if (data.contents) {
      state.contents = data.contents;
    }
    syncRelaxGameData();
    renderGalaxyFilters();
    renderGalaxyStack();
    renderOrganizeCategories();
    renderOrganizeList();
  } catch (error) {
    if (error.isReadOnly) {
      openReadOnlyModal("删除分类");
      return;
    }
    state.organizeMenuId = null;
    renderOrganizeCategories();
  }
}

function syncCollections(data) {
  if (data?.content) {
    state.contents = [data.content, ...state.contents.filter((item) => item.id !== data.content.id)];
  }
  if (data?.categories) {
    state.categoryRecords = data.categories;
    const categoryNames = data.categories.map((item) => item.name);
    state.categories = Array.from(new Set([...DEFAULT_CATEGORY_NAMES, ...categoryNames]));
  }
  renderHomePlanets();
  syncRelaxGameData();
  renderGalaxyFilters();
  renderGalaxyStack();
  if (hasOverviewScreen && state.currentView === "overview") {
    setupOverviewMotion();
  } else if (hasOverviewScreen) {
    renderOverviewField();
  }
  renderOrganizeCategories();
  renderOrganizeList();
}

function ensureDraftCategories() {
  if (!state.draft.categories || !state.draft.categories.length) {
    state.draft.categories = ["待整理"];
  }
}

function renderDraftCategories() {
  ensureDraftCategories();
  const merged = Array.from(new Set([...state.categories, ...state.draft.categories]));
  state.categories = merged;

  el.draftCategories.innerHTML = merged
    .map((name) => {
      const active = state.draft.categories.includes(name) ? "active" : "";
      const planet = getPlanetForCategory(name);
      return `
        <button class="draft-category ${active}" type="button" data-category-name="${name}">
          <img src="${planet}" alt="${name}" />
          <span>${name}</span>
        </button>
      `;
    })
    .join("") +
    `
      <button class="draft-category add-category" type="button" data-open-category-modal="true">
        <span class="add-category-circle">+</span>
        <span>新建分类</span>
      </button>
    `;
}

function toggleDraftCategory(name) {
  ensureDraftCategories();
  if (state.draft.categories.includes(name)) {
    state.draft.categories = state.draft.categories.filter((item) => item !== name);
  } else {
    state.draft.categories = [...state.draft.categories, name];
  }
  renderDraftCategories();
}

function addDraftCategory() {
  if (guardReadOnly("新建分类")) return;
  const value = el.newCategoryInput.value.trim();
  if (!value) return;
  state.categoryPlanetMap[value] = state.selectedPlanet || PLANET_POOL[0];
  if (!state.categories.includes(value)) {
    state.categories.push(value);
  }
  el.newCategoryInput.value = "";
  if (state.categoryModalReturnMode === "manage") {
    if (!state.organizeCategoryDraft.includes(value)) {
      state.organizeCategoryDraft.push(value);
    }
    openCategoryModal("manage");
    return;
  }
  if (state.draft && !state.draft.categories.includes(value)) {
    state.draft.categories.push(value);
  }
  closeCategoryModal();
  renderDraftCategories();
}

function renderPlanetPicker() {
  el.planetPicker.innerHTML = PLANET_POOL.map((planet) => {
    const active = planet === state.selectedPlanet ? "active" : "";
    return `
      <button class="planet-option ${active}" type="button" data-planet-option="${planet}">
        <img src="${planet}" alt="${getPlanetLabel(planet)}" />
        <span>${getPlanetLabel(planet)}</span>
      </button>
    `;
  }).join("");
}

function renderManageCategoryGrid() {
  const categoryNames = Array.from(new Set([...DEFAULT_CATEGORY_NAMES, ...state.categories])).filter(Boolean);
  el.manageCategoryGrid.innerHTML = categoryNames
    .map((name) => {
      const active = state.organizeCategoryDraft.includes(name) ? "active" : "";
      const planet = getPlanetForCategory(name);
      return `
        <button class="manage-category-option ${active}" type="button" data-manage-category="${name}">
          <img src="${planet}" alt="${name}" />
          <span>${name}</span>
        </button>
      `;
    })
    .join("") +
    `
      <button class="manage-category-option add-category" type="button" data-manage-category-create="true">
        <span class="manage-category-add-circle">+</span>
        <span>新建分类</span>
      </button>
    `;
}

function openCategoryModal(mode = "create") {
  state.categoryModalMode = mode;
  el.categoryCreatePanel.classList.toggle("hidden", mode !== "create");
  el.categoryManagePanel.classList.toggle("hidden", mode !== "manage");
  state.selectedPlanet = state.selectedPlanet || PLANET_POOL[0];
  if (mode === "create") {
    renderPlanetPicker();
  } else {
    renderManageCategoryGrid();
    state.categoryModalReturnMode = "manage";
  }
  el.categoryModal.classList.remove("hidden");
  el.categoryModal.setAttribute("aria-hidden", "false");
  if (mode === "create") {
    el.newCategoryInput.value = "";
    el.newCategoryInput.focus();
  }
}

function closeCategoryModal() {
  el.categoryModal.classList.add("hidden");
  el.categoryModal.setAttribute("aria-hidden", "true");
}

function toggleManageCategory(name) {
  if (state.organizeCategoryDraft.includes(name)) {
    state.organizeCategoryDraft = state.organizeCategoryDraft.filter((item) => item !== name);
  } else {
    state.organizeCategoryDraft = [...state.organizeCategoryDraft, name];
  }
  renderManageCategoryGrid();
}

async function organizeInput() {
  if (guardReadOnly("整理导入")) return;
  const input = el.importInput.value.trim();
  const customInstruction = el.instructionInput?.value.trim() || "";
  if (!input) {
    setFeedback("请先粘贴一段原文或一条链接。", "error");
    return;
  }

  el.organizeBtn.disabled = true;
  el.organizeBtn.dataset.loading = "true";
  setFeedback(state.mode === "manual" ? "正在整理你粘贴的原文..." : "正在抓取并整理这条链接...");

  try {
    const data = await apiFetch("/api/organize", {
      method: "POST",
      body: JSON.stringify({ mode: state.mode, input, custom_instruction: customInstruction }),
    });

    const draft = {
      title: data.draft.title,
      body: data.draft.body,
      note: "",
      source_url: data.draft.source_url || "",
      categories: data.draft.categories || [],
    };
    openDraftScreen(draft);
  } catch (error) {
    if (error.isReadOnly) {
      openReadOnlyModal("整理导入");
      return;
    }
    setFeedback(`${error.message}${error.fallback ? ` ${error.fallback}` : ""}`, "error");
  } finally {
    el.organizeBtn.disabled = false;
    el.organizeBtn.dataset.loading = "false";
  }
}

async function saveDraft() {
  if (guardReadOnly("确认收藏")) return;
  if (!state.draft) return;

  const payload = {
    title: el.draftTitle.value.trim(),
    body: el.draftBody.value.trim(),
    note: el.draftNote.value.trim(),
    source_url: state.draft.source_url || "",
    categories: state.draft.categories || [],
  };

  if (!payload.title || !payload.body) {
    setDraftFeedback("标题和整理内容不能为空。", "error");
    return;
  }
  if (!payload.categories.length) {
    setDraftFeedback("请至少选择一个分类星系。", "error");
    return;
  }

  el.saveDraftBtn.disabled = true;
  el.saveDraftBtn.textContent = "收藏中...";

  try {
    const data = await apiFetch("/api/contents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    syncCollections(data);
    setDraftFeedback("已成功收藏到你的知识银河。", "success");
    el.importInput.value = "";
    if (el.instructionInput) {
      el.instructionInput.value = "";
    }
    setTimeout(() => {
      closeDraftScreen();
      setFeedback("已收藏成功。", "success");
    }, 700);
  } catch (error) {
    if (error.isReadOnly) {
      openReadOnlyModal("确认收藏");
      return;
    }
    setDraftFeedback(error.message, "error");
  } finally {
    el.saveDraftBtn.disabled = false;
    el.saveDraftBtn.textContent = "确认收藏";
  }
}

async function saveOrganizeEntry(contentId) {
  if (guardReadOnly("保存修改")) return;
  const entry = el.organizeList.querySelector(`[data-content-id="${contentId}"]`);
  if (!entry) return;
  const status = entry.querySelector(`[data-organize-status="${contentId}"]`);
  const titleInput = entry.querySelector(".organize-title-input");
  const title = (titleInput ? titleInput.value : state.organizeDraft?.title || "").trim();
  const body = entry.querySelector(".organize-body-input").value.trim();
  const note = entry.querySelector(".organize-note-input").value.trim();
  const categories = state.organizeDraft?.categories || [];

  if (!title || !body) {
    status.textContent = "标题和正文不能为空";
    status.dataset.tone = "error";
    return;
  }

  const payload = {
    title,
    body,
    note,
    categories,
    source_url: state.organizeDraft?.source_url || "",
  };

  status.textContent = "保存中...";
  status.dataset.tone = "";

  try {
    const data = await apiFetch(`/api/contents/${contentId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    syncCollections(data);
    state.organizeSelectedId = contentId;
    state.organizeTitleEditingId = null;
    state.organizeDraft = data.content
      ? {
          id: data.content.id,
          title: data.content.title || "",
          body: data.content.body || "",
          note: data.content.note || "",
          categories: [...(data.content.categories || [])],
          source_url: data.content.source_url || "",
        }
      : state.organizeDraft;
    renderOrganizeList();
    const nextStatus = el.organizeList.querySelector(`[data-organize-status="${contentId}"]`);
    if (nextStatus) {
      nextStatus.textContent = "已保存";
      nextStatus.dataset.tone = "success";
    }
  } catch (error) {
    if (error.isReadOnly) {
      openReadOnlyModal("保存修改");
      return;
    }
    status.textContent = error.message;
    status.dataset.tone = "error";
  }
}

async function deleteOrganizeEntry(contentId) {
  if (guardReadOnly("删除内容")) return;
  const target = state.contents.find((item) => item.id === contentId);
  if (!target) return;
  const confirmed = window.confirm(`确定删除「${target.title}」吗？`);
  if (!confirmed) return;

  try {
    await apiFetch(`/api/contents/${contentId}`, { method: "DELETE" });
    await refreshCollectionsFromServer();
    if (state.organizeSelectedId === contentId) {
      state.organizeSelectedId = null;
      state.organizeDraft = null;
    }
    renderGalaxyFilters();
    renderGalaxyStack();
    renderOrganizeCategories();
    renderOrganizeList();
  } catch (error) {
    if (error.isReadOnly) {
      openReadOnlyModal("删除内容");
      return;
    }
    const status = el.organizeList.querySelector(`[data-organize-status="${contentId}"]`);
    if (status) {
      status.textContent = error.message;
      status.dataset.tone = "error";
    }
  }
}

el.modeManual.addEventListener("click", () => switchMode("manual"));
el.modeLink.addEventListener("click", () => switchMode("link"));
el.organizeBtn.addEventListener("click", organizeInput);
el.saveDraftBtn.addEventListener("click", saveDraft);
el.navHome.addEventListener("click", (event) => {
  event.preventDefault();
  state.draft = null;
  showView("home");
});
el.navCollections.addEventListener("click", (event) => {
  event.preventDefault();
  openGalaxyScreen();
});
el.navRelax.addEventListener("click", (event) => {
  event.preventDefault();
  openRelaxScreen();
});
el.navOrganize.addEventListener("click", (event) => {
  event.preventDefault();
  openOrganizeScreen();
});
el.navExport.addEventListener("click", (event) => {
  event.preventDefault();
  openExportScreen();
});
el.addCategoryBtn.addEventListener("click", addDraftCategory);
el.newCategoryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addDraftCategory();
  }
});
el.closeCategoryModal.addEventListener("click", closeCategoryModal);
el.closeManageCategoryModal.addEventListener("click", closeCategoryModal);
el.categoryModalBackdrop.addEventListener("click", closeCategoryModal);
if (el.closeReadOnlyModal) {
  el.closeReadOnlyModal.addEventListener("click", closeReadOnlyModal);
}
if (el.readOnlyModalConfirm) {
  el.readOnlyModalConfirm.addEventListener("click", closeReadOnlyModal);
}
if (el.readOnlyModalBackdrop) {
  el.readOnlyModalBackdrop.addEventListener("click", closeReadOnlyModal);
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCategoryModal();
    closeReadOnlyModal();
  }
  if (event.key.toLowerCase() === "f" && state.currentView === "relax") {
    event.preventDefault();
    toggleRelaxFullscreen();
  }
});

if (hasRelaxGame) {
  el.relaxStartBtn.addEventListener("click", startRelaxRound);
  el.relaxRestartBtn.addEventListener("click", startRelaxRound);
  el.relaxCanvas.addEventListener("pointermove", (event) => {
    if (state.currentView !== "relax") return;
    updateRelaxPointer(event.clientX);
  });
  el.relaxCanvas.addEventListener("pointerdown", (event) => {
    if (state.currentView !== "relax") return;
    event.preventDefault();
    updateRelaxPointer(event.clientX);
    if (relaxMotion.mode === "idle" || relaxMotion.mode === "over") {
      startRelaxRound();
      return;
    }
    dropRelaxBall();
  });
}


el.draftCategories.addEventListener("click", (event) => {
  const modalButton = event.target.closest("[data-open-category-modal]");
  if (modalButton) {
    if (guardReadOnly("新建分类")) return;
    state.categoryModalReturnMode = "create";
    openCategoryModal();
    return;
  }
  const button = event.target.closest("[data-category-name]");
  if (!button || !state.draft) return;
  toggleDraftCategory(button.dataset.categoryName);
});

el.planetPicker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-planet-option]");
  if (!button) return;
  state.selectedPlanet = button.dataset.planetOption;
  renderPlanetPicker();
});

el.manageCategoryGrid.addEventListener("click", (event) => {
  const createButton = event.target.closest("[data-manage-category-create]");
  if (createButton) {
    if (guardReadOnly("新建分类")) return;
    state.categoryModalReturnMode = "manage";
    openCategoryModal("create");
    return;
  }
  const button = event.target.closest("[data-manage-category]");
  if (!button) return;
  if (guardReadOnly("调整分类")) return;
  toggleManageCategory(button.dataset.manageCategory);
});

el.applyManageCategoriesBtn.addEventListener("click", () => {
  if (guardReadOnly("调整分类")) return;
  if (!state.organizeDraft) return;
  if (!state.organizeCategoryDraft.length) return;
  state.organizeDraft.categories = [...state.organizeCategoryDraft];
  closeCategoryModal();
  renderOrganizeList();
});

el.galaxyFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-galaxy-filter]");
  if (!button) return;
  const nextFilter = button.dataset.galaxyFilter;
  state.galaxyFilter = nextFilter === "全部" ? "all" : nextFilter;
  state.galaxyRotation = 0;
  renderGalaxyFilters();
  renderGalaxyStack();
  startGalaxyRotation();
});

el.galaxyStack.addEventListener("mouseover", (event) => {
  const card = event.target.closest(".galaxy-card[data-distance='0']");
  if (!card) return;
  galaxyMotion.hovered = true;
  stopGalaxyRotation();
});

el.galaxyStack.addEventListener("mouseout", (event) => {
  const card = event.target.closest(".galaxy-card[data-distance='0']");
  if (!card) return;
  const related = event.relatedTarget;
  if (related && card.contains(related)) return;
  galaxyMotion.hovered = false;
  startGalaxyRotation();
});

el.galaxyStack.addEventListener("click", (event) => {
  const card = event.target.closest(".galaxy-card[data-track-index]");
  if (!card) return;
  const nextIndex = Number(card.dataset.trackIndex);
  if (Number.isNaN(nextIndex)) return;
  if (galaxyMotion.clickTimerId) {
    window.clearTimeout(galaxyMotion.clickTimerId);
  }
  galaxyMotion.clickTimerId = window.setTimeout(() => {
    galaxyMotion.clickTimerId = null;
    if (nextIndex === state.galaxyRotation) return;
    state.galaxyRotation = nextIndex;
    renderGalaxyStack();
    startGalaxyRotation();
  }, 220);
});

el.galaxyStack.addEventListener("dblclick", (event) => {
  const card = event.target.closest(".galaxy-card[data-content-id]");
  if (!card) return;
  if (galaxyMotion.clickTimerId) {
    window.clearTimeout(galaxyMotion.clickTimerId);
    galaxyMotion.clickTimerId = null;
  }
  const contentId = Number(card.dataset.contentId);
  if (Number.isNaN(contentId)) return;
  openOrganizeDetail(contentId);
});

if (hasOverviewScreen) {
  el.overviewField.addEventListener("click", (event) => {
    const button = event.target.closest("[data-overview-category]");
    if (!button) return;
    state.galaxyFilter = button.dataset.overviewCategory || "all";
    state.galaxyRotation = 0;
    openGalaxyScreen();
  });
}

el.organizeCategories.addEventListener("click", (event) => {
  const renameButton = event.target.closest("[data-rename-category]");
  if (renameButton) {
    toggleCategoryMenu(Number(renameButton.dataset.renameCategory));
    return;
  }

  const menuRename = event.target.closest("[data-menu-rename]");
  if (menuRename) {
    if (guardReadOnly("重命名分类")) return;
    beginRenameCategory(Number(menuRename.dataset.menuRename));
    return;
  }

  const menuDelete = event.target.closest("[data-menu-delete]");
  if (menuDelete) {
    deleteCategoryRecord(Number(menuDelete.dataset.menuDelete));
    return;
  }

  const renameSave = event.target.closest("[data-rename-save]");
  if (renameSave) {
    saveRenameCategory(Number(renameSave.dataset.renameSave));
    return;
  }

  const button = event.target.closest("[data-organize-filter]");
  if (!button) return;
  state.organizeFilter = button.dataset.organizeFilter;
  state.organizeSelectedId = null;
  state.organizeDraft = null;
  state.organizeRenamingId = null;
  state.organizeRenameValue = "";
  state.organizeMenuId = null;
  renderOrganizeCategories();
  renderOrganizeList();
});

el.organizeCategories.addEventListener("input", (event) => {
  const input = event.target.closest("[data-rename-input]");
  if (!input) return;
  state.organizeRenameValue = input.value;
});

el.organizeCategories.addEventListener("keydown", (event) => {
  const input = event.target.closest("[data-rename-input]");
  if (!input) return;
  if (event.key === "Enter") {
    event.preventDefault();
    saveRenameCategory(Number(input.dataset.renameInput));
  }
  if (event.key === "Escape") {
    event.preventDefault();
    cancelRenameCategory();
  }
});

el.organizeCategories.addEventListener("focusout", (event) => {
  const input = event.target.closest("[data-rename-input]");
  if (!input) return;
  const related = event.relatedTarget;
  if (related && related.closest(".organize-category-item")) return;
  window.setTimeout(() => {
    if (state.organizeRenamingId) {
      cancelRenameCategory();
    }
  }, 0);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".organize-category-item")) {
    if (state.organizeMenuId !== null) {
      state.organizeMenuId = null;
      renderOrganizeCategories();
    }
  }
});

el.organizeList.addEventListener("click", (event) => {
  const titleDisplay = event.target.closest("[data-organize-title-display]");
  if (titleDisplay) {
    return;
  }

  const toggle = event.target.closest("[data-entry-toggle]");
  if (toggle) {
    const contentId = Number(toggle.dataset.entryToggle);
    state.organizeSelectedId = contentId;
    state.organizeDraft = null;
    state.organizeTitleEditingId = null;
    renderOrganizeList();
    return;
  }

  const openCategories = event.target.closest("[data-open-organize-categories]");
  if (openCategories) {
    if (guardReadOnly("调整分类")) return;
    if (!state.organizeDraft) return;
    state.organizeCategoryDraft = [...(state.organizeDraft.categories || [])];
    openCategoryModal("manage");
    return;
  }

  const backButton = event.target.closest("[data-organize-back]");
  if (backButton) {
    state.organizeSelectedId = null;
    state.organizeDraft = null;
    state.organizeTitleEditingId = null;
    renderOrganizeList();
    return;
  }

  const prevButton = event.target.closest("[data-organize-prev]");
  if (prevButton) {
    const items = getOrganizeCurrentItems();
    const index = items.findIndex((item) => item.id === state.organizeSelectedId);
    if (index > 0) {
      state.organizeSelectedId = items[index - 1].id;
      state.organizeDraft = null;
    } else {
      state.organizeSelectedId = null;
      state.organizeDraft = null;
    }
    state.organizeTitleEditingId = null;
    renderOrganizeList();
    return;
  }

  const nextButton = event.target.closest("[data-organize-next]");
  if (nextButton) {
    const items = getOrganizeCurrentItems();
    const index = items.findIndex((item) => item.id === state.organizeSelectedId);
    if (index >= 0 && index < items.length - 1) {
      state.organizeSelectedId = items[index + 1].id;
      state.organizeDraft = null;
    } else {
      state.organizeSelectedId = null;
      state.organizeDraft = null;
    }
    state.organizeTitleEditingId = null;
    renderOrganizeList();
    return;
  }

  const saveButton = event.target.closest("[data-save-content]");
  if (saveButton) {
    saveOrganizeEntry(Number(saveButton.dataset.saveContent));
    return;
  }

  const deleteButton = event.target.closest("[data-delete-content]");
  if (deleteButton) {
    deleteOrganizeEntry(Number(deleteButton.dataset.deleteContent));
  }
});

el.organizeList.addEventListener("dblclick", (event) => {
  const titleDisplay = event.target.closest("[data-organize-title-display]");
  if (!titleDisplay) return;
  state.organizeTitleEditingId = Number(titleDisplay.dataset.organizeTitleDisplay);
  renderOrganizeList();
});

el.organizeList.addEventListener("input", (event) => {
  if (!state.organizeDraft) return;
  if (event.target.classList.contains("organize-title-input")) {
    state.organizeDraft.title = event.target.value;
  }
  if (event.target.classList.contains("organize-body-input")) {
    state.organizeDraft.body = event.target.value;
  }
  if (event.target.classList.contains("organize-note-input")) {
    state.organizeDraft.note = event.target.value;
  }
});

el.organizeList.addEventListener("keydown", (event) => {
  const titleInput = event.target.closest(".organize-title-input");
  if (!titleInput) return;
  if (event.key === "Enter") {
    event.preventDefault();
    state.organizeTitleEditingId = null;
    renderOrganizeList();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    state.organizeTitleEditingId = null;
    renderOrganizeList();
  }
});

el.exportScopeAll.addEventListener("change", () => {
  state.exportScope = "all";
  renderExportScreen();
});

el.exportScopeCategories.addEventListener("change", () => {
  state.exportScope = "categories";
  renderExportScreen();
});

el.exportFormatXlsx.addEventListener("change", () => {
  state.exportFormat = "xlsx";
});

el.exportFormatMd.addEventListener("change", () => {
  state.exportFormat = "md";
});

el.exportCategories.addEventListener("change", (event) => {
  const input = event.target.closest("[data-export-category]");
  if (!input) return;
  const name = input.value;
  if (input.checked) {
    if (!state.exportCategorySelection.includes(name)) {
      state.exportCategorySelection.push(name);
    }
  } else {
    state.exportCategorySelection = state.exportCategorySelection.filter((item) => item !== name);
  }
});

el.exportSubmitBtn.addEventListener("click", submitExport);

el.pageShell.addEventListener("pointermove", (event) => {
  if (!el.pageShell.classList.contains("home-mode")) return;
  updateParticlePointer(event.clientX, event.clientY);
});

el.pageShell.addEventListener("pointerleave", releaseParticlePointer);
el.pageShell.addEventListener("pointerup", releaseParticlePointer);
el.pageShell.addEventListener("pointercancel", releaseParticlePointer);

window.addEventListener("resize", () => {
  setupParticleMotion();
  resizeRelaxCanvas();
  if (el.overviewScreen && !el.overviewScreen.classList.contains("hidden")) {
    setupOverviewMotion();
  } else if (!el.galaxyScreen.classList.contains("hidden")) {
    renderGalaxyStack();
  }
});

document.addEventListener("fullscreenchange", () => {
  if (state.currentView === "relax") {
    window.setTimeout(() => {
      resizeRelaxCanvas();
      renderRelaxGame();
    }, 50);
  }
});

window.addEventListener("hashchange", () => {
  const nextView = getViewFromHash();
  if (nextView !== state.currentView) {
    showView(nextView);
  }
});

switchMode("link");
bootstrap();
