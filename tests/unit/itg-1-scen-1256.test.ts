import {
  recordAuditLog,
  type AuditLogInput,
  type AuditLogResult,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1256: [error] 変更履歴・監査ログ自動記録機能 - 変更者情報が取得できない場合に監査ログ記録がエラーとなる
  test("変更者情報が取得できない場合、監査ログ記録処理でエラーが発生し、適切なエラーメッセージが出力される", () => {
    const auditLogInput: AuditLogInput = {
      operationType: "update",
      targetTable: "営業データ",
      targetRecordId: "SalesData-20240115-001",
      changedFields: {
        顧客名: { before: "顧客A", after: "顧客B" },
        金額: { before: 100000, after: 120000 },
      },
      changedAt: new Date("2024-01-15T11:00:00Z"),
      changedByUserId: null, // 変更者情報が null
      changedByUserName: null, // ユーザー名も null
      sessionId: "session-xyz-123",
    };

    expect(() => recordAuditLog(auditLogInput)).toThrow(/変更者情報/);
  });
});