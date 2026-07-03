import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSLACompliance,
  recordSLAMonitoringLog,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - SLA期限監視", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-784: [edge] 資料リリース通知から確認完了までのSLA監視機能 - SLA期限とちょうど同じ時間で正常系として扱う（境界値チェック）
  test("確認完了時刻がSLA期限と同じ時間の場合、SLAステータスが正常系と判定され、アラートが発報されないこと", () => {
    // テストデータセットアップ
    const slaDueDateTime = new Date("2024-01-15T17:00:00Z");
    const confirmedDateTime = new Date("2024-01-15T17:00:00Z");
    const materialReleaseNotificationId = "notification-001";
    const documentVersionId = "version-001";

    // SLA監視機能の開始
    const slaComplianceInput = {
      materialReleaseNotificationId: materialReleaseNotificationId,
      documentVersionId: documentVersionId,
      slaDueDateTime: slaDueDateTime.toISOString(),
      confirmedDateTime: confirmedDateTime.toISOString(),
    };

    // SLA監視関数を実行
    const slaComplianceResult = validateSLACompliance(slaComplianceInput);

    // SLAステータスが正常系（期限内）であることを検証
    expect(slaComplianceResult.slaStatus).toBe("WITHIN_SLA");

    // アラート発報フラグがfalseであることを検証
    expect(slaComplianceResult.alertTriggered).toBe(false);

    // SLAステータスメッセージを検証
    expect(slaComplianceResult.statusMessage).toMatch(/期限内/);

    // 監視ログ記録用の入力データを準備
    const monitoringLogInput = {
      materialReleaseNotificationId: materialReleaseNotificationId,
      documentVersionId: documentVersionId,
      slaDueDateTime: slaDueDateTime.toISOString(),
      confirmedDateTime: confirmedDateTime.toISOString(),
      slaStatus: "WITHIN_SLA",
      alertTriggered: false,
      complianceTimestampUtc: confirmedDateTime.toISOString(),
    };

    // 監視ログを記録する
    const monitoringLog = recordSLAMonitoringLog(monitoringLogInput);

    // 監視ログの内容を検証
    expect(monitoringLog.logMessage).toMatch(/SLA期限内で完了/);
    expect(monitoringLog.materialReleaseNotificationId).toBe(
      materialReleaseNotificationId
    );
    expect(monitoringLog.documentVersionId).toBe(documentVersionId);

    // ログレコードのタイムスタンプが記録されていることを検証
    expect(monitoringLog.recordedAtUtc).toBeDefined();

    // SLAコンプライアンスログのモニタリング結果検証
    const compliance_timestamp_diff_ms =
      new Date(confirmedDateTime).getTime() -
      new Date(slaDueDateTime).getTime();

    // 差分が0ミリ秒（ちょうど同じ時間）であることを検証
    expect(compliance_timestamp_diff_ms).toBe(0);

    // SLAステータスと請求自動化への引き継ぎフラグを検証
    expect(slaComplianceResult.proceedToBillingAutomation).toBe(true);

    // 追加: 複数の検証ケースを同一テスト内で実行
    // ケース1: 期限より前に完了（さらに期限内）
    const confirmedDateTimeEarly = new Date("2024-01-15T16:30:00Z");
    const earlyComplianceInput = {
      materialReleaseNotificationId: "notification-002",
      documentVersionId: "version-002",
      slaDueDateTime: slaDueDateTime.toISOString(),
      confirmedDateTime: confirmedDateTimeEarly.toISOString(),
    };

    const earlyComplianceResult = validateSLACompliance(earlyComplianceInput);
    expect(earlyComplianceResult.slaStatus).toBe("WITHIN_SLA");
    expect(earlyComplianceResult.alertTriggered).toBe(false);

    // ケース2: 期限を1秒超過
    const confirmedDateTimeLate = new Date("2024-01-15T17:00:01Z");
    const lateComplianceInput = {
      materialReleaseNotificationId: "notification-003",
      documentVersionId: "version-003",
      slaDueDateTime: slaDueDateTime.toISOString(),
      confirmedDateTime: confirmedDateTimeLate.toISOString(),
    };

    const lateComplianceResult = validateSLACompliance(lateComplianceInput);
    expect(lateComplianceResult.slaStatus).toBe("EXCEEDED_SLA");
    expect(lateComplianceResult.alertTriggered).toBe(true);
    expect(lateComplianceResult.statusMessage).toMatch(/期限超過/);
    expect(lateComplianceResult.proceedToBillingAutomation).toBe(false);

    // ケース3: 期限より1秒前に完了
    const confirmedDateTimeJustBefore = new Date("2024-01-15T16:59:59Z");
    const justBeforeComplianceInput = {
      materialReleaseNotificationId: "notification-004",
      documentVersionId: "version-004",
      slaDueDateTime: slaDueDateTime.toISOString(),
      confirmedDateTime: confirmedDateTimeJustBefore.toISOString(),
    };

    const justBeforeComplianceResult = validateSLACompliance(
      justBeforeComplianceInput
    );
    expect(justBeforeComplianceResult.slaStatus).toBe("WITHIN_SLA");
    expect(justBeforeComplianceResult.alertTriggered).toBe(false);
  });
});