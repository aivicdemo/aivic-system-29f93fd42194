import { validateLearningDataCompleteness } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1135
  test("学習データが不完全な状態での再学習を拒否してエラーを返す", () => {
    // 必須フィールドが欠落した過去案件データ
    const incomplete_past_case_data = [
      {
        case_id: "CASE001",
        project_date: "2024-01-15",
        // region フィールド欠落
        construction_type: "建築工事",
        estimate_amount: 5000000,
      },
      {
        case_id: "CASE002",
        project_date: "2024-02-20",
        region: "東京",
        construction_type: "土木工事",
        // estimate_amount フィールド欠落
      },
    ];

    // 完全な物価本データ
    const complete_price_book_data = [
      {
        item_id: "ITEM001",
        item_name: "鉄筋コンクリート工事",
        unit_price: 12000,
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
      },
    ];

    // 必須フィールド欠落を検出
    expect(() =>
      validateLearningDataCompleteness(
        incomplete_past_case_data,
        complete_price_book_data
      )
    ).toThrow(/必須フィールド/);
  });

  test("物価本データの必須フィールド欠落を検出", () => {
    // 完全な過去案件データ
    const complete_past_case_data = [
      {
        case_id: "CASE001",
        project_date: "2024-01-15",
        region: "東京",
        construction_type: "建築工事",
        estimate_amount: 5000000,
      },
    ];

    // 必須フィールドが欠落した物価本データ
    const incomplete_price_book_data = [
      {
        item_id: "ITEM001",
        item_name: "鉄筋コンクリート工事",
        // unit_price フィールド欠落
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
      },
      {
        item_id: "ITEM002",
        item_name: "鋼構造工事",
        unit_price: 15000,
        valid_from: "2024-01-01",
        // valid_to フィールド欠落
      },
    ];

    expect(() =>
      validateLearningDataCompleteness(
        complete_past_case_data,
        incomplete_price_book_data
      )
    ).toThrow(/フィールド/);
  });

  test("データ行が不完全（null/undefined 値）な状態を検出", () => {
    // null 値を含む過去案件データ
    const past_case_data_with_null = [
      {
        case_id: "CASE001",
        project_date: "2024-01-15",
        region: null,
        construction_type: "建築工事",
        estimate_amount: 5000000,
      },
    ];

    const complete_price_book_data = [
      {
        item_id: "ITEM001",
        item_name: "鉄筋コンクリート工事",
        unit_price: 12000,
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
      },
    ];

    expect(() =>
      validateLearningDataCompleteness(
        past_case_data_with_null,
        complete_price_book_data
      )
    ).toThrow(/null値/);
  });

  test("空配列として渡されたデータを検出", () => {
    const empty_past_case_data: object[] = [];
    const complete_price_book_data = [
      {
        item_id: "ITEM001",
        item_name: "鉄筋コンクリート工事",
        unit_price: 12000,
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
      },
    ];

    expect(() =>
      validateLearningDataCompleteness(
        empty_past_case_data,
        complete_price_book_data
      )
    ).toThrow(/データ件数/);
  });

  test("すべてのデータが完全な場合は検証を通す", () => {
    const complete_past_case_data = [
      {
        case_id: "CASE001",
        project_date: "2024-01-15",
        region: "東京",
        construction_type: "建築工事",
        estimate_amount: 5000000,
      },
      {
        case_id: "CASE002",
        project_date: "2024-02-20",
        region: "大阪",
        construction_type: "土木工事",
        estimate_amount: 3500000,
      },
    ];

    const complete_price_book_data = [
      {
        item_id: "ITEM001",
        item_name: "鉄筋コンクリート工事",
        unit_price: 12000,
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
      },
      {
        item_id: "ITEM002",
        item_name: "鋼構造工事",
        unit_price: 15000,
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
      },
    ];

    const result = validateLearningDataCompleteness(
      complete_past_case_data,
      complete_price_book_data
    );

    expect(result).toEqual({
      is_valid: true,
      past_case_count: 2,
      price_book_count: 2,
      validation_timestamp: expect.any(String),
    });
  });

  test("検証が成功した場合、既存モデルは変更されない状態であることを確認", () => {
    const complete_past_case_data = [
      {
        case_id: "CASE001",
        project_date: "2024-01-15",
        region: "東京",
        construction_type: "建築工事",
        estimate_amount: 5000000,
      },
    ];

    const complete_price_book_data = [
      {
        item_id: "ITEM001",
        item_name: "鉄筋コンクリート工事",
        unit_price: 12000,
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
      },
    ];

    const validation_result = validateLearningDataCompleteness(
      complete_past_case_data,
      complete_price_book_data
    );

    expect(validation_result.is_valid).toBe(true);
    expect(validation_result.model_changed).toBe(false);
  });
});