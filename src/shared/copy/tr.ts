/** Canonical V1 Turkish user-facing copy — see docs/TR_COPY_GLOSSARY.md */

export const tr = {
  app: {
    title: "Soru Stüdyosu",
    description:
      "Pedagoji Sinyal Laboratuvarı — kaynak kanıtından doğrulama ve dışa aktarmaya uzman iş akışı.",
    productName: "Soru Stüdyosu",
    labName: "Pedagoji Sinyal Laboratuvarı",
  },
  terms: {
    pedagogicalFingerprint: "Pedagojik Parmak İzi",
    criticalSignal: "Kritik Sinyal",
    distractor: "Çeldirici",
    misconception: "Kavram Yanılgısı",
    independentSolver: "Bağımsız Çözücü",
    verifier: "Doğrulayıcı",
  },
  demo: {
    badge: "ÖRNEK / DEMO",
    body:
      "Deterministik örnek veriler kullanılıyor — canlı yapay zeka çıktısı değildir. Gerçek sağlayıcı için QUESTION_STUDIO_DEMO_MODE kapatın.",
  },
  nav: {
    railLabel: "Stüdyo menüsü",
    phasesLabel: "İş akışı aşamaları",
    phaseLocked: "Sonraki aşamalar için önce kaynak alımını tamamlayın",
    provenanceTitle: "Köken",
    provenanceEmpty: "Henüz olay yok · tam iz Yayın aşamasında",
  },
  shell: {
    missionBoard: "S01 · Görev Panosu",
    missionStream: "Görev akışı",
  },
  common: {
    back: "Geri",
    continue: "Devam et",
    save: "Kaydet",
    cancel: "İptal",
    retry: "Yeniden dene",
    loading: "Yükleniyor…",
    missionThread: "Görev zinciri",
    open: "Aç",
    close: "Kapat",
    apply: "Uygula",
    upload: "Yükle",
    saving: "Kaydediliyor…",
    mission: "Görev",
    run: "Çalıştırma",
    dimension: "Boyut",
    quality: "Kalite",
    field: "Alan",
    status: "Durum",
    note: "Not",
    step: (n: number | string) => `Adım ${n}`,
    none: "—",
  },
  blockers: {
    panelAria: "Engel paneli",
    title: "Engeller",
    sortedActive: "Önem sırasına göre (aktif görevlerde).",
    sortedP0: "Önem sırasına göre (P0 önce).",
    empty: "Bu görevde engel yok.",
    count: (n: number) => `${n} engel`,
  },
  mission: {
    noMissionsTitle: "Henüz görev yok",
    noMissionsBody: "Görev zinciri açmak için kaynak alımıyla başlayın.",
    newSourceIntake: "Yeni kaynak alımı",
    activeMissions: "Aktif görevler",
    continueLast: "Son göreve devam et",
    streamAria: "Görev akışı",
    workspace: "Çalışma alanı",
    workspaceHint: "Aşama ekranları (S02–S18) kapılar tamamlandıkça buraya bağlanır. Son köken:",
    noEvents: "Kayıtlı olay yok.",
    offlineTitle: "Görev (veritabanı kapalı)",
    offlineBody:
      "Görev verilerini yüklemek için DATABASE_URL ayarlayın ve göçleri çalıştırın.",
    missionPrefix: "GÖREV",
    databaseOffline: "Veritabanı kapalı.",
    acceptStructuredBeforeDraft:
      "Parmak izi taslağı oluşturmak için önce yapılandırılmış çıkarmayı onaylayın:",
  },
  commandPalette: {
    closedHint: "Komut paleti kapalı. Açmak için Control+K.",
    aria: "Komut paleti",
    jumpStub: "Ekrana git (taslak)",
    screens: {
      missionBoard: "Görev Panosu",
      sourceUpload: "Kaynak Yükleme",
      fingerprintStudio: "Parmak İzi Stüdyosu",
    },
  },
  intake: {
    sourceNavigatorAria: "Kaynak gezgini",
    mainPanelAria: "Ana panel",
    inspectorAria: "Denetçi",
  },
  upload: {
    stepFiles: "1 · Dosyalar",
    stepMetadata: "2 · Meta veri",
    dropzoneTitle: "Sürükleyip bırakın veya dosya seçin",
    dropzoneHint: "PDF, DOCX, HTML, görsel · en fazla 25 MB",
    dropzoneActive: "Dosyayı buraya bırakın",
    browse: "Dosya seç",
    selected: (name: string) => `Seçilen: ${name}`,
    previewAlt: "Yüklenen kaynak önizlemesi",
    requirementsTitle: "Yükleme gereksinimleri",
    requirements: [
      "Dosya başına en fazla 25 MB",
      "PDF, DOCX, HTML, düz metin, görsel",
      "Gönderimde yeni bir görev zinciri oluşturulur",
    ],
    subjectLabel: "Konu ipucu",
    subjectPlaceholder: "ör. 7. sınıf orantısal akıl yürütme",
    languageLabel: "Dil",
    notesLabel: "Notlar",
    startExtraction: "Çıkarmayı başlat",
    uploading: "Yükleniyor…",
    errors: {
      fileRequired: "Önce bir dosya seçin.",
      unsupportedType: "Dosya türü desteklenmiyor.",
      sizeTooLarge: "Dosya boyutu çok büyük (en fazla 25 MB).",
      multipleFiles: "Yalnızca bir dosya yükleyebilirsiniz.",
      generic: "Görsel yüklenirken bir sorun oluştu. Tekrar deneyin.",
      dbUnavailable:
        "Yerel veritabanına bağlanılamadı. Docker veritabanını başlatın (pnpm db:up) ve göçleri uygulayın.",
      storageUnavailable: "Yerel dosya depolaması kullanılamıyor.",
      virus: "Dosya güvenlik taramasından geçemedi.",
      serverSave: "Sunucu görseli kaydedemedi.",
    },
    page: {
      screen: "S03 · Kaynak Yükleme",
      title: "Alım sihirbazı",
    },
  },
  sources: {
    libraryScreen: "S02 · Kaynak Kütüphanesi",
    libraryTitle: "Kaynak arşivi",
    filterPlaceholder: "Ada veya konuya göre filtrele",
    allExtractionStates: "Tüm çıkarma durumları",
    extractionQueued: "Kuyrukta",
    extractionRunning: "Çalışıyor",
    extractionSucceeded: "Başarılı",
    extractionFailed: "Başarısız",
    colName: "Ad",
    colSubject: "Konu",
    colExtraction: "Çıkarma",
    colFingerprint: "Parmak izi",
    colMission: "Görev",
    noSources: "Henüz kaynak yok.",
  },
  extraction: {
    timeline: "Çıkarma zaman çizelgesi",
    steps: ["Kuyrukta", "Çalışıyor", "Doğrulanıyor", "Tamamlandı"],
    openStructured: "Yapılandırılmış incelemeyi aç",
    inspector: "Denetçi",
    attempt: (n: number | string) => `Deneme ${n} · normal öncelik`,
    retry: "Çıkarmayı yeniden dene",
    page: {
      screen: "S04 · Çıkarma Kuyruğu",
      title: "Çıkarma işi",
    },
  },
  structured: {
    previewTitle: "Kaynak önizleme",
    previewHint: "Sayfa 1 · metin önizleme (tam görüntüleyici sonraki aşamada)",
    loading: "Yapılandırılmış çıkarma yükleniyor…",
    blocksTitle: "Yapılandırılmış bloklar",
    layers: {
      visible_fact: "Görünür gerçekler",
      inference: "Çıkarım",
      uncertainty: "Belirsizlik",
    },
    inspector: "Blok denetçisi",
    confidence: (pct: string) => `Güven ${pct}%`,
    layer: (label: string) => `Katman: ${label}`,
    accept: "Çıkarmayı onayla",
    reject: "Reddet · kuyruğa dön",
    viewTimeline: "İş zaman çizelgesini görüntüle",
    page: {
      screen: "S05 · Yapılandırılmış İnceleme",
      title: "Yan yana inceleme",
    },
  },
  fingerprint: {
    studioScreen: "S07 · Parmak İzi Stüdyosu",
    studioTitle: "Parmak İzi Stüdyosu",
    draftScreen: "S06 · Parmak İzi Taslağı",
    draftTitle: "Parmak izi taslağı",
    groups: {
      mechanism: "Mekanizma",
      burden: "Yük",
      distractors: "Çeldiriciler",
      surface: "Yüzey",
    },
    invariant: "Değişmez",
    mutable: "Değişebilir",
    evidence: "Kanıt",
    noEvidence: "Bu boyut için kanıt satırı yok.",
    saveMutableNotes: "Değişebilir notları kaydet",
    lockVersion: "Parmak izi sürümünü kilitle",
    dimensions: "Boyutlar",
    gapWarnings: "Boşluk uyarıları",
    openStudio: "Parmak İzi Stüdyosunda aç",
    evidenceSpans: "Kanıt parçaları",
    structuredHighlight: "Yapılandırılmış kaynak vurgusu",
    noBlockSelected: "Yapılandırılmış blok seçilmedi.",
    sourceFile: (id: string) => `Kaynak dosya ${id}`,
    openReviewS07: "Parmak izi incelemesini aç (S07)",
  },
  generation: {
    setupScreen: "S08 · Üretim Çalıştırma Kurulumu",
    setupTitle: "Üretim çalıştırma kurulumu",
    lockFingerprintFirst:
      "Mutasyon planları yazmadan önce bu görevde bir Pedagojik Parmak İzi kilitleyin. Tamamlayın",
    lockFingerprintPath: "alım → S06 → S07",
    mutationPlan: "Mutasyon planı",
    fingerprintVersion: "Parmak izi sürümü",
    previewGuards: "Basit mutasyon korumalarını önizle",
    savePlanToRun: "Planı çalıştırmaya kaydet",
    previewUpdated: "Önizleme güncellendi.",
    runSaved: "Çalıştırma kaydedildi.",
    invalidPlanJson: "Mutasyon planında geçersiz JSON.",
    trivialPreview: "Basit mutasyon önizleme",
    trivialHint:
      "QUESTION_GENERATION_RULES T1–T6 için sezgisel işaretler (Doğrulayıcı onayı değildir).",
    noTrivialFlags: "Bu plan için basit mutasyon işareti yok.",
    monitorScreen: "S09 · Üretim izleyici",
    monitorTitle: "Aday oluşturma",
    runningPipeline: "İşlem hattı çalışıyor…",
    spawned: (n: number) => `${n} aday oluşturuldu.`,
    spawnButton: "Adayları oluştur (S09)",
    openCompare: "S10 karşılaştırma matrisini aç",
    candidateLink: (id: string) => `Aday ${id}…`,
    findingsS12: "S12 bulgular",
  },
  candidates: {
    compareScreen: "S10 · Aday karşılaştırma",
    compareTitle: "Mekanizma matrisi",
    inspectorScreen: "S11 · Aday denetçi",
    inspectorTitle: "Düzenleme ve çeldirici meta verisi",
    openVerification: "S12 doğrulamayı aç",
    sourceMeasurement: "Kaynak ölçümü (salt okunur)",
    lockedInvariants: "Kilitli değişmezler",
    expertEditor: "Uzman düzenleyici (S11)",
    verificationStale: "Doğrulama güncel değil — onaydan önce Doğrulayıcıyı yeniden çalıştırın.",
    questionStem: "Soru gövdesi",
    solution: "Çözüm",
    choices: "Seçenekler",
    markCorrect: (label: string) => `${label} doğru olarak işaretle`,
    difficulty: "Zorluk",
    expectedSolveSec: "Beklenen çözüm (sn)",
    idealApproach: "İdeal yaklaşım",
    saveEdits: "Düzenlemeleri kaydet",
    saved: "Kaydedildi.",
    savedStale: "Kaydedildi — doğrulama geçersiz kılındı.",
    causalityDrawer: "Nedensellik çekmecesi",
    causalityHint:
      "Seçili yanlış seçenek için mekanizma, kavram yanılgısı, tuzak ve hata yolu.",
    noDistractorAnalysis: "Henüz çeldirici analizi yok.",
    wrongChoiceRailAria: "Yanlış seçenek şeridi",
    mechanismDeltasOnly: "Yalnızca mekanizma farkları",
    allRows: "Tüm satırlar",
    failWarnOnly: "Yalnızca Başarısız / Uyarı",
    fingerprintDrift: "Parmak izi sapması",
    distractorRowOnly: "Yalnızca çeldirici satırı",
    matrixAria: "Aday parmak izi karşılaştırma matrisi",
    compareRowAria: (label: string) => `${label} karşılaştırma satırı`,
    detail: "ayrıntı",
    sourceStem: "Kaynak gövdesi",
    closePreview: "Önizlemeyi kapat",
    openEditor: "Düzenleyiciyi aç",
    fingerprintRun: (label: string) => ` · parmak izi ${label}`,
    choice: "Seçenek",
    mechanismMech: "Mekanizma (MECH)",
    trapType: "Tuzak türü",
    likelyMistake: "Olası hata",
    whyAttractive: "Neden cazip",
    processOutcome: "İşlem sonucu (üretilen değer)",
    processErrorPath: "İşlem / hata yolu",
    addErrorStep: "Hata yolu adımı ekle",
    causalityStatus: "Nedensellik durumu",
    notEvaluated: "Değerlendirilmedi",
    noMetadataForChoice: (label: string) => `${label} seçeneği için çeldirici meta verisi yok.`,
    computed: (v: string) => ` · hesaplanan: ${v}`,
    approvalScreen: "S13 · Uzman onayı",
    approvalTitle: "İmza",
    verificationScreen: "S12 · Doğrulama bulguları",
    verificationTitle: "Geçti / Uyarı / Başarısız",
    expertComment: "Uzman yorumu",
    approveCandidate: "Adayı onayla",
    reject: "Reddet",
    rejected: "Aday reddedildi.",
    sendBack: "Geri gönder",
    approvalBlocked: "Onay, doğrulama geçene ve güncel olana kadar engellenir.",
    gate: "Kapı",
  },
  verification: {
    qualityGate: "Kalite kapısı",
    stale: "Güncel değil",
    rerun: "Doğrulamayı yeniden çalıştır",
    approvalLink: "S13 Onay",
    fixIn: "Düzelt:",
    editorS11: "düzenleyici (S11)",
    fingerprintS07: "parmak izi (S07)",
    fingerprintFidelity: "Parmak izi sadakati",
    verdict: "Karar",
    level: "Seviye",
    groups: {
      Solver: "Bağımsız Çözücü",
      Fingerprint: "Pedagojik Parmak İzi",
      Distractor: "Çeldirici",
      Similarity: "Benzerlik",
      Schema: "Şema",
      Trivial: "Basit mutasyon",
    },
  },
  causality: {
    SUPPORTED: "Doğrulandı (destekleniyor)",
    PLAUSIBLE: "Destekleniyor (nitel)",
    UNVERIFIED: "Doğrulanmadı",
    CONTRADICTED: "Çelişkili",
  },
  difficulty: {
    EASY: "Kolay",
    MEDIUM: "Orta",
    HARD: "Zor",
  },
  export: {
    dryRunScreen: "S18 · Kuru çalıştırma ve dışa aktarma kapısı",
    dryRunTitle: "İçe aktarma doğrulaması",
    mapScreen: "S17 · Denedio yük eşleyici",
    mapTitle: "Alan eşleme",
    mappingLink: "S17 eşleme",
    dryRunLink: "S18 kuru çalıştırma",
    catalogLink: "S16 katalog",
    recordLink: "S14 kayıt",
    passBanner: "GEÇTİ — dışa aktarma paketi etkin",
    failBanner: "BAŞARISIZ veya çalıştırılmadı — dışa aktarma kapalı",
    importKeyPreview: "importExternalKey önizleme:",
    importKeyStable: "importExternalKey (sabit):",
    runDryRun: "Kuru çalıştırma yap",
    downloadBundle: "Dışa aktarma paketini indir",
    publishDisabled: "Denedio'ya yayınla (devre dışı)",
    publishDisabledTitle: "Denedio'ya yayın V1'de devre dışı",
    issues: "Sorunlar",
    noIssues: "Kayıtlı sorun yok.",
    dryRunFailed: "Kuru çalıştırma isteği başarısız",
    exportBlocked: "Dışa aktarma engellendi",
    saveMapping: "Eşlemeyi kaydet",
    saveFailed: "Kaydetme başarısız",
    mappingSaved: "Eşleme kaydedildi",
    statusConfirmed: "onaylandı",
    statusProposed: "önerildi",
  },
  catalog: {
    screen: "S16 · Katalog tarayıcı",
    title: "Denedio taksonomi aynası",
    hint: "Yerel ayna — canlı Denedio varlıkları değildir.",
    curriculumTree: "Müfredat ağacı",
    readOnlyMirror: (source: string, fetchedAt: string) =>
      `Salt okunur ayna (${source}) · ${fetchedAt}`,
    demoDisclosure:
      "Örnek katalog referansı — UUID'ler yerel ayna değerleridir, canlı Denedio varlıkları doğrulanmamıştır.",
    uuidValidator: "Katalog UUID doğrulayıcı",
    uuidValidatorHint:
      "Yalnızca biçimi doğrular. Müfredatı S17'den aynadan eşleyin — rastgele UUID'leri Denedio FK olarak kullanmayın.",
    uuid: "UUID",
    validateUuid: "UUID doğrula",
    enterUuid: "UUID girin",
    invalidUuidFormat: "Geçersiz UUID biçimi",
    validUuid: "Geçerli UUID",
    trapTypes: "Tuzak türleri",
  },
  questions: {
    recordScreen: "S14 · Soru kaydı",
    recordTitle: "Onaylanan soru",
    versionHistory: "Sürüm geçmişi (S15)",
  },
  status: {
    pass: "Geçti",
    warning: "Uyarı",
    fail: "Başarısız",
    approved: "Onaylandı",
    rejected: "Reddedildi",
    draft: "Taslak",
    locked: "Kilitli",
    unknown: "Bilinmiyor",
  },
  confidence: {
    high: "yüksek",
    medium: "orta",
    low: "düşük",
  },
} as const;

export function verificationSeverityLabel(
  value: "PASS" | "WARNING" | "FAIL" | "BLOCKER" | string,
): string {
  switch (value) {
    case "PASS":
      return tr.status.pass;
    case "WARNING":
      return tr.status.warning;
    case "FAIL":
    case "BLOCKER":
      return tr.status.fail;
    default:
      return value;
  }
}

export function difficultyLabel(value: "EASY" | "MEDIUM" | "HARD" | string): string {
  switch (value) {
    case "EASY":
      return tr.difficulty.EASY;
    case "MEDIUM":
      return tr.difficulty.MEDIUM;
    case "HARD":
      return tr.difficulty.HARD;
    default:
      return value;
  }
}

export function causalityStatusLabel(state: string): string {
  return tr.causality[state as keyof typeof tr.causality] ?? state;
}

export function verificationGroupLabel(group: string): string {
  return tr.verification.groups[group as keyof typeof tr.verification.groups] ?? group;
}

export function mappingStatusLabel(status: "confirmed" | "proposed" | string): string {
  switch (status) {
    case "confirmed":
      return tr.export.statusConfirmed;
    case "proposed":
      return tr.export.statusProposed;
    default:
      return status;
  }
}

export function extractionStateLabel(state: string): string {
  switch (state) {
    case "PENDING":
      return tr.sources.extractionQueued;
    case "RUNNING":
      return tr.sources.extractionRunning;
    case "SUCCEEDED":
      return tr.sources.extractionSucceeded;
    case "FAILED":
      return tr.sources.extractionFailed;
    default:
      return state;
  }
}
