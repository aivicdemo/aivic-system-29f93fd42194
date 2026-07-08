import { detectDuplicateEstimate } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  // SCEN-722: [normal] 見積書重複提出・既査定検出 - 初回提出の見積書が新規として処理される
  test('初回提出の見積書は重複検出されず、新規査定として正常に処理・登録されること', () => {
    const estimateId = 'EST-2024-001';
    const estimateFileName = 'quotation_2024_01_15.pdf';
    const estimateFileHash = 'abc123def456ghi789';
    const itemName = '鉄筋コンクリート工事';
    const estimateAmount = 5000000;
    const submissionDate = new Date('2024-01-15T10:30:00Z');
    const submittedByUserId = 'USER-2024-001';
    const submittedByUserName = '査定員太郎';

    // 入力: 初回提出の見積書データ
    const firstSubmissionInput = {
      estimateId,
      estimateFileName,
      estimateFileHash,
      itemName,
      estimateAmount,
      submissionDate,
      submittedByUserId,
      submittedByUserName,
      existingEstimateRecords: [] // 既存の査定記録なし（初回提出）
    };

    // 処理実行: 重複チェック機能を実行
    const result = detectDuplicateEstimate(firstSubmissionInput);

    // 期待結果1: 初回提出は重複として検出されない
    expect(result.isDuplicate).toBe(false);

    // 期待結果2: 重複メッセージは null またはからの状態
    expect(result.duplicateMessage).toBeNull();

    // 期待結果3: 処理ステータスが「新規」として登録
    expect(result.registrationStatus).toBe('new');

    // 期待結果4: 登録ID（新規査定申請）が生成される
    expect(result.newAssessmentApplicationId).toBeDefined();
    expect(typeof result.newAssessmentApplicationId).toBe('string');
    expect(result.newAssessmentApplicationId.length).toBeGreaterThan(0);

    // 期待結果5: 登録日時が現在時刻に基づいて設定される
    expect(result.registrationDate).toBeDefined();
    expect(result.registrationDate instanceof Date).toBe(true);

    // 期待結果6: 登録された見積書の詳細情報が記録される
    expect(result.registeredEstimateDetail).toEqual({
      estimateId,
      estimateFileName,
      estimateFileHash,
      itemName,
      estimateAmount,
      submissionDate,
      submittedByUserId,
      submittedByUserName
    });

    // 期待結果7: 重複提出検出フラグが未設定状態
    expect(result.isDuplicateOrPreviouslyAssessed).toBe(false);

    // 期待結果8: 今後の重複検出が可能な状態（同見積書ハッシュが記録される）
    expect(result.registeredFileHashForFutureDetection).toBe(estimateFileHash);

    // 期待結果9: ステータスが「未査定」である（以後の審査対象となる準備状態）
    expect(result.assessmentReadinessStatus).toBe('pending_assessment');

    // 期待結果10: エラーフラグなし
    expect(result.hasError).toBe(false);
    expect(result.errorDetails).toBeNull();
  });
});