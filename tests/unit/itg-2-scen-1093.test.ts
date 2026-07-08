import { executeModelRetraining } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-1093: [error] 学習データ更新・モデル再学習実行機能 - 学習データセットが空の場合、再学習処理が中止されエラーが返される
  test('学習データセットが空の場合、再学習処理が中止され適切なエラーが返される', () => {
    const empty_learning_dataset = {
      past_project_data: [],
      price_master_data: [],
      metadata: {
        total_records: 0,
        update_timestamp: '2024-01-15T11:00:00Z',
        data_version: '1.0',
      },
    };

    expect(() =>
      executeModelRetraining({
        learning_dataset: empty_learning_dataset,
        model_id: 'model_v2_001',
        retraining_config: {
          train_test_split_ratio: 0.8,
          validation_set_ratio: 0.1,
          max_epochs: 100,
          batch_size: 32,
        },
      })
    ).toThrow(/学習データセット/);
  });
});