import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  updateContractAndQueueBillingData,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1224
  test("契約・請求データリアルタイム更新機能 - 変更確定直後の即座の更新処理が正確に実行される（タイミング境界値）", () => {
    const contractId = "CT-001";
    const oldAmount = 100000;
    const newAmount = 120000;
    const changeConfirmedAt = new Date("2024-01-15T14:59:59.999Z");

    const result = updateContractAndQueueBillingData({
      contractId,
      oldAmount,
      newAmount,
      changeConfirmedAt,
    });

    // 1. 変更確定直後、リアルタイムデータベース更新ログに記録されることを確認
    expect(result.realtimeDbUpdated).toBe(true);
    expect(result.updateLogEntry).toMatchObject({
      contractId: "CT-001",
      oldAmount: 100000,
      newAmount: 120000,
    });

    // 2. 請求データ自動生成キューに新規レコードが追加されたか確認
    expect(result.billingQueueEntry).toBeDefined();
    expect(result.billingQueueEntry?.contractId).toBe("CT-001");
    expect(result.billingQueueEntry?.status).toBe("pending");

    // 3. キュー内の更新内容を検証
    expect(result.billingQueueEntry?.changeDetails).toMatchObject({
      contractId: "CT-001",
      previousAmount: 100000,
      currentAmount: 120000,
      changeType: "amount_update",
    });

    // 4. 更新タイムスタンプが確定時刻から2秒以内であることを確認
    const updateTimestamp = new Date(result.billingQueueEntry?.timestamp!);
    const timeDiffMs =
      updateTimestamp.getTime() - changeConfirmedAt.getTime();
    expect(timeDiffMs).toBeLessThanOrEqual(2000);
    expect(timeDiffMs).toBeGreaterThanOrEqual(0);

    // 5. 請求画面でフィルタリング（更新日時：直近1分）を適用し、該当レコードが表示されるか確認
    const filterFromTime = new Date(
      changeConfirmedAt.getTime() - 60 * 1000
    ).toISOString();
    const filterToTime = new Date(
      changeConfirmedAt.getTime() + 60 * 1000
    ).toISOString();

    const filteredRecords = result.filteredBillingRecords?.filter(
      (rec) =>
        rec.timestamp >= filterFromTime && rec.timestamp <= filterToTime
    );

    expect(filteredRecords).toBeDefined();
    expect(filteredRecords!.length).toBeGreaterThan(0);
    expect(filteredRecords![0]?.contractId).toBe("CT-001");

    // 6. 更新前後で契約マスタと請求テンプレートの整合性を確認
    expect(result.contractMasterConsistency).toBe(true);
    expect(result.billingTemplateConsistency).toBe(true);
    expect(result.integrityCheck).toMatchObject({
      contractAmount: 120000,
      billingTemplateAmount: 120000,
      reconciled: true,
    });

    // 7. 更新ログにタイムスタンプが正確に記録されていることを確認
    expect(result.updateLogEntry?.timestamp).toBeDefined();
    const logTimestamp = new Date(result.updateLogEntry!.timestamp);
    expect(logTimestamp.getTime()).toBeLessThanOrEqual(
      changeConfirmedAt.getTime() + 2000
    );
    expect(logTimestamp.getTime()).toBeGreaterThanOrEqual(
      changeConfirmedAt.getTime()
    );
  });
});