import { generateExplanationMaterial } from "../../src/logic/it-6-3-1";

describe("判定根拠統合・説明資料自動生成機能", () => {
  test("SCEN-877: AI根拠が存在しない場合、査定員判定理由のみで説明資料を生成する", () => {
    // 入力: AI根拠が存在しない（null）、査定員判定理由あり
    const assessmentCaseId = "CASE-20240115-001";
    const assessorReasonText =
      "地盤改良工の施工条件が通常より厳しいため、追加費用が必要と判断した";
    const aiReasonData = null;
    const assessorId = "ASSR-12345";
    const assessmentDate = "2024-01-15T14:30:00Z";

    // 関数実行
    const result = generateExplanationMaterial({
      assessmentCaseId,
      assessorReasonText,
      aiReasonData,
      assessorId,
      assessmentDate,
    });

    // 期待値検証
    // 1. 生成された説明資料が存在すること
    expect(result).toBeDefined();
    expect(result.material_id).toBeDefined();
    expect(result.material_id).toMatch(/^MAT-/);

    // 2. 説明資料の基本属性が正常であること
    expect(result.assessment_case_id).toBe("CASE-20240115-001");
    expect(result.assessor_id).toBe("ASSR-12345");
    expect(result.generated_at).toBe("2024-01-15T14:30:00Z");

    // 3. 生成形式がPDF/Word互換形式であること
    expect(result.format).toBe("PDF");
    expect(result.file_extension).toBe(".pdf");

    // 4. 説明資料の内容に査定員判定理由が記載されていること
    expect(result.content).toBeDefined();
    expect(result.content).toContain("地盤改良工");
    expect(result.content).toContain("追加費用");
    expect(result.content).toContain("判定理由");

    // 5. AI根拠のセクションが空白であることを確認
    expect(result.ai_basis_section).toBe("");
    expect(result.ai_basis_section.length).toBe(0);

    // 6. 全体のフォーマットが崩れていないことを確認
    expect(result.format_valid).toBe(true);
    expect(result.sections_count).toBe(2); // 基本情報セクション + 判定理由セクション
    expect(result.has_structure_error).toBe(false);

    // 7. 説明資料のタイトルが正常であること
    expect(result.title).toBe("査定判定根拠説明書");

    // 8. 説明資料に査定員情報が記載されていること
    expect(result.content).toContain(assessorId);

    // 9. AI根拠がないことを明示する記述がないこと（ただし欄が空白であること）
    expect(result.ai_basis_section.trim()).toBe("");

    // 10. 説明資料の生成ステータスが成功であること
    expect(result.generation_status).toBe("SUCCESS");
  });
});