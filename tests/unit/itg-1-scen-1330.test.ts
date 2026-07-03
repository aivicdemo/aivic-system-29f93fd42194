import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQualityChecklist } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-1330: 品質管理ルール・チェックリスト作成 - 営業データ入力時の必須項目チェックルールがチェックリストに正しく文書化される", () => {
    // 前提: チェックリスト作成画面で必須項目を定義する準備が完了している状態
    // 入力: 営業データ入力時の必須項目チェックルールの定義情報
    const input_checklist_definition = {
      checklist_id: "checklist_001",
      checklist_name: "営業データ入力時の必須項目チェック",
      created_date: "2024-01-15T10:00:00Z",
      created_by: "operator_001",
      required_fields: [
        {
          field_name: "customer_name",
          field_label: "顧客名",
          field_type: "string",
          is_required: true,
          validation_type: "existence",
          validation_description: "顧客名が空でないことを確認"
        },
        {
          field_name: "transaction_amount",
          field_label: "取引金額",
          field_type: "number",
          is_required: true,
          validation_type: "format_and_range",
          validation_description: "取引金額が数値型で0より大きいことを確認"
        },
        {
          field_name: "transaction_date",
          field_label: "取引日",
          field_type: "date",
          is_required: true,
          validation_type: "format",
          validation_description: "取引日がISO8601形式の有効な日付であることを確認"
        },
        {
          field_name: "sales_person",
          field_label: "営業担当者",
          field_type: "string",
          is_required: true,
          validation_type: "existence",
          validation_description: "営業担当者名が空でないことを確認"
        }
      ]
    };

    // テスト1: チェックリスト定義の保存と検証
    const saved_checklist = validateSalesDataQualityChecklist(input_checklist_definition);

    // 保存されたチェックリストが正しく返却されることを確認
    expect(saved_checklist).toEqual({
      checklist_id: "checklist_001",
      checklist_name: "営業データ入力時の必須項目チェック",
      created_date: "2024-01-15T10:00:00Z",
      created_by: "operator_001",
      required_fields: [
        {
          field_name: "customer_name",
          field_label: "顧客名",
          field_type: "string",
          is_required: true,
          validation_type: "existence",
          validation_description: "顧客名が空でないことを確認"
        },
        {
          field_name: "transaction_amount",
          field_label: "取引金額",
          field_type: "number",
          is_required: true,
          validation_type: "format_and_range",
          validation_description: "取引金額が数値型で0より大きいことを確認"
        },
        {
          field_name: "transaction_date",
          field_label: "取引日",
          field_type: "date",
          is_required: true,
          validation_type: "format",
          validation_description: "取引日がISO8601形式の有効な日付であることを確認"
        },
        {
          field_name: "sales_person",
          field_label: "営業担当者",
          field_type: "string",
          is_required: true,
          validation_type: "existence",
          validation_description: "営業担当者名が空でないことを確認"
        }
      ]
    });

    // テスト2: チェックリストに含まれる必須項目の個数が正確であることを確認
    expect(saved_checklist.required_fields.length).toBe(4);

    // テスト3: 各必須項目の詳細内容が正確であることを確認
    const customer_name_field = saved_checklist.required_fields[0];
    expect(customer_name_field.field_name).toBe("customer_name");
    expect(customer_name_field.field_label).toBe("顧客名");
    expect(customer_name_field.is_required).toBe(true);
    expect(customer_name_field.validation_type).toBe("existence");

    const transaction_amount_field = saved_checklist.required_fields[1];
    expect(transaction_amount_field.field_name).toBe("transaction_amount");
    expect(transaction_amount_field.field_label).toBe("取引金額");
    expect(transaction_amount_field.is_required).toBe(true);
    expect(transaction_amount_field.validation_type).toBe("format_and_range");
    expect(transaction_amount_field.field_type).toBe("number");

    const transaction_date_field = saved_checklist.required_fields[2];
    expect(transaction_date_field.field_name).toBe("transaction_date");
    expect(transaction_date_field.field_label).toBe("取引日");
    expect(transaction_date_field.is_required).toBe(true);
    expect(transaction_date_field.validation_type).toBe("format");

    const sales_person_field = saved_checklist.required_fields[3];
    expect(sales_person_field.field_name).toBe("sales_person");
    expect(sales_person_field.field_label).toBe("営業担当者");
    expect(sales_person_field.is_required).toBe(true);
    expect(sales_person_field.validation_type).toBe("existence");

    // テスト4: 営業データ入力時に必須項目が未入力の場合、エラーが発生することを確認
    const invalid_sales_data_missing_customer = {
      customer_name: "",
      transaction_amount: 100000,
      transaction_date: "2024-01-15",
      sales_person: "営業太郎"
    };

    expect(() =>
      validateSalesDataQualityChecklist({
        ...input_checklist_definition,
        data_to_validate: invalid_sales_data_missing_customer
      })
    ).toThrow(/顧客名/);

    // テスト5: 取引金額が数値型でない場合、エラーが発生することを確認
    const invalid_sales_data_wrong_amount_type = {
      customer_name: "ABC株式会社",
      transaction_amount: "100000",
      transaction_date: "2024-01-15",
      sales_person: "営業太郎"
    };

    expect(() =>
      validateSalesDataQualityChecklist({
        ...input_checklist_definition,
        data_to_validate: invalid_sales_data_wrong_amount_type
      })
    ).toThrow(/取引金額/);

    // テスト6: 取引金額が0以下の場合、エラーが発生することを確認
    const invalid_sales_data_negative_amount = {
      customer_name: "ABC株式会社",
      transaction_amount: -50000,
      transaction_date: "2024-01-15",
      sales_person: "営業太郎"
    };

    expect(() =>
      validateSalesDataQualityChecklist({
        ...input_checklist_definition,
        data_to_validate: invalid_sales_data_negative_amount
      })
    ).toThrow(/取引金額/);

    // テスト7: 取引日が無効な形式の場合、エラーが発生することを確認
    const invalid_sales_data_bad_date = {
      customer_name: "ABC株式会社",
      transaction_amount: 100000,
      transaction_date: "2024/01/15",
      sales_person: "営業太郎"
    };

    expect(() =>
      validateSalesDataQualityChecklist({
        ...input_checklist_definition,
        data_to_validate: invalid_sales_data_bad_date
      })
    ).toThrow(/取引日/);

    // テスト8: 営業担当者が未入力の場合、エラーが発生することを確認
    const invalid_sales_data_missing_sales_person = {
      customer_name: "ABC株式会社",
      transaction_amount: 100000,
      transaction_date: "2024-01-15",
      sales_person: ""
    };

    expect(() =>
      validateSalesDataQualityChecklist({
        ...input_checklist_definition,
        data_to_validate: invalid_sales_data_missing_sales_person
      })
    ).toThrow(/営業担当者/);

    // テスト9: すべての必須項目が正常に入力されている場合、検証が合格することを確認
    const valid_sales_data = {
      customer_name: "ABC株式会社",
      transaction_amount: 100000,
      transaction_date: "2024-01-15",
      sales_person: "営業太郎"
    };

    const validation_result = validateSalesDataQualityChecklist({
      ...input_checklist_definition,
      data_to_validate: valid_sales_data
    });

    expect(validation_result.validation_status).toBe("合格");
    expect(validation_result.validation_errors).toEqual([]);
    expect(validation_result.validation_messages).toEqual([
      "顧客名: 検証成功",
      "取引金額: 検証成功",
      "取引日: 検証成功",
      "営業担当者: 検証成功"
    ]);

    // テスト10: チェックリスト詳細画面で全ての必須項目が表示されることを確認
    const checklist_detail_view = {
      checklist_id: saved_checklist.checklist_id,
      checklist_name: saved_checklist.checklist_name,
      created_date: saved_checklist.created_date,
      created_by: saved_checklist.created_by,
      total_required_fields: saved_checklist.required_fields.length,
      fields_summary: saved_checklist.required_fields.map(field => ({
        field_label: field.field_label,
        validation_type: field.validation_type
      }))
    };

    expect(checklist_detail_view.total_required_fields).toBe(4);
    expect(checklist_detail_view.fields_summary).toEqual([
      { field_label: "顧客名", validation_type: "existence" },
      { field_label: "取引金額", validation_type: "format_and_range" },
      { field_label: "取引日", validation_type: "format" },
      { field_label: "営業担当者", validation_type: "existence" }
    ]);
  });
});