import { describe, test, expect } from "@jest/globals";
import { generateStandardizedReleaseNotification } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-773: 変更履歴・適用ルール・有効期限が登録済みのとき、対象営業担当者に標準化された通知内容が正確に構成される", () => {
    // Arrange: 変更履歴、適用ルール、有効期限がすべて登録済みの入力データ
    const releaseInput = {
      changeHistory: {
        version: "v2.1",
        releaseDate: "2024-02-15",
        changedItems: [
          {
            itemName: "営業データ項目マッピング",
            changeType: "追加",
            description: "新規営業指標『顧客反応スコア』を追加",
          },
          {
            itemName: "検証ルール",
            changeType: "更新",
            description:
              "成約金額の異常値判定基準を100万円から150万円に変更",
          },
        ],
      },
      applicableRules: {
        targetCustomers: ["顧客A", "顧客B"],
        targetServices: ["営業代行", "品質管理"],
        applicableStartDate: "2024-02-20",
        applicableEndDate: "2024-12-31",
      },
      effectiveDate: {
        startDate: "2024-02-20",
        endDate: "2024-12-31",
        timeZone: "Asia/Tokyo",
      },
      recipientList: [
        { staffId: "STAFF001", staffName: "営業担当者A", email: "a@example.com" },
        { staffId: "STAFF002", staffName: "営業担当者B", email: "b@example.com" },
      ],
    };

    // Act: 標準化された通知内容を生成
    const notification = generateStandardizedReleaseNotification(releaseInput);

    // Assert: 通知のタイトル形式が標準化されている
    expect(notification.title).toBe(
      "【最新版リリース】営業データ品質管理システム v2.1"
    );

    // Assert: 本文の構成が標準化されている
    expect(notification.body).toContain("平素よりお世話になっております。");
    expect(notification.body).toContain("営業データ品質管理システム");
    expect(notification.body).toContain("最新版をリリースいたしました。");

    // Assert: 変更履歴情報が標準化された表記方法で記載される
    expect(notification.body).toContain("■ 変更内容");
    expect(notification.body).toContain(
      "【追加】営業データ項目マッピング : 新規営業指標『顧客反応スコア』を追加"
    );
    expect(notification.body).toContain(
      "【更新】検証ルール : 成約金額の異常値判定基準を100万円から150万円に変更"
    );

    // Assert: 適用ルールが記載順序と表現が統一されている
    expect(notification.body).toContain("■ 適用ルール");
    expect(notification.body).toContain("対象顧客 : 顧客A、顧客B");
    expect(notification.body).toContain("対象サービス : 営業代行、品質管理");

    // Assert: 有効期限が標準フォーマット（ISO 8601）で表示される
    expect(notification.body).toContain("■ 有効期限");
    expect(notification.body).toContain("開始日時 : 2024-02-20 00:00:00 (Asia/Tokyo)");
    expect(notification.body).toContain("終了日時 : 2024-12-31 23:59:59 (Asia/Tokyo)");

    // Assert: 署名とフッター情報が含まれている
    expect(notification.body).toContain("営業データ品質管理・請求自動化システム");
    expect(notification.body).toContain("システム管理者");

    // Assert: 配信対象者の数が正確に反映されている
    expect(notification.recipients.length).toBe(2);

    // Assert: 複数受信者に対して同一の通知内容が構成されている
    expect(notification.recipients[0].staffId).toBe("STAFF001");
    expect(notification.recipients[0].staffName).toBe("営業担当者A");
    expect(notification.recipients[0].email).toBe("a@example.com");
    expect(notification.recipients[0].notificationContent).toBe(
      notification.recipients[1].notificationContent
    );

    // Assert: テンプレート変数が正しく展開されている
    expect(notification.recipients[0].notificationContent).toContain(
      "営業担当者A"
    );
    expect(notification.recipients[0].notificationContent).not.toContain(
      "{{staffName}}"
    );

    expect(notification.recipients[1].notificationContent).toContain(
      "営業担当者B"
    );
    expect(notification.recipients[1].notificationContent).not.toContain(
      "{{staffName}}"
    );

    // Assert: 通知メタデータが正確に記録されている
    expect(notification.metadata.versionNumber).toBe("v2.1");
    expect(notification.metadata.releaseDate).toBe("2024-02-15");
    expect(notification.metadata.notificationType).toBe("release_notification");
    expect(notification.metadata.templateVersion).toBe("1.0");

    // Assert: 通知配信タイムスタンプが記録されている
    expect(notification.metadata.generatedAt).toBeDefined();
    expect(typeof notification.metadata.generatedAt).toBe("string");

    // Assert: 適用ルール違反チェック（顧客またはサービスがどちらも指定されている）
    expect(notification.applicableRules.targetCustomers.length).toBeGreaterThan(0);
    expect(notification.applicableRules.targetServices.length).toBeGreaterThan(0);

    // Assert: 有効期限の整合性検証（開始日が終了日より前）
    const startDate = new Date(
      notification.effectiveDate.startDate
    ).getTime();
    const endDate = new Date(notification.effectiveDate.endDate).getTime();
    expect(startDate).toBeLessThan(endDate);

    // Assert: タイトルが最大文字数以内
    expect(notification.title.length).toBeLessThanOrEqual(100);

    // Assert: 本文が最大文字数以内
    expect(notification.body.length).toBeLessThanOrEqual(10000);
  });
});