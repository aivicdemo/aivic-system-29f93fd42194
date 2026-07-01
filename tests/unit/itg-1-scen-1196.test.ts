import { verifyReportDataAccuracy } from '../../src/logic/it-1781935279444-2-2-1';

describe('Report Data Accuracy Verification', () => {
  // SCEN-1196: [normal] レポート数値とソースデータ照合機能 - 営業データから抽出したソースデータがレポート記載値と一致する場合、一致フラグが true で返される
  test('should return match_flag=true when extracted source data matches report values exactly', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const report_values = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const result = verifyReportDataAccuracy({
      source_data,
      report_values,
    });

    expect(result.match_flag).toBe(true);
    expect(result.verification_status).toBe('PASSED');
    expect(result.discrepancy_list).toEqual([]);
  });

  // Boundary: numeric field matches exactly
  test('should return match_flag=true when numeric values match exactly at boundary', () => {
    const source_data = {
      period_start: '2024-02-01',
      period_end: '2024-02-29',
      customer_id: 'CUST002',
      appointment_count: 0,
      contract_count: 100,
      customer_response_score: 5.0,
    };

    const report_values = {
      period_start: '2024-02-01',
      period_end: '2024-02-29',
      customer_id: 'CUST002',
      appointment_count: 0,
      contract_count: 100,
      customer_response_score: 5.0,
    };

    const result = verifyReportDataAccuracy({
      source_data,
      report_values,
    });

    expect(result.match_flag).toBe(true);
    expect(result.verification_status).toBe('PASSED');
  });

  // Error: source_data is null
  test('should throw error when source_data is null', () => {
    const report_values = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    expect(() =>
      verifyReportDataAccuracy({
        source_data: null as any,
        report_values,
      })
    ).toThrow(/ソースデータ/);
  });

  // Error: report_values is null
  test('should throw error when report_values is null', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    expect(() =>
      verifyReportDataAccuracy({
        source_data,
        report_values: null as any,
      })
    ).toThrow(/レポート値/);
  });

  // Mismatch: appointment_count differs
  test('should return match_flag=false when appointment_count differs', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const report_values = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 12,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const result = verifyReportDataAccuracy({
      source_data,
      report_values,
    });

    expect(result.match_flag).toBe(false);
    expect(result.verification_status).toBe('FAILED');
    expect(result.discrepancy_list).toContainEqual(
      expect.objectContaining({
        field_name: 'appointment_count',
        source_value: 15,
        report_value: 12,
      })
    );
  });

  // Mismatch: contract_count differs
  test('should return match_flag=false when contract_count differs', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const report_values = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 5,
      customer_response_score: 4.5,
    };

    const result = verifyReportDataAccuracy({
      source_data,
      report_values,
    });

    expect(result.match_flag).toBe(false);
    expect(result.verification_status).toBe('FAILED');
    expect(result.discrepancy_list.length).toBeGreaterThan(0);
  });

  // Mismatch: customer_response_score differs
  test('should return match_flag=false when customer_response_score differs', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const report_values = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 3.8,
    };

    const result = verifyReportDataAccuracy({
      source_data,
      report_values,
    });

    expect(result.match_flag).toBe(false);
    expect(result.verification_status).toBe('FAILED');
  });

  // Mismatch: period differs
  test('should return match_flag=false when period_start differs', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const report_values = {
      period_start: '2024-02-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const result = verifyReportDataAccuracy({
      source_data,
      report_values,
    });

    expect(result.match_flag).toBe(false);
  });

  // Mismatch: customer_id differs
  test('should return match_flag=false when customer_id differs', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const report_values = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST002',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const result = verifyReportDataAccuracy({
      source_data,
      report_values,
    });

    expect(result.match_flag).toBe(false);
  });

  // Multiple discrepancies
  test('should record all discrepancies when multiple fields differ', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const report_values = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 10,
      contract_count: 5,
      customer_response_score: 3.2,
    };

    const result = verifyReportDataAccuracy({
      source_data,
      report_values,
    });

    expect(result.match_flag).toBe(false);
    expect(result.discrepancy_list.length).toBe(3);
    expect(result.discrepancy_list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: 'appointment_count',
          source_value: 15,
          report_value: 10,
        }),
        expect.objectContaining({
          field_name: 'contract_count',
          source_value: 3,
          report_value: 5,
        }),
        expect.objectContaining({
          field_name: 'customer_response_score',
          source_value: 4.5,
          report_value: 3.2,
        }),
      ])
    );
  });

  // Error: missing required field in source_data
  test('should throw error when source_data missing required field appointment_count', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      contract_count: 3,
      customer_response_score: 4.5,
    } as any;

    const report_values = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    expect(() =>
      verifyReportDataAccuracy({
        source_data,
        report_values,
      })
    ).toThrow(/appointment_count/);
  });

  // Error: missing required field in report_values
  test('should throw error when report_values missing required field contract_count', () => {
    const source_data = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      contract_count: 3,
      customer_response_score: 4.5,
    };

    const report_values = {
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST001',
      appointment_count: 15,
      customer_response_score: 4.5,
    } as any;

    expect(() =>
      verifyReportDataAccuracy({
        source_data,
        report_values,
      })
    ).toThrow(/contract_count/);
  });
});