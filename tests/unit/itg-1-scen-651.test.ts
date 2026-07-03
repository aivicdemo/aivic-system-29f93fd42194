import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  detectAnomalousData,
} from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ異常値・漏れデータ自動検出機能', () => {
  // SCEN-651: 異常値範囲外のデータが検出され、補正理由が正確に識別される
  test('異常値自動検出・補正理由自動識別', () => {
    // 異常値範囲定義
    const anomaly_ranges = {
      sales_amount: { min: 0, max: 10000000 }, // 売上金額: 0以上1000万以下
      discount_rate: { min: 0, max: 50 },      // 割引率: 0～50%
      appointment_count: { min: 0, max: 9999 }, // アポ数: 0以上9999以下
      contract_count: { min: 0, max: 9999 },    // 成約数: 0以上9999以下
    };

    // テストデータ: 異常値範囲外のデータを複数含める
    const input_data = [
      {
        record_id: 'REC001',
        sales_amount: -100000,        // 異常: 負数（範囲外）
        discount_rate: 25,             // 正常
        appointment_count: 5,           // 正常
        contract_count: 2,              // 正常
      },
      {
        record_id: 'REC002',
        sales_amount: 5000000,          // 正常
        discount_rate: 150,             // 異常: 150%（範囲外）
        appointment_count: 3,           // 正常
        contract_count: 1,              // 正常
      },
      {
        record_id: 'REC003',
        sales_amount: 12000000,         // 異常: 1000万超（範囲外）
        discount_rate: 50,              // 正常
        appointment_count: 10,          // 正常
        contract_count: 5,              // 正常
      },
      {
        record_id: 'REC004',
        sales_amount: 3000000,          // 正常
        discount_rate: 35,              // 正常
        appointment_count: -5,          // 異常: 負数（範囲外）
        contract_count: 2,              // 正常
      },
      {
        record_id: 'REC005',
        sales_amount: 2500000,          // 正常
        discount_rate: 20,              // 正常
        appointment_count: 8,           // 正常
        contract_count: 15000,          // 異常: 9999超（範囲外）
      },
    ];

    // 異常値自動検出機能を実行
    const detection_result = detectAnomalousData({
      anomaly_ranges,
      input_data,
    });

    // 検出結果の検証
    expect(detection_result).toBeDefined();
    expect(detection_result.total_records).toBe(5);
    expect(detection_result.anomalous_count).toBe(4);  // 異常なレコード数: REC001, REC002, REC003, REC004, REC005 のうち異常持つ件数
    expect(detection_result.normal_count).toBe(1);      // 正常なレコード数: なし（すべてのレコードが何らかの異常を持つ）

    // 異常データの詳細検証
    expect(detection_result.anomalies).toBeDefined();
    expect(detection_result.anomalies.length).toBeGreaterThan(0);

    // REC001 の異常検出確認（売上金額が負数）
    const rec001_anomaly = detection_result.anomalies.find(
      (a: any) => a.record_id === 'REC001'
    );
    expect(rec001_anomaly).toBeDefined();
    expect(rec001_anomaly.field_name).toBe('sales_amount');
    expect(rec001_anomaly.detected_value).toBe(-100000);
    expect(rec001_anomaly.valid_range).toEqual({ min: 0, max: 10000000 });
    expect(rec001_anomaly.correction_reason).toBe('値が負数です。0以上の値を入力してください。');
    expect(rec001_anomaly.correction_suggestion).toBe(0); // 負数を0に補正提案

    // REC002 の異常検出確認（割引率が150%）
    const rec002_anomaly = detection_result.anomalies.find(
      (a: any) => a.record_id === 'REC002'
    );
    expect(rec002_anomaly).toBeDefined();
    expect(rec002_anomaly.field_name).toBe('discount_rate');
    expect(rec002_anomaly.detected_value).toBe(150);
    expect(rec002_anomaly.valid_range).toEqual({ min: 0, max: 50 });
    expect(rec002_anomaly.correction_reason).toBe('割引率が上限50%を超えています。50%以下の値を入力してください。');
    expect(rec002_anomaly.correction_suggestion).toBe(50); // 150%を50%に補正提案

    // REC003 の異常検出確認（売上金額が1000万超）
    const rec003_anomaly = detection_result.anomalies.find(
      (a: any) => a.record_id === 'REC003'
    );
    expect(rec003_anomaly).toBeDefined();
    expect(rec003_anomaly.field_name).toBe('sales_amount');
    expect(rec003_anomaly.detected_value).toBe(12000000);
    expect(rec003_anomaly.valid_range).toEqual({ min: 0, max: 10000000 });
    expect(rec003_anomaly.correction_reason).toBe('売上金額が上限1000万円を超えています。1000万円以下の値を入力してください。');
    expect(rec003_anomaly.correction_suggestion).toBe(10000000);

    // REC004 の異常検出確認（アポ数が負数）
    const rec004_anomaly = detection_result.anomalies.find(
      (a: any) => a.record_id === 'REC004'
    );
    expect(rec004_anomaly).toBeDefined();
    expect(rec004_anomaly.field_name).toBe('appointment_count');
    expect(rec004_anomaly.detected_value).toBe(-5);
    expect(rec004_anomaly.valid_range).toEqual({ min: 0, max: 9999 });
    expect(rec004_anomaly.correction_reason).toBe('値が負数です。0以上の値を入力してください。');
    expect(rec004_anomaly.correction_suggestion).toBe(0);

    // REC005 の異常検出確認（成約数が9999超）
    const rec005_anomaly = detection_result.anomalies.find(
      (a: any) => a.record_id === 'REC005'
    );
    expect(rec005_anomaly).toBeDefined();
    expect(rec005_anomaly.field_name).toBe('contract_count');
    expect(rec005_anomaly.detected_value).toBe(15000);
    expect(rec005_anomaly.valid_range).toEqual({ min: 0, max: 9999 });
    expect(rec005_anomaly.correction_reason).toBe('成約数が上限9999件を超えています。9999件以下の値を入力してください。');
    expect(rec005_anomaly.correction_suggestion).toBe(9999);

    // 補正理由の分類が正確かを確認
    expect(detection_result.anomalies.every(
      (a: any) => typeof a.correction_reason === 'string' && a.correction_reason.length > 0
    )).toBe(true);

    // 補正提案が有効な値であることを確認
    expect(detection_result.anomalies.every(
      (a: any) =>
        typeof a.correction_suggestion === 'number' &&
        a.correction_suggestion >= a.valid_range.min &&
        a.correction_suggestion <= a.valid_range.max
    )).toBe(true);

    // 検出結果ログ情報の確認
    expect(detection_result.detection_timestamp).toBeDefined();
    expect(typeof detection_result.detection_timestamp).toBe('string');
    expect(detection_result.detection_status).toBe('completed');
  });
});