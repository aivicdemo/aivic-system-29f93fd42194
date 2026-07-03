import { calculateDaysUntilDeadline } from "../../src/logic/it-1781935279444-2-2-1";

describe("修正期限管理・催促機能", () => {
  test("// SCEN-714: 修正期限までの日数が正確に計算され、営業担当者に通知される", () => {
    // テストデータ: 修正期限が設定された営業データレコード
    const baseDate = new Date("2024-01-15T09:00:00Z");
    const correctionDeadline = new Date("2024-01-22T23:59:59Z");
    const recordsWithDeadline = [
      {
        recordId: "REC001",
        customerId: "CUST001",
        correctionStatus: "pending",
        correctionDeadlineDate: correctionDeadline,
        notificationSent: false,
      },
      {
        recordId: "REC002",
        customerId: "CUST002",
        correctionStatus: "pending",
        correctionDeadlineDate: new Date("2024-01-17T23:59:59Z"),
        notificationSent: false,
      },
      {
        recordId: "REC003",
        customerId: "CUST003",
        correctionStatus: "pending",
        correctionDeadlineDate: new Date("2024-01-15T08:00:00Z"),
        notificationSent: false,
      },
    ];

    // 修正期限までの日数を計算
    const result = calculateDaysUntilDeadline({
      records: recordsWithDeadline,
      baseDate: baseDate,
    });

    // 計算結果が修正期限日から基準日を差し引いた日数と一致することを検証
    expect(result.calculations).toHaveLength(3);

    // REC001: 2024-01-22 - 2024-01-15 = 7日
    expect(result.calculations[0]).toEqual({
      recordId: "REC001",
      daysRemaining: 7,
      isOverdue: false,
      requiresNotification: true,
      notificationMessage: "修正期限まで7日です。期限内の対応をお願いします。",
    });

    // REC002: 2024-01-17 - 2024-01-15 = 2日
    expect(result.calculations[1]).toEqual({
      recordId: "REC002",
      daysRemaining: 2,
      isOverdue: false,
      requiresNotification: true,
      notificationMessage: "修正期限まで2日です。期限内の対応をお願いします。",
    });

    // REC003: 2024-01-15 08:00 < 2024-01-15 09:00 = 超過 (マイナス値)
    expect(result.calculations[2]).toEqual({
      recordId: "REC003",
      daysRemaining: 0,
      isOverdue: true,
      requiresNotification: true,
      notificationMessage: "修正期限を超過しました。至急対応をお願いします。",
    });

    // 修正期限までの日数が0日以下の場合、催促通知フラグが立つことを確認
    expect(result.calculations[2].isOverdue).toBe(true);
    expect(result.calculations[2].requiresNotification).toBe(true);

    // 営業担当者へ通知するメッセージに正確な日数が含まれていることを検証
    expect(result.calculations[0].notificationMessage).toContain("7日");
    expect(result.calculations[1].notificationMessage).toContain("2日");
    expect(result.calculations[2].notificationMessage).toContain("超過");

    // 複数レコード処理時も計算精度が保たれることを確認
    const allDaysCorrect = result.calculations.every(
      (calc) =>
        typeof calc.daysRemaining === "number" &&
        typeof calc.isOverdue === "boolean"
    );
    expect(allDaysCorrect).toBe(true);

    // 通知ログに修正期限までの日数が記録されていることを確認
    expect(result.notificationLog).toBeDefined();
    expect(result.notificationLog).toHaveLength(3);
    expect(result.notificationLog[0]).toEqual({
      recordId: "REC001",
      daysRemaining: 7,
      notificationTimestamp: baseDate.toISOString(),
      notificationType: "reminder",
    });
    expect(result.notificationLog[1]).toEqual({
      recordId: "REC002",
      daysRemaining: 2,
      notificationTimestamp: baseDate.toISOString(),
      notificationType: "reminder",
    });
    expect(result.notificationLog[2]).toEqual({
      recordId: "REC003",
      daysRemaining: 0,
      notificationTimestamp: baseDate.toISOString(),
      notificationType: "urgent",
    });

    // 全体的なサマリー検証
    expect(result.summary).toEqual({
      totalRecords: 3,
      notRequiringAction: 0,
      requiringReminder: 2,
      overdueRecords: 1,
    });
  });
});