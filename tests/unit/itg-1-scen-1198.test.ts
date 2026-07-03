import { detectDeliverableChangeAndNotify } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-1198: 成果物納期の変更が検知された場合、変更履歴と通知内容が正確に記録される", () => {
    // テストデータ：初期状態の成果物納期
    const initialDeliverableId = "DEL-001";
    const customerId = "CUST-123";
    const userId = "USER-456";
    const initialDueDate = new Date("2024-03-15T00:00:00Z");
    const newDueDate = new Date("2024-04-10T00:00:00Z");
    const changeTimestamp = new Date("2024-03-14T09:30:00Z");

    // 入力：成果物納期の変更情報
    const input = {
      deliverableId: initialDeliverableId,
      customerId: customerId,
      previousDueDate: initialDueDate,
      newDueDate: newDueDate,
      changedByUserId: userId,
      changeDetectedAt: changeTimestamp,
    };

    // 関数実行：変更検知と通知生成
    const result = detectDeliverableChangeAndNotify(input);

    // 検証1：変更履歴が正確に記録されていることを確認
    expect(result.changeHistory).toBeDefined();
    expect(result.changeHistory.deliverableId).toBe(initialDeliverableId);
    expect(result.changeHistory.customerId).toBe(customerId);
    expect(result.changeHistory.previousValue).toEqual(initialDueDate);
    expect(result.changeHistory.newValue).toEqual(newDueDate);
    expect(result.changeHistory.changedByUserId).toBe(userId);
    expect(result.changeHistory.changedAt).toEqual(changeTimestamp);

    // 検証2：通知内容が生成されていることを確認
    expect(result.notification).toBeDefined();
    expect(result.notification.subject).toContain("成果物納期");
    expect(result.notification.changeDetails.previousDueDate).toEqual(
      initialDueDate
    );
    expect(result.notification.changeDetails.newDueDate).toEqual(newDueDate);
    expect(result.notification.changeDetails.changedByUserId).toBe(userId);
    expect(result.notification.generatedAt).toEqual(changeTimestamp);

    // 検証3：変更履歴と通知内容の変更情報が一致していることを確認
    expect(result.notification.changeDetails.previousDueDate).toEqual(
      result.changeHistory.previousValue
    );
    expect(result.notification.changeDetails.newDueDate).toEqual(
      result.changeHistory.newValue
    );
    expect(result.notification.changeDetails.changedByUserId).toBe(
      result.changeHistory.changedByUserId
    );
    expect(result.notification.generatedAt).toEqual(
      result.changeHistory.changedAt
    );

    // 検証4：変更内容の詳細が通知に含まれていることを確認
    expect(result.notification.subject).toBe("成果物納期が変更されました");
    expect(result.notification.isChangeDetected).toBe(true);
    expect(result.changeHistory.recordId).toBeDefined();
    expect(typeof result.changeHistory.recordId).toBe("string");
  });
});