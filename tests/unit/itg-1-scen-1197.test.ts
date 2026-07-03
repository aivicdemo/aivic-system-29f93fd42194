import { detectContractChange } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1197
  test("契約内容の手動変更がシステムにより自動検知され、変更ログが正確に記録される。且つ、顧客企業への通知が正常に準備状態となり、通知内容に変更前後の詳細情報が含まれ、配信対象の顧客企業情報が正しく紐付けられていること", () => {
    // Arrange: テストデータ準備
    const existingContractId = "CONTRACT-2024-001";
    const existingCustomerId = "CUST-00001";
    const existingServiceId = "SVC-SALES-CONSULTING";
    const existingContractAmount = 500000;
    const existingContractStartDate = new Date("2024-01-01T00:00:00Z");
    const existingContractEndDate = new Date("2024-12-31T23:59:59Z");
    const existingServiceContent = "営業支援コンサルティング";

    const contractBefore = {
      contractId: existingContractId,
      customerId: existingCustomerId,
      serviceId: existingServiceId,
      contractAmount: existingContractAmount,
      contractStartDate: existingContractStartDate,
      contractEndDate: existingContractEndDate,
      serviceContent: existingServiceContent,
      lastUpdatedAt: new Date("2024-01-01T09:00:00Z"),
      lastUpdatedBy: "USER-INIT",
    };

    const newContractAmount = 600000;
    const newContractEndDate = new Date("2025-12-31T23:59:59Z");
    const newServiceContent = "営業支援コンサルティング + データ分析";
    const changeExecutedAt = new Date("2024-06-15T14:30:00Z");
    const changeExecutedBy = "USER-OPE-001";

    const contractAfter = {
      contractId: existingContractId,
      customerId: existingCustomerId,
      serviceId: existingServiceId,
      contractAmount: newContractAmount,
      contractStartDate: existingContractStartDate,
      contractEndDate: newContractEndDate,
      serviceContent: newServiceContent,
      lastUpdatedAt: changeExecutedAt,
      lastUpdatedBy: changeExecutedBy,
    };

    const customerInfo = {
      customerId: existingCustomerId,
      customerName: "テスト顧客企業A",
      contactPersonEmail: "contact@test-customer-a.jp",
      contactPersonName: "営業太郎",
    };

    // Act: 契約内容変更を検知・登録
    const result = detectContractChange({
      contractBefore,
      contractAfter,
      customerInfo,
      changeExecutedAt,
      changeExecutedBy,
    });

    // Assert: 変更検知・ログ記録の検証
    expect(result.changeDetected).toBe(true);
    expect(result.changeLog.contractId).toBe(existingContractId);
    expect(result.changeLog.customerId).toBe(existingCustomerId);
    expect(result.changeLog.recordedAt).toEqual(changeExecutedAt);
    expect(result.changeLog.recordedBy).toBe(changeExecutedBy);

    // Assert: 差分抽出の検証
    expect(result.changeDiff).toHaveProperty("contractAmount");
    expect(result.changeDiff.contractAmount.before).toBe(existingContractAmount);
    expect(result.changeDiff.contractAmount.after).toBe(newContractAmount);
    expect(result.changeDiff.contractAmount.change).toBe(100000);

    expect(result.changeDiff).toHaveProperty("contractEndDate");
    expect(result.changeDiff.contractEndDate.before).toEqual(
      existingContractEndDate
    );
    expect(result.changeDiff.contractEndDate.after).toEqual(newContractEndDate);

    expect(result.changeDiff).toHaveProperty("serviceContent");
    expect(result.changeDiff.serviceContent.before).toBe(existingServiceContent);
    expect(result.changeDiff.serviceContent.after).toBe(newServiceContent);

    // Assert: 通知内容の自動準備
    expect(result.notificationPrepared).toBe(true);
    expect(result.notification.notificationId).toBeDefined();
    expect(result.notification.status).toBe("PREPARED");
    expect(result.notification.notificationType).toBe("CONTRACT_CHANGE");

    // Assert: 通知に変更前後の詳細情報が含まれることを確認
    expect(result.notification.content).toHaveProperty("contractId");
    expect(result.notification.content.contractId).toBe(existingContractId);

    expect(result.notification.content).toHaveProperty("changeDetails");
    expect(result.notification.content.changeDetails).toHaveProperty(
      "contractAmount"
    );
    expect(
      result.notification.content.changeDetails.contractAmount.before
    ).toBe(existingContractAmount);
    expect(result.notification.content.changeDetails.contractAmount.after).toBe(
      newContractAmount
    );

    expect(result.notification.content.changeDetails).toHaveProperty(
      "contractEndDate"
    );
    expect(
      result.notification.content.changeDetails.contractEndDate.before
    ).toEqual(existingContractEndDate);
    expect(result.notification.content.changeDetails.contractEndDate.after).toEqual(
      newContractEndDate
    );

    expect(result.notification.content.changeDetails).toHaveProperty(
      "serviceContent"
    );
    expect(
      result.notification.content.changeDetails.serviceContent.before
    ).toBe(existingServiceContent);
    expect(result.notification.content.changeDetails.serviceContent.after).toBe(
      newServiceContent
    );

    // Assert: 配信対象の顧客企業情報が正しく紐付けられていることを確認
    expect(result.notification.recipientCustomerId).toBe(existingCustomerId);
    expect(result.notification.recipientCustomerName).toBe(
      "テスト顧客企業A"
    );
    expect(result.notification.recipientEmail).toBe(
      "contact@test-customer-a.jp"
    );
    expect(result.notification.recipientContactPersonName).toBe("営業太郎");

    // Assert: 通知のメタデータ検証
    expect(result.notification.createdAt).toEqual(changeExecutedAt);
    expect(result.notification.createdBy).toBe(changeExecutedBy);
    expect(result.notification.preparedAt).toBeDefined();
    expect(result.notification.scheduledSendTime).toBeDefined();

    // Assert: 変更ログの詳細検証
    expect(result.changeLog.changedFields).toContain("contractAmount");
    expect(result.changeLog.changedFields).toContain("contractEndDate");
    expect(result.changeLog.changedFields).toContain("serviceContent");
    expect(result.changeLog.changedFields.length).toBe(3);

    // Assert: 全体の戻り値構造を検証
    expect(result).toHaveProperty("changeDetected");
    expect(result).toHaveProperty("changeLog");
    expect(result).toHaveProperty("changeDiff");
    expect(result).toHaveProperty("notificationPrepared");
    expect(result).toHaveProperty("notification");
  });
});