import { structuredValidationResultWithWarning } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 参照ドキュメント存在確認", () => {
  // SCEN-1207: [edge] 検証結果根拠資料構造化機能 - 参照先のソースドキュメント（契約書・提案資料）が存在しない場合、警告フラグが付与される
  test("参照先のソースドキュメントが存在しない場合、検証結果に警告フラグが付与される", () => {
    const validation_result_id = "vr_20240115_001";
    const validation_error_id = "ve_20240115_001";
    const error_content = "営業データの売上金額が契約条件の範囲を超過";
    const source_contract_id = null;
    const source_proposal_id = null;
    const detected_at_timestamp = new Date("2024-01-15T11:30:00Z");

    const result = structuredValidationResultWithWarning({
      validation_result_id,
      validation_error_id,
      error_content,
      source_contract_id,
      source_proposal_id,
      detected_at_timestamp,
    });

    expect(result.validation_result_id).toBe("vr_20240115_001");
    expect(result.validation_error_id).toBe("ve_20240115_001");
    expect(result.error_content).toBe("営業データの売上金額が契約条件の範囲を超過");
    expect(result.source_contract_id).toBeNull();
    expect(result.source_proposal_id).toBeNull();
    expect(result.warning_flag).toBe(true);
    expect(result.warning_code).toBe("DOC_NOT_FOUND");
    expect(result.warning_message).toMatch(/参照先ドキュメント/);
    expect(result.warning_timestamp).toEqual(new Date("2024-01-15T11:30:00Z"));
    expect(result.processing_status).toBe("CONTINUED_WITH_WARNING");
    expect(result.is_logged).toBe(true);
  });

  test("参照先のソースドキュメントが存在する場合、警告フラグは付与されない", () => {
    const validation_result_id = "vr_20240115_002";
    const validation_error_id = "ve_20240115_002";
    const error_content = "営業データの成約日付が営業期間の範囲外";
    const source_contract_id = "ct_cust_A_202401";
    const source_proposal_id = "pp_cust_A_202401_rev1";
    const detected_at_timestamp = new Date("2024-01-15T10:45:00Z");

    const result = structuredValidationResultWithWarning({
      validation_result_id,
      validation_error_id,
      error_content,
      source_contract_id,
      source_proposal_id,
      detected_at_timestamp,
    });

    expect(result.validation_result_id).toBe("vr_20240115_002");
    expect(result.warning_flag).toBe(false);
    expect(result.warning_code).toBeNull();
    expect(result.warning_message).toBeNull();
    expect(result.processing_status).toBe("COMPLETED");
    expect(result.source_contract_id).toBe("ct_cust_A_202401");
    expect(result.source_proposal_id).toBe("pp_cust_A_202401_rev1");
  });

  test("参照先のソースドキュメントが部分的に存在しない場合、警告フラグが付与される", () => {
    const validation_result_id = "vr_20240115_003";
    const validation_error_id = "ve_20240115_003";
    const error_content = "営業データのアポ数が計上ルール違反";
    const source_contract_id = "ct_cust_B_202401";
    const source_proposal_id = null;
    const detected_at_timestamp = new Date("2024-01-15T14:20:00Z");

    const result = structuredValidationResultWithWarning({
      validation_result_id,
      validation_error_id,
      error_content,
      source_contract_id,
      source_proposal_id,
      detected_at_timestamp,
    });

    expect(result.validation_result_id).toBe("vr_20240115_003");
    expect(result.warning_flag).toBe(true);
    expect(result.warning_code).toBe("PARTIAL_DOC_NOT_FOUND");
    expect(result.warning_message).toMatch(/提案資料が見つかりません/);
    expect(result.source_contract_id).toBe("ct_cust_B_202401");
    expect(result.source_proposal_id).toBeNull();
    expect(result.processing_status).toBe("CONTINUED_WITH_WARNING");
  });

  test("警告フラグが付与された場合、ログに記録される", () => {
    const validation_result_id = "vr_20240115_004";
    const validation_error_id = "ve_20240115_004";
    const error_content = "営業データのサービス種別が契約対象外";
    const source_contract_id = null;
    const source_proposal_id = null;
    const detected_at_timestamp = new Date("2024-01-15T16:00:00Z");

    const result = structuredValidationResultWithWarning({
      validation_result_id,
      validation_error_id,
      error_content,
      source_contract_id,
      source_proposal_id,
      detected_at_timestamp,
    });

    expect(result.warning_flag).toBe(true);
    expect(result.is_logged).toBe(true);
    expect(result.log_timestamp).toBeDefined();
    expect(new Date(result.log_timestamp as string)).toBeInstanceOf(Date);
    expect(result.log_entry).toMatch(/DOC_NOT_FOUND/);
  });

  test("複数の検証エラーが存在し、参照ドキュメントが存在しない場合、それぞれに警告フラグが付与される", () => {
    const validation_errors = [
      {
        validation_result_id: "vr_20240115_005a",
        validation_error_id: "ve_20240115_005a",
        error_content: "売上金額が範囲超過",
        source_contract_id: null,
        source_proposal_id: null,
        detected_at_timestamp: new Date("2024-01-15T12:00:00Z"),
      },
      {
        validation_result_id: "vr_20240115_005b",
        validation_error_id: "ve_20240115_005b",
        error_content: "成約日付が範囲外",
        source_contract_id: null,
        source_proposal_id: null,
        detected_at_timestamp: new Date("2024-01-15T12:15:00Z"),
      },
    ];

    const results = validation_errors.map((ve) =>
      structuredValidationResultWithWarning(ve)
    );

    expect(results).toHaveLength(2);
    results.forEach((result) => {
      expect(result.warning_flag).toBe(true);
      expect(result.warning_code).toBe("DOC_NOT_FOUND");
      expect(result.processing_status).toBe("CONTINUED_WITH_WARNING");
    });
  });

  test("警告フラグが付与された場合、ユーザーが警告内容を確認できる", () => {
    const validation_result_id = "vr_20240115_006";
    const validation_error_id = "ve_20240115_006";
    const error_content = "営業データの顧客名が必須項目で欠落";
    const source_contract_id = null;
    const source_proposal_id = null;
    const detected_at_timestamp = new Date("2024-01-15T15:30:00Z");

    const result = structuredValidationResultWithWarning({
      validation_result_id,
      validation_error_id,
      error_content,
      source_contract_id,
      source_proposal_id,
      detected_at_timestamp,
    });

    expect(result.warning_flag).toBe(true);
    expect(result.warning_details).toBeDefined();
    expect(result.warning_details).toHaveProperty("doc_type_expected");
    expect(result.warning_details.doc_type_expected).toMatch(/contract|proposal/i);
    expect(result.warning_details).toHaveProperty("severity");
    expect(result.warning_details.severity).toBe("WARNING");
    expect(result.warning_details).toHaveProperty("user_action_required");
    expect(result.warning_details.user_action_required).toBe(true);
  });
});