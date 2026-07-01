import {
  validateSalesData,
  ValidationResult,
  SalesDataRecord,
  FieldValidationRule,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-722: [normal] 修正後データ再検証 - 修正されたデータが全ての品質基準を満たし合格判定となる
  test("修正されたデータが全ての品質基準を満たし合格判定となる", () => {
    // ============================================================
    // 1. 品質基準不適合のサンプル営業データを定義
    // ============================================================
    const defectiveRecord: SalesDataRecord = {
      recordId: "REC-001",
      customerId: "", // 必須項目が空：不適合
      customerName: "顧客A", // 正常
      contactDate: "2024-13-45", // データ型不正：不適合
      appointmentCount: "abc", // 数値型期待だが文字列：不適合
      contractAmount: 1500000, // 正常
      serviceType: "UNKNOWN_TYPE", // 許容値外：不適合
      approvalStatus: "confirmed", // 正常
      notes: "テスト",
    };

    const validationRules: FieldValidationRule[] = [
      {
        fieldName: "customerId",
        isRequired: true,
        dataType: "string",
        minLength: 1,
        maxLength: 50,
      },
      {
        fieldName: "contactDate",
        isRequired: true,
        dataType: "date",
        dateFormat: "YYYY-MM-DD",
      },
      {
        fieldName: "appointmentCount",
        isRequired: true,
        dataType: "number",
        minValue: 0,
        maxValue: 100,
      },
      {
        fieldName: "serviceType",
        isRequired: true,
        dataType: "string",
        allowedValues: ["SERVICE_A", "SERVICE_B", "SERVICE_C"],
      },
      {
        fieldName: "contractAmount",
        isRequired: true,
        dataType: "number",
        minValue: 0,
        maxValue: 10000000,
      },
    ];

    // ============================================================
    // 2. 品質検証機能を実行して不適合項目を特定
    // ============================================================
    const initialValidationResult: ValidationResult =
      validateSalesData(defectiveRecord, validationRules);

    // 修正前の検証ステータスは「不合格」
    expect(initialValidationResult.status).toBe("FAILED");

    // 検出される不適合項目を確認
    expect(initialValidationResult.errors).toContainEqual(
      expect.objectContaining({
        fieldName: "customerId",
        errorType: "REQUIRED_FIELD_MISSING",
      })
    );
    expect(initialValidationResult.errors).toContainEqual(
      expect.objectContaining({
        fieldName: "contactDate",
        errorType: "INVALID_DATE_FORMAT",
      })
    );
    expect(initialValidationResult.errors).toContainEqual(
      expect.objectContaining({
        fieldName: "appointmentCount",
        errorType: "INVALID_DATA_TYPE",
      })
    );
    expect(initialValidationResult.errors).toContainEqual(
      expect.objectContaining({
        fieldName: "serviceType",
        errorType: "VALUE_NOT_IN_ALLOWED_LIST",
      })
    );

    // ============================================================
    // 3. 検出された不適合データに対して修正処理を実行
    // ============================================================
    const correctedRecord: SalesDataRecord = {
      recordId: "REC-001",
      customerId: "CUST-12345", // 必須項目を修正
      customerName: "顧客A",
      contactDate: "2024-01-15", // 正しい日付形式に修正
      appointmentCount: 3, // 数値型に修正
      contractAmount: 1500000,
      serviceType: "SERVICE_A", // 許容値内に修正
      approvalStatus: "confirmed",
      notes: "テスト",
    };

    // ============================================================
    // 4. 修正されたデータに対して全品質基準の再検証を実行
    // ============================================================
    const correctedValidationResult: ValidationResult = validateSalesData(
      correctedRecord,
      validationRules
    );

    // ============================================================
    // 5. 各品質基準項目の検証結果を確認
    // ============================================================
    // 必須項目完全性：合格
    const customerIdValidation = correctedValidationResult.validations.find(
      (v) => v.fieldName === "customerId"
    );
    expect(customerIdValidation?.passed).toBe(true);
    expect(customerIdValidation?.criterion).toBe("REQUIRED_FIELD_CHECK");

    // データ型妥当性：合格
    const contactDateValidation = correctedValidationResult.validations.find(
      (v) => v.fieldName === "contactDate"
    );
    expect(contactDateValidation?.passed).toBe(true);
    expect(contactDateValidation?.criterion).toBe("DATA_TYPE_CHECK");

    const appointmentCountValidation =
      correctedValidationResult.validations.find(
        (v) => v.fieldName === "appointmentCount"
      );
    expect(appointmentCountValidation?.passed).toBe(true);
    expect(appointmentCountValidation?.criterion).toBe("DATA_TYPE_CHECK");

    // 値域妥当性：合格
    const contractAmountValidation =
      correctedValidationResult.validations.find(
        (v) => v.fieldName === "contractAmount"
      );
    expect(contractAmountValidation?.passed).toBe(true);
    expect(contractAmountValidation?.criterion).toBe("VALUE_RANGE_CHECK");

    // ビジネスルール整合性（許容値チェック）：合格
    const serviceTypeValidation = correctedValidationResult.validations.find(
      (v) => v.fieldName === "serviceType"
    );
    expect(serviceTypeValidation?.passed).toBe(true);
    expect(serviceTypeValidation?.criterion).toBe("ALLOWED_VALUES_CHECK");

    // ============================================================
    // 6. 修正後の検証結果ステータスが「合格」判定であることを確認
    // ============================================================
    expect(correctedValidationResult.status).toBe("PASSED");
    expect(correctedValidationResult.errors.length).toBe(0);

    // ============================================================
    // 7. 修正前後の検証ログを比較し、全ての不適合項目が解消されていることを確認
    // ============================================================
    // 修正前の不適合項目数
    const initialDefectCount = initialValidationResult.errors.length;
    expect(initialDefectCount).toBe(4); // customerId, contactDate, appointmentCount, serviceType

    // 修正後の不適合項目数
    const correctedDefectCount = correctedValidationResult.errors.length;
    expect(correctedDefectCount).toBe(0);

    // 全ての不適合項目が解消されたことを確認
    expect(correctedDefectCount).toBe(0);

    // ============================================================
    // 品質管理レポートの検証結果の反映を確認
    // ============================================================
    expect(correctedValidationResult.validations.every((v) => v.passed)).toBe(
      true
    );
    expect(correctedValidationResult.totalValidationRulesChecked).toBe(5);
    expect(correctedValidationResult.passedValidationRulesCount).toBe(5);
    expect(correctedValidationResult.failedValidationRulesCount).toBe(0);
  });
});