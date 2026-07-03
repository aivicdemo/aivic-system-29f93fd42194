import { detectAnomaliesAndGenerateCorrectionInstructions } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ品質管理 - 異常値検出・補正指示生成', () => {
  // SCEN-647
  test('複数の異常値が存在する場合、全て検出され個別の補正指示が生成される', () => {
    const test_sales_record = {
      record_id: 'REC-20240115-001',
      customer_id: '',
      sales_amount: -50000,
      transaction_date: '2025-12-25',
      service_type: 'PREMIUM',
      contact_person: 'John Doe',
    };

    const result = detectAnomaliesAndGenerateCorrectionInstructions(test_sales_record);

    // 異常値の件数が3件以上であることを確認
    expect(result.anomalies.length).toBeGreaterThanOrEqual(3);

    // 検出された異常値の種類を確認
    const anomaly_types = result.anomalies.map((a) => a.anomaly_type);
    expect(anomaly_types).toContain('empty_customer_id');
    expect(anomaly_types).toContain('negative_sales_amount');
    expect(anomaly_types).toContain('future_transaction_date');

    // 各異常値に対して個別の補正指示が生成されていることを確認
    expect(result.correction_instructions.length).toBe(3);

    // 補正指示1: 空文字カスタマーID
    const empty_id_instruction = result.correction_instructions.find(
      (instr) => instr.anomaly_type === 'empty_customer_id'
    );
    expect(empty_id_instruction).toBeDefined();
    expect(empty_id_instruction?.instruction_content).toMatch(/手動入力/);
    expect(empty_id_instruction?.record_id).toBe('REC-20240115-001');
    expect(empty_id_instruction?.priority).toBe('high');

    // 補正指示2: マイナス売上
    const negative_amount_instruction = result.correction_instructions.find(
      (instr) => instr.anomaly_type === 'negative_sales_amount'
    );
    expect(negative_amount_instruction).toBeDefined();
    expect(negative_amount_instruction?.instruction_content).toMatch(/絶対値/);
    expect(negative_amount_instruction?.suggested_value).toBe(50000);
    expect(negative_amount_instruction?.record_id).toBe('REC-20240115-001');
    expect(negative_amount_instruction?.priority).toBe('high');

    // 補正指示3: 未来日付
    const future_date_instruction = result.correction_instructions.find(
      (instr) => instr.anomaly_type === 'future_transaction_date'
    );
    expect(future_date_instruction).toBeDefined();
    expect(future_date_instruction?.instruction_content).toMatch(/取引日付/);
    expect(future_date_instruction?.record_id).toBe('REC-20240115-001');
    expect(future_date_instruction?.priority).toBe('medium');

    // 全ての補正指示が同一レコードに紐付けられていることを確認
    const all_record_ids = result.correction_instructions.map((instr) => instr.record_id);
    expect(all_record_ids.every((id) => id === 'REC-20240115-001')).toBe(true);

    // 生成された補正指示の総数が異常値の件数と一致することを確認
    expect(result.correction_instructions.length).toBe(result.anomalies.length);

    // 補正指示が異常値の見落としなく生成されていることを確認
    expect(result.correction_instructions.every((instr) => instr.instruction_id)).toBe(true);
    expect(result.correction_instructions.every((instr) => instr.instruction_content.length > 0)).toBe(true);

    // 結果サマリー
    expect(result.summary).toMatchObject({
      record_id: 'REC-20240115-001',
      total_anomalies: 3,
      correction_instructions_generated: 3,
      validation_status: 'failed',
    });
  });
});