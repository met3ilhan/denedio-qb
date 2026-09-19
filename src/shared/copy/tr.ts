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
      "Deterministik örnek veriler kullanılıyor — canlı yapay zeka çıktısı değildir.",
  },
  aiService: {
    retrying: "Yapay zekâ servisi geçici olarak yoğun. Yeniden deneniyor…",
    unavailable:
      "Yapay zekâ servisine şu anda ulaşılamıyor. Birkaç dakika sonra tekrar deneyebilirsiniz.",
    authError:
      "Yapay zekâ servisi kimlik doğrulaması başarısız. Yapılandırmayı kontrol edin.",
    invalidRequestError:
      "Yapay zekâ isteği reddedildi. Teknik ayrıntılara bakın veya destekle iletişime geçin.",
    genericFailure: "Yapay zekâ adımı tamamlanamadı. Tekrar deneyebilirsiniz.",
  },
  providerMode: {
    MOCK: {
      badge: "MOCK · Yerel",
      body:
        "Canlı yapay zeka kapalı. Çıkarım dosya özüne bağlı mock/yer tutucudur; yüklediğiniz görseli inceleme ekranında karşılaştırın.",
    },
    DEMO: {
      badge: "ÖRNEK / DEMO",
      body: "Yalnızca demo adlı kaynaklar deterministik örnek soruya eşlenir.",
    },
    MANUAL: {
      badge: "MANUEL",
      body: "Otomatik çıkarım kapalı; alanları uzman doldurur.",
    },
  },
  blockType: {
    stem: "Soru kökü",
    choice: "Seçenek",
    figure: "Şekil",
    table: "Tablo",
    solution: "Çözüm",
    metadata: "Meta veri",
    other: "Diğer",
  },
  jobStatus: {
    PENDING: "Kuyrukta",
    RUNNING: "Çalışıyor",
    SUCCEEDED: "Tamamlandı",
    FAILED: "Başarısız",
    CANCELLED: "İptal",
  },
  nav: {
    railLabel: "Stüdyo menüsü",
    globalLabel: "Ana gezinme",
    home: "Ana sayfa",
    sourcesArchive: "Kaynak arşivi",
    catalog: "Katalog",
    phasesLabel: "İş akışı aşamaları",
    phaseLocked: "Sonraki aşamalar için önce kaynak alımını tamamlayın",
    provenanceTitle: "Köken",
    provenanceEmpty: "Henüz olay yok · tam iz Yayın aşamasında",
  },
  home: {
    introAria: "Ürün tanıtımı",
    introTitle: "Kaynak sorudan doğrulanmış yeni soruya",
    introBody:
      "Soru Stüdyosu, uzmanların lisanslı kaynak soru görselini yükleyip pedagojik olarak eşdeğer yeni aday sorular üretmesi içindir. Yapay zeka yapıyı çıkarır; onay ve doğrulama uzmandadır. Bu uygulama öğrenci sınav arayüzü değildir.",
    introBullets: [
      "Başlangıç: kaynak soru görseli veya dosyası yükleyin.",
      "Sistem çıkarma ve Pedagojik Parmak İzi oluşturur; siz inceler ve kilitleyin.",
      "Demo modda sonuçlar örnek veridir; canlı yapay zeka ayrıca yapılandırılır.",
    ],
    primaryCta: "Yeni Soru Oluştur",
    secondarySources: "Kaynak arşivine git",
  },
  shell: {
    missionBoard: "Görev panosu",
    missionStream: "Görev akışı",
  },
  blockerCopy: {
    noSourceTitle: "Kaynak yüklenmedi",
    noSourceDetail: "Görev zincirini başlatmak için kaynak soru dosyası yükleyin.",
    extractionIncompleteTitle: "Çıkarma tamamlanmadı",
    extractionIncompleteDetail: (status: string) => `Son iş durumu: ${status}`,
    statusMissing: "kayıt yok",
    fingerprintNotLockedTitle: "Pedagojik Parmak İzi kilitli değil",
    fingerprintNotLockedDetail: "Aday üretiminden önce parmak izini inceleyip kilitleyin.",
    verificationFailTitle: "Doğrulama başarısız",
    verificationFailDetail: "Onay, doğrulama geçene kadar engellenir.",
    mappingMissingTitle: "Katalog eşlemesi eksik",
    mappingMissingDetail: "Denedio alan eşlemesini tamamlayın.",
    dryRunNotPassedTitle: "Kuru çalıştırma geçmedi",
    dryRunNotPassedDetail: "Dışa aktarmadan önce yerel içe aktarma doğrulamasını çalıştırın.",
  },
  workflow: {
    hubAria: "Görev iş akışı",
    hubTitle: "Bu görevde sıradaki adım",
    hubHint: "Her aşamaya buradan veya ilgili ekrandaki birincil düğmeden geçin.",
    nextStepLabel: "Sıradaki adım",
    continueStep: "Devam et",
    backToHome: "Ana sayfaya dön",
    statusDone: "Tamamlandı",
    statusCurrent: "Şimdi",
    statusUpcoming: "Sırada",
    statusBlocked: "Önce önceki adım",
    upload: {
      label: "Kaynak soru yükle",
      description: "Görsel veya dosya ile yeni görev başlatın.",
    },
    extraction: {
      label: "Çıkarma işi",
      description: "Kaynaktan yapılandırılmış metin çıkarılır.",
    },
    structured: {
      label: "Yapılandırılmış inceleme",
      description: "Çıkarmayı onaylayın veya reddedin.",
    },
    fingerprintDraft: {
      label: "Parmak izi taslağı",
      description: "Pedagojik Parmak İzi taslağını gözden geçirin.",
    },
    fingerprintStudio: {
      label: "Parmak İzi Stüdyosu",
      description: "Değişmezleri doğrulayın ve sürümü kilitleyin.",
    },
    generation: {
      label: "Üretim kurulumu",
      description: "Mutasyon planı ve çalıştırma ayarları.",
    },
    generationRun: {
      label: "Aday oluşturma",
      description: "Demo veya canlı üretim çalıştırması.",
    },
    compare: {
      label: "Aday karşılaştırma",
      description: "Kardeş adayların mekanizma matrisi.",
    },
    candidate: {
      label: "Aday düzenleyici",
      description: "Soru metni, çeldiriciler ve çözüm.",
    },
    verification: {
      label: "Doğrulama bulguları",
      description: "Bağımsız Çözücü ve Doğrulayıcı sonuçları.",
    },
    approval: {
      label: "Uzman onayı",
      description: "Onayla veya reddet.",
    },
    dryRun: {
      label: "Denedio kuru çalıştırma",
      description: "Yerel içe aktarma doğrulaması.",
    },
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
    undetermined: "Belirlenmedi",
    notYetEvaluated: "Henüz değerlendirilmedi",
  },
  provenance: {
    label: "Kaynak",
    aiDerived: "Canlı AI",
    expertEdited: "Uzman düzenledi",
    solverDerived: "Bağımsız çözücü",
    denedioMapping: "Denedio eşlemesi",
    undetermined: "Belirlenmedi",
  },
  denedioReadiness: {
    mappingPending: "Eşleme bekliyor",
    mappingConfirmed: "Eşleme onaylandı",
  },
  expertReview: {
    screenLabel: "Kaynak soru analizi",
    title: "Kaynak soru analizi",
    sourcePanel: "Kaynak paneli",
    aiContent: "Yapay zeka içeriği",
    classification: "Sınıflandırma",
    pedagogicalProfile: "Pedagojik profil",
    denedioReadiness: "Denedio hazırlığı",
    primaryCta: "Analizi onayla ve soru üretimine geç",
    extractionNotReady: "Çıkarma henüz hazır değil.",
    approveFailed: "Onay ve kilitleme başarısız — tekrar deneyin.",
    correctAnswer: "Doğru cevap",
    fieldCol: "Alan",
    studioCol: "Stüdyo değeri",
    valueStatusCol: "Değer durumu",
    mappingCol: "Denedio eşlemesi",
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
    newSourceIntake: "Yeni Soru Oluştur",
    defaultTitle: (baseName: string) => `Kaynak · ${baseName}`,
    activeMissions: "Aktif görevler",
    continueLast: "Son göreve devam et",
    streamAria: "Görev akışı",
    workspace: "Çalışma alanı",
    workspaceHint: "Soldaki menüden veya aşağıdaki adım listesinden ilerleyin.",
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
      screen: "Kaynak yükleme",
      title: "Kaynak soru yükleme",
    },
  },
  sources: {
    libraryScreen: "Kaynak arşivi",
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
    steps: ["Görsel yüklendi", "Soru okunuyor", "İçerik yapılandırılıyor", "İncelemeye hazır"],
    technicalDetails: "Teknik ayrıntılar",
    openStructured: "Yapılandırılmış incelemeyi aç",
    inspector: "Denetçi",
    attempt: (n: number | string) => `Deneme ${n} · normal öncelik`,
    retry: "Çıkarmayı yeniden dene",
    schemaShapeError:
      "Yapay zekâ soruyu okudu ancak sonuç beklenen biçime dönüştürülemedi. Tekrar deneyebilir veya teknik ayrıntıları inceleyebilirsiniz.",
    providerUnavailableError:
      "Yapay zekâ servisine şu anda ulaşılamıyor. Birkaç dakika sonra tekrar deneyebilirsiniz.",
    genericFailureError:
      "Çıkarma tamamlanamadı. Tekrar deneyebilir veya teknik ayrıntıları inceleyebilirsiniz.",
    page: {
      screen: "Çıkarma işi",
      title: "Çıkarma işi",
    },
  },
  structured: {
    previewTitle: "Yüklenen kaynak",
    previewHint: "Görseli çıkarılan metinle karşılaştırın",
    executionMode: "Çalıştırma modu",
    fileName: "Dosya",
    uploadedAt: "Yüklenme",
    checksum: "SHA256",
    technicalDetails: "Teknik ayrıntılar",
    providerLabel: "Sağlayıcı",
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
    accept: "Analizi onayla ve devam et",
    reject: "Reddet · kuyruğa dön",
    viewTimeline: "İş zaman çizelgesini görüntüle",
    page: {
      screen: "Kaynak soru analizi",
      title: "Kaynak soru analizi",
    },
    acceptAndContinue: "Analizi onayla ve devam et",
  },
  fingerprint: {
    studioScreen: "Pedagojik parmak izi",
    studioTitle: "Pedagojik parmak izi incelemesi",
    draftScreen: "Pedagojik profil",
    draftTitle: "Pedagojik profil taslağı",
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
    openReviewS07: "Parmak izi incelemesini aç",
  },
  generation: {
    setupScreen: "Üretim kurulumu",
    setupTitle: "Üretim çalıştırma kurulumu",
    lockFingerprintFirst:
      "Mutasyon planları yazmadan önce bu görevde bir Pedagojik Parmak İzi kilitleyin.",
    lockFingerprintPath: "kaynak analizi → parmak izi kilidi",
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
    monitorScreen: "Üretim izleyici",
    monitorTitle: "Aday oluşturma",
    runningPipeline: "İşlem hattı çalışıyor…",
    spawned: (n: number) => `${n} aday oluşturuldu.`,
    spawnButton: "Adayları oluştur",
    openCompare: "Karşılaştırma matrisini aç",
    candidateLink: (id: string) => `Aday ${id}…`,
    findingsS12: "Doğrulama bulguları",
  },
  candidates: {
    compareScreen: "Aday karşılaştırma",
    compareTitle: "Mekanizma matrisi",
    inspectorScreen: "Aday denetçi",
    inspectorTitle: "Düzenleme ve çeldirici meta verisi",
    openVerification: "Doğrulamayı aç",
    sourceMeasurement: "Kaynak ölçümü (salt okunur)",
    lockedInvariants: "Kilitli değişmezler",
    expertEditor: "Uzman düzenleyici",
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
    mechanismMech: "Mekanizma",
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
    approvalScreen: "Uzman onayı",
    approvalTitle: "İmza",
    verificationScreen: "Doğrulama bulguları",
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
    approvalLink: "Onay",
    fixIn: "Düzelt:",
    editorS11: "düzenleyici",
    fingerprintS07: "parmak izi incelemesi",
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
    dryRunScreen: "Kuru çalıştırma ve dışa aktarma",
    dryRunTitle: "İçe aktarma doğrulaması",
    mapScreen: "Denedio alan eşleyici",
    mapTitle: "Alan eşleme",
    mappingLink: "Alan eşleme",
    dryRunLink: "Kuru çalıştırma",
    catalogLink: "Katalog",
    recordLink: "Soru kaydı",
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
    screen: "Katalog tarayıcı",
    title: "Denedio taksonomi aynası",
    hint: "Yerel ayna — canlı Denedio varlıkları değildir.",
    curriculumTree: "Müfredat ağacı",
    readOnlyMirror: (source: string, fetchedAt: string) =>
      `Salt okunur ayna (${source}) · ${fetchedAt}`,
    demoDisclosure:
      "Örnek katalog referansı — UUID'ler yerel ayna değerleridir, canlı Denedio varlıkları doğrulanmamıştır.",
    uuidValidator: "Katalog UUID doğrulayıcı",
    uuidValidatorHint:
      "Yalnızca biçimi doğrular. Müfredatı alan eşlemeden aynadan eşleyin — rastgele UUID'leri Denedio FK olarak kullanmayın.",
    uuid: "UUID",
    validateUuid: "UUID doğrula",
    enterUuid: "UUID girin",
    invalidUuidFormat: "Geçersiz UUID biçimi",
    validUuid: "Geçerli UUID",
    trapTypes: "Tuzak türleri",
  },
  questions: {
    recordScreen: "Soru kaydı",
    recordTitle: "Onaylanan soru",
    versionHistory: "Sürüm geçmişi",
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
