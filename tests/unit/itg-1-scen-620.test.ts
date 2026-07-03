import { validateSalesDataType } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ項目メタデータ管理 - データ型検証エラー通知", () => {
  test("SCEN-620: データ型不一致時にエラーが検出され修正対応者に通知される", () => {
    // 前提: メタデータで「数値」型に定義された営業データ項目に対して、「文字列」型のデータを入力
    const metadata_item_id = "meta_001";
    const metadata_item_name = "アポ数";
    const expected_data_type = "number";
    const actual_input_value = "abc"; // 文字列型で入力（メタデータと不一致）
    const actual_input_type = "string";
    const correction_responsible_email = "correction@example.com";
    const error_detection_timestamp = new Date("2024-01-15T10:30:00Z");
    const correction_deadline = new Date("2024-01-17T17:00:00Z");

    // 入力値を構築
    const validation_input = {
      metadata_item_id,
      metadata_item_name,
      expected_data_type,
      actual_input_value,
      actual_input_type,
      correction_responsible_email,
      error_detection_timestamp,
      correction_deadline,
    };

    // データ型検証を実行
    const validation_result = validateSalesDataType(validation_input);

    // 期待結果：検証失敗（エラー検出）
    expect(validation_result.is_valid).toBe(false);

    // エラーメッセージが存在し、キーワード「データ型」を含むことを確認
    expect(validation_result.error_message).toMatch(/データ型/);

    // エラーメッセージに期待されるデータ型が含まれていることを確認
    expect(validation_result.error_message).toContain(expected_data_type);

    // エラーメッセージに実際に入力されたデータ型が含まれていることを確認
    expect(validation_result.error_message).toContain(actual_input_type);

    // エラーレコードが生成されていることを確認
    expect(validation_result.validation_error_record).toBeDefined();
    expect(validation_result.validation_error_record.metadata_item_id).toBe(
      metadata_item_id
    );
    expect(
      validation_result.validation_error_record.metadata_item_name
    ).toBe(metadata_item_name);
    expect(
      validation_result.validation_error_record.expected_data_type
    ).toBe(expected_data_type);
    expect(validation_result.validation_error_record.actual_input_type).toBe(
      actual_input_type
    );

    // 通知オブジェクトが生成されていることを確認
    expect(validation_result.notification).toBeDefined();

    // 通知の送信先が修正対応者のメールアドレスであることを確認
    expect(validation_result.notification.recipient_email).toBe(
      correction_responsible_email
    );

    // 通知に詳細なエラー情報が含まれていることを確認
    expect(validation_result.notification.error_details).toBeDefined();
    expect(
      validation_result.notification.error_details.error_detected_item_name
    ).toBe(metadata_item_name);
    expect(
      validation_result.notification.error_details.expected_data_type
    ).toBe(expected_data_type);
    expect(validation_result.notification.error_details.actual_data_type).toBe(
      actual_input_type
    );

    // 通知に修正期限が含まれていることを確認
    expect(validation_result.notification.error_details.correction_deadline).toBe(
      correction_deadline.toISOString()
    );

    // 通知に修正対応内容が含まれていることを確認
    expect(
      validation_result.notification.correction_action_content
    ).toBeDefined();
    expect(
      validation_result.notification.correction_action_content
    ).toMatch(/修正/);

    // システムがエラー状態を維持していることを確認
    expect(validation_result.system_error_state_maintained).toBe(true);

    // エラー状態が継続していることを示すフラグが true であることを確認
    expect(validation_result.continues_error_status).toBe(true);
  });

  test("SCEN-620: データ型が正しく一致する場合は検証成功", () => {
    // 正常系：メタデータで「数値」型に定義され、実際にも「数値」型で入力される
    const metadata_item_id = "meta_002";
    const metadata_item_name = "成約数";
    const expected_data_type = "number";
    const actual_input_value = 5;
    const actual_input_type = "number";
    const correction_responsible_email = "correction@example.com";
    const error_detection_timestamp = new Date("2024-01-15T11:00:00Z");
    const correction_deadline = new Date("2024-01-17T17:00:00Z");

    const validation_input = {
      metadata_item_id,
      metadata_item_name,
      expected_data_type,
      actual_input_value,
      actual_input_type,
      correction_responsible_email,
      error_detection_timestamp,
      correction_deadline,
    };

    const validation_result = validateSalesDataType(validation_input);

    // 期待結果：検証成功
    expect(validation_result.is_valid).toBe(true);
    expect(validation_result.validation_error_record).toBeNull();
    expect(validation_result.notification).toBeNull();
    expect(validation_result.system_error_state_maintained).toBe(false);
    expect(validation_result.continues_error_status).toBe(false);
  });

  test("SCEN-620: 日付型メタデータと文字列型入力のミスマッチ", () => {
    // 日付型として定義されたメタデータに対して文字列を入力
    const metadata_item_id = "meta_003";
    const metadata_item_name = "接触日時";
    const expected_data_type = "datetime";
    const actual_input_value = "not-a-date";
    const actual_input_type = "string";
    const correction_responsible_email = "correction@example.com";
    const error_detection_timestamp = new Date("2024-01-15T12:00:00Z");
    const correction_deadline = new Date("2024-01-17T17:00:00Z");

    const validation_input = {
      metadata_item_id,
      metadata_item_name,
      expected_data_type,
      actual_input_value,
      actual_input_type,
      correction_responsible_email,
      error_detection_timestamp,
      correction_deadline,
    };

    const validation_result = validateSalesDataType(validation_input);

    // エラーが検出されることを確認
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.error_message).toMatch(/データ型/);
    expect(validation_result.validation_error_record.expected_data_type).toBe(
      expected_data_type
    );
    expect(validation_result.continues_error_status).toBe(true);
  });
});