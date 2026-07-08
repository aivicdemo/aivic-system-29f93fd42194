import { validateImprovementPlan } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-1481: [normal] 改善計画妥当性自動検証 - 改善計画が必須項目をすべて満たしている場合、承認可とする
  test("改善計画の全必須項目が満たされている場合、検証結果が承認可と表示される", () => {
    const improvement_plan = {
      improvement_item_name: "OCR読取精度向上",
      improvement_content: "過去案件データ追加により学習データセットを拡充",
      scheduled_start_date: "2025-02-01",
      scheduled_end_date: "2025-02-28",
      responsible_person: "山田太郎",
      target_value: 85.5,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(true);
    expect(result.approval_status).toBe("承認可");
    expect(result.error_messages).toEqual([]);
    expect(result.missing_fields).toEqual([]);
    expect(result.validation_timestamp).toBeDefined();
  });

  test("改善項目名が未入力の場合、検証結果が不承認となる", () => {
    const improvement_plan = {
      improvement_item_name: "",
      improvement_content: "過去案件データ追加により学習データセットを拡充",
      scheduled_start_date: "2025-02-01",
      scheduled_end_date: "2025-02-28",
      responsible_person: "山田太郎",
      target_value: 85.5,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(false);
    expect(result.approval_status).toBe("不承認");
    expect(result.missing_fields).toContain("improvement_item_name");
  });

  test("改善内容が未入力の場合、検証結果が不承認となる", () => {
    const improvement_plan = {
      improvement_item_name: "OCR読取精度向上",
      improvement_content: "",
      scheduled_start_date: "2025-02-01",
      scheduled_end_date: "2025-02-28",
      responsible_person: "山田太郎",
      target_value: 85.5,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(false);
    expect(result.approval_status).toBe("不承認");
    expect(result.missing_fields).toContain("improvement_content");
  });

  test("実施予定日が未入力の場合、検証結果が不承認となる", () => {
    const improvement_plan = {
      improvement_item_name: "OCR読取精度向上",
      improvement_content: "過去案件データ追加により学習データセットを拡充",
      scheduled_start_date: "",
      scheduled_end_date: "2025-02-28",
      responsible_person: "山田太郎",
      target_value: 85.5,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(false);
    expect(result.approval_status).toBe("不承認");
    expect(result.missing_fields).toContain("scheduled_start_date");
  });

  test("責任者が未入力の場合、検証結果が不承認となる", () => {
    const improvement_plan = {
      improvement_item_name: "OCR読取精度向上",
      improvement_content: "過去案件データ追加により学習データセットを拡充",
      scheduled_start_date: "2025-02-01",
      scheduled_end_date: "2025-02-28",
      responsible_person: "",
      target_value: 85.5,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(false);
    expect(result.approval_status).toBe("不承認");
    expect(result.missing_fields).toContain("responsible_person");
  });

  test("目標値が未入力の場合、検証結果が不承認となる", () => {
    const improvement_plan = {
      improvement_item_name: "OCR読取精度向上",
      improvement_content: "過去案件データ追加により学習データセットを拡充",
      scheduled_start_date: "2025-02-01",
      scheduled_end_date: "2025-02-28",
      responsible_person: "山田太郎",
      target_value: null,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(false);
    expect(result.approval_status).toBe("不承認");
    expect(result.missing_fields).toContain("target_value");
  });

  test("実施予定日の形式が不正な場合、検証結果が不承認となる", () => {
    const improvement_plan = {
      improvement_item_name: "OCR読取精度向上",
      improvement_content: "過去案件データ追加により学習データセットを拡充",
      scheduled_start_date: "2025/02/01",
      scheduled_end_date: "2025-02-28",
      responsible_person: "山田太郎",
      target_value: 85.5,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(false);
    expect(result.approval_status).toBe("不承認");
    expect(result.error_messages.length).toBeGreaterThan(0);
  });

  test("開始日が終了日より後の場合、検証結果が不承認となる", () => {
    const improvement_plan = {
      improvement_item_name: "OCR読取精度向上",
      improvement_content: "過去案件データ追加により学習データセットを拡充",
      scheduled_start_date: "2025-03-01",
      scheduled_end_date: "2025-02-28",
      responsible_person: "山田太郎",
      target_value: 85.5,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(false);
    expect(result.approval_status).toBe("不承認");
    expect(result.error_messages.length).toBeGreaterThan(0);
  });

  test("複数の必須項目が未入力の場合、すべての不足項目が記録される", () => {
    const improvement_plan = {
      improvement_item_name: "",
      improvement_content: "",
      scheduled_start_date: "",
      scheduled_end_date: "2025-02-28",
      responsible_person: "",
      target_value: null,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(false);
    expect(result.approval_status).toBe("不承認");
    expect(result.missing_fields).toContain("improvement_item_name");
    expect(result.missing_fields).toContain("improvement_content");
    expect(result.missing_fields).toContain("scheduled_start_date");
    expect(result.missing_fields).toContain("responsible_person");
    expect(result.missing_fields).toContain("target_value");
    expect(result.missing_fields.length).toBe(5);
  });

  test("目標値が負の数の場合、検証結果が不承認となる", () => {
    const improvement_plan = {
      improvement_item_name: "OCR読取精度向上",
      improvement_content: "過去案件データ追加により学習データセットを拡充",
      scheduled_start_date: "2025-02-01",
      scheduled_end_date: "2025-02-28",
      responsible_person: "山田太郎",
      target_value: -10,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.is_valid).toBe(false);
    expect(result.approval_status).toBe("不承認");
    expect(result.error_messages.length).toBeGreaterThan(0);
  });

  test("検証結果にはタイムスタンプが含まれる", () => {
    const improvement_plan = {
      improvement_item_name: "OCR読取精度向上",
      improvement_content: "過去案件データ追加により学習データセットを拡充",
      scheduled_start_date: "2025-02-01",
      scheduled_end_date: "2025-02-28",
      responsible_person: "山田太郎",
      target_value: 85.5,
      target_value_unit: "%",
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.validation_timestamp).toBeDefined();
    expect(typeof result.validation_timestamp).toBe("string");
  });
});