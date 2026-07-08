import { distributeGuidelineAndRecordReceipt } from "../../src/logic/it-6-2-2-2";

describe("ガイドライン配信・受領管理機能", () => {
  test("SCEN-1570: 対象部署と担当者が特定され、配信方法に基づいてガイドラインが配信される", () => {
    // 入力: 配信対象設定
    const distribution_input = {
      guideline_id: "GL-20240115-001",
      guideline_title: "見積査定システム運用ガイドライン",
      guideline_content_url: "https://example.com/guidelines/GL-001.pdf",
      target_divisions: [
        { division_id: "DIV-010", division_name: "原価管理部" },
        { division_id: "DIV-020", division_name: "営業企画部" }
      ],
      target_staff: [
        {
          staff_id: "STF-001",
          staff_name: "査定員A",
          division_id: "DIV-010",
          email: "staff_a@example.com"
        },
        {
          staff_id: "STF-002",
          staff_name: "査定員B",
          division_id: "DIV-010",
          email: "staff_b@example.com"
        },
        {
          staff_id: "STF-003",
          staff_name: "営業担当C",
          division_id: "DIV-020",
          email: "staff_c@example.com"
        }
      ],
      distribution_method: "email",
      description: "新版運用ガイドラインの配信です。必ず確認してください。",
      scheduled_distribution_datetime: "2024-01-15T09:00:00Z",
      distributor_id: "USR-ADMIN-001",
      distributor_name: "システム管理者"
    };

    // 実行
    const result = distributeGuidelineAndRecordReceipt(distribution_input);

    // 期待結果の検証

    // 1. 配信処理が正常に完了し、ステータスが「配信済み」に更新される
    expect(result.distribution_status).toBe("distributed");

    // 2. 配信IDが生成される
    expect(result.distribution_id).toBeDefined();
    expect(typeof result.distribution_id).toBe("string");
    expect(result.distribution_id.length).toBeGreaterThan(0);

    // 3. 配信対象部署数が正確に記録される
    expect(result.target_divisions_count).toBe(2);

    // 4. 配信対象担当者数が正確に記録される
    expect(result.target_staff_count).toBe(3);

    // 5. 配信方法が正確に記録される
    expect(result.distribution_method_used).toBe("email");

    // 6. 配信実行日時がシステムに記録される
    expect(result.actual_distribution_datetime).toBeDefined();
    expect(new Date(result.actual_distribution_datetime).getTime()).toBeGreaterThan(0);

    // 7. 配信対象部署別の配信結果が記録される
    expect(result.distribution_results_by_division).toBeDefined();
    expect(Array.isArray(result.distribution_results_by_division)).toBe(true);
    expect(result.distribution_results_by_division.length).toBe(2);

    // 部署010の配信結果
    const div_010_result = result.distribution_results_by_division.find(
      (r: any) => r.division_id === "DIV-010"
    );
    expect(div_010_result).toBeDefined();
    expect(div_010_result.division_name).toBe("原価管理部");
    expect(div_010_result.target_staff_in_division).toBe(2);
    expect(div_010_result.distribution_status).toBe("distributed");

    // 部署020の配信結果
    const div_020_result = result.distribution_results_by_division.find(
      (r: any) => r.division_id === "DIV-020"
    );
    expect(div_020_result).toBeDefined();
    expect(div_020_result.division_name).toBe("営業企画部");
    expect(div_020_result.target_staff_in_division).toBe(1);
    expect(div_020_result.distribution_status).toBe("distributed");

    // 8. 配信対象担当者別の配信履歴が記録される
    expect(result.receipt_history).toBeDefined();
    expect(Array.isArray(result.receipt_history)).toBe(true);
    expect(result.receipt_history.length).toBe(3);

    // 査定員A（STF-001）の受領履歴
    const stf_001_receipt = result.receipt_history.find(
      (r: any) => r.staff_id === "STF-001"
    );
    expect(stf_001_receipt).toBeDefined();
    expect(stf_001_receipt.staff_name).toBe("査定員A");
    expect(stf_001_receipt.division_id).toBe("DIV-010");
    expect(stf_001_receipt.division_name).toBe("原価管理部");
    expect(stf_001_receipt.delivery_method).toBe("email");
    expect(stf_001_receipt.recipient_email).toBe("staff_a@example.com");
    expect(stf_001_receipt.distribution_datetime).toBeDefined();
    expect(stf_001_receipt.receipt_status).toBe("delivered");

    // 査定員B（STF-002）の受領履歴
    const stf_002_receipt = result.receipt_history.find(
      (r: any) => r.staff_id === "STF-002"
    );
    expect(stf_002_receipt).toBeDefined();
    expect(stf_002_receipt.staff_name).toBe("査定員B");
    expect(stf_002_receipt.division_id).toBe("DIV-010");
    expect(stf_002_receipt.delivery_method).toBe("email");
    expect(stf_002_receipt.receipt_status).toBe("delivered");

    // 営業担当C（STF-003）の受領履歴
    const stf_003_receipt = result.receipt_history.find(
      (r: any) => r.staff_id === "STF-003"
    );
    expect(stf_003_receipt).toBeDefined();
    expect(stf_003_receipt.staff_name).toBe("営業担当C");
    expect(stf_003_receipt.division_id).toBe("DIV-020");
    expect(stf_003_receipt.division_name).toBe("営業企画部");
    expect(stf_003_receipt.delivery_method).toBe("email");
    expect(stf_003_receipt.recipient_email).toBe("staff_c@example.com");
    expect(stf_003_receipt.receipt_status).toBe("delivered");

    // 9. 配信前確認画面の内容が正確に記録される
    expect(result.pre_distribution_verification).toBeDefined();
    expect(result.pre_distribution_verification.divisions_confirmed).toBe(true);
    expect(result.pre_distribution_verification.staff_confirmed).toBe(true);
    expect(result.pre_distribution_verification.method_confirmed).toBe(true);

    // 10. 配信内容メタデータが記録される
    expect(result.guideline_metadata).toBeDefined();
    expect(result.guideline_metadata.guideline_id).toBe("GL-20240115-001");
    expect(result.guideline_metadata.guideline_title).toBe("見積査定システム運用ガイドライン");
    expect(result.guideline_metadata.content_url).toBe("https://example.com/guidelines/GL-001.pdf");
    expect(result.guideline_metadata.description).toBe(
      "新版運用ガイドラインの配信です。必ず確認してください。"
    );

    // 11. 配信者情報が記録される
    expect(result.distributor_info).toBeDefined();
    expect(result.distributor_info.distributor_id).toBe("USR-ADMIN-001");
    expect(result.distributor_info.distributor_name).toBe("システム管理者");

    // 12. 配信全体のサマリーが記録される
    expect(result.distribution_summary).toBeDefined();
    expect(result.distribution_summary.total_divisions).toBe(2);
    expect(result.distribution_summary.total_recipients).toBe(3);
    expect(result.distribution_summary.successful_deliveries).toBe(3);
    expect(result.distribution_summary.failed_deliveries).toBe(0);
    expect(result.distribution_summary.delivery_success_rate).toBe(100);
    expect(result.distribution_summary.scheduled_datetime).toBe("2024-01-15T09:00:00Z");

    // 13. 受領者がガイドラインを受け取ることができることが確認される（受領可能フラグ）
    expect(result.guidelines_accessible_to_recipients).toBe(true);

    // 14. 配信・受領履歴が完全に記録されていることを確認
    expect(result.audit_trail_recorded).toBe(true);
    expect(result.audit_trail_completeness).toBe(100);
  });
});