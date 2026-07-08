import { executeModelRetraining } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1136: 学習データ更新に基づくモデル再学習実行機能 - 再学習実行日時・使用データ件数・学習時間をシステムに正確に記録', async () => {
    // テスト準備: 学習用データセット（最低100件以上）
    const training_dataset_size = 150;
    const training_dataset = Array.from({ length: training_dataset_size }, (_, i) => ({
      case_id: `case_${i + 1}`,
      past_project_data: {
        project_id: `proj_${i + 1}`,
        construction_type: i % 3 === 0 ? '建築' : i % 3 === 1 ? '土木' : '設備',
        region: i % 5 === 0 ? '東京' : i % 5 === 1 ? '大阪' : i % 5 === 2 ? '名古屋' : i % 5 === 3 ? '福岡' : '札幌',
        estimated_amount: 1000000 + i * 10000,
        contract_date: `2023-${(i % 12) + 1}-15`,
      },
      price_index_data: {
        price_book_version: 'v2024.01',
        item_code: `item_${i % 50}`,
        unit_price: 5000 + i * 100,
      },
    }));

    // 再学習実行前の日時をシステムから取得（固定値）
    const retraining_start_datetime = new Date('2024-02-15T10:30:00Z');
    const system_recorded_start_time = retraining_start_datetime.toISOString();

    // 使用するデータ件数を確認（準備したデータセット件数と一致）
    const expected_data_count = training_dataset_size;

    // 再学習実行ボタンをクリック（処理開始）→ 学習処理の経過時間を計測
    const learning_duration_seconds = 45;
    const expected_learning_time_seconds = learning_duration_seconds;

    // 再学習完了後、システムから取得した履歴情報
    const retraining_execution_result = await executeModelRetraining({
      dataset_items: training_dataset,
      execution_timestamp: system_recorded_start_time,
      expected_dataset_count: expected_data_count,
      learning_duration_seconds: expected_learning_time_seconds,
    });

    // 期待結果: 再学習実行日時がシステム実行時刻と一致
    expect(retraining_execution_result.recorded_execution_datetime).toBe('2024-02-15T10:30:00Z');

    // 期待結果: 使用データ件数が準備したデータセット件数と完全に一致
    expect(retraining_execution_result.used_dataset_count).toBe(150);

    // 期待結果: 学習時間が計測値と誤差1秒以内で記録
    expect(Math.abs(retraining_execution_result.recorded_learning_time_seconds - 45)).toBeLessThanOrEqual(1);

    // 期待結果: 再学習実行履歴テーブルへの永続性検証
    expect(retraining_execution_result.history_record_persisted).toBe(true);

    // 期待結果: UIとDB両方の記録が一致
    expect(retraining_execution_result.ui_display_datetime).toBe(retraining_execution_result.database_record_datetime);
    expect(retraining_execution_result.ui_display_dataset_count).toBe(retraining_execution_result.database_record_dataset_count);
    expect(retraining_execution_result.ui_display_learning_time).toBe(retraining_execution_result.database_record_learning_time);

    // 期待結果: 再学習完了後のモデルバージョン更新を確認
    expect(retraining_execution_result.model_version_updated).toBe(true);

    // 期待結果: 記録情報の完全性チェック
    expect(retraining_execution_result.recorded_execution_datetime).toBeDefined();
    expect(retraining_execution_result.used_dataset_count).toBeDefined();
    expect(retraining_execution_result.recorded_learning_time_seconds).toBeDefined();
    expect(typeof retraining_execution_result.recorded_execution_datetime).toBe('string');
    expect(typeof retraining_execution_result.used_dataset_count).toBe('number');
    expect(typeof retraining_execution_result.recorded_learning_time_seconds).toBe('number');
  });
});