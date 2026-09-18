import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import type { GoldenPedagogyRecord } from "./types";

/** Turkish verbal golden — inference with lexical trap. Original synthetic. */
export const GOLDEN_VERBAL_TR_AUTHOR_INFERENCE: GoldenPedagogyRecord = {
  id: "golden-verbal-tr-author-inference",
  title: "Yazar tutumu çıkarımı (lexical trap)",
  language: "tr",
  discipline: "verbal",
  source: {
    schemaVersion: SCHEMA_VERSION,
    providerId: "golden-pedagogy",
    modelId: "expert-authored-v1",
    demoFixtureId: "golden-verbal-tr-author-inference",
    extraction: {
      schemaVersion: SCHEMA_VERSION,
      sourceQuestionKey: "golden-verbal-tr-1",
      language: "tr",
      stemText:
        "Aşağıdaki parçayı okuyunuz.\n\n" +
        "Şehir kütüphanesinin yeni dijital kataloğu, ilk haftada kayıtlı üye sayısını artırdı; " +
        "ancak uzmanlar, sistemin arama sonuçlarını kişiselleştirmek için kullanılan verilerin " +
        "ne ölçüde şeffaf olduğunu hâlâ sorguluyor. Yazar, bu gelişmeyi ‘kolaylık sağlayan bir adım’ " +
        "olarak nitelendirirken, aynı cümlede ‘henüz güvenilir bir ölçüt sunmadığı’ uyarısını da düşürmeden bırakıyor.\n\n" +
        "Bu parçada yazarın dijital kataloğa yaklaşımı aşağıdakilerden hangisiyle en iyi açıklanır?",
      choices: [
        { label: "A", text: "Tamamen olumlu; tüm eleştirileri geçersiz kılıyor" },
        { label: "B", text: "Temkinli bir beğeni; yararını kabul ederken belirsizlikleri vurguluyor", isCorrect: true },
        { label: "C", text: "Kesin bir red; sistemi kullanılmaz buluyor" },
        { label: "D", text: "Tarafsız bir teknik rapor; kişisel yargı içermiyor" },
        { label: "E", text: "İronik bir alay; gelişmeyi ciddiye almıyor" },
      ],
      solutionText:
        "Yazar hem ‘kolaylık sağlayan adım’ der hem ‘henüz güvenilir ölçüt sunmadığı’ uyarısını korur → temkinli olumlu (B).",
      blocks: [],
      extractionWarnings: [],
    },
    blockLayers: {},
    layerNotes: {},
  },
  fingerprint: {
    schemaVersion: SCHEMA_VERSION,
    fingerprintId: "fp-golden-verbal-tr-inference-v1",
    sourceQuestionId: "golden-verbal-tr-1",
    measured_skill: "Parçada yazarın tutumunu çift yönlü ipuçlarından çıkarmak",
    learning_objective: "Tek kelimelik olum/olumsuzluk yerine cümle içi dengeyi okumak",
    cognitive_operation: "analyze",
    reasoning_pattern: "weigh_concessive_contrast_then_infer_attitude",
    solution_skeleton: [
      {
        phase_id: "parse",
        operation_type: "parse",
        depends_on: [],
        critical_substep: true,
        description: "Locate author-evaluative phrases (olumlu ve uyarıcı).",
      },
      {
        phase_id: "infer",
        operation_type: "infer",
        depends_on: ["parse"],
        critical_substep: true,
        description: "Resolve whether praise and caution coexist in same rhetorical move.",
      },
      {
        phase_id: "compare",
        operation_type: "compare",
        depends_on: ["infer"],
        critical_substep: false,
        description: "Eliminate absolute positive/negative and faux-neutral labels.",
      },
      {
        phase_id: "verify",
        operation_type: "verify",
        depends_on: ["compare"],
        critical_substep: false,
        description: "Check chosen option covers both halves of the concessive structure.",
      },
    ],
    critical_signal: {
      role: "Concessive pairing: benefit acknowledged while reliability doubt remains",
      surface_form_notes: "‘ancak’ clause plus quoted ‘kolaylık’ vs ‘henüz güvenilir ölçüt’",
    },
    hidden_constraint:
      "Attitude is mixed, not binary; options forcing single-valence reading are traps",
    reasoning_steps: { min: 3, max: 4 },
    information_order: "passage_then_attitude_question; evaluative lexicon mid-passage",
    calculation_burden: "none",
    language_burden: "high",
    visual_reasoning_burden: "none",
    distractor_mechanisms: [
      {
        slot: "A",
        mechanism_id: "MECH_PARTIAL",
        trap_type_ids: ["TRAP_PARTIAL", "TRAP_READ"],
        misconception_id: "misc_latch_first_positive_phrase",
        summary: "‘Kolaylık sağlayan adım’ ifadesine takılıp uyarıyı yok saymak.",
      },
      {
        slot: "C",
        mechanism_id: "MECH_READ",
        trap_type_ids: ["TRAP_READ"],
        misconception_id: "misc_latch_sorguluyor_as_rejection",
        summary: "Uzmanların sorgulamasını yazarın tam reddi sanmak.",
      },
      {
        slot: "D",
        mechanism_id: "MECH_SPECIAL_CASE",
        trap_type_ids: ["TRAP_CONCEPT_SWAP"],
        misconception_id: "misc_neutral_register_confusion",
        summary: "Bilimsel üslup gördüğü için tarafsız rapor sanmak.",
      },
      {
        slot: "E",
        mechanism_id: "MECH_RED_HERRING",
        trap_type_ids: ["TRAP_RED_HERRING"],
        misconception_id: "misc_irony_where_none",
        summary: "Olumsuz kelimeleri ironi olarak aşırı yorumlamak.",
      },
    ],
    misconception_targets: [
      "misc_latch_first_positive_phrase",
      "misc_latch_sorguluyor_as_rejection",
      "misc_neutral_register_confusion",
      "misc_irony_where_none",
    ],
    trap_types: ["TRAP_PARTIAL", "TRAP_READ", "TRAP_CONCEPT_SWAP", "TRAP_RED_HERRING"],
    elimination_opportunities: [
      "Parçada hem olumlu hem uyarıcı cümle var → tam olumlu ve tam red elenir",
    ],
    difficulty_factors: [
      { factor: "low_signal_to_noise", weight: "primary" },
      { factor: "trap_density", weight: "secondary" },
    ],
    expected_solve_time_seconds: { min: 60, max: 100 },
    question_archetype: {
      archetype_id: "AR_VERBAL_ATTITUDE_CONCESSIVE",
      version: "1",
      label: "Yazar tutumu — örtük concessive yapı",
    },
    mutable_surface_notes: "Konu (kütüphane→sağlık portalı), isimler; concessive yapı korunmalı.",
    dimension_evidence: [
      {
        dimensionKey: "critical_signal",
        verdict: "PRESERVED",
        evidence: [{ excerpt: "kolaylık sağlayan bir adım… henüz güvenilir bir ölçüt sunmadığı" }],
      },
    ],
  },
  invariants_summary: [
    "Mixed attitude (temkinli olumlu)",
    "Concessive critical signal",
    "Four verbal distractor mechanisms (partial, read, register swap, red herring)",
    "High language burden; no calculation",
  ],
  mutable_features: ["Passage domain", "Choice wording synonyms", "Five-option layout"],
  mutation_plan: {
    fingerprint_ref: "fp-golden-verbal-tr-inference-v1",
    surface_mutations: ["New policy topic; preserve ancak + paired evaluative quotes"],
    invariant_assertions: ["AR_VERBAL_ATTITUDE_CONCESSIVE", "reasoning_pattern unchanged"],
    operand_constraints: ["Passage 80–120 words Turkish; one clear concessive pivot"],
    distractor_regeneration: [
      { slot: "A", mechanism_id: "MECH_PARTIAL", parameter_notes: "Overweight first praise clause" },
      { slot: "C", mechanism_id: "MECH_READ", parameter_notes: "Misread expert doubt as author rejection" },
      { slot: "D", mechanism_id: "MECH_SPECIAL_CASE", parameter_notes: "False neutral register" },
      { slot: "E", mechanism_id: "MECH_RED_HERRING", parameter_notes: "Fabricated irony" },
    ],
    anti_copy_notes: "Do not reuse ‘dijital katalog’ clause order; keep pivot in second half.",
  },
  expected_pedagogical_family: "AR_VERBAL_ATTITUDE_CONCESSIVE / iki kutuplu ipucu dengesi",
  good_bad_examples: [
    {
      label: "GOOD",
      stem_excerpt: "Belediye uygulaması ‘zaman kazandırıyor’ derken ‘veri saklama süresi belirsiz’…",
      why: "Same concessive attitude inference.",
    },
    {
      label: "BAD_SURFACE",
      stem_excerpt: "Paragraf yalnızca sistemi övüyor; soru yine ‘temkinli beğeni’…",
      why: "Stem supports only A; mechanism collapse.",
    },
    {
      label: "BAD_MECHANISM",
      stem_excerpt: "Aynı paragraf; doğru seçenek ‘Tamamen olumlu’ olarak değiştirildi.",
      why: "Fingerprint attitude invariant broken (DRIFT).",
    },
  ],
  distractor_causality: [
    {
      choice_label: "A",
      choice_text: "Tamamen olumlu…",
      mechanism_id: "MECH_PARTIAL",
      trap_type_ids: ["TRAP_PARTIAL", "TRAP_READ"],
      misconception_id: "misc_latch_first_positive_phrase",
      steps: ["‘Kolaylık sağlayan adım’ ifadesini gör", "Uyarı cümlesini önemsiz say"],
      produces_value: "Seçenek A",
    },
    {
      choice_label: "C",
      choice_text: "Kesin bir red…",
      mechanism_id: "MECH_READ",
      trap_type_ids: ["TRAP_READ"],
      misconception_id: "misc_latch_sorguluyor_as_rejection",
      steps: ["Uzmanların sorguladığını oku", "Yazarın da reddettiğini varsay"],
      produces_value: "Seçenek C",
    },
    {
      choice_label: "D",
      choice_text: "Tarafsız teknik rapor…",
      mechanism_id: "MECH_SPECIAL_CASE",
      trap_type_ids: ["TRAP_CONCEPT_SWAP"],
      misconception_id: "misc_neutral_register_confusion",
      steps: ["Teknik terimleri gör", "Değerlendirme içermediğini varsay"],
      produces_value: "Seçenek D",
    },
    {
      choice_label: "E",
      choice_text: "İronik bir alay…",
      mechanism_id: "MECH_RED_HERRING",
      trap_type_ids: ["TRAP_RED_HERRING"],
      misconception_id: "misc_irony_where_none",
      steps: ["Olumsuz kelimeleri abart", "Alay olarak yorumla"],
      produces_value: "Seçenek E",
    },
  ],
  expected_solver: {
    correct_label: "B",
    correct_value_summary: "Temkinli beğeni",
    reasoning_phase_count: 4,
    independent_solver_should_match: true,
  },
  expected_verifier: {
    aggregate: "APPROVE",
    trivial_codes: [],
    dimension_findings: [
      { dimension: "language_burden", verdict: "PRESERVED", note: "High Turkish reading load" },
      { dimension: "distractor_mechanisms", verdict: "PRESERVED", note: "Four verbal mechanisms" },
    ],
  },
  evidence_notes: ["Five-option layout exercises E slot without changing four-mechanism minimum."],
};
