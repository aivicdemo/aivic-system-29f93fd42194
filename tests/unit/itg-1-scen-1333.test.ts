import { validateSalesSystemBackofficeCompatibility } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業システム・バックオフィスシステム連携仕様検証", () => {
  test("SCEN-1333: 営業システムの出力データ項目がバックオフィスシステムの入力要件と完全に互換性がある場合に検証成功と判定される", () => {
    // 営業システムから出力されるデータ項目の仕様書
    const salesSystemOutputSpec = {
      fields: [
        {
          fieldName: "customer_id",
          dataType: "string",
          maxLength: 20,
          required: true,
          format: "numeric",
        },
        {
          fieldName: "appointment_count",
          dataType: "integer",
          minValue: 0,
          maxValue: 999,
          required: true,
          format: "numeric",
        },
        {
          fieldName: "contract_count",
          dataType: "integer",
          minValue: 0,
          maxValue: 999,
          required: true,
          format: "numeric",
        },
        {
          fieldName: "service_type",
          dataType: "string",
          maxLength: 50,
          required: true,
          format: "alphanumeric",
        },
        {
          fieldName: "response_score",
          dataType: "decimal",
          minValue: 0,
          maxValue: 100,
          precision: 2,
          required: false,
          format: "numeric",
        },
      ],
    };

    // バックオフィスシステムの入力要件仕様書
    const backofficeInputRequirement = {
      fields: [
        {
          fieldName: "customer_id",
          dataType: "string",
          maxLength: 20,
          required: true,
          format: "numeric",
        },
        {
          fieldName: "appointment_count",
          dataType: "integer",
          minValue: 0,
          maxValue: 999,
          required: true,
          format: "numeric",
        },
        {
          fieldName: "contract_count",
          dataType: "integer",
          minValue: 0,
          maxValue: 999,
          required: true,
          format: "numeric",
        },
        {
          fieldName: "service_type",
          dataType: "string",
          maxLength: 50,
          required: true,
          format: "alphanumeric",
        },
        {
          fieldName: "response_score",
          dataType: "decimal",
          minValue: 0,
          maxValue: 100,
          precision: 2,
          required: false,
          format: "numeric",
        },
      ],
    };

    // 営業システムから出力されるテストデータ（正常系）
    const testDataNormal = {
      customer_id: "C00001",
      appointment_count: 15,
      contract_count: 5,
      service_type: "SVC001",
      response_score: 85.5,
    };

    // 営業システムから出力されるテストデータ（境界値）
    const testDataBoundary = {
      customer_id: "C12345678901234567890",
      appointment_count: 0,
      contract_count: 999,
      service_type: "A",
      response_score: 0.0,
    };

    // 営業システムから出力されるテストデータ（特殊文字を含むデータ）
    const testDataSpecial = {
      customer_id: "C99999",
      appointment_count: 100,
      contract_count: 50,
      service_type: "SVC_ABC123",
      response_score: 100.0,
    };

    // 正常系パターンの検証
    const resultNormal = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: testDataNormal,
    });

    expect(resultNormal).toEqual({
      isCompatible: true,
      dataValidated: true,
      processingSuccessful: true,
      storageSuccessful: true,
      errorCount: 0,
      errors: [],
      testPatternResults: [
        {
          patternName: "normal",
          isValid: true,
          errorMessage: null,
        },
      ],
    });

    // 境界値パターンの検証
    const resultBoundary = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: testDataBoundary,
    });

    expect(resultBoundary).toEqual({
      isCompatible: true,
      dataValidated: true,
      processingSuccessful: true,
      storageSuccessful: true,
      errorCount: 0,
      errors: [],
      testPatternResults: [
        {
          patternName: "boundary",
          isValid: true,
          errorMessage: null,
        },
      ],
    });

    // 特殊文字含むパターンの検証
    const resultSpecial = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: testDataSpecial,
    });

    expect(resultSpecial).toEqual({
      isCompatible: true,
      dataValidated: true,
      processingSuccessful: true,
      storageSuccessful: true,
      errorCount: 0,
      errors: [],
      testPatternResults: [
        {
          patternName: "specialCharacters",
          isValid: true,
          errorMessage: null,
        },
      ],
    });

    // 全パターンの統合検証結果
    const integrationResult = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testDataPatterns: [testDataNormal, testDataBoundary, testDataSpecial],
    });

    expect(integrationResult.isCompatible).toBe(true);
    expect(integrationResult.dataValidated).toBe(true);
    expect(integrationResult.processingSuccessful).toBe(true);
    expect(integrationResult.storageSuccessful).toBe(true);
    expect(integrationResult.errorCount).toBe(0);
    expect(integrationResult.errors.length).toBe(0);
    expect(integrationResult.testPatternResults.length).toBe(3);
    expect(
      integrationResult.testPatternResults.every((r) => r.isValid === true)
    ).toBe(true);

    // データ型互換性チェック
    expect(integrationResult.fieldMappingValidation).toEqual({
      customer_id: { typeMatch: true, formatMatch: true, lengthMatch: true },
      appointment_count: {
        typeMatch: true,
        rangeMatch: true,
        formatMatch: true,
      },
      contract_count: { typeMatch: true, rangeMatch: true, formatMatch: true },
      service_type: { typeMatch: true, formatMatch: true, lengthMatch: true },
      response_score: {
        typeMatch: true,
        rangeMatch: true,
        precisionMatch: true,
        formatMatch: true,
      },
    });

    // 必須/オプション区分の一致確認
    expect(integrationResult.requiredFieldsConsistency).toEqual({
      customer_id: { required: true, consistent: true },
      appointment_count: { required: true, consistent: true },
      contract_count: { required: true, consistent: true },
      service_type: { required: true, consistent: true },
      response_score: { required: false, consistent: true },
    });

    // 検証完了ステータス
    expect(integrationResult.validationStatus).toBe("完全互換");
    expect(integrationResult.compatibilityScore).toBe(100);
  });

  test("SCEN-1333: データ型が不一致の場合、検証失敗と判定されエラーが返される", () => {
    const salesSystemOutputSpec = {
      fields: [
        {
          fieldName: "appointment_count",
          dataType: "string",
          maxLength: 10,
          required: true,
          format: "alphanumeric",
        },
      ],
    };

    const backofficeInputRequirement = {
      fields: [
        {
          fieldName: "appointment_count",
          dataType: "integer",
          minValue: 0,
          maxValue: 999,
          required: true,
          format: "numeric",
        },
      ],
    };

    const result = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: { appointment_count: "100" },
    });

    expect(result.isCompatible).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("データ型");
  });

  test("SCEN-1333: 必須フィールドの区分が不一致の場合、検証失敗と判定されエラーが返される", () => {
    const salesSystemOutputSpec = {
      fields: [
        {
          fieldName: "response_score",
          dataType: "decimal",
          required: true,
          precision: 2,
        },
      ],
    };

    const backofficeInputRequirement = {
      fields: [
        {
          fieldName: "response_score",
          dataType: "decimal",
          required: false,
          precision: 2,
        },
      ],
    };

    const result = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: { response_score: 85.5 },
    });

    expect(result.isCompatible).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("必須");
  });

  test("SCEN-1333: 文字列長が上限を超える場合、検証失敗と判定されエラーが返される", () => {
    const salesSystemOutputSpec = {
      fields: [
        {
          fieldName: "service_type",
          dataType: "string",
          maxLength: 50,
          required: true,
        },
      ],
    };

    const backofficeInputRequirement = {
      fields: [
        {
          fieldName: "service_type",
          dataType: "string",
          maxLength: 20,
          required: true,
        },
      ],
    };

    const testData = {
      service_type: "A".repeat(30),
    };

    const result = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: testData,
    });

    expect(result.isCompatible).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("文字列長");
  });

  test("SCEN-1333: 数値範囲が超過する場合、検証失敗と判定されエラーが返される", () => {
    const salesSystemOutputSpec = {
      fields: [
        {
          fieldName: "appointment_count",
          dataType: "integer",
          minValue: 0,
          maxValue: 999,
          required: true,
        },
      ],
    };

    const backofficeInputRequirement = {
      fields: [
        {
          fieldName: "appointment_count",
          dataType: "integer",
          minValue: 0,
          maxValue: 500,
          required: true,
        },
      ],
    };

    const result = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: { appointment_count: 750 },
    });

    expect(result.isCompatible).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("範囲");
  });

  test("SCEN-1333: 小数精度が不一致の場合、検証失敗と判定されエラーが返される", () => {
    const salesSystemOutputSpec = {
      fields: [
        {
          fieldName: "response_score",
          dataType: "decimal",
          precision: 3,
          required: false,
        },
      ],
    };

    const backofficeInputRequirement = {
      fields: [
        {
          fieldName: "response_score",
          dataType: "decimal",
          precision: 2,
          required: false,
        },
      ],
    };

    const result = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: { response_score: 85.555 },
    });

    expect(result.isCompatible).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("精度");
  });

  test("SCEN-1333: フォーマット形式が不一致の場合、検証失敗と判定されエラーが返される", () => {
    const salesSystemOutputSpec = {
      fields: [
        {
          fieldName: "customer_id",
          dataType: "string",
          maxLength: 20,
          required: true,
          format: "alphanumeric",
        },
      ],
    };

    const backofficeInputRequirement = {
      fields: [
        {
          fieldName: "customer_id",
          dataType: "string",
          maxLength: 20,
          required: true,
          format: "numeric",
        },
      ],
    };

    const result = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: { customer_id: "C00001" },
    });

    expect(result.isCompatible).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("フォーマット");
  });

  test("SCEN-1333: 営業システムの出力フィールドがバックオフィス要件より少ない場合、検証失敗と判定される", () => {
    const salesSystemOutputSpec = {
      fields: [
        {
          fieldName: "customer_id",
          dataType: "string",
          maxLength: 20,
          required: true,
        },
        {
          fieldName: "appointment_count",
          dataType: "integer",
          required: true,
        },
      ],
    };

    const backofficeInputRequirement = {
      fields: [
        {
          fieldName: "customer_id",
          dataType: "string",
          maxLength: 20,
          required: true,
        },
        {
          fieldName: "appointment_count",
          dataType: "integer",
          required: true,
        },
        {
          fieldName: "contract_count",
          dataType: "integer",
          required: true,
        },
      ],
    };

    const result = validateSalesSystemBackofficeCompatibility({
      salesSystemSpec: salesSystemOutputSpec,
      backofficeRequirement: backofficeInputRequirement,
      testData: {
        customer_id: "C00001",
        appointment_count: 10,
      },
    });

    expect(result.isCompatible).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("フィールド");
  });
});