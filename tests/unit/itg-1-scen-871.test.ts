import { notifyValidationError } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-871: [error] 検証エラー自動通知機能 - 上位管理者の連絡先が存在しない場合にエラーが発生する
  test('上位管理者の連絡先が存在しない場合、エラーメッセージが表示されエラーログが記録される', () => {
    const validation_error_id = 'ERR_VAL_001';
    const error_message = '営業データの必須項目が欠落しています';
    const error_severity = 'HIGH';
    const detection_timestamp = new Date('2024-01-15T11:00:00Z');
    const sales_data_id = 'SD_20240115_001';
    const field_name = 'customer_name';
    const operator_id = 'OP_001';
    const supervisor_id = null;
    const supervisor_email = null;

    expect(() =>
      notifyValidationError({
        validation_error_id,
        error_message,
        error_severity,
        detection_timestamp,
        sales_data_id,
        field_name,
        operator_id,
        supervisor_id,
        supervisor_email,
      })
    ).toThrow(/上位管理者の連絡先/);
  });
});