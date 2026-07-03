import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証", () => {
  // SCEN-1049
  test("営業データに不足データが存在する場合、エラー詳細情報と共に通知される", () => {
    // 必須項目の一部が空白の営業データ
    const incompleteData = {
      rowNumber: 5,
      customerId: "",
      customerName: "",
      amount: 0,
      transactionDate: "",
      serviceType: "consulting",
      appointmentCount: 3,
      contractCount: 1,
    };

    // 検証実行
    const validationResult = validateSalesDataCompleteness(incompleteData);

    // エラーが発生することを確認
    expect(validationResult.isValid).toBe(false);

    // エラーの詳細情報を確認
    expect(validationResult.errors).toBeDefined();
    expect(validationResult.errors.length).toBeGreaterThan(0);

    // エラー詳細情報に必須項目が含まれていることを確認
    const errorMessages = validationResult.errors.map(
      (err: any) => err.fieldName
    );
    expect(errorMessages).toContain("customerId");
    expect(errorMessages).toContain("customerName");
    expect(errorMessages).toContain("transactionDate");

    // 該当行番号がエラー情報に含まれていることを確認
    expect(validationResult.errors[0].rowNumber).toBe(5);

    // エラーコードが発行されていることを確認
    expect(validationResult.errors[0].errorCode).toBeDefined();
    expect(typeof validationResult.errors[0].errorCode).toBe("string");

    // 通知情報が生成されていることを確認
    expect(validationResult.notification).toBeDefined();
    expect(validationResult.notification.type).toBe("error");
    expect(validationResult.notification.include_details).toBe(true);

    // 通知内容にエラー詳細情報が含まれていることを確認
    expect(validationResult.notification.message).toContain("必須項目");
    expect(validationResult.notification.message).toContain("customerId");

    // データが請求処理へ進まないことを確認
    expect(validationResult.proceedToInvoicing).toBe(false);
  });
});