import { validateContractAgreement } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-1242: 契約変更内容の合意状況検証機能 - 顧客の合意と登録済み変更内容が一致する場合、承認フローへ進める", () => {
    // 前提: 登録済み変更内容
    const registeredChangeContent = {
      contractChangeId: "CC-2024-001",
      customerId: "CUST-A001",
      contractId: "CONT-2024-001",
      changeType: "SERVICE_SCOPE",
      changeDetails: {
        beforeValue: "Service A",
        afterValue: "Service B",
        effectiveDate: "2024-02-01",
      },
      registrationDate: "2024-01-15T10:00:00Z",
      registrationStatus: "PENDING_AGREEMENT",
    };

    // 顧客の合意内容（登録済み変更内容と完全に一致）
    const customerAgreement = {
      contractChangeId: "CC-2024-001",
      customerId: "CUST-A001",
      agreementStatus: "AGREED",
      agreementDetails: {
        beforeValue: "Service A",
        afterValue: "Service B",
        effectiveDate: "2024-02-01",
      },
      agreementDate: "2024-01-20T14:30:00Z",
      approverEmail: "manager@customer.example.com",
      approverName: "Manager Name",
    };

    // テスト対象: 合意内容の検証実行
    const validationResult = validateContractAgreement({
      registeredChange: registeredChangeContent,
      customerAgreement: customerAgreement,
    });

    // 期待結果1: 検証が成功する（isValidが true）
    expect(validationResult.isValid).toBe(true);

    // 期待結果2: 検証メッセージが「一致」であること
    expect(validationResult.validationMessage).toBe("一致");

    // 期待結果3: ステータスが「合意済み」に更新される
    expect(validationResult.updatedStatus).toBe("AGREED");

    // 期待結果4: 承認フローへ進む準備フラグが true
    expect(validationResult.proceedToApprovalFlow).toBe(true);

    // 期待結果5: 契約変更IDが正確に返される
    expect(validationResult.contractChangeId).toBe("CC-2024-001");

    // 期待結果6: 検証完了タイムスタンプが記録される
    expect(validationResult.validationCompletedAt).toBeDefined();
    expect(typeof validationResult.validationCompletedAt).toBe("string");

    // 境界値テスト: 合意内容と登録内容の beforeValue が異なる場合、検証失敗
    const mismatchedAgreement = {
      contractChangeId: "CC-2024-001",
      customerId: "CUST-A001",
      agreementStatus: "AGREED",
      agreementDetails: {
        beforeValue: "Service X", // 一致しない
        afterValue: "Service B",
        effectiveDate: "2024-02-01",
      },
      agreementDate: "2024-01-20T14:30:00Z",
      approverEmail: "manager@customer.example.com",
      approverName: "Manager Name",
    };

    const mismatchResult = validateContractAgreement({
      registeredChange: registeredChangeContent,
      customerAgreement: mismatchedAgreement,
    });

    expect(mismatchResult.isValid).toBe(false);
    expect(mismatchResult.validationMessage).toMatch(/不一致/);
    expect(mismatchResult.updatedStatus).toBe("MISMATCH_DETECTED");
    expect(mismatchResult.proceedToApprovalFlow).toBe(false);

    // エラーテスト: 契約変更IDが一致しない場合
    const invalidContractChangeId = {
      contractChangeId: "CC-2024-999", // 異なる ID
      customerId: "CUST-A001",
      agreementStatus: "AGREED",
      agreementDetails: {
        beforeValue: "Service A",
        afterValue: "Service B",
        effectiveDate: "2024-02-01",
      },
      agreementDate: "2024-01-20T14:30:00Z",
      approverEmail: "manager@customer.example.com",
      approverName: "Manager Name",
    };

    expect(() =>
      validateContractAgreement({
        registeredChange: registeredChangeContent,
        customerAgreement: invalidContractChangeId,
      })
    ).toThrow(/契約変更ID/);

    // エラーテスト: 顧客IDが一致しない場合
    const invalidCustomerId = {
      contractChangeId: "CC-2024-001",
      customerId: "CUST-B999", // 異なる顧客
      agreementStatus: "AGREED",
      agreementDetails: {
        beforeValue: "Service A",
        afterValue: "Service B",
        effectiveDate: "2024-02-01",
      },
      agreementDate: "2024-01-20T14:30:00Z",
      approverEmail: "manager@customer.example.com",
      approverName: "Manager Name",
    };

    expect(() =>
      validateContractAgreement({
        registeredChange: registeredChangeContent,
        customerAgreement: invalidCustomerId,
      })
    ).toThrow(/顧客/);

    // エラーテスト: agreementStatus が DISAGREED の場合
    const disagreedAgreement = {
      contractChangeId: "CC-2024-001",
      customerId: "CUST-A001",
      agreementStatus: "DISAGREED", // 非合意
      agreementDetails: {
        beforeValue: "Service A",
        afterValue: "Service B",
        effectiveDate: "2024-02-01",
      },
      agreementDate: "2024-01-20T14:30:00Z",
      approverEmail: "manager@customer.example.com",
      approverName: "Manager Name",
    };

    const disagreedResult = validateContractAgreement({
      registeredChange: registeredChangeContent,
      customerAgreement: disagreedAgreement,
    });

    expect(disagreedResult.isValid).toBe(false);
    expect(disagreedResult.validationMessage).toMatch(/非合意/);
    expect(disagreedResult.proceedToApprovalFlow).toBe(false);

    // 境界値テスト: effectiveDate が異なる場合、検証失敗
    const mismatchedEffectiveDate = {
      contractChangeId: "CC-2024-001",
      customerId: "CUST-A001",
      agreementStatus: "AGREED",
      agreementDetails: {
        beforeValue: "Service A",
        afterValue: "Service B",
        effectiveDate: "2024-03-01", // 異なる日付
      },
      agreementDate: "2024-01-20T14:30:00Z",
      approverEmail: "manager@customer.example.com",
      approverName: "Manager Name",
    };

    const dateResult = validateContractAgreement({
      registeredChange: registeredChangeContent,
      customerAgreement: mismatchedEffectiveDate,
    });

    expect(dateResult.isValid).toBe(false);
    expect(dateResult.validationMessage).toMatch(/不一致/);
  });
});