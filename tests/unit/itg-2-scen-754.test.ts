import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateAndDistributeExplanationMaterial } from '../../src/logic/it-6-3-1';

const fetchMock = require('jest-fetch-mock');

describe('IT-6-3-1: 査定結果説明資料の自動生成・配信機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  // SCEN-754
  test('査定判定確定から24時間以内に説明資料が自動生成・配信される', async () => {
    // ===== 前提条件の構築 =====
    const assessmentCaseId = 'AC-20240115-001';
    const assessmentEmployeeId = 'EMP-ASST-00001';
    const contractorId = 'CONT-GC-00042';
    const contractorEmail = 'contact@contractor.example.com';
    const assessmentCaseTitle = '大型商業施設新築工事';
    
    // 査정判定확정 시점 (현재 시각 기준으로 18시간 전)
    const assessmentConfirmedAt = new Date('2024-01-15T06:00:00Z');
    const currentExecutionTime = new Date('2024-01-16T00:30:00Z'); // 18時間30分後
    
    // 査定案件の詳細情報
    const estimatedAmount = 125000000;
    const marketRangeMin = 110000000;
    const marketRangeMax = 135000000;
    const deviationRate = 8.3; // %
    const deviationAmount = 10000000; // 円
    const referencePastCaseCount = 47;
    const correctionCoefficientApplied = 1.05;
    const correctionReason = '地域補正係数（関東地方）および季節補正係数（冬季）を適用';
    
    // 説明資料生成の入力パラメータ
    const inputParams = {
      assessmentCaseId: assessmentCaseId,
      assessmentEmployeeId: assessmentEmployeeId,
      contractorId: contractorId,
      assessmentConfirmedAt: assessmentConfirmedAt.toISOString(),
      estimatedAmount: estimatedAmount,
      marketRangeMin: marketRangeMin,
      marketRangeMax: marketRangeMax,
      deviationRate: deviationRate,
      deviationAmount: deviationAmount,
      referencePastCaseCount: referencePastCaseCount,
      correctionCoefficientApplied: correctionCoefficientApplied,
      correctionReason: correctionReason,
      assessmentCaseTitle: assessmentCaseTitle,
      contractorEmail: contractorEmail,
      currentTime: currentExecutionTime.toISOString(),
    };

    // ===== モック設定 =====
    // 1. 説明資料生成API のモック
    const generatedMaterialId = 'MAT-20240116-00001';
    const generatedMaterialUrl = 'https://system.example.com/materials/MAT-20240116-00001.pdf';
    const generatedMaterialFormat = 'application/pdf';
    const generatedMaterialSize = 2457600; // 2.4MB
    
    fetchMock.mockResponseOnce(
      JSON.stringify({
        materialId: generatedMaterialId,
        materialUrl: generatedMaterialUrl,
        format: generatedMaterialFormat,
        fileSize: generatedMaterialSize,
        generatedAt: currentExecutionTime.toISOString(),
        status: 'generated',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    // 2. 配信ログ記録API のモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        deliveryLogId: 'DL-20240116-00001',
        materialId: generatedMaterialId,
        recipientEmail: contractorEmail,
        deliveredAt: currentExecutionTime.toISOString(),
        status: 'delivered',
        statusCode: 200,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    // 3. データベース記録API のモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        recordId: 'REC-20240116-00001',
        assessmentCaseId: assessmentCaseId,
        materialId: generatedMaterialId,
        deliveryLogId: 'DL-20240116-00001',
        completionStatus: 'completed',
        recordedAt: currentExecutionTime.toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    // ===== 実行 =====
    const result = await generateAndDistributeExplanationMaterial(inputParams);

    // ===== 検証 =====
    
    // 1. 生成完了ステータスの確認
    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.completionStatus).toBe('completed');

    // 2. 生成された説明資料の情報確認
    expect(result.materialId).toBe(generatedMaterialId);
    expect(result.materialUrl).toBe(generatedMaterialUrl);
    expect(result.format).toBe(generatedMaterialFormat);
    expect(result.fileSize).toBe(generatedMaterialSize);
    expect(new Date(result.generatedAt).getTime()).toBe(currentExecutionTime.getTime());

    // 3. 査定判定確定からの経過時間検証（24時間以内であることを確認）
    const elapsedMillis = new Date(result.generatedAt).getTime() - new Date(assessmentConfirmedAt).getTime();
    const elapsedHours = elapsedMillis / (1000 * 60 * 60);
    expect(elapsedHours).toBeLessThan(24);
    expect(elapsedHours).toBeGreaterThanOrEqual(18);
    expect(elapsedHours).toBeLessThanOrEqual(19);

    // 4. 説明資料に記載される査定結果詳細情報の検証
    expect(result.materialContent).toBeDefined();
    expect(result.materialContent.assessmentCaseTitle).toBe(assessmentCaseTitle);
    expect(result.materialContent.estimatedAmount).toBe(estimatedAmount);
    expect(result.materialContent.marketRangeMin).toBe(marketRangeMin);
    expect(result.materialContent.marketRangeMax).toBe(marketRangeMax);
    expect(result.materialContent.deviationRate).toBe(deviationRate);
    expect(result.materialContent.deviationAmount).toBe(deviationAmount);
    expect(result.materialContent.referencePastCaseCount).toBe(referencePastCaseCount);
    expect(result.materialContent.correctionCoefficientApplied).toBe(correctionCoefficientApplied);
    expect(result.materialContent.correctionReason).toBe(correctionReason);

    // 5. 説明資料の形式確認（PDF形式であること）
    expect(result.format).toMatch(/pdf/i);
    expect([
      'application/pdf',
      'application/x-pdf',
    ]).toContain(result.format);

    // 6. ファイルサイズの妥当性検証（最小500KB、最大10MB）
    expect(result.fileSize).toBeGreaterThanOrEqual(512000);
    expect(result.fileSize).toBeLessThanOrEqual(10485760);

    // 7. 配信ログの記録確認
    expect(result.deliveryLog).toBeDefined();
    expect(result.deliveryLog.deliveryLogId).toBe('DL-20240116-00001');
    expect(result.deliveryLog.materialId).toBe(generatedMaterialId);
    expect(result.deliveryLog.recipientEmail).toBe(contractorEmail);
    expect(result.deliveryLog.status).toBe('delivered');
    expect(new Date(result.deliveryLog.deliveredAt).getTime()).toBe(currentExecutionTime.getTime());

    // 8. 配信先メールアドレスの確認
    expect(result.deliveryLog.recipientEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(result.deliveryLog.recipientEmail).toBe(contractorEmail);

    // 9. データベース記録の確認
    expect(result.databaseRecord).toBeDefined();
    expect(result.databaseRecord.recordId).toBe('REC-20240116-00001');
    expect(result.databaseRecord.assessmentCaseId).toBe(assessmentCaseId);
    expect(result.databaseRecord.materialId).toBe(generatedMaterialId);
    expect(result.databaseRecord.deliveryLogId).toBe('DL-20240116-00001');
    expect(result.databaseRecord.completionStatus).toBe('completed');

    // 10. 記録タイムスタンプの確認
    expect(new Date(result.databaseRecord.recordedAt).getTime()).toBe(currentExecutionTime.getTime());

    // 11. 記録の整合性確認（すべてのレコードが同一時刻で記録されていること）
    const generatedAtTime = new Date(result.generatedAt).getTime();
    const deliveredAtTime = new Date(result.deliveryLog.deliveredAt).getTime();
    const recordedAtTime = new Date(result.databaseRecord.recordedAt).getTime();
    expect(deliveredAtTime).toBe(generatedAtTime);
    expect(recordedAtTime).toBe(generatedAtTime);

    // 12. 各フェーズの処理実行確認（HTTP呼び出し）
    expect(fetchMock).toHaveBeenCalledTimes(3);
    
    // 第1呼び出し：説明資料生成API
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/generate-explanation-material'),
      expect.objectContaining({
        method: 'POST',
      })
    );

    // 第2呼び出し：配信ログ記録API
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/delivery-log'),
      expect.objectContaining({
        method: 'POST',
      })
    );

    // 第3呼び出し：データベース記録API
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/database-record'),
      expect.objectContaining({
        method: 'POST',
      })
    );

    // 13. 説明資料内容の構造化データ確認
    expect(result.materialContent).toHaveProperty('assessmentCaseTitle');
    expect(result.materialContent).toHaveProperty('estimatedAmount');
    expect(result.materialContent).toHaveProperty('marketRangeMin');
    expect(result.materialContent).toHaveProperty('marketRangeMax');
    expect(result.materialContent).toHaveProperty('deviationRate');
    expect(result.materialContent).toHaveProperty('deviationAmount');
    expect(result.materialContent).toHaveProperty('referencePastCaseCount');
    expect(result.materialContent).toHaveProperty('correctionCoefficientApplied');
    expect(result.materialContent).toHaveProperty('correctionReason');

    // 14. 乖離率の精度確認（小数点第1位まで）
    const expectedDeviationRate = Math.round((deviationAmount / marketRangeMin) * 1000) / 10;
    expect(result.materialContent.deviationRate).toBeCloseTo(expectedDeviationRate, 1);

    // 15. 補正係数の有効性確認（1.0以上2.0以下の範囲内）
    expect(result.materialContent.correctionCoefficientApplied).toBeGreaterThanOrEqual(1.0);
    expect(result.materialContent.correctionCoefficientApplied).toBeLessThanOrEqual(2.0);

    // 16. 過去案件参照件数の妥当性確認（10件以上100件以下）
    expect(result.materialContent.referencePastCaseCount).toBeGreaterThanOrEqual(10);
    expect(result.materialContent.referencePastCaseCount).toBeLessThanOrEqual(100);

    // 17. 市場相場範囲の妥当性確認（最小値 < 予定金額 < 最大値）
    expect(result.materialContent.marketRangeMin).toBeLessThan(result.materialContent.estimatedAmount);
    expect(result.materialContent.estimatedAmount).toBeLessThan(result.materialContent.marketRangeMax);

    // 18. 金額の単位確認（1万円以上）
    expect(result.materialContent.estimatedAmount).toBeGreaterThanOrEqual(10000000);
    expect(result.materialContent.marketRangeMin).toBeGreaterThanOrEqual(10000000);
    expect(result.materialContent.marketRangeMax).toBeGreaterThanOrEqual(10000000);

    // 19. 配信ステータスコードの確認（200 = 成功）
    expect(result.deliveryLog.statusCode).toBe(200);
  });
});