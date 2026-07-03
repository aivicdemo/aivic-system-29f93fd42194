import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ検証ルール実行機能", () => {
  test("SCEN-1296: 営業データの数値が許容範囲の最小値境界で検証を通過する", () => {
    // 許容範囲の最小値を含む営業データを準備
    const salesData = {
      appointmentCount: 0, // 許容範囲の最小値
      contractCount: 0, // 許容範囲の最小値
      customerReaction: 0, // 許容範囲の最小値
      serviceType: "standard", // 必須項目
      contactDate: "2024-01-15",
      customerId: "CUST001",
      status: "completed",
    };

    // 検証ルール定義：数値フィールドの許容範囲
    const validationRules = {
      appointmentCount: { min: 0, max: 1000, required: true },
      contractCount: { min: 0, max: 500, required: true },
      customerReaction: { min: 0, max: 100, required: true },
      serviceType: { required: true, pattern: /^(standard|premium|basic)$/ },
      contactDate: { required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
      customerId: { required: true, pattern: /^CUST\d{3}$/ },
      status: { required: true, pattern: /^(completed|pending|failed)$/ },
    };

    // 検証ルール実行
    const validationResult = validateSalesData(salesData, validationRules);

    // 検証ステータスが「成功」であること
    expect(validationResult.status).toBe("success");

    // エラーメッセージがないこと
    expect(validationResult.errors).toEqual([]);

    // 検証ログに成功記録が含まれることを確認
    expect(validationResult.validationLog).toBeDefined();
    expect(validationResult.validationLog.length).toBeGreaterThan(0);

    // 最小値境界での検証が明示的に記録されていること
    const minBoundaryCheckLog = validationResult.validationLog.find(
      (log: any) =>
        log.field === "appointmentCount" && log.checkType === "min_boundary"
    );
    expect(minBoundaryCheckLog).toBeDefined();
    if (minBoundaryCheckLog) {
      expect(minBoundaryCheckLog.passed).toBe(true);
      expect(minBoundaryCheckLog.value).toBe(0);
      expect(minBoundaryCheckLog.threshold).toBe(0);
    }

    // 全必須項目が検証を通過したことを確認
    const requiredFieldsStatus = validationResult.validationLog.filter(
      (log: any) => log.required === true
    );
    expect(requiredFieldsStatus.length).toBe(7);
    requiredFieldsStatus.forEach((log: any) => {
      expect(log.passed).toBe(true);
    });

    // 全体的な検証サマリー
    expect(validationResult.summary).toEqual({
      totalFields: 7,
      passedFields: 7,
      failedFields: 0,
      skippedFields: 0,
    });
  });
});