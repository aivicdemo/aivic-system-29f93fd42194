import { validateSalesDataWithoutRules } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1070: [error] 営業データ品質検証機能 - 検証ルール定義が存在しない場合、スキップまたはエラーのいずれかが返される
  test("検証ルール定義が存在しない状態で検証処理を実行した場合、スキップメッセージまたはエラーメッセージが返される", () => {
    // Arrange: 営業データと検証ルール定義なしの状態
    const salesData = {
      sales_id: "SALES-001",
      customer_id: "CUST-001",
      service_id: "SVC-001",
      appointment_count: 5,
      contract_count: 2,
      amount: 100000,
      record_date: "2024-01-15",
    };

    const validationRules = [];

    // Act: 検証ルール定義が存在しない状態で検証処理を実行
    const result = validateSalesDataWithoutRules(salesData, validationRules);

    // Assert: 結果がスキップメッセージまたはエラーメッセージのいずれかを返す
    // パターン1: スキップメッセージが返される場合
    if (result.status === "skipped") {
      expect(result.status).toBe("skipped");
      expect(result.message).toMatch(/ルール定義/);
      expect(result.message).toMatch(/スキップ/);
      expect(result.data).toEqual(salesData);
    }
    // パターン2: エラーメッセージが返される場合
    else if (result.status === "error") {
      expect(result.status).toBe("error");
      expect(result.message).toMatch(/検証ルール定義/);
      expect(result.message).toMatch(/見つかりません/);
      expect(result.data).toBeUndefined();
    }
    // どちらかのパターンが実行されることを保証
    expect(["skipped", "error"]).toContain(result.status);
    // システムが安定した状態（例外をスロー していない）を確認
    expect(result).toBeDefined();
  });

  test("検証ルール定義が存在しない場合、エラーハンドリングが適切に実行される", () => {
    // Arrange: 複数の営業データレコードと空の検証ルール定義
    const multipleRecords = [
      {
        sales_id: "SALES-001",
        customer_id: "CUST-001",
        service_id: "SVC-001",
        appointment_count: 5,
        contract_count: 2,
        amount: 100000,
        record_date: "2024-01-15",
      },
      {
        sales_id: "SALES-002",
        customer_id: "CUST-002",
        service_id: "SVC-002",
        appointment_count: 3,
        contract_count: 1,
        amount: 50000,
        record_date: "2024-01-16",
      },
    ];

    const emptyValidationRules = [];

    // Act: 複数レコードに対して検証処理を実行
    const results = multipleRecords.map((record) =>
      validateSalesDataWithoutRules(record, emptyValidationRules)
    );

    // Assert: すべてのレコード処理が安定した結果を返す
    expect(results).toHaveLength(2);
    results.forEach((result) => {
      // 各結果がスキップまたはエラーのいずれかであることを確認
      expect(["skipped", "error"]).toContain(result.status);
      // 結果オブジェクトが完全に定義されていることを確認
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("message");
      // エラーメッセージが空でないことを確認
      expect(result.message).toBeTruthy();
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  test("検証ルール定義が存在しない場合、業務ロジックが予測可能な挙動を返す", () => {
    // Arrange: 標準的な営業データ
    const standardSalesData = {
      sales_id: "SALES-003",
      customer_id: "CUST-003",
      service_id: "SVC-003",
      appointment_count: 10,
      contract_count: 5,
      amount: 250000,
      record_date: "2024-01-17",
    };

    const noValidationRules = [];

    // Act: 検証ルール定義なしで検証を実行
    const response = validateSalesDataWithoutRules(
      standardSalesData,
      noValidationRules
    );

    // Assert: 戻り値が以下の条件を満たす
    // 1. status フィールドが存在し、スキップまたはエラーのいずれか
    expect(response.status).toBeDefined();
    expect(["skipped", "error"]).toContain(response.status);

    // 2. message フィールドが存在し、業務的に意味のあるメッセージ
    expect(response.message).toBeDefined();
    expect(typeof response.message).toBe("string");

    // 3. スキップの場合は data フィールドに元データを保有
    if (response.status === "skipped") {
      expect(response.data).toEqual(standardSalesData);
    }

    // 4. エラーの場合は data フィールドが未定義
    if (response.status === "error") {
      expect(response.data).toBeUndefined();
    }

    // 5. レスポンス構造が一貫している
    expect(Object.keys(response).sort()).toEqual(
      ["data", "message", "status"].sort()
    );
  });
});