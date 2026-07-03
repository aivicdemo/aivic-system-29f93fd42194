import { notifyContractChangeToCustomer } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1209: [edge] メール通知自動送信・ポータル即時表示・受信確認記録 - 複数のメールアドレスが存在する場合、全アドレスへの送信を試行し個別の送信結果を記録する
  test("複数のメールアドレスを持つユーザーへのメール通知送信時、全アドレスへの送信を試行し、各アドレスごとの送信結果を個別に記録する", () => {
    const contractChangeEvent = {
      contractId: "CONTRACT-001",
      customerId: "CUSTOMER-001",
      changeType: "納期変更",
      changedAt: "2024-01-15T10:30:00Z",
      changeContent: {
        oldDeliveryDate: "2024-02-28",
        newDeliveryDate: "2024-03-15",
        reason: "顧客要望による延期",
      },
    };

    const userWithMultipleEmails = {
      userId: "USER-001",
      userName: "営業責任者A",
      emailAddresses: [
        {
          address: "sales-a@customer-company.com",
          isVerified: true,
          isPrimary: true,
        },
        {
          address: "sales-a-backup@customer-company.com",
          isVerified: true,
          isPrimary: false,
        },
        {
          address: "sales-a-alternate@customer-company.com",
          isVerified: true,
          isPrimary: false,
        },
      ],
      portalAccessEnabled: true,
    };

    const result = notifyContractChangeToCustomer(
      contractChangeEvent,
      userWithMultipleEmails
    );

    // 期待結果: 3つのメールアドレスすべてに対して送信を試行
    expect(result.notificationAttempts).toHaveLength(3);

    // 各メールアドレスについて送信結果が記録されていることを確認
    expect(result.notificationAttempts[0]).toEqual({
      address: "sales-a@customer-company.com",
      status: "success",
      sentAt: expect.any(String),
      messageId: expect.any(String),
    });

    expect(result.notificationAttempts[1]).toEqual({
      address: "sales-a-backup@customer-company.com",
      status: "success",
      sentAt: expect.any(String),
      messageId: expect.any(String),
    });

    expect(result.notificationAttempts[2]).toEqual({
      address: "sales-a-alternate@customer-company.com",
      status: "success",
      sentAt: expect.any(String),
      messageId: expect.any(String),
    });

    // ポータル即時表示用のメタデータが生成されていることを確認
    expect(result.portalDisplayData).toBeDefined();
    expect(result.portalDisplayData.displayedAt).toBeDefined();
    expect(result.portalDisplayData.contractId).toBe("CONTRACT-001");
    expect(result.portalDisplayData.changeType).toBe("納期変更");

    // 送信統計情報が正確に集計されていることを確認
    expect(result.summary).toEqual({
      totalAttempts: 3,
      successCount: 3,
      failureCount: 0,
      allSucceeded: true,
    });

    // 受信確認記録ログにすべての送信情報が含まれていることを確認
    expect(result.notificationLog).toBeDefined();
    expect(result.notificationLog.entries).toHaveLength(3);
    expect(result.notificationLog.entries[0]).toEqual({
      address: "sales-a@customer-company.com",
      status: "success",
      timestamp: expect.any(String),
      deliveryStatus: "delivered",
    });
  });

  test("複数のメールアドレスのうち1つが無効な場合、有効なアドレスへの送信は成功し無効なアドレスへの失敗が個別に記録される", () => {
    const contractChangeEvent = {
      contractId: "CONTRACT-002",
      customerId: "CUSTOMER-002",
      changeType: "割引ルール変更",
      changedAt: "2024-01-15T11:45:00Z",
      changeContent: {
        oldDiscountRate: 10,
        newDiscountRate: 15,
        reason: "契約更新に伴う割引率改定",
      },
    };

    const userWithMixedEmails = {
      userId: "USER-002",
      userName: "経理部長B",
      emailAddresses: [
        {
          address: "finance-b@customer-company.com",
          isVerified: true,
          isPrimary: true,
        },
        {
          address: "invalid-removed@customer-company.com",
          isVerified: false,
          isPrimary: false,
        },
        {
          address: "finance-b-copy@customer-company.com",
          isVerified: true,
          isPrimary: false,
        },
      ],
      portalAccessEnabled: true,
    };

    const result = notifyContractChangeToCustomer(
      contractChangeEvent,
      userWithMixedEmails
    );

    // 3つのアドレスすべてへの送信を試行
    expect(result.notificationAttempts).toHaveLength(3);

    // 最初のアドレス: 成功
    expect(result.notificationAttempts[0]).toEqual({
      address: "finance-b@customer-company.com",
      status: "success",
      sentAt: expect.any(String),
      messageId: expect.any(String),
    });

    // 2番目のアドレス: 失敗（無効なアドレス）
    expect(result.notificationAttempts[1]).toEqual({
      address: "invalid-removed@customer-company.com",
      status: "failed",
      sentAt: expect.any(String),
      errorMessage: expect.stringMatching(/invalid|address|invalid email/i),
    });

    // 3番目のアドレス: 成功
    expect(result.notificationAttempts[2]).toEqual({
      address: "finance-b-copy@customer-company.com",
      status: "success",
      sentAt: expect.any(String),
      messageId: expect.any(String),
    });

    // 送信統計: 2成功、1失敗
    expect(result.summary).toEqual({
      totalAttempts: 3,
      successCount: 2,
      failureCount: 1,
      allSucceeded: false,
    });

    // ポータル即時表示データが生成されていることを確認
    expect(result.portalDisplayData).toBeDefined();
    expect(result.portalDisplayData.contractId).toBe("CONTRACT-002");

    // 受信確認記録ログに全送信履歴が保持されていることを確認
    expect(result.notificationLog).toBeDefined();
    expect(result.notificationLog.entries).toHaveLength(3);

    // 失敗したアドレスのログエントリにエラー情報が含まれていることを確認
    expect(result.notificationLog.entries[1]).toEqual({
      address: "invalid-removed@customer-company.com",
      status: "failed",
      timestamp: expect.any(String),
      deliveryStatus: "failed",
      errorMessage: expect.stringMatching(/invalid|address|invalid email/i),
    });

    // 成功したアドレスのログエントリが正確に記録されていることを確認
    expect(result.notificationLog.entries[2]).toEqual({
      address: "finance-b-copy@customer-company.com",
      status: "success",
      timestamp: expect.any(String),
      deliveryStatus: "delivered",
    });
  });

  test("複数のメールアドレスへの送信時、各メールアドレスのタイムスタンプが記録され、ポータルに受信確認記録が即時表示される", () => {
    const contractChangeEvent = {
      contractId: "CONTRACT-003",
      customerId: "CUSTOMER-003",
      changeType: "請求ルール変更",
      changedAt: "2024-01-15T14:20:00Z",
      changeContent: {
        oldBillingCycle: "monthly",
        newBillingCycle: "quarterly",
        reason: "顧客要望による請求周期変更",
      },
    };

    const userWithThreeEmails = {
      userId: "USER-003",
      userName: "営業マネージャーC",
      emailAddresses: [
        {
          address: "manager-c@customer-company.com",
          isVerified: true,
          isPrimary: true,
        },
        {
          address: "manager-c-work@customer-company.com",
          isVerified: true,
          isPrimary: false,
        },
        {
          address: "manager-c-personal@customer-company.com",
          isVerified: true,
          isPrimary: false,
        },
      ],
      portalAccessEnabled: true,
    };

    const result = notifyContractChangeToCustomer(
      contractChangeEvent,
      userWithThreeEmails
    );

    // すべての送信が成功
    expect(result.notificationAttempts).toHaveLength(3);
    expect(result.summary.allSucceeded).toBe(true);
    expect(result.summary.successCount).toBe(3);
    expect(result.summary.failureCount).toBe(0);

    // タイムスタンプが記録されていることを確認
    const sentTimestamps = result.notificationAttempts.map((attempt) => {
      expect(attempt.sentAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/
      );
      return new Date(attempt.sentAt).getTime();
    });

    // タイムスタンプが連続的で、各アドレスごとに記録されていることを確認
    sentTimestamps.forEach((timestamp, index) => {
      expect(timestamp).toBeGreaterThan(0);
      if (index > 0) {
        // 後続の送信は前の送信と同等以上の時刻
        expect(timestamp).toBeGreaterThanOrEqual(sentTimestamps[index - 1]);
      }
    });

    // ポータル即時表示データにすべての送信情報が含まれていることを確認
    expect(result.portalDisplayData).toBeDefined();
    expect(result.portalDisplayData.displayedAt).toBeDefined();
    expect(result.portalDisplayData.recipientCount).toBe(3);
    expect(result.portalDisplayData.successfulDeliveries).toBe(3);

    // 受信確認記録ログにタイムスタンプと詳細情報が保持されていることを確認
    expect(result.notificationLog.entries).toHaveLength(3);
    result.notificationLog.entries.forEach((entry, index) => {
      expect(entry.timestamp).toBeDefined();
      expect(entry.address).toBe(userWithThreeEmails.emailAddresses[index].address);
      expect(entry.status).toBe("success");
      expect(entry.deliveryStatus).toBe("delivered");
    });

    // ログの生成タイムスタンプが記録されていることを確認
    expect(result.notificationLog.generatedAt).toBeDefined();
  });
});