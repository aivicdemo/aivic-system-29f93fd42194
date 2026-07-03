import { detectDeprecatedMaterial } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-776
  test("旧バージョン資料の自動検出・警告機能 - 非推奨版を検出し警告フラグを立てて通知", () => {
    const material_input = {
      material_id: "MAT-2024-001",
      material_name: "営業提案資料_2024年版",
      file_version: "1.0",
      uploaded_date: "2024-01-10T09:00:00Z",
      uploaded_by_user_id: "USR-001",
      file_path: "/materials/proposal_2024_v1.0.pdf",
      current_active_version: "2.5",
      deprecation_date: "2024-01-15T00:00:00Z",
      deprecation_reason: "新版でテンプレート改善のため非推奨化",
      recommended_version: "2.5",
      recommended_version_release_date: "2024-01-15T10:00:00Z",
      sales_rep_email: "sales.rep@company.com",
    };

    const result = detectDeprecatedMaterial(material_input);

    expect(result.is_deprecated).toBe(true);
    expect(result.warning_flag_status).toBe("ACTIVE");
    expect(result.detected_version).toBe("1.0");
    expect(result.current_active_version).toBe("2.5");
    expect(result.deprecation_reason).toBe(
      "新版でテンプレート改善のため非推奨化"
    );
    expect(result.warning_message).toContain("旧バージョン");
    expect(result.warning_message).toContain("1.0");
    expect(result.warning_message).toContain("2.5");
    expect(result.notification_generated).toBe(true);
    expect(result.notification_recipient_email).toBe(
      "sales.rep@company.com"
    );
    expect(result.notification_content.version_number).toBe("1.0");
    expect(result.notification_content.deprecation_reason).toBe(
      "新版でテンプレート改善のため非推奨化"
    );
    expect(result.notification_content.recommended_version).toBe("2.5");
    expect(result.notification_content.recommended_version_release_date).toBe(
      "2024-01-15T10:00:00Z"
    );
    expect(result.database_record_created).toBe(true);
    expect(result.log_timestamp).toBeDefined();
    expect(typeof result.log_timestamp).toBe("string");
  });
});