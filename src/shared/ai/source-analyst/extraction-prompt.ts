import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import type { SourceAnalystInput } from "./types";

export function buildSourceExtractionPrompt(input: SourceAnalystInput): string {
  return (
    "Sen Türkçe sınav soruları için kaynak analistsin. Yalnızca geçerli JSON döndür (markdown yok). " +
    "Tüm metin alanları Türkçe olmalı. " +
    "choices: 2–5 seçenek; etiketler A'dan başlayarak ardışık olmalı (A,B,C,D veya A,B,C,D,E — görselde kaç seçenek varsa hepsini dahil et, asla D'de kesme). " +
    "blocks: stem + her choice için block (type choice, choiceLabel, text, page:1). " +
    "isCorrect: yalnızca kaynakta açıkça işaretli doğru cevap varsa true; yoksa tüm seçeneklerde false veya alanı atla. " +
    "Doğru cevap görünmüyorsa extractionWarnings içine 'correct_answer_not_visible_in_source' ekle. " +
    "Kaynakta doğru cevap işaretli değilse, kendi alan bilgine dayanarak inferredCorrectLabel alanında en iyi cevabın harfini belirt; " +
    "bu alan kaynakta görünür bilgi değildir. solutionText alanına bu cevabın işlevsel gerekçesini Türkçe 1–3 cümleyle yaz. " +
    `schemaVersion tam olarak "${SCHEMA_VERSION}". ` +
    "Dosya adı: " +
    input.originalFilename
  );
}
