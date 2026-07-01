import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1115
  test("複数の例外ケースが混在する場合、優先度順に正しくソートされて返却される", () => {
    // Arrange: 複数の検証ルール定義（異なる優先度レベル：高・中・低）
    const validationRules = [
      {
        ruleId: "rule_001",
        ruleName: "必須項目チェック",
        priority: 1, // 高優先度
        condition: "required_field",
        errorCode: "ERR_REQUIRED_001",
        errorMessage: "顧客名は必須項目です",
      },
      {
        ruleId: "rule_002",
        ruleName: "金額範囲チェック",
        priority: 2, // 中優先度
        condition: "amount_range",
        errorCode: "ERR_AMOUNT_001",
        errorMessage: "金額が許容範囲外です",
      },
      {
        ruleId: "rule_003",
        ruleName: "データ型チェック",
        priority: 3, // 低優先度
        condition: "data_type",
        errorCode: "ERR_TYPE_001",
        errorMessage: "データ型が正しくありません",
      },
    ];

    // テストデータ：複数の例外ケースが混在
    const testData = {
      customerId: "", // 必須項目欠落 → priority 1 (高)
      amount: 999999999, // 金額異常値 → priority 2 (中)
      serviceType: 123, // データ型不正 → priority 3 (低)
      appointmentDate: "2024-01-15",
      dealStatus: "pending",
    };

    // Act: 検証実行
    const result = validateSalesDataQuality({
      validationRules,
      salesData: testData,
    });

    // Assert: 返却された例外ケースが優先度順（高→中→低）にソートされているか検証
    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toBeDefined();
    expect(result.validationErrors.length).toBe(3);

    // 優先度順の正確性を検証（index 0 が最高優先度）
    expect(result.validationErrors[0].priority).toBe(1);
    expect(result.validationErrors[0].errorCode).toBe("ERR_REQUIRED_001");
    expect(result.validationErrors[0].errorMessage).toBe("顧客名は必須項目です");
    expect(result.validationErrors[0].fieldName).toBe("customerId");

    expect(result.validationErrors[1].priority).toBe(2);
    expect(result.validationErrors[1].errorCode).toBe("ERR_AMOUNT_001");
    expect(result.validationErrors[1].errorMessage).toBe("金額が許容範囲外です");
    expect(result.validationErrors[1].fieldName).toBe("amount");

    expect(result.validationErrors[2].priority).toBe(3);
    expect(result.validationErrors[2].errorCode).toBe("ERR_TYPE_001");
    expect(result.validationErrors[2].errorMessage).toBe(
      "データ型が正しくありません"
    );
    expect(result.validationErrors[2].fieldName).toBe("serviceType");

    // 各例外ケースの詳細情報が正確に表示されているか検証
    result.validationErrors.forEach((error, index) => {
      expect(error).toHaveProperty("errorCode");
      expect(error).toHaveProperty("errorMessage");
      expect(error).toHaveProperty("priority");
      expect(error).toHaveProperty("fieldName");
      expect(typeof error.errorCode).toBe("string");
      expect(typeof error.errorMessage).toBe("string");
      expect(typeof error.priority).toBe("number");
      expect(typeof error.fieldName).toBe("string");

      // 優先度が昇順（1 → 2 → 3）であることを検証
      if (index > 0) {
        expect(error.priority).toBeGreaterThanOrEqual(
          result.validationErrors[index - 1].priority
        );
      }
    });

    // 検証結果メタデータの妥当性
    expect(result.totalErrorCount).toBe(3);
    expect(result.validationTimestamp).toBeDefined();
    expect(typeof result.validationTimestamp).toBe("string");
  });
});