import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateToleranceParameter } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  let systemLogEntries: Array<{ timestamp: string; level: string; message: string; error?: unknown }> = [];

  beforeEach(() => {
    systemLogEntries = [];
    // システムログ収集用の mock を設定
    global.console.error = jest.fn((message: string, error?: unknown) => {
      systemLogEntries.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        error,
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    systemLogEntries = [];
  });

  // SCEN-1203: [error] レポート数値正確性判定機能 - 許容誤差パラメータが不正な値の場合、エラーが発生する
  test('許容誤差パラメータが不正な値の場合、入力値検証エラーが発生し、エラーメッセージが表示され、システムログに記録される', () => {
    // ハッピーパス: 正常な許容誤差パラメータ（0以上の数値）
    const validToleranceResult = validateToleranceParameter({ tolerance: 0.05 });
    expect(validToleranceResult).toEqual({
      isValid: true,
      message: '',
    });

    const validToleranceZeroResult = validateToleranceParameter({ tolerance: 0 });
    expect(validToleranceZeroResult).toEqual({
      isValid: true,
      message: '',
    });

    // エラーケース: 負の数値
    systemLogEntries = [];
    expect(() => validateToleranceParameter({ tolerance: -0.05 })).toThrow(/許容誤差/);
    expect(systemLogEntries.length).toBeGreaterThan(0);
    expect(systemLogEntries[0].level).toBe('ERROR');
    expect(systemLogEntries[0].message).toMatch(/許容誤差/);

    // エラーケース: 文字列
    systemLogEntries = [];
    expect(() => validateToleranceParameter({ tolerance: '0.05' as any })).toThrow(/許容誤差/);
    expect(systemLogEntries.length).toBeGreaterThan(0);
    expect(systemLogEntries[0].level).toBe('ERROR');

    // エラーケース: null
    systemLogEntries = [];
    expect(() => validateToleranceParameter({ tolerance: null as any })).toThrow(/許容誤差/);
    expect(systemLogEntries.length).toBeGreaterThan(0);
    expect(systemLogEntries[0].level).toBe('ERROR');

    // エラーケース: undefined
    systemLogEntries = [];
    expect(() => validateToleranceParameter({ tolerance: undefined as any })).toThrow(/許容誤差/);
    expect(systemLogEntries.length).toBeGreaterThan(0);
    expect(systemLogEntries[0].level).toBe('ERROR');

    // エラーケース: NaN
    systemLogEntries = [];
    expect(() => validateToleranceParameter({ tolerance: NaN })).toThrow(/許容誤差/);
    expect(systemLogEntries.length).toBeGreaterThan(0);
    expect(systemLogEntries[0].level).toBe('ERROR');

    // エラーケース: オブジェクト
    systemLogEntries = [];
    expect(() => validateToleranceParameter({ tolerance: {} as any })).toThrow(/許容誤差/);
    expect(systemLogEntries.length).toBeGreaterThan(0);
    expect(systemLogEntries[0].level).toBe('ERROR');

    // エラー発生時、正常な数値比較は実行されないことを確認
    systemLogEntries = [];
    expect(() => {
      validateToleranceParameter({ tolerance: -1 });
    }).toThrow(/許容誤差/);
    // 処理は中断され、正常な比較処理へ進まないことを確認
    expect(systemLogEntries.length).toBeGreaterThan(0);
  });
});