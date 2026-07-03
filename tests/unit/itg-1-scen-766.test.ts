import { generateNotificationForRelease } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-766: 最新版リリース通知の自動配信 - 対象営業担当者に標準化された通知内容が正確に生成される", () => {
    // テストデータ: 複数の営業担当者と最新版リリース情報を準備
    const salesStaffA = {
      id: "staff_001",
      name: "営業担当者A",
      email: "staff_a@company.jp",
      department: "営業部",
    };
    const salesStaffB = {
      id: "staff_002",
      name: "営業担当者B",
      email: "staff_b@company.jp",
      department: "営業部",
    };
    const salesStaffC = {
      id: "staff_003",
      name: "営業担当者C",
      email: "staff_c@company.jp",
      department: "営業企画部",
    };

    const releaseInfo = {
      documentType: "contract",
      versionNumber: "v2.3.1",
      releaseDateTime: new Date("2024-06-15T10:00:00Z"),
      changeContent: "契約書条項の更新と追加特典の明記",
      targetFeatures: ["基本契約条項", "割引適用ルール", "特典内容"],
      documentName: "標準契約書（営業代行サービス向け）",
    };

    const targetStaffList = [salesStaffA, salesStaffB, salesStaffC];

    // 最新版リリース通知の自動配信機能を実行
    const notificationResults = generateNotificationForRelease(
      releaseInfo,
      targetStaffList
    );

    // 生成された通知数が対象営業担当者の数と一致することを確認
    expect(notificationResults.length).toBe(3);

    // 各営業担当者に対する通知が生成されたことを確認
    notificationResults.forEach((notification, index) => {
      expect(notification).toBeDefined();
      expect(notification.staffId).toBe(targetStaffList[index].id);
      expect(notification.staffEmail).toBe(targetStaffList[index].email);
    });

    // 生成された通知内容が標準化されたフォーマットに従っていることを検証
    notificationResults.forEach((notification) => {
      expect(notification.format).toBe("standard");
      expect(notification.templateVersion).toBe("v1.0");
    });

    // 通知内容に必須項目が含まれていることを確認
    notificationResults.forEach((notification) => {
      expect(notification.content).toHaveProperty("releaseDateTime");
      expect(notification.content).toHaveProperty("versionNumber");
      expect(notification.content).toHaveProperty("changeContent");
      expect(notification.content).toHaveProperty("targetFeatures");
    });

    // 必須項目の具体的な値を検証
    notificationResults.forEach((notification) => {
      expect(notification.content.releaseDateTime).toBe(
        "2024-06-15T10:00:00Z"
      );
      expect(notification.content.versionNumber).toBe("v2.3.1");
      expect(notification.content.changeContent).toBe(
        "契約書条項の更新と追加特典の明記"
      );
      expect(notification.content.targetFeatures).toEqual([
        "基本契約条項",
        "割引適用ルール",
        "特典内容",
      ]);
    });

    // 複数の営業担当者に対する通知内容が同一の標準化フォーマットで統一されていることを検証
    const firstNotificationContent = notificationResults[0].content;
    notificationResults.forEach((notification) => {
      expect(notification.content.versionNumber).toBe(
        firstNotificationContent.versionNumber
      );
      expect(notification.content.releaseDateTime).toBe(
        firstNotificationContent.releaseDateTime
      );
      expect(notification.content.changeContent).toBe(
        firstNotificationContent.changeContent
      );
      expect(notification.content.targetFeatures).toEqual(
        firstNotificationContent.targetFeatures
      );
    });

    // 通知内容に個人情報や機密情報が含まれていないことを確認
    notificationResults.forEach((notification) => {
      const contentString = JSON.stringify(notification.content);
      expect(contentString).not.toMatch(/パスワード|password/i);
      expect(contentString).not.toMatch(/クレジットカード|credit card/i);
      expect(contentString).not.toMatch(/社会保障番号|ssn/i);
    });

    // 通知の配信タイミングが指定された時刻に一致していることを検証
    const expectedScheduleDateTime = new Date("2024-06-15T10:00:00Z");
    notificationResults.forEach((notification) => {
      expect(notification.scheduledDeliveryTime).toEqual(
        expectedScheduleDateTime
      );
    });

    // 全ての対象営業担当者に対して通知が生成されていることを最終確認
    expect(notificationResults.length).toBe(targetStaffList.length);

    // 各通知が一意のIDを持っていることを確認
    const notificationIds = notificationResults.map((n) => n.id);
    const uniqueIds = new Set(notificationIds);
    expect(uniqueIds.size).toBe(notificationResults.length);

    // 通知の生成タイムスタンプが妥当であることを確認
    notificationResults.forEach((notification) => {
      expect(notification.generatedAt).toBeDefined();
      const generatedTime = new Date(notification.generatedAt);
      expect(generatedTime.getTime()).toBeLessThanOrEqual(
        new Date().getTime()
      );
    });
  });
});