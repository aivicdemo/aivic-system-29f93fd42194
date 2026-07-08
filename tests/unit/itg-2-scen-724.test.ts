import { detectDuplicateEstimate } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  test('SCEN-724: 既に査定済みの見積書の再提出が検出されスキップされる', () => {
    // 前提条件: 既に査定済みの見積書（見積書ID: EST-2024-001）をデータベースに登録
    const existingEstimate = {
      estimateId: 'EST-2024-001',
      fileName: 'estimate_2024_001.pdf',
      fileHash: 'hash_abc123def456',
      submittedAt: new Date('2024-01-15T10:00:00Z'),
      assessmentStatus: 'completed',
      assessmentCompletedAt: new Date('2024-01-15T10:30:00Z'),
    };

    // データベースに既存レコード登録（テスト用モック）
    const existingRecords = [existingEstimate];

    // 同じ見積書ID（EST-2024-001）の見積書ファイルを再提出
    const resubmittedEstimate = {
      estimateId: 'EST-2024-001',
      fileName: 'estimate_2024_001.pdf',
      fileHash: 'hash_abc123def456',
      submittedAt: new Date('2024-01-15T14:30:00Z'),
    };

    // システムが既査定検出ロジックを実行
    const detectionResult = detectDuplicateEstimate(resubmittedEstimate, existingRecords);

    // 重複検出結果のステータスを確認
    expect(detectionResult.isDuplicate).toBe(true);
    expect(detectionResult.duplicateType).toBe('already_assessed');
    expect(detectionResult.statusCode).toBe('DUPLICATE_DETECTED');

    // エラーメッセージが適切に返されることを確認
    expect(detectionResult.message).toMatch(/既に査定済み/);
    expect(detectionResult.message).toMatch(/EST-2024-001/);

    // 見積書再処理がスキップされたことを確認
    expect(detectionResult.shouldSkipProcessing).toBe(true);

    // データベースレコード数が増加していないことを確認
    // （再提出された見積書は新規レコードとして保存されない）
    expect(detectionResult.newRecordCreated).toBe(false);

    // 既査定の見積書参照情報が返されることを確認
    expect(detectionResult.originalAssessmentId).toBe(existingEstimate.estimateId);
    expect(detectionResult.originalAssessmentCompletedAt).toEqual(
      new Date('2024-01-15T10:30:00Z')
    );
  });

  test('SCEN-724: 重複なし場合は処理が続行される', () => {
    // 既存のデータベースレコード
    const existingRecords = [
      {
        estimateId: 'EST-2024-001',
        fileHash: 'hash_abc123def456',
        assessmentStatus: 'completed',
      },
    ];

    // 異なる見積書ID（EST-2024-002）の新規見積書を提出
    const newEstimate = {
      estimateId: 'EST-2024-002',
      fileName: 'estimate_2024_002.pdf',
      fileHash: 'hash_xyz789ghi012',
      submittedAt: new Date('2024-01-15T14:30:00Z'),
    };

    // 既査定検出ロジックを実行
    const detectionResult = detectDuplicateEstimate(newEstimate, existingRecords);

    // 重複が検出されないことを確認
    expect(detectionResult.isDuplicate).toBe(false);
    expect(detectionResult.statusCode).toBe('NO_DUPLICATE');

    // 処理スキップフラグが false であることを確認
    expect(detectionResult.shouldSkipProcessing).toBe(false);

    // 新規レコード作成フラグが true であることを確認
    expect(detectionResult.newRecordCreated).toBe(true);

    // メッセージが空か処理続行を示していることを確認
    expect(detectionResult.message).toMatch(/処理を続行|新規|重複なし/);
  });

  test('SCEN-724: 同一ハッシュ値で異なる見積書IDの重複も検出される', () => {
    // 既存のデータベースレコード（異なる見積書IDだが同一ハッシュ値）
    const existingRecords = [
      {
        estimateId: 'EST-2024-001',
        fileHash: 'hash_same_content',
        assessmentStatus: 'completed',
      },
    ];

    // 異なる見積書IDだが同一ハッシュ値（重複内容）の見積書を提出
    const resubmittedEstimate = {
      estimateId: 'EST-2024-003',
      fileName: 'estimate_2024_003.pdf',
      fileHash: 'hash_same_content',
      submittedAt: new Date('2024-01-15T15:00:00Z'),
    };

    // 既査定検出ロジックを実行
    const detectionResult = detectDuplicateEstimate(resubmittedEstimate, existingRecords);

    // 同一内容の重複として検出されることを確認
    expect(detectionResult.isDuplicate).toBe(true);
    expect(detectionResult.duplicateType).toBe('same_content');
    expect(detectionResult.statusCode).toBe('DUPLICATE_DETECTED');

    // 処理スキップフラグが true であることを確認
    expect(detectionResult.shouldSkipProcessing).toBe(true);

    // 元の見積書IDが返されることを確認
    expect(detectionResult.originalEstimateId).toBe('EST-2024-001');

    // 警告メッセージが適切に返されることを確認
    expect(detectionResult.message).toMatch(/重複|同一内容/);
  });

  test('SCEN-724: 空のデータベースレコードから新規提出判定', () => {
    // 空のデータベース
    const existingRecords: any[] = [];

    // 最初の見積書を提出
    const firstEstimate = {
      estimateId: 'EST-2024-001',
      fileName: 'estimate_2024_001.pdf',
      fileHash: 'hash_first_estimate',
      submittedAt: new Date('2024-01-15T09:00:00Z'),
    };

    // 既査定検出ロジックを実行
    const detectionResult = detectDuplicateEstimate(firstEstimate, existingRecords);

    // 重複が検出されないことを確認
    expect(detectionResult.isDuplicate).toBe(false);
    expect(detectionResult.statusCode).toBe('NO_DUPLICATE');

    // 新規レコード作成が許可されることを確認
    expect(detectionResult.newRecordCreated).toBe(true);
    expect(detectionResult.shouldSkipProcessing).toBe(false);
  });
});