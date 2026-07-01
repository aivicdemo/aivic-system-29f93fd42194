import { validateSalesDataRequiredFields } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1371: [error] 営業データ入力時の品質検証ルール定義・実行機能 - 必須項目が欠落している営業データが検証エラーとして検出される
  test("必須項目が欠落している営業データに対して、検証エラーが正常に検出され、欠落項目を特定するエラーメッセージが表示される", () => {
    // 必須項目が欠落しているデータ: 顧客名が空文字列
    const invalidSalesData = {
      customer_name: "",
      amount: 100000,
      date: "2024-01-15",
      contact_date: "2024-01-15T10:30:00Z",
      outcome_content: "商品提案",
      appointment_status: "confirmed",
    };

    // 検証ルール定義: customer_name, amount, date, contact_date, outcome_content が必須
    const validationRuleDef = {
      required_fields: [
        "customer_name",
        "amount",
        "date",
        "contact_date",
        "outcome_content",
      ],
      field_definitions: {
        customer_name: { data_type: "string", min_length: 1 },
        amount: { data_type: "number", min_value: 0 },
        date: { data_type: "string", format: "YYYY-MM-DD" },
        contact_date: { data_type: "string", format: "ISO8601" },
        outcome_content: { data_type: "string", min_length: 1 },
      },
    };

    // 検証を実行 - エラーが throws されることを期待
    expect(() =>
      validateSalesDataRequiredFields(invalidSalesData, validationRuleDef)
    ).toThrow(/顧客名/);
  });

  // 追加境界値テスト: 複数の必須項目が欠落している場合
  test("複数の必須項目が欠落している営業データに対して、最初に欠落した項目名を含むエラーが検出される", () => {
    const invalidSalesData = {
      customer_name: "",
      amount: 0,
      date: "",
      contact_date: "2024-01-15T10:30:00Z",
      outcome_content: "",
    };

    const validationRuleDef = {
      required_fields: [
        "customer_name",
        "amount",
        "date",
        "contact_date",
        "outcome_content",
      ],
      field_definitions: {
        customer_name: { data_type: "string", min_length: 1 },
        amount: { data_type: "number", min_value: 1 },
        date: { data_type: "string", format: "YYYY-MM-DD" },
        contact_date: { data_type: "string", format: "ISO8601" },
        outcome_content: { data_type: "string", min_length: 1 },
      },
    };

    expect(() =>
      validateSalesDataRequiredFields(invalidSalesData, validationRuleDef)
    ).toThrow(/必須項目/);
  });

  // 成功パス: すべての必須項目が完全に入力されている場合
  test("すべての必須項目が正確に入力されている営業データは検証を通過する", () => {
    const validSalesData = {
      customer_name: "株式会社ABC",
      amount: 150000,
      date: "2024-01-15",
      contact_date: "2024-01-15T10:30:00Z",
      outcome_content: "商品提案・契約意思確認",
      appointment_status: "confirmed",
    };

    const validationRuleDef = {
      required_fields: [
        "customer_name",
        "amount",
        "date",
        "contact_date",
        "outcome_content",
      ],
      field_definitions: {
        customer_name: { data_type: "string", min_length: 1 },
        amount: { data_type: "number", min_value: 1 },
        date: { data_type: "string", format: "YYYY-MM-DD" },
        contact_date: { data_type: "string", format: "ISO8601" },
        outcome_content: { data_type: "string", min_length: 1 },
      },
    };

    const result = validateSalesDataRequiredFields(
      validSalesData,
      validationRuleDef
    );
    expect(result).toEqual({
      is_valid: true,
      validation_status: "合格",
      errors: [],
    });
  });

  // データ型不正のエラーケース: amount が文字列で入力されている
  test("データ型が不正な必須項目に対して、型不正エラーが検出される", () => {
    const invalidSalesData = {
      customer_name: "株式会社XYZ",
      amount: "150000",
      date: "2024-01-15",
      contact_date: "2024-01-15T10:30:00Z",
      outcome_content: "提案",
    };

    const validationRuleDef = {
      required_fields: [
        "customer_name",
        "amount",
        "date",
        "contact_date",
        "outcome_content",
      ],
      field_definitions: {
        customer_name: { data_type: "string", min_length: 1 },
        amount: { data_type: "number", min_value: 1 },
        date: { data_type: "string", format: "YYYY-MM-DD" },
        contact_date: { data_type: "string", format: "ISO8601" },
        outcome_content: { data_type: "string", min_length: 1 },
      },
    };

    expect(() =>
      validateSalesDataRequiredFields(invalidSalesData, validationRuleDef)
    ).toThrow(/金額/);
  });

  // 値の範囲外エラーケース: 日付が不正な形式
  test("値の形式が基準を満たさない必須項目に対して、形式エラーが検出される", () => {
    const invalidSalesData = {
      customer_name: "株式会社DEF",
      amount: 200000,
      date: "2024/01/15",
      contact_date: "2024-01-15T10:30:00Z",
      outcome_content: "提案実施",
    };

    const validationRuleDef = {
      required_fields: [
        "customer_name",
        "amount",
        "date",
        "contact_date",
        "outcome_content",
      ],
      field_definitions: {
        customer_name: { data_type: "string", min_length: 1 },
        amount: { data_type: "number", min_value: 1 },
        date: { data_type: "string", format: "YYYY-MM-DD" },
        contact_date: { data_type: "string", format: "ISO8601" },
        outcome_content: { data_type: "string", min_length: 1 },
      },
    };

    expect(() =>
      validateSalesDataRequiredFields(invalidSalesData, validationRuleDef)
    ).toThrow(/日付/);
  });

  // 金額が負数の値範囲外エラーケース
  test("数値が許容範囲外の必須項目に対して、範囲外エラーが検出される", () => {
    const invalidSalesData = {
      customer_name: "株式会社GHI",
      amount: -50000,
      date: "2024-01-15",
      contact_date: "2024-01-15T10:30:00Z",
      outcome_content: "提案",
    };

    const validationRuleDef = {
      required_fields: [
        "customer_name",
        "amount",
        "date",
        "contact_date",
        "outcome_content",
      ],
      field_definitions: {
        customer_name: { data_type: "string", min_length: 1 },
        amount: { data_type: "number", min_value: 0 },
        date: { data_type: "string", format: "YYYY-MM-DD" },
        contact_date: { data_type: "string", format: "ISO8601" },
        outcome_content: { data_type: "string", min_length: 1 },
      },
    };

    expect(() =>
      validateSalesDataRequiredFields(invalidSalesData, validationRuleDef)
    ).toThrow(/金額/);
  });

  // 必須項目が null の場合のエラー検出
  test("必須項目が null である営業データに対して、null エラーが検出される", () => {
    const invalidSalesData = {
      customer_name: null,
      amount: 100000,
      date: "2024-01-15",
      contact_date: "2024-01-15T10:30:00Z",
      outcome_content: "提案",
    };

    const validationRuleDef = {
      required_fields: [
        "customer_name",
        "amount",
        "date",
        "contact_date",
        "outcome_content",
      ],
      field_definitions: {
        customer_name: { data_type: "string", min_length: 1 },
        amount: { data_type: "number", min_value: 1 },
        date: { data_type: "string", format: "YYYY-MM-DD" },
        contact_date: { data_type: "string", format: "ISO8601" },
        outcome_content: { data_type: "string", min_length: 1 },
      },
    };

    expect(() =>
      validateSalesDataRequiredFields(invalidSalesData, validationRuleDef)
    ).toThrow(/顧客名/);
  });

  // 文字列長の最小値違反
  test("文字列が最小長要件を満たさない必須項目に対して、長さ不足エラーが検出される", () => {
    const invalidSalesData = {
      customer_name: "A",
      amount: 100000,
      date: "2024-01-15",
      contact_date: "2024-01-15T10:30:00Z",
      outcome_content: "提案",
    };

    const validationRuleDef = {
      required_fields: [
        "customer_name",
        "amount",
        "date",
        "contact_date",
        "outcome_content",
      ],
      field_definitions: {
        customer_name: { data_type: "string", min_length: 2 },
        amount: { data_type: "number", min_value: 1 },
        date: { data_type: "string", format: "YYYY-MM-DD" },
        contact_date: { data_type: "string", format: "ISO8601" },
        outcome_content: { data_type: "string", min_length: 1 },
      },
    };

    expect(() =>
      validateSalesDataRequiredFields(invalidSalesData, validationRuleDef)
    ).toThrow(/顧客名/);
  });
});