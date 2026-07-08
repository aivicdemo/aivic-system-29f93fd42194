import { recordNegotiationResult } from '../../src/logic/it-6-2-2-2';

describe('交渉結果記録・統計蓄積機能 - バリデーション', () => {
  test('SCEN-1053: 必須項目（合意金額・乖離理由）が未入力の場合にバリデーションエラーを返す', () => {
    const assessmentId = 'ASSESS-20240115-001';
    const negotiationDateTime = new Date('2024-01-15T14:30:00Z');
    const agreedAmount = null;
    const discrepancyReason = null;
    const discrepancyRate = 5.2;
    const adjustedQuantity = 100;
    const adjustedUnitPrice = 5000;
    const recordedByUserId = 'USER-ASSESSOR-001';
    const recordedDateTime = new Date('2024-01-15T14:35:00Z');

    const input = {
      assessmentId,
      negotiationDateTime,
      agreedAmount,
      discrepancyReason,
      discrepancyRate,
      adjustedQuantity,
      adjustedUnitPrice,
      recordedByUserId,
      recordedDateTime,
    };

    expect(() => recordNegotiationResult(input)).toThrow(/合意金額/);
  });

  test('SCEN-1053: 乖離理由が未入力の場合にバリデーションエラーを返す', () => {
    const assessmentId = 'ASSESS-20240115-001';
    const negotiationDateTime = new Date('2024-01-15T14:30:00Z');
    const agreedAmount = 525000;
    const discrepancyReason = null;
    const discrepancyRate = 5.2;
    const adjustedQuantity = 100;
    const adjustedUnitPrice = 5000;
    const recordedByUserId = 'USER-ASSESSOR-001';
    const recordedDateTime = new Date('2024-01-15T14:35:00Z');

    const input = {
      assessmentId,
      negotiationDateTime,
      agreedAmount,
      discrepancyReason,
      discrepancyRate,
      adjustedQuantity,
      adjustedUnitPrice,
      recordedByUserId,
      recordedDateTime,
    };

    expect(() => recordNegotiationResult(input)).toThrow(/乖離理由/);
  });

  test('SCEN-1053: 合意金額と乖離理由の両方が未入力の場合にバリデーションエラーを返す', () => {
    const assessmentId = 'ASSESS-20240115-001';
    const negotiationDateTime = new Date('2024-01-15T14:30:00Z');
    const agreedAmount = null;
    const discrepancyReason = null;
    const discrepancyRate = 5.2;
    const adjustedQuantity = 100;
    const adjustedUnitPrice = 5000;
    const recordedByUserId = 'USER-ASSESSOR-001';
    const recordedDateTime = new Date('2024-01-15T14:35:00Z');

    const input = {
      assessmentId,
      negotiationDateTime,
      agreedAmount,
      discrepancyReason,
      discrepancyRate,
      adjustedQuantity,
      adjustedUnitPrice,
      recordedByUserId,
      recordedDateTime,
    };

    expect(() => recordNegotiationResult(input)).toThrow(/合意金額|乖離理由/);
  });

  test('SCEN-1053: 合意金額と乖離理由が正常に入力された場合に記録処理が成功する', () => {
    const assessmentId = 'ASSESS-20240115-001';
    const negotiationDateTime = new Date('2024-01-15T14:30:00Z');
    const agreedAmount = 525000;
    const discrepancyReason = '地域の施工実績が豊富であり、市場価格より低減可能と判断';
    const discrepancyRate = 5.2;
    const adjustedQuantity = 100;
    const adjustedUnitPrice = 5250;
    const recordedByUserId = 'USER-ASSESSOR-001';
    const recordedDateTime = new Date('2024-01-15T14:35:00Z');

    const input = {
      assessmentId,
      negotiationDateTime,
      agreedAmount,
      discrepancyReason,
      discrepancyRate,
      adjustedQuantity,
      adjustedUnitPrice,
      recordedByUserId,
      recordedDateTime,
    };

    const result = recordNegotiationResult(input);

    expect(result).toHaveProperty('negotiationResultId');
    expect(result.negotiationResultId).toMatch(/^NEGO-/);
    expect(result.assessmentId).toBe(assessmentId);
    expect(result.agreedAmount).toBe(525000);
    expect(result.discrepancyReason).toBe('地域の施工実績が豊富であり、市場価格より低減可能と判断');
    expect(result.recordedDateTime).toEqual(recordedDateTime);
    expect(result.status).toBe('recorded');
  });

  test('SCEN-1053: 合意金額が0以下の場合にバリデーションエラーを返す', () => {
    const assessmentId = 'ASSESS-20240115-001';
    const negotiationDateTime = new Date('2024-01-15T14:30:00Z');
    const agreedAmount = 0;
    const discrepancyReason = '地域の施工実績が豊富であり、市場価格より低減可能と判断';
    const discrepancyRate = 5.2;
    const adjustedQuantity = 100;
    const adjustedUnitPrice = 5250;
    const recordedByUserId = 'USER-ASSESSOR-001';
    const recordedDateTime = new Date('2024-01-15T14:35:00Z');

    const input = {
      assessmentId,
      negotiationDateTime,
      agreedAmount,
      discrepancyReason,
      discrepancyRate,
      adjustedQuantity,
      adjustedUnitPrice,
      recordedByUserId,
      recordedDateTime,
    };

    expect(() => recordNegotiationResult(input)).toThrow(/合意金額/);
  });

  test('SCEN-1053: 乖離理由が空文字列の場合にバリデーションエラーを返す', () => {
    const assessmentId = 'ASSESS-20240115-001';
    const negotiationDateTime = new Date('2024-01-15T14:30:00Z');
    const agreedAmount = 525000;
    const discrepancyReason = '';
    const discrepancyRate = 5.2;
    const adjustedQuantity = 100;
    const adjustedUnitPrice = 5250;
    const recordedByUserId = 'USER-ASSESSOR-001';
    const recordedDateTime = new Date('2024-01-15T14:35:00Z');

    const input = {
      assessmentId,
      negotiationDateTime,
      agreedAmount,
      discrepancyReason,
      discrepancyRate,
      adjustedQuantity,
      adjustedUnitPrice,
      recordedByUserId,
      recordedDateTime,
    };

    expect(() => recordNegotiationResult(input)).toThrow(/乖離理由/);
  });

  test('SCEN-1053: assessmentIdが未入力の場合にバリデーションエラーを返す', () => {
    const assessmentId = null;
    const negotiationDateTime = new Date('2024-01-15T14:30:00Z');
    const agreedAmount = 525000;
    const discrepancyReason = '地域の施工実績が豊富であり、市場価格より低減可能と判断';
    const discrepancyRate = 5.2;
    const adjustedQuantity = 100;
    const adjustedUnitPrice = 5250;
    const recordedByUserId = 'USER-ASSESSOR-001';
    const recordedDateTime = new Date('2024-01-15T14:35:00Z');

    const input = {
      assessmentId,
      negotiationDateTime,
      agreedAmount,
      discrepancyReason,
      discrepancyRate,
      adjustedQuantity,
      adjustedUnitPrice,
      recordedByUserId,
      recordedDateTime,
    };

    expect(() => recordNegotiationResult(input)).toThrow(/査定ID/);
  });

  test('SCEN-1053: recordedByUserIdが未入力の場合にバリデーションエラーを返す', () => {
    const assessmentId = 'ASSESS-20240115-001';
    const negotiationDateTime = new Date('2024-01-15T14:30:00Z');
    const agreedAmount = 525000;
    const discrepancyReason = '地域の施工実績が豊富であり、市場価格より低減可能と判断';
    const discrepancyRate = 5.2;
    const adjustedQuantity = 100;
    const adjustedUnitPrice = 5250;
    const recordedByUserId = null;
    const recordedDateTime = new Date('2024-01-15T14:35:00Z');

    const input = {
      assessmentId,
      negotiationDateTime,
      agreedAmount,
      discrepancyReason,
      discrepancyRate,
      adjustedQuantity,
      adjustedUnitPrice,
      recordedByUserId,
      recordedDateTime,
    };

    expect(() => recordNegotiationResult(input)).toThrow(/ユーザーID/);
  });
});