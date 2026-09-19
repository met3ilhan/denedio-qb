import { MECHANISM_IDS, TRAP_TYPE_IDS } from "@/shared/validation/pedagogy-enums";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import type { FingerprintAnalystInput } from "./types";

export function buildFingerprintAnalysisPrompt(input: FingerprintAnalystInput): string {
  const extractionJson = JSON.stringify({
    stemText: input.extraction.stemText,
    choices: input.extraction.choices,
    blocks: input.extraction.blocks,
    solutionText: input.extraction.solutionText,
    language: input.extraction.language,
    extractionWarnings: input.extraction.extractionWarnings,
  });

  return (
    "Sen Türkçe sınav soruları için pedagojik analistsin. Yalnızca verilen yapılandırılmış çıkarmayı kullan. " +
    "Tüm uzman-facing açıklamaları TÜRKÇE yaz (measured_skill, learning_objective, reasoning_pattern açıklamaları, " +
    "critical_signal, distractor summary, classification alanları). " +
    "Şema enum değerleri (mechanism_id, trap_type_ids, operation_type, difficulty EASY|MEDIUM|HARD) İngilizce sabit kalsın. " +
    "Genel doldurma YASAK: 'Skill derived from source stem', 'Source-aligned item', 'stem_guided_reasoning' gibi ifadeler kullanma. " +
    "Her boyut bu soruya özgü olmalı; emin değilsen metin alanına NOT_ANALYZED yaz. " +
    "hidden_constraint için: gizli koşul yoksa tam olarak 'NOT_APPLICABLE' yaz (İngilizce açıklama ekleme). " +
    "Tarih sorularında kayak/fiyat/parça parça fonksiyon şablonu uydurma. " +
    "Yanlış seçenekler için distractor_mechanisms: belge türü/kavram karışıklığı gibi gerçek tuzakları Türkçe özetle. " +
    `mechanism_id: ${MECHANISM_IDS.join("|")}. trap_type_ids: ${TRAP_TYPE_IDS.join("|")}. ` +
    `schemaVersion: "${SCHEMA_VERSION}". sourceQuestionId: ${input.sourceQuestionId}. ` +
    "JSON (markdown yok) — üst seviye alanlar: PedagogicalFingerprint alanları + classification nesnesi: " +
    "{ subject (ders, örn. Tarih), topic (konu), subtopic (alt konu, yoksa atla), question_type, difficulty EASY|MEDIUM|HARD, " +
    "expected_solve_time_seconds {min,max integer}, difficulty_rationale Türkçe }. " +
    "Structured extraction JSON:\n" +
    extractionJson
  );
}
