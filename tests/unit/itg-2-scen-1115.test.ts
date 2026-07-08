import { detectAnomalousValues } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1115
  test('異常値検出・自動診断機能 - 統計データ不足時のエラーハンドリング', () => {
    // 前提: 異常値判定に必要な最小サンプル数は30件と定義
    const minimum_sample_size = 30;
    
    // 統計データが極端に不足している状態（サンプル数が最小値未満）
    const insufficient_data = {
      assessor_id: 'A001',
      sample_count: 15, // 最小値30件未満
      deviation_rate_values: [
        2.5, 3.1, 2.8, 3.0, 2.9, 3.2, 2.7, 3.1, 2.9, 3.0,
        2.8, 3.1, 2.9, 3.0, 2.9
      ],
      assessment_duration_seconds: [
        1200, 1350, 1400, 1380, 1410,
        1390, 1360, 1420, 1380, 1400,
        1350, 1380, 1410, 1390, 1360
      ],
      correction_rate: 0.15,
      time_period: 'monthly'
    };

    // ハッピーパス: サンプル数が十分な場合の正常系（参考用）
    const sufficient_data = {
      assessor_id: 'A002',
      sample_count: 35, // 最小値以上
      deviation_rate_values: Array(35).fill(0).map(() => 2.5 + Math.random() * 0.8),
      assessment_duration_seconds: Array(35).fill(1380),
      correction_rate: 0.12,
      time_period: 'monthly'
    };

    // エラー期待: 統計データ不足
    expect(() => detectAnomalousValues(insufficient_data)).toThrow(/統計データ不足/);

    // ハッピーパス検証: サンプル数が十分な場合は成功
    const result = detectAnomalousValues(sufficient_data);
    
    // 戻り値の構造確認
    expect(result).toHaveProperty('is_anomaly_detected');
    expect(result).toHaveProperty('error_message');
    expect(result).toHaveProperty('error_details');
    expect(result).toHaveProperty('guidance');
    expect(result).toHaveProperty('error_log_entry');

    // 正常系: 統計データが十分な場合、is_anomaly_detected は boolean
    expect(typeof result.is_anomaly_detected).toBe('boolean');
    
    // 正常系: エラーメッセージは空文字列または null
    expect(result.error_message).toBe(null);
    
    // 正常系: エラー詳細情報は null
    expect(result.error_details).toBe(null);
    
    // 正常系: ガイダンス情報は正常状態を示す文字列
    expect(typeof result.guidance).toBe('string');
    expect(result.guidance.length).toBeGreaterThan(0);

    // 境界値テスト: サンプル数がちょうど最小値
    const boundary_data = {
      assessor_id: 'A003',
      sample_count: 30, // 最小値と等しい
      deviation_rate_values: Array(30).fill(2.8),
      assessment_duration_seconds: Array(30).fill(1380),
      correction_rate: 0.13,
      time_period: 'monthly'
    };

    const boundary_result = detectAnomalousValues(boundary_data);
    expect(boundary_result.error_message).toBe(null);
    expect(typeof boundary_result.is_anomaly_detected).toBe('boolean');

    // エラーハンドリング検証: 統計データ不足時の詳細エラー情報
    try {
      detectAnomalousValues(insufficient_data);
      fail('エラーが発生するべき');
    } catch (error: any) {
      expect(error.message).toMatch(/統計データ不足/);
      // エラーオブジェクトに詳細情報を含むかどうか確認
      if (error.details) {
        expect(error.details).toHaveProperty('required_sample_count');
        expect(error.details).toHaveProperty('actual_sample_count');
        expect(error.details.required_sample_count).toBe(30);
        expect(error.details.actual_sample_count).toBe(15);
      }
    }

    // ユーザーガイダンス確認（正常系）
    expect(result.guidance).toContain('査定員の判定精度分析');
  });
});