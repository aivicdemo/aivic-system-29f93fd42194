import {
  notifyContractChangesToCustomers,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-851: 複数の契約が同時に更新されたときに各々の顧客へメール通知が正しく送信される
  test("should send individual email notifications to multiple customers when contracts are updated simultaneously", async () => {
    const contractUpdates = [
      {
        contractId: "C001",
        customerId: "CUST001",
        customerName: "Company A",
        customerEmail: "contact@companya.jp",
        contractContent: "Base Contract - Service A",
        previousAmount: 100000,
        newAmount: 120000,
        changeReason: "Volume increase",
        effectiveDate: "2024-02-01",
        changedAt: "2024-01-15T09:00:00Z",
      },
      {
        contractId: "C002",
        customerId: "CUST002",
        customerName: "Company B",
        customerEmail: "contact@companyb.jp",
        contractContent: "Premium Contract - Service B",
        previousAmount: 250000,
        newAmount: 275000,
        changeReason: "Service tier upgrade",
        effectiveDate: "2024-02-01",
        changedAt: "2024-01-15T09:05:00Z",
      },
      {
        contractId: "C003",
        customerId: "CUST003",
        customerName: "Company C",
        customerEmail: "contact@companyc.jp",
        contractContent: "Enterprise Contract - Service C",
        previousAmount: 500000,
        newAmount: 550000,
        changeReason: "Contract renewal with adjustment",
        effectiveDate: "2024-02-01",
        changedAt: "2024-01-15T09:10:00Z",
      },
    ];

    const result = await notifyContractChangesToCustomers(contractUpdates);

    // メール送信件数の検証：契約更新件数（3件）と同じ
    expect(result.totalNotificationsSent).toBe(3);

    // 各顧客へのメール送信が成功したことを検証
    expect(result.successfulNotifications).toBe(3);
    expect(result.failedNotifications).toBe(0);

    // 送信されたメールの詳細検証
    expect(result.notificationDetails).toHaveLength(3);

    // Company A へのメール検証
    const companyANotif = result.notificationDetails[0];
    expect(companyANotif.customerId).toBe("CUST001");
    expect(companyANotif.recipientEmail).toBe("contact@companya.jp");
    expect(companyANotif.customerName).toBe("Company A");
    expect(companyANotif.contractId).toBe("C001");
    expect(companyANotif.subject).toContain("契約内容の変更");
    expect(companyANotif.body).toContain("Base Contract - Service A");
    expect(companyANotif.body).toContain("100000");
    expect(companyANotif.body).toContain("120000");
    expect(companyANotif.sentAt).toBe("2024-01-15T09:00:00Z");
    expect(companyANotif.status).toBe("sent");

    // Company B へのメール検証
    const companyBNotif = result.notificationDetails[1];
    expect(companyBNotif.customerId).toBe("CUST002");
    expect(companyBNotif.recipientEmail).toBe("contact@companyb.jp");
    expect(companyBNotif.customerName).toBe("Company B");
    expect(companyBNotif.contractId).toBe("C002");
    expect(companyBNotif.subject).toContain("契約内容の変更");
    expect(companyBNotif.body).toContain("Premium Contract - Service B");
    expect(companyBNotif.body).toContain("250000");
    expect(companyBNotif.body).toContain("275000");
    expect(companyBNotif.sentAt).toBe("2024-01-15T09:05:00Z");
    expect(companyBNotif.status).toBe("sent");

    // Company C へのメール検証
    const companyCNotif = result.notificationDetails[2];
    expect(companyCNotif.customerId).toBe("CUST003");
    expect(companyCNotif.recipientEmail).toBe("contact@companyc.jp");
    expect(companyCNotif.customerName).toBe("Company C");
    expect(companyCNotif.contractId).toBe("C003");
    expect(companyCNotif.subject).toContain("契約内容の変更");
    expect(companyCNotif.body).toContain("Enterprise Contract - Service C");
    expect(companyCNotif.body).toContain("500000");
    expect(companyCNotif.body).toContain("550000");
    expect(companyCNotif.sentAt).toBe("2024-01-15T09:10:00Z");
    expect(companyCNotif.status).toBe("sent");

    // 各メール送信のタイムスタンプが送信開始時刻範囲内にあることを検証
    const notificationTimestamps = result.notificationDetails.map((n) =>
      new Date(n.sentAt).getTime()
    );
    const minTimestamp = new Date("2024-01-15T09:00:00Z").getTime();
    const maxTimestamp = new Date("2024-01-15T09:10:00Z").getTime();
    notificationTimestamps.forEach((ts) => {
      expect(ts).toBeGreaterThanOrEqual(minTimestamp);
      expect(ts).toBeLessThanOrEqual(maxTimestamp);
    });

    // トランザクションログの検証
    expect(result.transactionLog).toBeDefined();
    expect(result.transactionLog.contractsUpdated).toBe(3);
    expect(result.transactionLog.emailsQueued).toBe(3);
    expect(result.transactionLog.emailsSent).toBe(3);
    expect(result.transactionLog.completionStatus).toBe("success");
  });

  // エラーハンドリングテスト：特定の顧客へのメール送信失敗時も他の顧客への送信は継続される
  test("should continue sending emails to other customers even if one customer notification fails", async () => {
    const contractUpdates = [
      {
        contractId: "C004",
        customerId: "CUST004",
        customerName: "Company D",
        customerEmail: "contact@companyd.jp",
        contractContent: "Standard Contract - Service D",
        previousAmount: 50000,
        newAmount: 60000,
        changeReason: "Annual increase",
        effectiveDate: "2024-02-01",
        changedAt: "2024-01-15T10:00:00Z",
      },
      {
        contractId: "C005",
        customerId: "CUST005",
        customerName: "Company E",
        customerEmail: "invalid-email@",
        contractContent: "Gold Contract - Service E",
        previousAmount: 300000,
        newAmount: 330000,
        changeReason: "Service expansion",
        effectiveDate: "2024-02-01",
        changedAt: "2024-01-15T10:05:00Z",
      },
      {
        contractId: "C006",
        customerId: "CUST006",
        customerName: "Company F",
        customerEmail: "contact@companyf.jp",
        contractContent: "Diamond Contract - Service F",
        previousAmount: 800000,
        newAmount: 880000,
        changeReason: "Contract extension",
        effectiveDate: "2024-02-01",
        changedAt: "2024-01-15T10:10:00Z",
      },
    ];

    const result = await notifyContractChangesToCustomers(contractUpdates);

    // 総送信数は3件だが、1件失敗
    expect(result.totalNotificationsSent).toBe(3);
    expect(result.successfulNotifications).toBe(2);
    expect(result.failedNotifications).toBe(1);

    // Company D（成功）、Company E（失敗）、Company F（成功）の順序で処理
    expect(result.notificationDetails).toHaveLength(3);

    // Company D の通知確認（成功）
    const companyDNotif = result.notificationDetails[0];
    expect(companyDNotif.customerId).toBe("CUST004");
    expect(companyDNotif.status).toBe("sent");

    // Company E の通知確認（失敗）
    const companyENotif = result.notificationDetails[1];
    expect(companyENotif.customerId).toBe("CUST005");
    expect(companyENotif.status).toBe("failed");
    expect(companyENotif.errorReason).toMatch(/メールアドレス/);

    // Company F の通知確認（成功）- E の失敗にもかかわらず送信続行
    const companyFNotif = result.notificationDetails[2];
    expect(companyFNotif.customerId).toBe("CUST006");
    expect(companyFNotif.status).toBe("sent");
    expect(companyFNotif.recipientEmail).toBe("contact@companyf.jp");
    expect(companyFNotif.body).toContain("Diamond Contract - Service F");

    // トランザクションログで失敗も記録されている
    expect(result.transactionLog.contractsUpdated).toBe(3);
    expect(result.transactionLog.emailsQueued).toBe(3);
    expect(result.transactionLog.emailsSent).toBe(2);
    expect(result.transactionLog.emailsFailed).toBe(1);
    expect(result.transactionLog.completionStatus).toBe("partial_success");
  });
});