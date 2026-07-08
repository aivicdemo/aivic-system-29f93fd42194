import { detectFormatDifference } from "../../src/logic/it-6-2-2-1";

describe("査定品質管理・標準化システム - 他部署フォーマット判定ロジック適用試験機能", () => {
  test("SCEN-1363: 他部署フォーマット見積書入力時にフォーマット差異を検出して例外情報を記録する", () => {
    // 【前提条件】
    // - 査定部署学習モデルが構築済み（標準フォーマット: 工事種別、金額、数量、単価、人員配置要件）
    // - 他部署フォーマット見積書が準備済み（差異: 項目名異なる、金額単位異なる、必須フィールド欠落）
    // - システムログ記録機能が有効化

    // 【入力データ】
    // 査定部署標準フォーマット（期待される項目構造）
    const standard_estimate_format = {
      construction_type: "建築工事", // 工事種別
      total_amount: 15000000, // 金額（円）
      quantity: 1, // 数量
      unit_price: 15000000, // 単価（円）
      manpower_requirement: 5, // 人員配置要件
      region: "東京", // 地域
      time_period: "2024-01", // 時期
    };

    // 他部署フォーマット見積書（フォーマット差異を含む）
    // 差異パターン：
    // 1. 項目名が異なる（construction_type → kouj_shubetsu）
    // 2. 金額単位が異なる（円ではなく万円）
    // 3. 必須フィールド欠落（manpower_requirement 不在）
    // 4. 不要フィールド追加（remarks）
    // 5. データ型相違（total_amount が文字列）
    const other_department_estimate = {
      kouj_shubetsu: "建築", // 異なる項目名
      kingaku_manyen: "1500", // 万円単位・文字列型
      suryo: 1,
      tanka_manyen: "1500", // 万円単位・文字列型
      // manpower_requirement 欠落
      chiiki: "東京",
      kikan: "2024-01",
      remarks: "特別対応", // 追加フィールド
    };

    // 【実行】
    const result = detectFormatDifference(
      other_department_estimate,
      standard_estimate_format
    );

    // 【期待出力】
    // フォーマット差異の検出結果を検証

    // 1. 検出フラグが true （差異が検出された）
    expect(result.has_format_difference).toBe(true);

    // 2. 差異のカテゴリ分類が正確
    expect(result.difference_categories).toEqual(
      expect.arrayContaining([
        "field_name_mismatch", // 項目名不一致
        "data_type_mismatch", // データ型相違
        "missing_required_field", // 必須フィールド欠落
      ])
    );

    // 3. 差異詳細情報が記録された
    expect(result.differences).toBeDefined();
    expect(Array.isArray(result.differences)).toBe(true);
    expect(result.differences.length).toBeGreaterThanOrEqual(1);

    // 4. 項目名不一致の詳細：construction_type が他部署フォーマットに不在
    const field_name_mismatch = result.differences.find(
      (d: any) =>
        d.category === "field_name_mismatch" &&
        d.standard_field === "construction_type"
    );
    expect(field_name_mismatch).toBeDefined();
    expect(field_name_mismatch.detail).toContain("construction_type");
    expect(field_name_mismatch.other_department_field).toBe("kouj_shubetsu");

    // 5. データ型相違の詳細：金額が文字列型
    const data_type_mismatch = result.differences.find(
      (d: any) =>
        d.category === "data_type_mismatch" &&
        d.standard_field === "total_amount"
    );
    expect(data_type_mismatch).toBeDefined();
    expect(data_type_mismatch.standard_type).toBe("number");
    expect(data_type_mismatch.other_department_type).toBe("string");
    expect(data_type_mismatch.standard_value).toBe(15000000);
    expect(data_type_mismatch.other_department_value).toBe("1500");

    // 6. 必須フィールド欠落の詳細：manpower_requirement が他部署フォーマットに不在
    const missing_field = result.differences.find(
      (d: any) =>
        d.category === "missing_required_field" &&
        d.standard_field === "manpower_requirement"
    );
    expect(missing_field).toBeDefined();
    expect(missing_field.is_required).toBe(true);
    expect(missing_field.detail).toContain("manpower_requirement");

    // 7. 例外情報ログレコード構造の検証
    expect(result.exception_log).toBeDefined();
    expect(result.exception_log).toHaveProperty("exception_id");
    expect(result.exception_log).toHaveProperty("timestamp");
    expect(result.exception_log).toHaveProperty("source_format");
    expect(result.exception_log).toHaveProperty("target_format");
    expect(result.exception_log).toHaveProperty("detected_differences_count");
    expect(result.exception_log).toHaveProperty("severity_level");
    expect(result.exception_log).toHaveProperty("error_details");

    // 8. 例外 ID が一意的に生成されたか
    expect(result.exception_log.exception_id).toMatch(/^EXC-\d{4}-\d{6}$/);

    // 9. タイムスタンプが ISO 形式で記録
    expect(result.exception_log.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 10. ソース・ターゲットフォーマット指定が正確
    expect(result.exception_log.source_format).toBe("other_department");
    expect(result.exception_log.target_format).toBe("standard");

    // 11. 検出差異件数が正確（項目名1件、データ型1件、必須フィールド欠落1件 = 3件以上）
    expect(result.exception_log.detected_differences_count).toBeGreaterThanOrEqual(
      3
    );

    // 12. 深刻度レベルが "high" に設定（必須フィールド欠落があるため）
    expect(result.exception_log.severity_level).toBe("high");

    // 13. エラー詳細が構造化されている
    expect(result.exception_log.error_details).toHaveProperty(
      "field_name_mismatches"
    );
    expect(result.exception_log.error_details).toHaveProperty(
      "data_type_mismatches"
    );
    expect(result.exception_log.error_details).toHaveProperty(
      "missing_required_fields"
    );
    expect(result.exception_log.error_details).toHaveProperty(
      "unexpected_additional_fields"
    );

    // 14. 各カテゴリの詳細が配列として記録
    expect(
      Array.isArray(result.exception_log.error_details.field_name_mismatches)
    ).toBe(true);
    expect(
      Array.isArray(result.exception_log.error_details.data_type_mismatches)
    ).toBe(true);
    expect(
      Array.isArray(result.exception_log.error_details.missing_required_fields)
    ).toBe(true);
    expect(
      Array.isArray(
        result.exception_log.error_details.unexpected_additional_fields
      )
    ).toBe(true);

    // 15. 項目名不一致の詳細情報が記録
    expect(
      result.exception_log.error_details.field_name_mismatches
    ).toContainEqual(
      expect.objectContaining({
        standard_field: "construction_type",
        other_department_field: "kouj_shubetsu",
        severity: "medium",
      })
    );

    // 16. データ型相違の詳細情報が記録
    expect(
      result.exception_log.error_details.data_type_mismatches
    ).toContainEqual(
      expect.objectContaining({
        field_name: "total_amount",
        standard_type: "number",
        other_department_type: "string",
        standard_value: 15000000,
        other_department_value: "1500",
        severity: "high",
      })
    );

    // 17. 必須フィールド欠落の詳細情報が記録
    expect(
      result.exception_log.error_details.missing_required_fields
    ).toContainEqual(
      expect.objectContaining({
        field_name: "manpower_requirement",
        is_required: true,
        severity: "high",
      })
    );

    // 18. 予期しない追加フィールドの検出
    expect(
      result.exception_log.error_details.unexpected_additional_fields
    ).toContainEqual(
      expect.objectContaining({
        field_name: "remarks",
        severity: "low",
      })
    );

    // 19. 推奨対応措置が記録
    expect(result.exception_log).toHaveProperty("recommended_actions");
    expect(Array.isArray(result.exception_log.recommended_actions)).toBe(true);
    expect(result.exception_log.recommended_actions.length).toBeGreaterThanOrEqual(
      1
    );

    // 20. 推奨対応措置に適切なアクションが含まれている
    const action_types = result.exception_log.recommended_actions.map(
      (a: any) => a.action_type
    );
    expect(action_types).toContainEqual(
      expect.stringMatching(
        /^(add_field_mapping|convert_data_type|add_missing_field|clarify_field_definition)$/
      )
    );

    // 21. 品質管理業務への活用可能性が確認可能
    expect(result.exception_log).toHaveProperty("usable_for_quality_control");
    expect(result.exception_log.usable_for_quality_control).toBe(true);

    // 22. 後続フロー（カスタマイズ範囲特定など）への入力データとして構造が適切
    expect(result.exception_log).toHaveProperty("downstream_input_ready");
    expect(result.exception_log.downstream_input_ready).toBe(true);

    // 【例外パス検証】
    // エラーケース：標準フォーマット定義が null または undefined
    expect(() => {
      detectFormatDifference(other_department_estimate, null as any);
    }).toThrow(/標準フォーマット/);

    expect(() => {
      detectFormatDifference(other_department_estimate, undefined as any);
    }).toThrow(/標準フォーマット/);

    // エラーケース：他部署見積書が null または undefined
    expect(() => {
      detectFormatDifference(null as any, standard_estimate_format);
    }).toThrow(/他部署フォーマット/);

    expect(() => {
      detectFormatDifference(undefined as any, standard_estimate_format);
    }).toThrow(/他部署フォーマット/);

    // エラーケース：両方が空オブジェクト
    expect(() => {
      detectFormatDifference({}, {});
    }).toThrow(/最小フィールド要件/);
  });
});