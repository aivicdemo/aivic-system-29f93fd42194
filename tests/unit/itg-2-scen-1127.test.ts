import { recordLearningDataUpdateMetadata, retrieveLearningDataUpdateMetadata } from '../../src/logic/it-6-3-1';

describe('学習データ更新メタデータ構造化記録機能', () => {
  // SCEN-1127
  test('モデル更新前のベースライン測定に必要なメタデータを完全かつ正確に構造化記録できる', () => {
    // 前提: メタデータレコード新規作成の入力パラメータを準備
    const metadata_input = {
      model_version: 'v2.1.0',
      learning_dataset_id: 'lds_20240115_001',
      learning_execution_datetime: '2024-01-15T09:30:00Z',
      data_sample_count: 15847,
      feature_count: 42,
      feature_info: [
        { feature_name: '工事種別', feature_type: 'categorical', cardinality: 28 },
        { feature_name: '見積金額', feature_type: 'numeric', min: 100000, max: 50000000 },
        { feature_name: '地域コード', feature_type: 'categorical', cardinality: 47 }
      ],
      hyperparameter_set: {
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 100,
        regularization_l2: 0.0001,
        dropout_rate: 0.2
      },
      baseline_ocr_accuracy: 0.945,
      baseline_judgment_accuracy: 0.912,
      training_data_split_ratio: { train: 0.7, validation: 0.15, test: 0.15 },
      baseline_measurement_date: '2024-01-14T23:59:59Z',
      data_preprocessing_notes: '外れ値除外: 5σ基準、欠損値補完: 中央値代入'
    };

    // アクション: メタデータレコードを新規作成して保存
    const record_id = recordLearningDataUpdateMetadata(metadata_input);

    // 検証1: レコードIDが正常に生成されたことを確認
    expect(typeof record_id).toBe('string');
    expect(record_id.length).toBeGreaterThan(0);

    // アクション: 保存されたメタデータレコードを取得
    const retrieved_metadata = retrieveLearningDataUpdateMetadata(record_id);

    // 検証2: 必須メタデータ項目がすべて記録・保有されていることを確認
    expect(retrieved_metadata).toHaveProperty('model_version');
    expect(retrieved_metadata).toHaveProperty('learning_dataset_id');
    expect(retrieved_metadata).toHaveProperty('learning_execution_datetime');
    expect(retrieved_metadata).toHaveProperty('data_sample_count');
    expect(retrieved_metadata).toHaveProperty('feature_count');
    expect(retrieved_metadata).toHaveProperty('feature_info');
    expect(retrieved_metadata).toHaveProperty('hyperparameter_set');
    expect(retrieved_metadata).toHaveProperty('baseline_ocr_accuracy');
    expect(retrieved_metadata).toHaveProperty('baseline_judgment_accuracy');
    expect(retrieved_metadata).toHaveProperty('training_data_split_ratio');
    expect(retrieved_metadata).toHaveProperty('baseline_measurement_date');
    expect(retrieved_metadata).toHaveProperty('data_preprocessing_notes');

    // 検証3: メタデータ値が正確に記録されていることを確認
    expect(retrieved_metadata.model_version).toBe('v2.1.0');
    expect(retrieved_metadata.learning_dataset_id).toBe('lds_20240115_001');
    expect(retrieved_metadata.learning_execution_datetime).toBe('2024-01-15T09:30:00Z');
    expect(retrieved_metadata.data_sample_count).toBe(15847);
    expect(retrieved_metadata.feature_count).toBe(42);
    
    // 検証4: 特徴量情報の配列構造が正確に記録されていることを確認
    expect(Array.isArray(retrieved_metadata.feature_info)).toBe(true);
    expect(retrieved_metadata.feature_info.length).toBe(3);
    expect(retrieved_metadata.feature_info[0]).toEqual({
      feature_name: '工事種別',
      feature_type: 'categorical',
      cardinality: 28
    });
    expect(retrieved_metadata.feature_info[1]).toEqual({
      feature_name: '見積金額',
      feature_type: 'numeric',
      min: 100000,
      max: 50000000
    });
    expect(retrieved_metadata.feature_info[2]).toEqual({
      feature_name: '地域コード',
      feature_type: 'categorical',
      cardinality: 47
    });

    // 検証5: ハイパーパラメータセットが正確に記録されていることを確認
    expect(retrieved_metadata.hyperparameter_set).toEqual({
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 100,
      regularization_l2: 0.0001,
      dropout_rate: 0.2
    });

    // 検証6: ベースライン精度値が正確に記録されていることを確認
    expect(retrieved_metadata.baseline_ocr_accuracy).toBe(0.945);
    expect(retrieved_metadata.baseline_judgment_accuracy).toBe(0.912);

    // 検証7: 訓練・検証・テスト分割比率が正確に記録されていることを確認
    expect(retrieved_metadata.training_data_split_ratio).toEqual({
      train: 0.7,
      validation: 0.15,
      test: 0.15
    });

    // 検証8: ベースライン測定日時が正確に記録されていることを確認
    expect(retrieved_metadata.baseline_measurement_date).toBe('2024-01-14T23:59:59Z');

    // 検証9: データ前処理ノートが正確に記録されていることを確認
    expect(retrieved_metadata.data_preprocessing_notes).toBe('外れ値除外: 5σ基準、欠損値補完: 中央値代入');

    // 検証10: メタデータ構造化記録フォーマットが定義されていることを確認
    // (すべてのメタデータ項目の型と構造が期待通りであることを確認)
    expect(typeof retrieved_metadata.model_version).toBe('string');
    expect(typeof retrieved_metadata.learning_dataset_id).toBe('string');
    expect(typeof retrieved_metadata.learning_execution_datetime).toBe('string');
    expect(typeof retrieved_metadata.data_sample_count).toBe('number');
    expect(typeof retrieved_metadata.feature_count).toBe('number');
    expect(typeof retrieved_metadata.baseline_ocr_accuracy).toBe('number');
    expect(typeof retrieved_metadata.baseline_judgment_accuracy).toBe('number');
    expect(typeof retrieved_metadata.data_preprocessing_notes).toBe('string');

    // 検証11: 整数値の範囲が妥当であることを確認
    expect(retrieved_metadata.data_sample_count).toBeGreaterThan(0);
    expect(retrieved_metadata.feature_count).toBeGreaterThan(0);

    // 検証12: 精度値が0～1の範囲内であることを確認
    expect(retrieved_metadata.baseline_ocr_accuracy).toBeGreaterThanOrEqual(0);
    expect(retrieved_metadata.baseline_ocr_accuracy).toBeLessThanOrEqual(1);
    expect(retrieved_metadata.baseline_judgment_accuracy).toBeGreaterThanOrEqual(0);
    expect(retrieved_metadata.baseline_judgment_accuracy).toBeLessThanOrEqual(1);

    // 検証13: 分割比率の合計が1.0であることを確認
    const split_sum = retrieved_metadata.training_data_split_ratio.train +
                      retrieved_metadata.training_data_split_ratio.validation +
                      retrieved_metadata.training_data_split_ratio.test;
    expect(split_sum).toBeCloseTo(1.0, 5);

    // 検証14: 複数のメタデータレコードを同時に管理できることを確認
    const metadata_input_2 = {
      model_version: 'v2.2.0',
      learning_dataset_id: 'lds_20240120_002',
      learning_execution_datetime: '2024-01-20T14:15:00Z',
      data_sample_count: 18250,
      feature_count: 45,
      feature_info: [
        { feature_name: '工事種別', feature_type: 'categorical', cardinality: 28 }
      ],
      hyperparameter_set: {
        learning_rate: 0.0015,
        batch_size: 64,
        epochs: 120,
        regularization_l2: 0.00015,
        dropout_rate: 0.25
      },
      baseline_ocr_accuracy: 0.948,
      baseline_judgment_accuracy: 0.918,
      training_data_split_ratio: { train: 0.7, validation: 0.15, test: 0.15 },
      baseline_measurement_date: '2024-01-19T23:59:59Z',
      data_preprocessing_notes: '外れ値除外: 4σ基準、欠損値補完: 平均値代入'
    };

    const record_id_2 = recordLearningDataUpdateMetadata(metadata_input_2);
    expect(record_id_2).not.toBe(record_id);

    const retrieved_metadata_2 = retrieveLearningDataUpdateMetadata(record_id_2);
    expect(retrieved_metadata_2.model_version).toBe('v2.2.0');
    expect(retrieved_metadata_2.data_sample_count).toBe(18250);

    // 検証15: 最初のメタデータレコードが変わらないことを確認
    const re_retrieved_metadata_1 = retrieveLearningDataUpdateMetadata(record_id);
    expect(re_retrieved_metadata_1.model_version).toBe('v2.1.0');
    expect(re_retrieved_metadata_1.data_sample_count).toBe(15847);
  });
});