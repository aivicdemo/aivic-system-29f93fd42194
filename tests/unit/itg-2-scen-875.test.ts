import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { integrateAndGenerateExplanation } from "../../src/logic/it-6-2-2-1";

const fetchMock = require("jest-fetch-mock");

describe("判定根拠統合・説明資料自動生成機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-875
  test("AI自動判定根拠と査定員判定理由を統合し説明資料を自動生成・記録する", () => {
    // ===== 準備フェーズ =====
    // 1. AI自動判定根拠データ
    const ai_judgment_basis = {
      assessment_id: "ASS-2024-001",
      deviation_rate: 12.5,
      deviation_amount: 250000,
      reference_data_count: 47,
      price_book_source: "物価本2024年1月版",
      applied_correction_coefficient: 1.08,
      deviation_category: "標準",
      confidence_score: 87,
    };

    // 2. 査정원 판정 이유
    const assessor_judgment_reason = "地域の労務費変動と季節要因を考慮し、物価本の基準単価に対して8%の上昇傾向が妥当と判定。";

    // 3. API レスポンス（AI根拠データ取得）
    fetchMock.mockResponseOnce(
      JSON.stringify({
        assessment_id: ai_judgment_basis.assessment_id,
        ai_judgment: ai_judgment_basis,
      }),
      { status: 200 }
    );

    // 4. API レスポンス（説明資料保存）
    const saved_explanation_id = "EXP-2024-001";
    fetchMock.mockResponseOnce(
      JSON.stringify({
        explanation_id: saved_explanation_id,
        assessment_id: ai_judgment_basis.assessment_id,
        generation_timestamp: "2024-01-15T11:00:00Z",
        saved: true,
      }),
      { status: 200 }
    );

    // ===== 実行フェーズ =====
    const result = integrateAndGenerateExplanation({
      assessment_id: ai_judgment_basis.assessment_id,
      ai_judgment_basis: ai_judgment_basis,
      assessor_judgment_reason: assessor_judgment_reason,
      assessor_id: "ASR-2024-042",
      generation_timestamp: "2024-01-15T11:00:00Z",
    });

    // ===== 検証フェーズ =====
    // (1) 統合・生成が正常に完了したか
    expect(result).toBeDefined();
    expect(result.integration_status).toBe("success");

    // (2) 統合された根拠データの検証
    expect(result.integrated_basis).toBeDefined();
    expect(result.integrated_basis.ai_deviation_rate).toBe(12.5);
    expect(result.integrated_basis.ai_deviation_amount).toBe(250000);
    expect(result.integrated_basis.ai_confidence_score).toBe(87);
    expect(result.integrated_basis.assessor_reason).toBe(
      assessor_judgment_reason
    );

    // (3) 自動生成された説明資料の内容検証
    expect(result.generated_explanation).toBeDefined();
    expect(result.generated_explanation.title).toContain("見積査定根拠説明");
    expect(result.generated_explanation.content).toContain("乖離率");
    expect(result.generated_explanation.content).toContain("12.5%");
    expect(result.generated_explanation.content).toContain("250000");
    expect(result.generated_explanation.content).toContain(
      "地域の労務費変動と季節要因"
    );
    expect(result.generated_explanation.content).toContain("1.08");
    expect(result.generated_explanation.reference_data_count).toBe(47);
    expect(result.generated_explanation.price_book_source).toBe(
      "物価本2024年1月版"
    );

    // (4) 説明資料フォーマットの検証
    expect(result.generated_explanation.format).toBe("PDF");
    expect(result.generated_explanation.sections).toContain("乖離根拠");
    expect(result.generated_explanation.sections).toContain("査定員判定理由");
    expect(result.generated_explanation.sections).toContain("参照データ");

    // (5) 説明資料の構造化データ検証
    expect(result.generated_explanation.deviation_basis).toBeDefined();
    expect(
      result.generated_explanation.deviation_basis.deviation_rate_percent
    ).toBe(12.5);
    expect(
      result.generated_explanation.deviation_basis.deviation_amount_yen
    ).toBe(250000);
    expect(
      result.generated_explanation.deviation_basis.deviation_category
    ).toBe("標準");
    expect(
      result.generated_explanation.deviation_basis.applied_correction_coefficient
    ).toBe(1.08);

    // (6) 査定員判定理由の統合確認
    expect(result.generated_explanation.assessor_judgment).toBeDefined();
    expect(result.generated_explanation.assessor_judgment.reason).toBe(
      assessor_judgment_reason
    );
    expect(result.generated_explanation.assessor_judgment.assessor_id).toBe(
      "ASR-2024-042"
    );

    // (7) システム記録の検証
    expect(result.system_record).toBeDefined();
    expect(result.system_record.saved).toBe(true);
    expect(result.system_record.explanation_id).toBe(saved_explanation_id);
    expect(result.system_record.assessment_id).toBe(
      ai_judgment_basis.assessment_id
    );
    expect(result.system_record.generation_timestamp).toBe(
      "2024-01-15T11:00:00Z"
    );
    expect(result.system_record.linked_to_assessment).toBe(true);

    // (8) 監査ログの確認
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.action).toBe("生成・保存");
    expect(result.audit_log.assessor_id).toBe("ASR-2024-042");
    expect(result.audit_log.timestamp).toBe("2024-01-15T11:00:00Z");
    expect(result.audit_log.assessment_id).toBe(ai_judgment_basis.assessment_id);

    // (9) 生成されたファイルメタデータ
    expect(result.explanation_metadata).toBeDefined();
    expect(result.explanation_metadata.filename).toContain(
      saved_explanation_id
    );
    expect(result.explanation_metadata.mimetype).toBe("application/pdf");
    expect(result.explanation_metadata.generated_at).toBe(
      "2024-01-15T11:00:00Z"
    );

    // (10) 説明資料が査定情報と正確に紐付けられているか
    expect(result.assessment_linkage).toBeDefined();
    expect(result.assessment_linkage.assessment_id).toBe(
      ai_judgment_basis.assessment_id
    );
    expect(result.assessment_linkage.explanation_id).toBe(saved_explanation_id);
    expect(result.assessment_linkage.linked).toBe(true);
    expect(result.assessment_linkage.reference_status).toBe("正常");
  });
});