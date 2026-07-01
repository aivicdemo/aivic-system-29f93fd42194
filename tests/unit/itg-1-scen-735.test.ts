import { validateSalesActivityData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業活動データ自動検証・エラー通知機能", () => {
  // SCEN-735: 顧客名が空白またはスペースのみの場合、必須項目欠落として検出する
  test("顧客名が空白またはスペースのみの場合、必須項目欠落エラーを返す", () => {
    // ケース1: 顧客名が完全に空白
    const input_empty_customer_name = {
      customer_name: "",
      contact_date: "2024-01-15",
      achievement_content: "初回面談",
      appointment_status: "confirmed",
    };
    expect(() =>
      validateSalesActivityData(input_empty_customer_name)
    ).toThrow(/顧客名/);

    // ケース2: 顧客名がスペースのみ（1文字）
    const input_space_only_single = {
      customer_name: " ",
      contact_date: "2024-01-15",
      achievement_content: "初回面談",
      appointment_status: "confirmed",
    };
    expect(() =>
      validateSalesActivityData(input_space_only_single)
    ).toThrow(/顧客名/);

    // ケース3: 顧客名がスペース複数文字
    const input_space_only_multiple = {
      customer_name: "   ",
      contact_date: "2024-01-15",
      achievement_content: "初回面談",
      appointment_status: "confirmed",
    };
    expect(() =>
      validateSalesActivityData(input_space_only_multiple)
    ).toThrow(/顧客名/);

    // ケース4: 顧客名がスペースと改行のみ
    const input_space_and_newline = {
      customer_name: " \n ",
      contact_date: "2024-01-15",
      achievement_content: "初回面談",
      appointment_status: "confirmed",
    };
    expect(() =>
      validateSalesActivityData(input_space_and_newline)
    ).toThrow(/顧客名/);

    // ケース5: 正常な顧客名の場合は検証を通す
    const input_valid_customer_name = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15",
      achievement_content: "初回面談",
      appointment_status: "confirmed",
    };
    const result = validateSalesActivityData(input_valid_customer_name);
    expect(result).toEqual({
      is_valid: true,
      errors: [],
    });

    // ケース6: 顧客名にスペースを含むが有効な値（先頭と末尾のスペースは削除される）
    const input_customer_name_with_spaces = {
      customer_name: "  株式会社DEF  ",
      contact_date: "2024-01-15",
      achievement_content: "初回面談",
      appointment_status: "confirmed",
    };
    const result_with_spaces = validateSalesActivityData(
      input_customer_name_with_spaces
    );
    expect(result_with_spaces).toEqual({
      is_valid: true,
      errors: [],
    });
  });
});