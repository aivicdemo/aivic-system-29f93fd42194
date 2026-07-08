import { calculateElapsedTimeWithValidation } from '../../src/logic/it-1-br-2-2-2-1';

describe('SLA監視・警告機能 - タイムスタンプ検証とエラーハンドリング', () => {
  test('SCEN-794: 不正なタイムスタンプでエラーハンドリングが実行される', () => {
    // === ハッピーパス: 正常なタイムスタンプで経過時間計算が成功 ===
    const validSubmitTime = new Date('2024-01-15T10:00:00Z');
    const validCurrentTime = new Date('2024-01-15T10:15:30Z');

    const validResult = calculateElapsedTimeWithValidation({
      submitTimestamp: validSubmitTime,
      currentTimestamp: validCurrentTime,
    });

    // 経過時間は930秒（15分30秒）であることを期待
    expect(validResult.elapsedSeconds).toBe(930);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errorMessage).toBeUndefined();

    // === エラーケース1: submitTimestamp が null ===
    const nullSubmitResult = calculateElapsedTimeWithValidation({
      submitTimestamp: null as any,
      currentTimestamp: new Date('2024-01-15T10:15:30Z'),
    });

    expect(nullSubmitResult.isValid).toBe(false);
    expect(nullSubmitResult.elapsedSeconds).toBeNull();
    expect(nullSubmitResult.errorMessage).toMatch(/タイムスタンプ/);

    // === エラーケース2: currentTimestamp が undefined ===
    const undefinedCurrentResult = calculateElapsedTimeWithValidation({
      submitTimestamp: new Date('2024-01-15T10:00:00Z'),
      currentTimestamp: undefined as any,
    });

    expect(undefinedCurrentResult.isValid).toBe(false);
    expect(undefinedCurrentResult.elapsedSeconds).toBeNull();
    expect(undefinedCurrentResult.errorMessage).toMatch(/タイムスタンプ/);

    // === エラーケース3: submitTimestamp が無効な日付 ===
    const invalidDateResult = calculateElapsedTimeWithValidation({
      submitTimestamp: new Date('invalid-date') as any,
      currentTimestamp: new Date('2024-01-15T10:15:30Z'),
    });

    expect(invalidDateResult.isValid).toBe(false);
    expect(invalidDateResult.elapsedSeconds).toBeNull();
    expect(invalidDateResult.errorMessage).toMatch(/タイムスタンプ/);

    // === エラーケース4: currentTimestamp が submitTimestamp より前 ===
    const reverseTimeResult = calculateElapsedTimeWithValidation({
      submitTimestamp: new Date('2024-01-15T10:30:00Z'),
      currentTimestamp: new Date('2024-01-15T10:15:00Z'),
    });

    expect(reverseTimeResult.isValid).toBe(false);
    expect(reverseTimeResult.elapsedSeconds).toBeNull();
    expect(reverseTimeResult.errorMessage).toMatch(/時刻|順序/);

    // === エラーケース5: 両方のタイムスタンプが null ===
    const bothNullResult = calculateElapsedTimeWithValidation({
      submitTimestamp: null as any,
      currentTimestamp: null as any,
    });

    expect(bothNullResult.isValid).toBe(false);
    expect(bothNullResult.elapsedSeconds).toBeNull();
    expect(bothNullResult.errorMessage).toMatch(/タイムスタンプ/);

    // === ハッピーパス: SLA目標時間(30分)内での計算 ===
    const slaCheckSubmitTime = new Date('2024-01-15T09:30:00Z');
    const slaCheckCurrentTime = new Date('2024-01-15T09:45:00Z');

    const slaCheckResult = calculateElapsedTimeWithValidation({
      submitTimestamp: slaCheckSubmitTime,
      currentTimestamp: slaCheckCurrentTime,
    });

    // 経過時間は900秒（15分）
    expect(slaCheckResult.elapsedSeconds).toBe(900);
    expect(slaCheckResult.isValid).toBe(true);
    // SLA目標(30分=1800秒)内かどうかを確認
    expect(slaCheckResult.elapsedSeconds).toBeLessThanOrEqual(1800);

    // === ハッピーパス: SLA目標時間を超過した場合の警告フラグ ===
    const slaExceedSubmitTime = new Date('2024-01-15T09:00:00Z');
    const slaExceedCurrentTime = new Date('2024-01-15T09:45:00Z');

    const slaExceedResult = calculateElapsedTimeWithValidation({
      submitTimestamp: slaExceedSubmitTime,
      currentTimestamp: slaExceedCurrentTime,
    });

    // 経過時間は2700秒（45分）
    expect(slaExceedResult.elapsedSeconds).toBe(2700);
    expect(slaExceedResult.isValid).toBe(true);
    expect(slaExceedResult.slaExceeded).toBe(true);
    expect(slaExceedResult.warningMessage).toMatch(/SLA|超過/);

    // === エラーハンドリング: エラー状態でもシステムが継続動作 ===
    const errorHandlingResult = calculateElapsedTimeWithValidation({
      submitTimestamp: null as any,
      currentTimestamp: new Date('2024-01-15T10:15:30Z'),
    });

    // エラーが発生したが、システムは正常に応答
    expect(errorHandlingResult).toBeDefined();
    expect(errorHandlingResult.isValid).toBe(false);
    // エラー状態でもレスポンスオブジェクトは構造化されている
    expect(errorHandlingResult).toHaveProperty('errorMessage');
    expect(errorHandlingResult).toHaveProperty('isValid');
    expect(errorHandlingResult).toHaveProperty('elapsedSeconds');
  });
});