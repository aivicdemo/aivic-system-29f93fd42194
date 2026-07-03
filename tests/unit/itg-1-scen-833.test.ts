import { notifyContractDeliverableDateChange } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-833
  test("成果物納期変更時に顧客企業営業責任者に自動メール通知が送信される", () => {
    const contractId = "CTRCT-20240115-001";
    const customerId = "CUST-20240115-001";
    const serviceId = "SRV-20240115-001";
    const previousDeliverableDate = "2024-02-15";
    const newDeliverableDate = "2024-02-28";
    const changedByUserId = "USER-20240115-001";
    const changedByUserName = "営業代表太郎";
    const customerResponsibleEmail = "tanaka@customer-company.co.jp";
    const customerResponsibleName = "田中営業責任者";
    const contractName = "営業支援サービス基本契約";
    const serviceName = "アポイント獲得支援";
    const changedAtTimestamp = "2024-01-15T11:00:00Z";

    const input = {
      contractId,
      customerId,
      serviceId,
      previousDeliverableDate,
      newDeliverableDate,
      changedByUserId,
      changedByUserName,
      customerResponsibleEmail,
      customerResponsibleName,
      contractName,
      serviceName,
      changedAtTimestamp,
    };

    const result = notifyContractDeliverableDateChange(input);

    expect(result).toEqual({
      notificationId: expect.any(String),
      status: "sent",
      recipientEmail: customerResponsibleEmail,
      recipientName: customerResponsibleName,
      contractId,
      customerId,
      serviceId,
      previousDeliverableDate,
      newDeliverableDate,
      changedByUserName,
      changedAtTimestamp,
      emailContent: {
        subject: `契約納期変更のお知らせ - ${contractName}`,
        body: expect.stringContaining(
          `${customerResponsibleName}様`
        ),
      },
      sentAtTimestamp: expect.any(String),
      auditLog: {
        eventType: "contract_deliverable_date_changed",
        changedByUserId,
        changedByUserName,
        changedAtTimestamp,
        changeDetail: {
          previousDeliverableDate,
          newDeliverableDate,
        },
      },
    });

    expect(result.emailContent.body).toContain(previousDeliverableDate);
    expect(result.emailContent.body).toContain(newDeliverableDate);
    expect(result.emailContent.body).toContain(contractName);
    expect(result.emailContent.body).toContain(serviceName);
    expect(result.emailContent.body).toContain(changedByUserName);
    expect(result.status).toBe("sent");
    expect(result.recipientEmail).toBe(customerResponsibleEmail);
  });
});