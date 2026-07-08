import { detectPrecisionDegradeSignal } from '../../src/logic/it-6-2-2-1';

describe('精度低下兆候検知機能（比較対象の前回測定値が存在しない場合のエラーハンドリング）', () => {
  // SCEN-1146
  test('前回測定値が存在しない場合、エラーで検知処理を中止し、適切なエラーメッセージを返却する', () => {
    const currentMeasurementData = {
      measurementDate: new Date('2024-01-15T10:00:00Z'),
      ocrAccuracy: 85.5,
      aiJudgmentAccuracy: 82.3,
      learningModelUpdateFrequency: 2,
      userFeedbackCount: 15,
    };

    const previousMeasurementData = null;

    expect(() => {
      detectPrecisionDegradeSignal(
        currentMeasurementData,
        previousMeasurementData
      );
    }).toThrow(/比較対象/);
  });
});