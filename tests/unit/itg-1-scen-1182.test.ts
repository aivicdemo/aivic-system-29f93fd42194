import { describe, test, expect } from "@jest/globals";
import { organizeVerificationEvidenceStructure } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ検証結果と根拠資料の構造化整理", () => {
  // SCEN-1182
  test("根拠資料が存在しない場合、エラーコード'ERR_EVIDENCE_NOT_FOUND'を返す", () => {
    const verification_id = "VER-20240115-001";
    const verification_type = "quality_check";
    const verification_datetime = new Date("2024-01-15T11:00:00Z");
    const evidence_references = [];

    const result = organizeVerificationEvidenceStructure({
      verification_id: verification_id,
      verification_type: verification_type,
      verification_datetime: verification_datetime,
      evidence_references: evidence_references,
    });

    expect(result).toEqual({
      success: false,
      error_code: "ERR_EVIDENCE_NOT_FOUND",
      error_message: "根拠資料が見つかりません",
      verification_id: verification_id,
      structured_data: null,
    });
  });
});