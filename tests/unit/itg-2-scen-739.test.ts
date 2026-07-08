import { recordModificationHistory } from '../../src/logic/it-6-2-2-1';

describe('修正履歴自動記録・検索機能', () => {
  test('SCEN-739: 修正理由が未入力のとき修正が保存されずエラーメッセージが表示される', () => {
    // 既存の査定データ
    const existingAssessmentData = {
      assessmentId: 'ASS-2024-001',
      itemName: '重機レンタル',
      originalAmount: 500000,
      originalQuantity: 10,
      originalUnitPrice: 50000,
      originalCorrectionFactor: 1.0,
      originalMarketDeviation: 5.2,
    };

    // 修正内容
    const modificationContent = {
      revisedAmount: 480000,
      revisedQuantity: 10,
      revisedUnitPrice: 48000,
      revisedCorrectionFactor: 0.96,
      revisedMarketDeviation: 3.8,
    };

    // 修正理由を空白のまま
    const modificationReason = '';

    // 修正者情報
    const assessorInfo = {
      assessorId: 'ASS-EMP-001',
      assessorName: '査定員A',
      departmentId: 'DEPT-001',
      departmentName: '原価管理部',
    };

    // 修正理由が空の状態でエラーが発生することを確認
    expect(() =>
      recordModificationHistory({
        assessmentId: existingAssessmentData.assessmentId,
        itemName: existingAssessmentData.itemName,
        originalAmount: existingAssessmentData.originalAmount,
        originalQuantity: existingAssessmentData.originalQuantity,
        originalUnitPrice: existingAssessmentData.originalUnitPrice,
        originalCorrectionFactor: existingAssessmentData.originalCorrectionFactor,
        originalMarketDeviation: existingAssessmentData.originalMarketDeviation,
        revisedAmount: modificationContent.revisedAmount,
        revisedQuantity: modificationContent.revisedQuantity,
        revisedUnitPrice: modificationContent.revisedUnitPrice,
        revisedCorrectionFactor: modificationContent.revisedCorrectionFactor,
        revisedMarketDeviation: modificationContent.revisedMarketDeviation,
        modificationReason: modificationReason,
        assessorId: assessorInfo.assessorId,
        assessorName: assessorInfo.assessorName,
        departmentId: assessorInfo.departmentId,
        departmentName: assessorInfo.departmentName,
      })
    ).toThrow(/修正理由/);
  });
});