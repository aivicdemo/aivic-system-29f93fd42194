import { validateAndRejectLearningData } from "../../src/logic/it-6-3-1";

describe("査定判定ロジック適用履歴と根拠記録・検索機能", () => {
  test("SCEN-1217: 学習データ品質検証機能 - 品質検証に不合格となったデータを詳細理由と共に拒却する", () => {
    // 前提: 学習データ品質検証対象の不合格データが複数件存在する状態
    const learning_data_set_id = "dataset_20240515_001";
    const data_quality_check_results = [
      {
        record_id: "rec_001",
        validation_status: "pass",
        quality_score: 95,
        error_details: null,
      },
      {
        record_id: "rec_002",
        validation_status: "fail",
        quality_score: 32,
        error_details: {
          issue_type: "outlier_detection",
          issue_detail: "見積金額が過去相場データの平均の300%超過",
          affected_field: "estimate_amount",
          severity_level: "high",
        },
      },
      {
        record_id: "rec_003",
        validation_status: "fail",
        quality_score: 18,
        error_details: {
          issue_type: "missing_required_field",
          issue_detail: "工事種別コードが未入力",
          affected_field: "construction_type_code",
          severity_level: "critical",
        },
      },
      {
        record_id: "rec_004",
        validation_status: "fail",
        quality_score: 45,
        error_details: {
          issue_type: "invalid_data_type",
          issue_detail: "数量欄に数値以外の文字列を検出",
          affected_field: "quantity",
          severity_level: "high",
        },
      },
    ];

    const rejection_confirmation = {
      rejected_by_user_id: "assessor_user_001",
      rejection_timestamp: new Date("2024-05-15T14:30:00Z"),
      rejection_reason: "システム検証ロジック自動判定による品質不合格",
    };

    // 実行: validateAndRejectLearningData関数を呼び出す
    const result = validateAndRejectLearningData({
      learning_data_set_id: learning_data_set_id,
      validation_results: data_quality_check_results,
      rejection_config: rejection_confirmation,
    });

    // 検証1: 拒却処理が成功したこと
    expect(result.process_status).toBe("success");

    // 検証2: 不合格データが正しく拒却されたこと
    expect(result.rejected_record_count).toBe(3); // rec_002, rec_003, rec_004が拒却対象
    expect(result.passed_record_count).toBe(1); // rec_001は合格

    // 検証3: 拒却されたデータが学習データセットから正しく除外されたこと
    expect(result.excluded_records_from_dataset).toEqual([
      "rec_002",
      "rec_003",
      "rec_004",
    ]);

    // 検証4: 不合格データの詳細理由が拒却記録に含まれていること
    expect(result.rejection_details).toHaveLength(3);

    expect(result.rejection_details[0]).toEqual({
      record_id: "rec_002",
      issue_type: "outlier_detection",
      issue_detail: "見積金額が過去相場データの平均の300%超過",
      affected_field: "estimate_amount",
      severity_level: "high",
      rejection_datetime: new Date("2024-05-15T14:30:00Z"),
      rejection_reason: "システム検証ロジック自動判定による品質不合格",
    });

    expect(result.rejection_details[1]).toEqual({
      record_id: "rec_003",
      issue_type: "missing_required_field",
      issue_detail: "工事種別コードが未入力",
      affected_field: "construction_type_code",
      severity_level: "critical",
      rejection_datetime: new Date("2024-05-15T14:30:00Z"),
      rejection_reason: "システム検証ロジック自動判定による品質不合格",
    });

    expect(result.rejection_details[2]).toEqual({
      record_id: "rec_004",
      issue_type: "invalid_data_type",
      issue_detail: "数量欄に数値以外の文字列を検出",
      affected_field: "quantity",
      severity_level: "high",
      rejection_datetime: new Date("2024-05-15T14:30:00Z"),
      rejection_reason: "システム検証ロジック自動判定による品質不合格",
    });

    // 検証5: 拒却処理の完了メッセージが正しく返されていること
    expect(result.completion_message).toBe(
      "品質検証で不合格と判定された3件のデータが詳細理由と共に拒却され、学習データセットから除外されました。"
    );

    // 検証6: システムログに拒却履歴と理由が記録されていること
    expect(result.system_log_entry).toEqual({
      event_type: "learning_data_rejection",
      learning_data_set_id: "dataset_20240515_001",
      total_records_processed: 4,
      rejected_count: 3,
      passed_count: 1,
      rejection_executed_by: "assessor_user_001",
      rejection_executed_at: new Date("2024-05-15T14:30:00Z"),
      rejection_summary: {
        outlier_count: 1,
        missing_field_count: 1,
        invalid_type_count: 1,
      },
      status: "completed",
    });

    // 検証7: 学習データセットのメタデータが正しく更新されていること
    expect(result.dataset_metadata_update).toEqual({
      learning_data_set_id: "dataset_20240515_001",
      total_records_before_rejection: 4,
      total_records_after_rejection: 1,
      records_excluded_count: 3,
      quality_status: "partially_qualified",
      last_rejection_timestamp: new Date("2024-05-15T14:30:00Z"),
      dataset_ready_for_training: false, // 1件のみでは機械学習に不足
    });

    // 検証8: 拒却の詳細理由が確認ダイアログに表示可能な形式で構造化されていること
    expect(result.rejection_confirmation_dialog).toEqual({
      title: "学習データ拒却の確認",
      message:
        "以下の3件のデータが品質検証に不合格と判定されたため、拒却します。",
      rejection_items: [
        {
          record_id: "rec_002",
          summary: "外れ値検出: 見積金額が過去相場データの平均の300%超過",
        },
        {
          record_id: "rec_003",
          summary: "必須項目欠落: 工事種別コードが未入力",
        },
        {
          record_id: "rec_004",
          summary: "データ型不正: 数量欄に数値以外の文字列を検出",
        },
      ],
      action_buttons: ["confirm_rejection", "cancel"],
    });

    // 検証9: エラー処理の検証 - 無効なデータセットIDで拒却を試みた場合
    expect(() =>
      validateAndRejectLearningData({
        learning_data_set_id: "",
        validation_results: data_quality_check_results,
        rejection_config: rejection_confirmation,
      })
    ).toThrow(/データセットID/);

    // 検証10: エラー処理の検証 - 検証結果が空の場合
    expect(() =>
      validateAndRejectLearningData({
        learning_data_set_id: learning_data_set_id,
        validation_results: [],
        rejection_config: rejection_confirmation,
      })
    ).toThrow(/検証結果/);

    // 検証11: エラー処理の検証 - 拒却ユーザーIDが未設定の場合
    expect(() =>
      validateAndRejectLearningData({
        learning_data_set_id: learning_data_set_id,
        validation_results: data_quality_check_results,
        rejection_config: {
          rejected_by_user_id: "",
          rejection_timestamp: new Date("2024-05-15T14:30:00Z"),
          rejection_reason: "システム検証ロジック自動判定による品質不合格",
        },
      })
    ).toThrow(/ユーザーID/);
  });
});