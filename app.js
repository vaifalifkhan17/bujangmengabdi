const storageKey = "content-creation-journey-v1";
const form = document.querySelector("#journeyForm");
const panels = [...document.querySelectorAll("[data-step]")];
const stepButtons = [...document.querySelectorAll("[data-step-button]")];
const planRows = document.querySelector("#planRows");
const selectedContent = document.querySelector("#selectedContent");
const summaryContent = document.querySelector("#summaryContent");
const previewTitle = document.querySelector("#previewTitle");
const pageTitle = document.querySelector("#pageTitle");
const stepLabel = document.querySelector("#stepLabel");
const pdfStepTitle = document.querySelector("#pdfStepTitle");
const progressBar = document.querySelector("#progressBar");
const identityName = document.querySelector("#identityName");
const identityTagline = document.querySelector("#identityTagline");
const identityValues = document.querySelector("#identityValues");
const selectedPillars = document.querySelector("#selectedPillars");
const logoFile = document.querySelector("#logoFile");
const visualFile = document.querySelector("#visualFile");
const logoFileName = document.querySelector("#logoFileName");
const visualFileName = document.querySelector("#visualFileName");
const logoUploadBox = document.querySelector("#logoUploadBox");
const visualUploadBox = document.querySelector("#visualUploadBox");
const logoUploadStatus = document.querySelector("#logoUploadStatus");
const visualUploadStatus = document.querySelector("#visualUploadStatus");
const colorRows = document.querySelector("#colorRows");
const colorMode = document.querySelector("#colorMode");
const gradientDirection = document.querySelector("#gradientDirection");
const gradientPreview = document.querySelector("#gradientPreview");
const contextSchool = document.querySelector("#contextSchool");
const contextMood = document.querySelector("#contextMood");
const contextFocus = document.querySelector("#contextFocus");
const visualSelectedTitle = document.querySelector("#visualSelectedTitle");
const visualSelectedMeta = document.querySelector("#visualSelectedMeta");
let currentStep = 0;
let planning = [];
let uploadedImages = { logo: "", visual: "" };
let palette = ["#0f4c81", "#2563eb", "#f59e0b", "#64748b"];
let savedSteps = [];
let savedPillars = [];
let savedPlanning = [];
let saveWarningShown = false;

const stepTitles = [
  "Kenali Identitas Instansi",
  "Tentukan Content Pillar Anda",
  "Buat Content Planning",
  "Buat Content Brief",
  "Tentukan Visual Direction",
];

function emptyData() {
  return {
    schoolName: "",
    tagline: "",
    institutionDescription: "",
    values: [],
    otherValues: "",
    strengths: "",
    assets: [],
    otherAssets: "",
    pillars: [],
    otherPillar: "",
    pillarGoal: "",
    pillarTopics: "",
    planningPeriod: "",
    publishFrequency: "2x/minggu",
    mainPlatform: "Instagram",
    selectedContent: "",
    caption: "",
    hashtags: "",
    mood: "",
    visualStyle: "Modern & Clean",
    layoutStyle: "Clean Corporate",
    heroSource: "Foto Resmi Kegiatan Instansi",
    colors: "",
    colorMode: "solid",
    gradientDirection: "90deg",
    heroVisual: "",
    supportingElements: "",
    aiKeywords: "",
    uploadedImages: { logo: "", visual: "" },
    palette: ["#0f4c81", "#2563eb", "#f59e0b", "#64748b"],
    savedSteps: [],
    savedPillars: [],
    savedPlanning: [],
  };
}

function collectFormData() {
  const data = emptyData();
  new FormData(form).forEach((value, key) => {
    if (key === "values" || key === "assets" || key === "pillars") data[key].push(value);
    else data[key] = value;
  });
  data.colors = describePalette(data.colorMode, data.gradientDirection);
  return { ...data, planning, uploadedImages, palette, savedSteps, savedPillars, savedPlanning };
}

function applyData(saved) {
  const data = { ...emptyData(), ...saved };
  planning = Array.isArray(data.planning) ? data.planning : [];
  uploadedImages = data.uploadedImages || { logo: "", visual: "" };
  palette = Array.isArray(data.palette) && data.palette.length ? data.palette : emptyData().palette;
  savedSteps = Array.isArray(data.savedSteps) ? data.savedSteps : [];
  savedPillars = Array.isArray(data.savedPillars)
    ? data.savedPillars
    : savedSteps.includes(1)
      ? [...data.pillars, data.otherPillar].filter(Boolean)
      : [];
  savedPlanning = Array.isArray(data.savedPlanning)
    ? data.savedPlanning
    : savedSteps.includes(2)
      ? (Array.isArray(data.planning) ? data.planning : [])
      : [];
  form.reset();
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const input = form.querySelector(`[name="${key}"][value="${CSS.escape(item)}"]`);
        if (input) input.checked = true;
      });
      return;
    }
    const input = form.querySelector(`[name="${key}"]`);
    if (input) input.value = value ?? "";
  });
  renderPlanning();
  renderPalette();
  renderSavedSteps();
  renderSummary();
}

function saveLocal() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(collectFormData()));
  } catch (error) {
    if (!saveWarningShown) {
      console.warn("Draft tidak dapat disimpan ke penyimpanan browser.", error);
      saveWarningShown = true;
    }
  }
  renderSummary();
}

function showStep(index) {
  currentStep = Math.max(0, Math.min(index, panels.length - 1));
  panels.forEach((panel, panelIndex) => panel.classList.toggle("is-active", panelIndex === currentStep));
  stepButtons.forEach((button, buttonIndex) => button.classList.toggle("is-active", buttonIndex === currentStep));
  renderSavedSteps();
  document.querySelector("#prevStep").disabled = currentStep === 0;
  setButtonLabel("#saveDraft", currentStep === panels.length - 1 ? "Simpan & Download Final" : "Simpan");
  setButtonLabel("#nextStep", currentStep === panels.length - 1 ? "Download Final" : "Lanjutkan");
  setButtonLabel("#downloadPdf", currentStep === panels.length - 1 ? "Download PDF Final" : "Download PDF Tahap Ini");
  pageTitle.textContent = stepTitles[currentStep];
  stepLabel.textContent = `Langkah ${currentStep + 1} dari ${panels.length}`;
  pdfStepTitle.textContent = currentStep === panels.length - 1 ? "Ringkasan Final" : `Ringkasan Tahap ${currentStep + 1}: ${stepTitles[currentStep]}`;
  progressBar.style.width = `${((currentStep + 1) / panels.length) * 100}%`;
  renderSummary();
}

function setButtonLabel(selector, label) {
  document.querySelector(selector).querySelector("span").textContent = label;
}

function renderSavedSteps() {
  stepButtons.forEach((button, index) => {
    button.classList.toggle("is-saved", savedSteps.includes(index));
  });
}

function markStepSaved() {
  if (currentStep === 1 && getCurrentPillars().length < 4) {
    alert("Pilih minimal 4 pillar sebelum menyimpan tahap ini.");
    return false;
  }
  savedSteps = savedSteps.filter((step) => step <= currentStep);
  if (!savedSteps.includes(currentStep)) savedSteps.push(currentStep);
  if (currentStep === 1) {
    savedPillars = [...collectFormData().pillars, collectFormData().otherPillar].filter(Boolean);
    savedPlanning = [];
    syncPlanningWithSavedPillars();
  }
  if (currentStep === 2) {
    savedPlanning = getPlanningRows(planning);
    renderContentOptions();
  }
  saveLocal();
  renderSavedSteps();
  return true;
}

function saveStepAndContinue() {
  if (!markStepSaved()) return;
  if (currentStep < panels.length - 1) {
    showStep(currentStep + 1);
    return;
  }
  downloadPdf();
}

function addPlanRow(row = {}) {
  const masterPillars = getSavedPillars();
  planning.push({
    pillar: row.pillar || masterPillars[0] || "",
    topic: row.topic || "",
    goal: row.goal || "",
    format: row.format || "Feed",
    schedule: row.schedule || "",
  });
  renderPlanning();
  saveLocal();
}

function renderPlanning() {
  planRows.innerHTML = "";
  if (!planning.length) addDefaultPlanning(false);
  const masterPillars = getSavedPillars();
  planning.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${masterPillars.length ? `
        <select data-plan="${index}" data-field="pillar">
          ${masterPillars.map((pillar) => `<option value="${escapeHtml(pillar)}" ${row.pillar === pillar ? "selected" : ""}>${escapeHtml(pillar)}</option>`).join("")}
        </select>
      ` : `<input data-plan="${index}" data-field="pillar" value="${escapeHtml(row.pillar)}" placeholder="Simpan pillar dulu" readonly />`}</td>
      <td><input data-plan="${index}" data-field="topic" value="${escapeHtml(row.topic)}" placeholder="Program unggulan bulan ini" /></td>
      <td><input data-plan="${index}" data-field="goal" value="${escapeHtml(row.goal)}" placeholder="Menunjukkan dampak instansi" /></td>
      <td><select data-plan="${index}" data-field="format">
        ${["Feed", "Carousel", "Reels", "Story", "Frame"].map((item) => `<option ${row.format === item ? "selected" : ""}>${item}</option>`).join("")}
      </select></td>
      <td><input data-plan="${index}" data-field="schedule" type="date" value="${escapeHtml(row.schedule)}" /></td>
      <td><button class="ghost-button small icon-danger" type="button" data-remove-plan="${index}">
        <i data-lucide="trash-2"></i>
        <span>Hapus</span>
      </button></td>
    `;
    planRows.appendChild(tr);
  });
  renderContentOptions();
  refreshIcons();
}

function addDefaultPlanning(shouldSave = true) {
  const pillars = getSavedPillars();
  const base = pillars.length ? pillars.slice(0, 4) : ["Profil Instansi", "Pencapaian", "Aktivitas Instansi", "Program & Layanan"];
  planning = base.map((pillar) => ({ pillar, topic: "", goal: "", format: "Feed", schedule: "" }));
  if (shouldSave) saveLocal();
}

function getSavedPillars() {
  return savedSteps.includes(1) ? savedPillars : [];
}

function getCurrentPillars() {
  const data = collectFormData();
  return [...data.pillars, data.otherPillar].filter(Boolean);
}

function syncPlanningWithSavedPillars() {
  const pillars = [...collectFormData().pillars, collectFormData().otherPillar].filter(Boolean);
  const existingByPillar = new Map(planning.map((row) => [row.pillar, row]));
  const nextRows = pillars.map((pillar) => existingByPillar.get(pillar) || {
    pillar,
    topic: "",
    goal: "",
    format: "Feed",
    schedule: "",
  });
  planning = nextRows.length ? nextRows : planning;
  renderPlanning();
}

function getSavedPlanningRows(force = false) {
  if (!force && !savedSteps.includes(2)) return [];
  return force ? getPlanningRows(planning) : savedPlanning;
}

function getPlanningRows(rows) {
  return rows.filter((row) => row.pillar || row.topic || row.goal || row.format || row.schedule)
    .map((row) => ({ ...row }));
}

function renderContentOptions() {
  const selected = selectedContent.value;
  const source = getSavedPlanningRows();
  selectedContent.innerHTML = (source.length ? source : []).map((row, index) => {
    const label = planningRowLabel(row, index);
    return `<option value="${escapeHtml(label)}">${escapeHtml(label)}</option>`;
  }).join("") || `<option value="">Simpan Content Planning dulu</option>`;
  if ([...selectedContent.options].some((option) => option.value === selected)) selectedContent.value = selected;
}

function renderSummary() {
  const data = collectFormData();
  renderIdentityPreview(data);
  renderSelectedPillars(data);
  renderContext(data);
  previewTitle.textContent = data.schoolName || "Nama Instansi";
  pdfStepTitle.textContent = currentStep === panels.length - 1 ? "Ringkasan Final" : `Ringkasan Tahap ${currentStep + 1}: ${stepTitles[currentStep]}`;
  document.querySelector("#pdfPage").classList.remove("is-final");
  renderPdfContent(data, currentStep);
}

function renderContext(data) {
  contextSchool.textContent = data.schoolName || "Belum diisi";
  contextMood.textContent = data.mood || joinList(data.values, data.otherValues) || "-";
  contextFocus.textContent = data.pillarGoal || data.strengths || "-";
  const selectedPlan = getSavedPlanningRows().find((row, index) => planningRowLabel(row, index) === data.selectedContent);
  visualSelectedTitle.textContent = data.selectedContent || "Brief belum dipilih";
  visualSelectedMeta.textContent = selectedPlan
    ? `${data.mainPlatform || "Platform"} - ${selectedPlan.format || "Format"}`
    : "Platform dan format mengikuti Content Planning.";
}

function planningRowLabel(row, index) {
  return row.topic ? `${row.topic} (${row.pillar || "Tanpa pilar"})` : `Konten ${index + 1}`;
}

function renderPdfContent(data, stepIndex) {
  const visiblePlans = data.planning.filter((row) => row.pillar || row.topic || row.goal || row.schedule);
  const sections = [
    identityPdf(data),
    pillarPdf(data),
    planningPdf(visiblePlans),
    block("04. Content Brief", [
      ["Konten", data.selectedContent],
      ["Caption", data.caption],
      ["Hashtag", data.hashtags],
    ]),
    visualPdf(data),
  ];
  summaryContent.innerHTML = sections[stepIndex];
}

function renderFinalPdfContent(data) {
  const visiblePlans = data.planning.filter((row) => row.pillar || row.topic || row.goal || row.schedule);
  const sections = [
    identityPdf(data),
    pillarPdf(data),
    planningPdf(visiblePlans),
    block("04. Content Brief", [
      ["Konten", data.selectedContent],
      ["Caption", data.caption],
      ["Hashtag", data.hashtags],
    ]),
    visualPdf(data),
  ];
  document.querySelector("#pdfPage").classList.add("is-final");
  summaryContent.innerHTML = sections.map((section, index) => `
    <section class="final-page">
      <div class="pdf-cover">
        <p class="pdf-kicker">Content Creation Journey</p>
        <h2>${escapeHtml(data.schoolName || "Nama Instansi")}</h2>
        <p>Halaman ${index + 1} dari 5: ${escapeHtml(stepTitles[index])}</p>
      </div>
      ${section}
    </section>
  `).join("");
}

function identityPdf(data) {
  return `
    <div class="pdf-identity">
      <div class="pdf-logo">${uploadedImages.logo ? `<img src="${uploadedImages.logo}" alt="Logo instansi" />` : `<span>Logo</span>`}</div>
      <div>
        <h3>${escapeHtml(data.schoolName || "Nama Instansi")}</h3>
        <p>${escapeHtml(data.tagline || "Slogan instansi")}</p>
      </div>
    </div>
    ${block("01. Identitas Digital", [
      ["Nama Instansi", data.schoolName],
      ["Slogan", data.tagline],
      ["Nilai / Karakter", joinList(data.values, data.otherValues)],
      ["Keunggulan", data.strengths],
      ["Aset yang Dimiliki", joinList(data.assets, data.otherAssets)],
    ])}
  `;
}

function pillarPdf(data) {
  const pillars = [...data.pillars, data.otherPillar].filter(Boolean);
  return `
    <section class="summary-block">
      <div class="summary-heading"><span>02</span><h3>Content Pillar Instansi</h3></div>
      <div class="pdf-pillars">
        ${pillars.length ? pillars.map((pillar, index) => `
          <div>
            <strong>${index + 1}. ${escapeHtml(pillar)}</strong>
            <span>${escapeHtml(pillarDescription(pillar))}</span>
          </div>
        `).join("") : `<p>Belum ada pilar yang dipilih.</p>`}
      </div>
    </section>
  `;
}

function planningPdf(rows) {
  return `
    <section class="summary-block">
      <div class="summary-heading"><span>03</span><h3>Content Planning</h3></div>
      <table class="pdf-table">
        <thead><tr><th>No</th><th>Pilar</th><th>Judul / Topik</th><th>Tujuan</th><th>Format</th><th>Jadwal</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((row, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(row.pillar)}</td>
              <td>${escapeHtml(row.topic)}</td>
              <td>${escapeHtml(row.goal)}</td>
              <td>${escapeHtml(row.format)}</td>
              <td>${escapeHtml(row.schedule)}</td>
            </tr>
          `).join("") : `<tr><td colspan="6">Belum ada rencana konten.</td></tr>`}
        </tbody>
      </table>
    </section>
  `;
}

function visualPdf(data) {
  return `
    ${block("05. Visual Direction", [
      ["Mood", data.mood],
      ["Mode Warna", colorModeLabel(data.colorMode)],
      ["Gaya", data.visualStyle],
      ["Hero Visual", data.heroVisual],
      ["Elemen", data.supportingElements],
      ["Keyword AI", data.aiKeywords],
      ["Gambar Referensi", uploadedImages.visual ? "Terlampir" : ""],
    ])}
    ${palettePdf(data)}
    ${imageBlock("Gambar Referensi Visual", uploadedImages.visual)}
  `;
}

function palettePdf(data) {
  return `
    <section class="summary-block">
      <div class="summary-heading"><span>CLR</span><h3>Palette Warna</h3></div>
      <div class="pdf-gradient" style="background:${escapeHtml(gradientCss(data.colorMode, data.gradientDirection))}"></div>
      <div class="pdf-swatches">
        ${palette.map((color) => `<div><span style="background:${escapeHtml(color)}"></span><strong>${escapeHtml(color.toUpperCase())}</strong></div>`).join("")}
      </div>
    </section>
  `;
}

function renderIdentityPreview(data) {
  identityName.textContent = data.schoolName || "Nama Instansi";
  identityTagline.textContent = data.tagline || "Slogan Instansi";
  const logoPreview = document.querySelector(".logo-preview");
  logoPreview.innerHTML = uploadedImages.logo
    ? `<img src="${uploadedImages.logo}" alt="Logo instansi" />`
    : `<i data-lucide="building-2"></i>`;
  renderUploadStatus(logoUploadBox, logoUploadStatus, logoFileName, uploadedImages.logo, "Logo sudah terupload", "PNG, JPG, WEBP maks. 2MB");
  renderUploadStatus(visualUploadBox, visualUploadStatus, visualFileName, uploadedImages.visual, "Referensi sudah terupload", "PNG, JPG, WEBP maks. 2MB");
  const values = [...data.values, data.otherValues].filter(Boolean).slice(0, 3);
  identityValues.innerHTML = (values.length ? values : ["-", "-", "-"])
    .map((item) => `<span>${escapeHtml(item)}</span>`)
    .join("");
}

function renderSelectedPillars(data) {
  const pillars = [...data.pillars, data.otherPillar].filter(Boolean);
  selectedPillars.innerHTML = pillars.length
    ? pillars.map((item, index) => `
      <div class="selected-pillar">
        <span>${index + 1}</span>
        <strong>${escapeHtml(item)}</strong>
      </div>
    `).join("")
    : `<p>Belum ada pilar yang dipilih.</p>`;
}

function renderPalette() {
  colorRows.innerHTML = palette.map((color, index) => `
    <div class="color-row">
      <input type="color" value="${escapeHtml(color)}" data-color-index="${index}" aria-label="Warna ${index + 1}" />
      <input type="text" value="${escapeHtml(color)}" data-color-text="${index}" aria-label="Kode warna ${index + 1}" />
      <button class="ghost-button small icon-danger" type="button" data-remove-color="${index}" ${palette.length <= 1 ? "disabled" : ""}>
        <i data-lucide="trash-2"></i>
        <span>Hapus</span>
      </button>
    </div>
  `).join("");
  renderGradientPreview();
  refreshIcons();
}

function renderGradientPreview() {
  const mode = colorMode.value || "solid";
  const direction = gradientDirection.value || "90deg";
  gradientPreview.style.background = gradientCss(mode, direction);
  form.querySelector('[name="colors"]').value = describePalette(mode, direction);
}

function gradientCss(mode, direction) {
  if (mode === "radial") return `radial-gradient(circle, ${palette.join(", ")})`;
  if (mode === "linear") return `linear-gradient(${direction}, ${palette.join(", ")})`;
  return `linear-gradient(90deg, ${palette.join(", ")})`;
}

function describePalette(mode, direction) {
  const colorList = palette.join(", ");
  if (mode === "linear") return `Linear gradient ${direction}: ${colorList}`;
  if (mode === "radial") return `Radial gradient: ${colorList}`;
  return `Palette: ${colorList}`;
}

function colorModeLabel(mode) {
  if (mode === "linear") return "Linear Gradient";
  if (mode === "radial") return "Radial Gradient";
  return "Solid / Palette";
}

function pillarDescription(pillar) {
  const descriptions = {
    "Profil Instansi": "Tentang identitas, visi, misi, fasilitas, layanan, dan nilai utama.",
    "Aktivitas Instansi": "Kegiatan, program, event, dokumentasi, dan keseharian operasional.",
    Pencapaian: "Capaian tim, penghargaan, dampak, testimoni, dan bukti kredibilitas.",
    Edukasi: "Tips, insight, informasi bermanfaat, literasi, dan pengembangan audiens.",
    Pengumuman: "Informasi penting, jadwal, kebijakan, dan agenda instansi.",
    "Program & Layanan": "Produk, layanan, program, penawaran, atau proses pendaftaran.",
    "Ucapan & Momen": "Hari besar, ucapan, dan momen spesial instansi.",
    Kolaborasi: "Kerja sama, kunjungan, mitra, dan dukungan pihak eksternal.",
  };
  return descriptions[pillar] || "Pilar komunikasi tambahan instansi.";
}

function normalizeHex(value) {
  const raw = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return "";
}

function block(title, rows) {
  const [number, ...nameParts] = title.split(". ");
  const name = nameParts.join(". ") || title;
  return `
    <section class="summary-block">
      <div class="summary-heading">
        <span>${escapeHtml(number)}</span>
        <h3>${escapeHtml(name)}</h3>
      </div>
      ${rows.map(([key, value]) => `<div class="summary-row"><strong>${escapeHtml(key)}</strong><span>${escapeHtml(value || "-")}</span></div>`).join("")}
    </section>
  `;
}

function imageBlock(title, src) {
  if (!src) return "";
  return `
    <section class="summary-block image-summary">
      <div class="summary-heading">
        <span>IMG</span>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <img src="${src}" alt="${escapeHtml(title)}" />
    </section>
  `;
}

function joinList(list, other) {
  return [...list, other].filter(Boolean).join(", ");
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function downloadJson() {
  const data = collectFormData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const name = slugify(data.schoolName || "draft-content-journey");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}-tahap-${currentStep + 1}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function downloadPdf() {
  saveLocal();
  const data = collectFormData();
  const name = slugify(data.schoolName || "ringkasan-content-journey");
  if (!window.jspdf) {
    alert("Library PDF belum termuat. Coba refresh halaman lalu download lagi.");
    return;
  }
  const pages = buildPdfPages(data);
  const isFinal = currentStep === panels.length - 1;
  const pagesToPrint = isFinal ? pages : [pages[currentStep]];
  const pdf = new jspdf.jsPDF("p", "mm", "a4");

  pagesToPrint.forEach((page, index) => {
    if (index > 0) pdf.addPage("a4", "portrait");
    drawPdfPage(pdf, data, page, isFinal ? index + 1 : currentStep + 1, isFinal ? 5 : 1);
  });
  pdf.save(isFinal ? `${name}-final.pdf` : `${name}-tahap-${currentStep + 1}.pdf`);
}

function buildPdfPages(data) {
  const visiblePlans = data.planning.filter((row) => row.pillar || row.topic || row.goal || row.schedule);
  return [
    {
      title: "Identitas Digital Instansi",
      logo: true,
      rows: [
        ["Nama Instansi", data.schoolName],
        ["Jenis Instansi", data.institutionType],
        ["Slogan / Tagline", data.tagline],
        ["Deskripsi Singkat", data.institutionDescription],
        ["Nilai / Karakter", joinList(data.values, data.otherValues)],
        ["Keunggulan Utama", data.strengths],
        ["Aset yang Dimiliki", joinList(data.assets, data.otherAssets)],
      ],
    },
    {
      title: "Content Pillar Instansi",
      rows: [[
        "Pilar Terpilih",
        [...data.pillars, data.otherPillar].filter(Boolean).map((pillar, index) => `${index + 1}. ${pillar} - ${pillarDescription(pillar)}`).join("\n"),
      ],
      ["Tujuan Pilar", data.pillarGoal],
      ["Topik / Hashtag", data.pillarTopics]],
    },
    {
      title: "Content Planning",
      rows: [
        ["Periode", data.planningPeriod],
        ["Frekuensi Publikasi", data.publishFrequency],
        ["Platform Utama", data.mainPlatform],
        ...visiblePlans.map((row, index) => [
        `Konten ${index + 1}`,
        `${row.pillar}\n${row.topic}\nTujuan: ${row.goal}\nFormat: ${row.format}\nJadwal: ${row.schedule}`,
        ]),
      ],
    },
    {
      title: "Content Brief",
      rows: [
        ["Konten", data.selectedContent],
        ["Caption", data.caption],
        ["Hashtag", data.hashtags],
      ],
    },
    {
      title: "Visual Direction",
      visualImage: true,
      rows: [
        ["Mood / Nuansa", data.mood],
        ["Mode Warna", colorModeLabel(data.colorMode)],
        ["Palette", palette.map((color) => color.toUpperCase()).join(", ")],
        ["Layout Style", data.layoutStyle],
        ["Sumber Hero", data.heroSource],
        ["Gaya Visual", data.visualStyle],
        ["Hero Visual", data.heroVisual],
        ["Elemen Pendukung", data.supportingElements],
        ["Keyword AI", data.aiKeywords],
      ],
      swatches: true,
    },
  ];
}

function drawPdfPage(pdf, data, page, pageNumber, totalPages) {
  const margin = 14;
  let y = 16;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, 182, 26, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(37, 99, 235);
  pdf.text("Content Creation Journey", margin + 5, y + 8);
  pdf.setFontSize(15);
  pdf.setTextColor(17, 24, 39);
  pdf.text(data.schoolName || "Nama Instansi", margin + 5, y + 18);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  const pageLabel = totalPages === 1 ? `Tahap ${pageNumber} / 5` : `Halaman ${pageNumber} dari ${totalPages}`;
  pdf.text(`${pageLabel} - ${page.title}`, 196, y + 8, { align: "right" });
  y += 36;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(17, 24, 39);
  pdf.text(page.title, margin, y);
  y += 8;

  if (page.logo && uploadedImages.logo) {
    y = drawPdfImage(pdf, uploadedImages.logo, margin, y, 34, 24);
  }

  if (page.swatches) {
    y = drawColorSwatches(pdf, y, margin);
  }

  page.rows.forEach(([label, value]) => {
    y = drawPdfRow(pdf, label, value || "-", margin, y);
  });

  if (page.visualImage && uploadedImages.visual) {
    drawPdfImage(pdf, uploadedImages.visual, margin, y, 58, 38);
  }
}

function drawPdfRow(pdf, label, value, x, y) {
  const width = 182;
  const labelWidth = 42;
  const textWidth = width - labelWidth - 10;
  const remaining = Math.max(20, 282 - y);
  let fontSize = 8.2;
  let lineHeight = 4.1;
  let lines = pdf.splitTextToSize(String(value || "-"), textWidth);
  let height = Math.max(11, lines.length * lineHeight + 6);

  if (height > remaining) {
    fontSize = 6.8;
    lineHeight = 3.25;
    lines = pdf.splitTextToSize(String(value || "-"), textWidth + 5);
    const maxLines = Math.max(1, Math.floor((remaining - 5) / lineHeight));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = `${String(lines[maxLines - 1]).replace(/\s+$/, "")}...`;
    }
    height = Math.max(10, Math.min(remaining, lines.length * lineHeight + 5));
  }

  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(x, y, width, height, 1.5, 1.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.6);
  pdf.setTextColor(107, 114, 128);
  pdf.text(label, x + 4, y + 7);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(17, 24, 39);
  pdf.text(lines, x + labelWidth + 6, y + 7, { maxWidth: textWidth + 5 });
  return y + height + 3;
}

function drawColorSwatches(pdf, y, x) {
  palette.forEach((color, index) => {
    const left = x + (index % 4) * 45;
    const top = y + Math.floor(index / 4) * 16;
    const rgb = hexToRgb(color);
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.circle(left + 5, top + 5, 4, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(17, 24, 39);
    pdf.text(color.toUpperCase(), left + 12, top + 7);
  });
  return y + Math.ceil(palette.length / 4) * 16 + 4;
}

function drawPdfImage(pdf, src, x, y, width, height) {
  try {
    pdf.setDrawColor(229, 231, 235);
    pdf.roundedRect(x, y, width, height, 1.5, 1.5);
    pdf.addImage(src, undefined, x + 2, y + 2, width - 4, height - 4);
    return y + height + 4;
  } catch (error) {
    return drawPdfRow(pdf, "Gambar", "File gambar terlampir di form, tetapi tidak bisa dirender ke PDF.", x, y);
  }
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readImageFile(file, key, label) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert("Ukuran gambar maksimal 2MB supaya PDF tetap ringan.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    uploadedImages[key] = reader.result;
    label.textContent = file.name;
    saveLocal();
    refreshIcons();
  };
  reader.readAsDataURL(file);
}

function renderUploadStatus(box, status, label, hasFile, uploadedText, defaultText) {
  box.classList.toggle("has-file", Boolean(hasFile));
  status.textContent = hasFile ? uploadedText : "Belum ada file";
  if (!hasFile) label.textContent = defaultText;
}

form.addEventListener("input", saveLocal);
form.addEventListener("change", saveLocal);
logoFile.addEventListener("change", (event) => readImageFile(event.target.files[0], "logo", logoFileName));
visualFile.addEventListener("change", (event) => readImageFile(event.target.files[0], "visual", visualFileName));
colorMode.addEventListener("change", () => {
  renderGradientPreview();
  saveLocal();
});
gradientDirection.addEventListener("change", () => {
  renderGradientPreview();
  saveLocal();
});
document.querySelector("#addColor").addEventListener("click", () => {
  palette.push("#ffffff");
  renderPalette();
  saveLocal();
});
colorRows.addEventListener("input", (event) => {
  const pickerIndex = event.target.dataset.colorIndex;
  const textIndex = event.target.dataset.colorText;
  const index = pickerIndex ?? textIndex;
  if (index === undefined) return;
  const value = normalizeHex(event.target.value);
  if (!value) return;
  palette[Number(index)] = value;
  renderPalette();
  saveLocal();
});
colorRows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-color]");
  if (!button || palette.length <= 1) return;
  palette.splice(Number(button.dataset.removeColor), 1);
  renderPalette();
  saveLocal();
});
document.querySelector("#addPlan").addEventListener("click", () => addPlanRow());
document.querySelector("#prevStep").addEventListener("click", () => showStep(currentStep - 1));
document.querySelector("#nextStep").addEventListener("click", () => saveStepAndContinue());
document.querySelector("#saveDraft").addEventListener("click", () => {
  saveStepAndContinue();
});
document.querySelector("#downloadPdf").addEventListener("click", downloadPdf);
stepButtons.forEach((button) => button.addEventListener("click", () => {
  const targetStep = Number(button.dataset.stepButton);
  if (currentStep === 1 || currentStep === 2) {
    if (!markStepSaved()) return;
  } else {
    saveLocal();
  }
  showStep(targetStep);
}));
planRows.addEventListener("input", (event) => {
  const index = Number(event.target.dataset.plan);
  const field = event.target.dataset.field;
  if (!Number.isNaN(index) && field) planning[index][field] = event.target.value;
  saveLocal();
});
planRows.addEventListener("change", (event) => {
  const index = Number(event.target.dataset.plan);
  const field = event.target.dataset.field;
  if (!Number.isNaN(index) && field) planning[index][field] = event.target.value;
  saveLocal();
});
planRows.addEventListener("click", (event) => {
  const removeIndex = event.target.dataset.removePlan;
  if (removeIndex === undefined) return;
  planning.splice(Number(removeIndex), 1);
  renderPlanning();
  saveLocal();
});

function loadSavedData() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    return saved && typeof saved === "object" ? saved : emptyData();
  } catch (error) {
    console.warn("Draft browser tidak valid dan diabaikan.", error);
    return emptyData();
  }
}

applyData(loadSavedData());
showStep(0);
refreshIcons();

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}
