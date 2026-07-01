import { detectContractChangeAndValidateNotificationContact } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1074
  test("契約・成果物変更通知機能 - 変更検知は行われたが連絡先情報が不完全の場合、バリデーションエラーが返される", () => {
    // 変更前の契約情報
    const previousContract = {
      contractId: "CT-20240115-001",
      customerId: "CUST-A001",
      contractAmount: 500000,
      deliverableContent: "営業代行サービス基本パッケージ",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      contactEmail: "contact@example.com",
    };

    // 変更後の契約情報（金額と成果物内容を変更）
    const changedContract = {
      contractId: "CT-20240115-001",
      customerId: "CUST-A001",
      contractAmount: 600000,
      deliverableContent: "営業代行サービス拡張パッケージ",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      contactEmail: "invalid-email",
    };

    // 無効なメールアドレスを含む連絡先情報
    const invalidContactInfo = {
      recipientName: "山田太郎",
      recipientEmail: "invalid-email",
      recipientPhone: "09012345678",
      recipientDepartment: "営業部",
    };

    // 関数を実行
    const result = detectContractChangeAndValidateNotificationContact(
      previousContract,
      changedContract,
      invalidContactInfo
    );

    // 変更が検知されていることを確認
    expect(result.changeDetected).toBe(true);

    // バリデーションエラーが発生していることを確認
    expect(result.validationSuccess).toBe(false);

    // エラーコードがメールアドレス形式に関するものであることを確認
    expect(result.errorCode).toBe("INVALID_EMAIL_FORMAT");

    // エラーメッセージに不正な連絡先情報の詳細が含まれていることを確認
    expect(result.errorMessage).toContain("メールアドレス");
    expect(result.errorMessage).toContain("invalid-email");

    // 通知が送信されていないことを確認
    expect(result.notificationSent).toBe(false);

    // 変更検知結果にはコントラクト変更内容が含まれていることを確認
    expect(result.detectedChanges).toEqual({
      contractAmountChanged: true,
      deliverableContentChanged: true,
      previousAmount: 500000,
      newAmount: 600000,
      previousContent: "営業代行サービス基本パッケージ",
      newContent: "営業代行サービス拡張パッケージ",
    });

    // 複数の無効なメールアドレスパターンを検証
    const invalidEmailPatterns = ["test@", "@example.com", "", "test@@example.com"];

    invalidEmailPatterns.forEach((invalidEmail) => {
      const contactWithInvalidEmail = {
        recipientName: "佐藤花子",
        recipientEmail: invalidEmail,
        recipientPhone: "09087654321",
        recipientDepartment: "経理部",
      };

      const resultWithPattern =
        detectContractChangeAndValidateNotificationContact(
          previousContract,
          changedContract,
          contactWithInvalidEmail
        );

      expect(resultWithPattern.changeDetected).toBe(true);
      expect(resultWithPattern.validationSuccess).toBe(false);
      expect(resultWithPattern.errorCode).toBe("INVALID_EMAIL_FORMAT");
      expect(resultWithPattern.notificationSent).toBe(false);
    });

    // 有効なメールアドレスの場合は成功することを確認
    const validContactInfo = {
      recipientName: "山田太郎",
      recipientEmail: "contact@example.com",
      recipientPhone: "09012345678",
      recipientDepartment: "営業部",
    };

    const resultValid =
      detectContractChangeAndValidateNotificationContact(
        previousContract,
        changedContract,
        validContactInfo
      );

    expect(resultValid.changeDetected).toBe(true);
    expect(resultValid.validationSuccess).toBe(true);
    expect(resultValid.notificationSent).toBe(true);
    expect(resultValid.errorCode).toBeNull();
  });
});