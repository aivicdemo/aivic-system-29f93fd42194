import { recordAuditLog, queryAuditLogs } from "../../src/logic/it-1781935279444-2-2-1";

describe("ポータルアクション監査ログ自動記録機能", () => {
  // SCEN-844
  test("同一ユーザーが短時間に複数アクションを実行した場合、各アクションが個別のレコードとして記録される", async () => {
    const userId = "user_test_844";
    const sessionId = "session_test_844_001";
    const timestamp1 = new Date("2024-01-15T11:00:00.000Z");
    const timestamp2 = new Date("2024-01-15T11:00:00.100Z");
    const timestamp3 = new Date("2024-01-15T11:00:00.200Z");

    // アクション1: データエクスポート
    await recordAuditLog({
      userId,
      sessionId,
      actionType: "DATA_EXPORT",
      timestamp: timestamp1,
      portalAction: "export",
      details: { format: "csv", recordCount: 150 },
    });

    // アクション2: 請求書生成
    await recordAuditLog({
      userId,
      sessionId,
      actionType: "INVOICE_GENERATION",
      timestamp: timestamp2,
      portalAction: "generate_invoice",
      details: { customerId: "cust_001", amount: 50000 },
    });

    // アクション3: 営業レポート更新
    await recordAuditLog({
      userId,
      sessionId,
      actionType: "REPORT_UPDATE",
      timestamp: timestamp3,
      portalAction: "update_report",
      details: { reportId: "rep_001", section: "sales_summary" },
    });

    // 監査ログを照会
    const auditLogs = await queryAuditLogs({
      userId,
      sessionId,
      startTime: new Date("2024-01-15T10:59:00.000Z"),
      endTime: new Date("2024-01-15T11:01:00.000Z"),
    });

    // ログレコード件数が3件であることを検証
    expect(auditLogs).toHaveLength(3);

    // 最初のレコード (データエクスポート)
    expect(auditLogs[0]).toEqual({
      userId: "user_test_844",
      sessionId: "session_test_844_001",
      actionType: "DATA_EXPORT",
      timestamp: timestamp1,
      portalAction: "export",
      details: { format: "csv", recordCount: 150 },
    });

    // 2番目のレコード (請求書生成)
    expect(auditLogs[1]).toEqual({
      userId: "user_test_844",
      sessionId: "session_test_844_001",
      actionType: "INVOICE_GENERATION",
      timestamp: timestamp2,
      portalAction: "generate_invoice",
      details: { customerId: "cust_001", amount: 50000 },
    });

    // 3番目のレコード (営業レポート更新)
    expect(auditLogs[2]).toEqual({
      userId: "user_test_844",
      sessionId: "session_test_844_001",
      actionType: "REPORT_UPDATE",
      timestamp: timestamp3,
      portalAction: "update_report",
      details: { reportId: "rep_001", section: "sales_summary" },
    });

    // 各ログレコードのタイムスタンプが異なることを検証 (ミリ秒単位で区別可能)
    expect(auditLogs[0].timestamp.getTime()).toBe(
      new Date("2024-01-15T11:00:00.000Z").getTime()
    );
    expect(auditLogs[1].timestamp.getTime()).toBe(
      new Date("2024-01-15T11:00:00.100Z").getTime()
    );
    expect(auditLogs[2].timestamp.getTime()).toBe(
      new Date("2024-01-15T11:00:00.200Z").getTime()
    );

    // 各ログレコードのアクション種別が正確に記録されていることを検証
    expect(auditLogs[0].actionType).toBe("DATA_EXPORT");
    expect(auditLogs[1].actionType).toBe("INVOICE_GENERATION");
    expect(auditLogs[2].actionType).toBe("REPORT_UPDATE");

    // すべてのログレコードが同一のユーザーID・セッションIDを持つことを検証
    auditLogs.forEach((log) => {
      expect(log.userId).toBe("user_test_844");
      expect(log.sessionId).toBe("session_test_844_001");
    });
  });
});