import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質管理・請求自動化システム - 生成レポートの自動品質検証", () => {
  // SCEN-1127: [edge] 生成レポートの自動品質検証 - 数値項目が0または負の境界値の場合も検証ルールが正確に適用される
  test("数値項目が0および負の値の境界値である場合、検証ルールが正確に適用される", () => {
    // 前提: 営業データ品質管理・請求自動化システムにログイン済み、生成レポート機能が利用可能
    // 発生条件: 数値項目に0を入力してレポートを生成、検証ルール適用の確認

    // テスト 1: 数値項目が0の場合
    const report_with_zero_apo = {
      customer_id: "CUST001",
      service_id: "SVC001",
      apo_count: 0,
      contract_amount: 100000,
      discount_rate: 0.1,
      is_active: true,
    };

    const result_zero = validateSalesDataQuality(report_with_zero_apo);

    // 0はデータ型としては整数で正当。ビジネスルール上も「アポ数0」は有効
    // 検証ルールが0に対して例外なく適用される
    expect(result_zero).toEqual({
      is_valid: true,
      validation_result: "合格",
      errors: [],
      warnings: [
        {
          field: "apo_count",
          message: "アポ数が0です。売上がない可能性があります",
          severity: "warning",
        },
      ],
      timestamp: expect.any(String),
    });

    // テスト 2: 数値項目が負の値(-1)の場合
    const report_with_negative_apo = {
      customer_id: "CUST001",
      service_id: "SVC001",
      apo_count: -1,
      contract_amount: 100000,
      discount_rate: 0.1,
      is_active: true,
    };

    const result_negative = validateSalesDataQuality(
      report_with_negative_apo
    );

    // 負の値は業務的に不正。検証ルールが検出し、不合格判定
    expect(result_negative).toEqual({
      is_valid: false,
      validation_result: "不合格",
      errors: [
        {
          field: "apo_count",
          message: "アポ数は0以上である必要があります",
          severity: "error",
          constraint_type: "range",
          actual_value: -1,
          allowed_range: { min: 0, max: null },
        },
      ],
      warnings: [],
      timestamp: expect.any(String),
    });

    // テスト 3: 数値項目が負の値(-100)の場合
    const report_with_large_negative = {
      customer_id: "CUST001",
      service_id: "SVC001",
      apo_count: 10,
      contract_amount: -100000,
      discount_rate: 0.1,
      is_active: true,
    };

    const result_large_negative = validateSalesDataQuality(
      report_with_large_negative
    );

    // 契約金額が負数は不正。検証ルールで検出
    expect(result_large_negative).toEqual({
      is_valid: false,
      validation_result: "不合格",
      errors: [
        {
          field: "contract_amount",
          message: "契約金額は0より大きい値である必要があります",
          severity: "error",
          constraint_type: "range",
          actual_value: -100000,
          allowed_range: { min: 0, max: null },
        },
      ],
      warnings: [],
      timestamp: expect.any(String),
    });

    // テスト 4: 0と負の値が混在するデータセット
    const report_mixed_boundary = {
      customer_id: "CUST002",
      service_id: "SVC002",
      apo_count: 0,
      contract_amount: 50000,
      discount_rate: -0.05,
      is_active: true,
    };

    const result_mixed = validateSalesDataQuality(report_mixed_boundary);

    // apo_count=0はwarning、discount_rate=-0.05はerror
    expect(result_mixed).toEqual({
      is_valid: false,
      validation_result: "不合格",
      errors: [
        {
          field: "discount_rate",
          message: "割引率は0以上1以下である必要があります",
          severity: "error",
          constraint_type: "range",
          actual_value: -0.05,
          allowed_range: { min: 0, max: 1 },
        },
      ],
      warnings: [
        {
          field: "apo_count",
          message: "アポ数が0です。売上がない可能性があります",
          severity: "warning",
        },
      ],
      timestamp: expect.any(String),
    });

    // テスト 5: すべての数値項目が正常値の場合（対照群）
    const report_normal = {
      customer_id: "CUST003",
      service_id: "SVC003",
      apo_count: 5,
      contract_amount: 200000,
      discount_rate: 0.15,
      is_active: true,
    };

    const result_normal = validateSalesDataQuality(report_normal);

    expect(result_normal).toEqual({
      is_valid: true,
      validation_result: "合格",
      errors: [],
      warnings: [],
      timestamp: expect.any(String),
    });

    // 期待結果: 以下の条件をすべて満たしていることを検証
    // 1. 数値項目が0の場合、検証ルールが例外なく適用される（warningレベル）
    // 2. 数値項目が負の値の場合、検証ルールが正確に検出する（errorレベル）
    // 3. 0と負の値が混在する場合、両方が正確に処理される
    // 4. 検証結果に対応するエラー/警告メッセージが付与される
    // 5. 検証プロセスが例外なく完了し、タイムスタンプが記録される

    expect(result_zero.validation_result).toBe("合格");
    expect(result_zero.warnings.length).toBe(1);

    expect(result_negative.validation_result).toBe("不合格");
    expect(result_negative.errors.length).toBe(1);
    expect(result_negative.errors[0].constraint_type).toBe("range");

    expect(result_large_negative.validation_result).toBe("不合格");
    expect(result_large_negative.errors.length).toBe(1);

    expect(result_mixed.validation_result).toBe("不合格");
    expect(result_mixed.errors.length).toBe(1);
    expect(result_mixed.warnings.length).toBe(1);

    expect(result_normal.validation_result).toBe("合格");
    expect(result_normal.errors.length).toBe(0);
    expect(result_normal.warnings.length).toBe(0);
  });
});