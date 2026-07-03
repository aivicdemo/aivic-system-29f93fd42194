import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・エラー検出機能", () => {
  // SCEN-1152: [error] 営業データ品質検証・エラー検出機能 - 検証失敗時に代表へ通知が送信され後続処理が停止される
  test("検証失敗時に代表へエラー通知が送信され後続処理が停止される", () => {
    const notificationsSent: Array<{
      recipientType: string;
      errorType: string;
      details: string;
      timestamp: string;
    }> = [];

    const mockNotify = (
      recipientType: string,
      errorType: string,
      details: string,
      timestamp: string
    ): void => {
      notificationsSent.push({
        recipientType,
        errorType,
        details,
        timestamp,
      });
    };

    // テストデータ：複数の検証ルール違反を含む
    const invalidSalesData = {
      customerId: "", // 必須項目が空白
      serviceType: null, // null値
      appointmentCount: -5, // 範囲外（負数）
      contractAmount: "invalid_amount", // データ型不正
      contactDate: "2024-13-45", // 日付形式不正
      status: "UNKNOWN_STATUS", // 許可されていないステータス
      salesPersonId: undefined, // 未定義
    };

    // 検証実行
    const validationResult = validateSalesDataQuality(
      invalidSalesData,
      mockNotify
    );

    // 検証結果がエラーステータスであることを確認
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.status).toBe("VALIDATION_FAILED");

    // 検出されたエラーが複数あることを確認
    expect(validationResult.errors.length).toBeGreaterThanOrEqual(7);

    // エラーの詳細内容を検証
    const errorTypes = validationResult.errors.map((e) => e.field);
    expect(errorTypes).toContain("customerId");
    expect(errorTypes).toContain("serviceType");
    expect(errorTypes).toContain("appointmentCount");
    expect(errorTypes).toContain("contractAmount");
    expect(errorTypes).toContain("contactDate");
    expect(errorTypes).toContain("status");
    expect(errorTypes).toContain("salesPersonId");

    // 代表への通知が送信されたことを確認
    expect(notificationsSent.length).toBeGreaterThan(0);

    // 通知の内容を検証
    const firstNotification = notificationsSent[0];
    expect(firstNotification.recipientType).toBe("REPRESENTATIVE");
    expect(firstNotification.errorType).toBe("DATA_VALIDATION_ERROR");
    expect(firstNotification.details).toContain("必須項目");

    // 通知タイムスタンプが ISO形式であることを確認
    expect(firstNotification.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 後続処理が停止されたことを確認
    expect(validationResult.shouldProceedToNextStep).toBe(false);

    // ロールバック状態が記録されていることを確認
    expect(validationResult.rollbackApplied).toBe(true);

    // システム状態が「エラー」に設定されたことを確認
    expect(validationResult.systemState).toBe("ERROR");

    // 検証結果にエラーメッセージが含まれていることを確認
    expect(validationResult.errors[0]).toHaveProperty("message");
    expect(validationResult.errors[0].message).toMatch(/項目/);
  });
});