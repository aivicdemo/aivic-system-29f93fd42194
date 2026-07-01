import { surveyDataItemMetadata } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-1345: [normal] 営業データ項目の現状調査機能 - 営業システムの全データ項目が単位・データ型・計算ロジック付きで洗い出される
  test("営業システムの全データ項目が単位・データ型・計算ロジック付きで正確に洗い出されて画面表示およびエクスポート可能となること", () => {
    // 前提: 営業システムに営業活動データ（アポ数、成約数、顧客反応など）が記録されており、バックオフィス自動化の要件定義プロセスが開始されている状態
    // 発生条件: 代表兼営業オペレーターが現在の営業データ項目・単位・計算ロジックの調査を開始するとき
    // 期待結果: 営業システムに記録されているすべてのデータ項目を洗い出し、各項目の単位・データ型・計算ロジック・レポート出力時の変換ルールを整理した調査結果を作成する

    // 入力: 営業システムから取得可能なデータ項目群
    const survey_input = {
      system_id: "crm_salesforce_001",
      load_timestamp: "2024-01-15T09:00:00Z",
      requested_by_user_id: "user_rep_001",
    };

    // 実行: 現状調査機能を実行
    const survey_result = surveyDataItemMetadata(survey_input);

    // 検証1: 結果の基本構造が存在すること
    expect(survey_result).toBeDefined();
    expect(typeof survey_result).toBe("object");

    // 検証2: 調査ステータスが完了であること
    expect(survey_result.survey_status).toBe("completed");

    // 検証3: 洗い出されたデータ項目数が5件以上であること
    expect(Array.isArray(survey_result.extracted_items)).toBe(true);
    expect(survey_result.extracted_items.length).toBeGreaterThanOrEqual(5);

    // 検証4: 各データ項目が必須フィールド（項目名、単位、データ型、計算ロジック）を持つこと
    survey_result.extracted_items.forEach((item: any) => {
      expect(item.item_name).toBeDefined();
      expect(typeof item.item_name).toBe("string");
      expect(item.item_name.length).toBeGreaterThan(0);

      expect(item.unit).toBeDefined();
      expect(typeof item.unit).toBe("string");
      expect(item.unit.length).toBeGreaterThan(0);

      expect(item.data_type).toBeDefined();
      expect(typeof item.data_type).toBe("string");
      expect(["string", "number", "boolean", "date"].includes(item.data_type)).toBe(true);

      expect(item.calculation_logic).toBeDefined();
      expect(typeof item.calculation_logic).toBe("string");
      expect(item.calculation_logic.length).toBeGreaterThan(0);
    });

    // 検証5: 具体的な項目例が期待通りに洗い出されていること
    // 例：アポ数、成約数、顧客反応などが含まれるか確認
    const item_names = survey_result.extracted_items.map((item: any) => item.item_name);
    expect(item_names).toContain("アポ数");
    expect(item_names).toContain("成約数");

    // 検証6: アポ数の詳細情報が正確であること
    const apo_count_item = survey_result.extracted_items.find(
      (item: any) => item.item_name === "アポ数"
    );
    expect(apo_count_item).toBeDefined();
    expect(apo_count_item.unit).toBe("件");
    expect(apo_count_item.data_type).toBe("number");
    expect(apo_count_item.calculation_logic).toContain("COUNT");

    // 検証7: 成約数の詳細情報が正確であること
    const contract_count_item = survey_result.extracted_items.find(
      (item: any) => item.item_name === "成約数"
    );
    expect(contract_count_item).toBeDefined();
    expect(contract_count_item.unit).toBe("件");
    expect(contract_count_item.data_type).toBe("number");
    expect(contract_count_item.calculation_logic).toContain("COUNT");

    // 検証8: レポート出力時の変換ルール情報が存在すること
    expect(survey_result.extracted_items[0].report_mapping).toBeDefined();
    expect(typeof survey_result.extracted_items[0].report_mapping).toBe("object");

    // 検証9: エクスポート用データが生成されていること
    expect(survey_result.export_data).toBeDefined();
    expect(typeof survey_result.export_data).toBe("string");
    expect(survey_result.export_data.length).toBeGreaterThan(0);

    // 検証10: エクスポートデータがCSV形式であること（ヘッダーと複数行を含む）
    const csv_lines = survey_result.export_data.split("\n");
    expect(csv_lines.length).toBeGreaterThanOrEqual(2); // ヘッダー + データ行

    // 検証11: CSVヘッダーが期待されるカラムを含むこと
    const csv_header = csv_lines[0];
    expect(csv_header).toContain("項目名");
    expect(csv_header).toContain("単位");
    expect(csv_header).toContain("データ型");
    expect(csv_header).toContain("計算ロジック");

    // 検証12: CSVデータ行に実際の項目情報が含まれていること
    const csv_data_row = csv_lines[1];
    expect(csv_data_row.length).toBeGreaterThan(0);
    // CSVデータ行にアポ数または成約数などの項目名が含まれることを確認
    const item_names_in_csv = csv_lines.slice(1).join(",");
    expect(item_names_in_csv).toContain("アポ");

    // 検証13: 調査完了時刻が記録されていること
    expect(survey_result.completed_at).toBeDefined();
    expect(typeof survey_result.completed_at).toBe("string");
    // ISO 8601形式であることを確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(survey_result.completed_at)).toBe(
      true
    );

    // 検証14: エラーが発生していないこと
    expect(survey_result.error_list).toBeDefined();
    expect(Array.isArray(survey_result.error_list)).toBe(true);
    expect(survey_result.error_list.length).toBe(0);

    // 検証15: 調査実行者情報が記録されていること
    expect(survey_result.executed_by_user_id).toBe("user_rep_001");

    // 検証16: システムID が正確に記録されていること
    expect(survey_result.source_system_id).toBe("crm_salesforce_001");
  });
});