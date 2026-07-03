import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1250: [error] 営業データ異常値・漏れ自動検出・通知機能
  test("異常値が検出された場合、異常内容と修正指示を代表に通知して工程を一時停止する", () => {
    // テストデータ：複数の異常値を含む営業データ
    const invalidSalesData = [
      {
        id: "data_001",
        customerId: "cust_001",
        customerName: "", // 異常：顧客名が空欄
        serviceType: "service_A",
        appointmentCount: 5,
        contractCount: 2,
        revenue: -50000, // 異常：売上金額がマイナス値
        invoiceDate: "2024-13-45", // 異常：請求日付が不正形式
        status: "pending",
      },
      {
        id: "data_002",
        customerId: "cust_002",
        customerName: "Customer B",
        serviceType: "", // 異常：サービスタイプが空欄
        appointmentCount: 10,
        contractCount: 5,
        revenue: 250000,
        invoiceDate: "2024-01-15",
        status: "pending",
      },
      {
        id: "data_003",
        customerId: "cust_003",
        customerName: "Customer C",
        serviceType: "service_C",
        appointmentCount: -3, // 異常：アポ数がマイナス値
        contractCount: 2,
        revenue: 180000,
        invoiceDate: "2024-01-20",
        status: "pending",
      },
    ];

    // データ品質検証エンジンを実行
    const validationResult = validateSalesDataQuality(invalidSalesData);

    // 検証結果の構造を確認
    expect(validationResult).toHaveProperty("isValid");
    expect(validationResult).toHaveProperty("errors");
    expect(validationResult).toHaveProperty("notifications");
    expect(validationResult).toHaveProperty("workflowStatus");

    // 検証失敗を確認
    expect(validationResult.isValid).toBe(false);

    // 検出された異常値の内容を検証
    expect(validationResult.errors).toBeInstanceOf(Array);
    expect(validationResult.errors.length).toBeGreaterThan(0);

    // 異常値の詳細内容を検証
    const customerNameError = validationResult.errors.find(
      (err: any) => err.dataId === "data_001" && err.field === "customerName"
    );
    expect(customerNameError).toBeDefined();
    expect(customerNameError.errorType).toBe("EMPTY_FIELD");
    expect(customerNameError.message).toContain("顧客名");

    const negativeRevenueError = validationResult.errors.find(
      (err: any) => err.dataId === "data_001" && err.field === "revenue"
    );
    expect(negativeRevenueError).toBeDefined();
    expect(negativeRevenueError.errorType).toBe("INVALID_VALUE_RANGE");
    expect(negativeRevenueError.message).toContain("売上");

    const invalidInvoiceDateError = validationResult.errors.find(
      (err: any) => err.dataId === "data_001" && err.field === "invoiceDate"
    );
    expect(invalidInvoiceDateError).toBeDefined();
    expect(invalidInvoiceDateError.errorType).toBe("INVALID_FORMAT");
    expect(invalidInvoiceDateError.message).toContain("日付");

    const emptyServiceTypeError = validationResult.errors.find(
      (err: any) => err.dataId === "data_002" && err.field === "serviceType"
    );
    expect(emptyServiceTypeError).toBeDefined();
    expect(emptyServiceTypeError.errorType).toBe("EMPTY_FIELD");

    const negativeAppointmentError = validationResult.errors.find(
      (err: any) => err.dataId === "data_003" && err.field === "appointmentCount"
    );
    expect(negativeAppointmentError).toBeDefined();
    expect(negativeAppointmentError.errorType).toBe("INVALID_VALUE_RANGE");

    // 修正指示を含む通知メッセージが生成されることを確認
    expect(validationResult.notifications).toBeInstanceOf(Array);
    expect(validationResult.notifications.length).toBeGreaterThan(0);

    const notification = validationResult.notifications[0];
    expect(notification).toHaveProperty("recipientType");
    expect(notification.recipientType).toBe("REPRESENTATIVE");
    expect(notification).toHaveProperty("notificationType");
    expect(notification.notificationType).toBe("DATA_QUALITY_ERROR");
    expect(notification).toHaveProperty("message");
    expect(notification.message).toContain("異常値");
    expect(notification.message).toContain("修正");
    expect(notification).toHaveProperty("channel");
    expect(["email", "system", "both"]).toContain(notification.channel);

    // 工程を一時停止状態に遷移することを確認
    expect(validationResult.workflowStatus).toBe("PAUSED");

    // 異常値の総数を検証（最低4件の異常が検出される）
    expect(validationResult.errors.length).toBeGreaterThanOrEqual(4);

    // 通知に含まれる異常データの参照情報を検証
    expect(notification).toHaveProperty("affectedDataIds");
    expect(notification.affectedDataIds).toBeInstanceOf(Array);
    expect(notification.affectedDataIds.length).toBe(3);

    // 一時停止中は後続の自動処理が実行されないことを確認
    expect(validationResult).toHaveProperty("canProceedToNextStep");
    expect(validationResult.canProceedToNextStep).toBe(false);

    // 修正と承認後に再開可能な状態を確認
    expect(validationResult).toHaveProperty("requiresManualApproval");
    expect(validationResult.requiresManualApproval).toBe(true);
    expect(validationResult).toHaveProperty("resumeToken");
    expect(typeof validationResult.resumeToken).toBe("string");
    expect(validationResult.resumeToken.length).toBeGreaterThan(0);

    // 通知の送信対象が代表であることを確認
    expect(notification.recipientRole).toBe("REPRESENTATIVE");
    expect(notification).toHaveProperty("sentAt");
    expect(typeof notification.sentAt).toBe("string");

    // 各異常値の詳細が通知に含まれることを確認
    expect(notification).toHaveProperty("errorSummary");
    expect(notification.errorSummary).toBeInstanceOf(Array);
    expect(notification.errorSummary.length).toBeGreaterThanOrEqual(4);
  });
});