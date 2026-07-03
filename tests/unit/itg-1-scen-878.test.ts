import { detectAnomalousValues } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-878
  test('[normal] 営業データ異常値自動検出機能 - 営業データの値が許容範囲外の場合に「警告」ステータスと詳細情報が返される', () => {
    const input_sales_amount = -50000;
    const input_discount_rate = 150;
    const input_appointment_count = 0;
    const input_contract_count = -5;

    const permitted_sales_min = 0;
    const permitted_sales_max = 10000000;
    const permitted_discount_min = 0;
    const permitted_discount_max = 100;
    const permitted_appointment_min = 0;
    const permitted_appointment_max = 1000;
    const permitted_contract_min = 0;
    const permitted_contract_max = 500;

    const test_data = {
      sales_amount: input_sales_amount,
      discount_rate: input_discount_rate,
      appointment_count: input_appointment_count,
      contract_count: input_contract_count,
      customer_id: 'CUST001',
      service_type: 'SERVICE_A',
      record_date: '2024-01-15'
    };

    const validation_rules = {
      sales_amount: {
        min: permitted_sales_min,
        max: permitted_sales_max,
        type: 'number'
      },
      discount_rate: {
        min: permitted_discount_min,
        max: permitted_discount_max,
        type: 'number'
      },
      appointment_count: {
        min: permitted_appointment_min,
        max: permitted_appointment_max,
        type: 'number'
      },
      contract_count: {
        min: permitted_contract_min,
        max: permitted_contract_max,
        type: 'number'
      }
    };

    const result = detectAnomalousValues(test_data, validation_rules);

    expect(result.status).toBe('警告');
    expect(result.details).toBeDefined();
    expect(Array.isArray(result.details)).toBe(true);
    expect(result.details.length).toBeGreaterThan(0);

    const sales_anomaly = result.details.find(
      (item: any) => item.field_name === 'sales_amount'
    );
    expect(sales_anomaly).toBeDefined();
    expect(sales_anomaly.detected_value).toBe(input_sales_amount);
    expect(sales_anomaly.permitted_min).toBe(permitted_sales_min);
    expect(sales_anomaly.permitted_max).toBe(permitted_sales_max);
    expect(sales_anomaly.anomaly_type).toBe('範囲外');

    const discount_anomaly = result.details.find(
      (item: any) => item.field_name === 'discount_rate'
    );
    expect(discount_anomaly).toBeDefined();
    expect(discount_anomaly.detected_value).toBe(input_discount_rate);
    expect(discount_anomaly.permitted_min).toBe(permitted_discount_min);
    expect(discount_anomaly.permitted_max).toBe(permitted_discount_max);
    expect(discount_anomaly.anomaly_type).toBe('範囲外');

    const contract_anomaly = result.details.find(
      (item: any) => item.field_name === 'contract_count'
    );
    expect(contract_anomaly).toBeDefined();
    expect(contract_anomaly.detected_value).toBe(input_contract_count);
    expect(contract_anomaly.permitted_min).toBe(permitted_contract_min);
    expect(contract_anomaly.permitted_max).toBe(permitted_contract_max);
    expect(contract_anomaly.anomaly_type).toBe('範囲外');

    const appointment_anomaly = result.details.find(
      (item: any) => item.field_name === 'appointment_count'
    );
    expect(appointment_anomaly).toBeUndefined();
  });
});