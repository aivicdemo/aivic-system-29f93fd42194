import { validateSalesDataAccuracy } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-727: [edge] 月次レポート生成前の最終検証機能 - 確定済みデータに正確性の異常値が検出され、生成可否判定で生成不可と判定される
  test('確定済みデータに正確性の異常値が検出された場合、最終検証機能の生成可否判定で「生成不可」と判定され、月次レポート生成処理が実行されず、適切なエラーメッセージとログが記録されること', () => {
    // Arrange: 確定済みの売上データセットを準備する（正常なレコード複数件と異常値を含むレコード1件以上）
    const normal_sales_record_1 = {
      sales_id: 'SALES-001',
      customer_id: 'CUST-A',
      service_type: 'SERVICE-X',
      appointment_count: 5,
      contract_count: 2,
      amount: 50000,
      data_status: 'confirmed',
      recorded_date: '2024-01-15T10:30:00Z',
    };

    const normal_sales_record_2 = {
      sales_id: 'SALES-002',
      customer_id: 'CUST-B',
      service_type: 'SERVICE-Y',
      appointment_count: 3,
      contract_count: 1,
      amount: 30000,
      data_status: 'confirmed',
      recorded_date: '2024-01-15T11:15:00Z',
    };

    const abnormal_sales_record = {
      sales_id: 'SALES-003',
      customer_id: 'CUST-C',
      service_type: 'SERVICE-Z',
      appointment_count: 2,
      contract_count: 5, // 異常値: appointment_count より contract_count が大きい
      amount: -10000, // 異常値: 負の金額
      data_status: 'confirmed',
      recorded_date: '2024-01-15T12:00:00Z',
    };

    const confirmed_dataset = [
      normal_sales_record_1,
      normal_sales_record_2,
      abnormal_sales_record,
    ];

    // Act: 異常値検出エンジンを実行し、データの正確性を検証する、および月次レポート生成前の最終検証機能を実行する
    const validation_result = validateSalesDataAccuracy(confirmed_dataset);

    // Assert: 異常値検出結果が『異常あり』と判定されることを確認する
    expect(validation_result.has_anomaly).toBe(true);

    // Assert: 検証機能内の生成可否判定ロジックが異常値の存在を認識していることを確認する
    expect(validation_result.anomalies.length).toBeGreaterThan(0);

    // Assert: 生成可否判定の結果が『生成不可』と判定されることを確認する
    expect(validation_result.can_generate_report).toBe(false);

    // Assert: 生成不可の理由として『確定済みデータに正確性の異常値が検出されました』というメッセージが返却されることを確認する
    expect(validation_result.reason).toMatch(/確定済みデータに正確性の異常値が検出されました/);

    // Assert: 月次レポート生成処理が実行されないことを確認する
    expect(validation_result.report_generation_executed).toBe(false);

    // Assert: システムログに異常検出と生成中止の記録が正しく出力されることを確認する
    expect(validation_result.log_entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'error',
          message: expect.stringMatching(/異常値を検出/),
        }),
        expect.objectContaining({
          level: 'info',
          message: expect.stringMatching(/月次レポート生成を中止/),
        }),
      ])
    );

    // Assert: 異常値の詳細情報が正確に記録されていることを確認する
    const anomaly_details = validation_result.anomalies;
    expect(anomaly_details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: 'SALES-003',
          anomaly_type: 'logic_error',
          field_name: 'contract_count',
          detected_value: 5,
          reason: 'appointment_count より大きい値が検出されました',
        }),
        expect.objectContaining({
          record_id: 'SALES-003',
          anomaly_type: 'range_error',
          field_name: 'amount',
          detected_value: -10000,
          reason: '負の金額が検出されました',
        }),
      ])
    );

    // Assert: 正常なデータレコードは異常リストに含まれないことを確認する
    const anomalous_record_ids = anomaly_details.map((a: any) => a.record_id);
    expect(anomalous_record_ids).not.toContain('SALES-001');
    expect(anomalous_record_ids).not.toContain('SALES-002');
  });
});