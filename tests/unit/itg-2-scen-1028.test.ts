import { recordEstimateExplanationPresentation } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-1028: [edge] 説明資料のゼネコン提示記録機能 - 提示日時が過去日時の場合、システムは現在時刻に矯正して記録される
  test("提示日時に過去の日時を入力した場合、現在時刻に矯正されて記録される", () => {
    // 固定の現在時刻
    const current_timestamp = new Date("2024-01-15T14:30:00Z");
    
    // 過去の日時（現在時刻より1日前）
    const user_input_past_timestamp = new Date("2024-01-14T14:30:00Z");
    
    const input_payload = {
      explanation_material_id: "MAT-20240115-001",
      contractor_id: "CTR-12345",
      contractor_name: "株式会社サンプルゼネコン",
      presentation_timestamp: user_input_past_timestamp,
      material_content: "相場乖離率: 12.5%, 乖離額: 150,000円",
      material_format: "pdf",
      recipient_email: "contractor@example.com",
    };

    const result = recordEstimateExplanationPresentation(
      input_payload,
      current_timestamp
    );

    // 期待値: 提示日時が現在時刻に矯正され、入力された過去日時ではなく現在時刻が記録される
    expect(result.recorded_presentation_timestamp).toEqual(current_timestamp);
    expect(result.recorded_presentation_timestamp).not.toEqual(
      user_input_past_timestamp
    );

    // 記録されたデータ構造の検証
    expect(result).toEqual({
      recorded_presentation_timestamp: current_timestamp,
      explanation_material_id: "MAT-20240115-001",
      contractor_id: "CTR-12345",
      contractor_name: "株式会社サンプルゼネコン",
      material_content: "相場乖離率: 12.5%, 乖離額: 150,000円",
      material_format: "pdf",
      recipient_email: "contractor@example.com",
      is_timestamp_corrected: true,
      user_input_timestamp: user_input_past_timestamp,
    });

    // 矯正フラグが真であることを確認
    expect(result.is_timestamp_corrected).toBe(true);
  });
});