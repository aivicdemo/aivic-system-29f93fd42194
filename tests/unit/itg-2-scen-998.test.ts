import { calculateRegionTimeCorrectionFactor } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  // SCEN-998: [normal] 地域・時期補正係数の自動算出
  test("地域・時期補正が必要な項目に対して、補正係数が正常に算出される", () => {
    // ハッピーパス: 東京都・2024年1月の建物評価額補正
    const result_tokyo_jan = calculateRegionTimeCorrectionFactor({
      prefectureCode: "13",
      municipalityCode: "100",
      assessmentDate: "2024-01-15",
      itemType: "building_valuation",
      baseValue: 10000000,
    });

    expect(result_tokyo_jan).toEqual({
      correctionFactor: 1.05,
      correctedValue: 10500000,
      regionAdjustment: 1.02,
      seasonalAdjustment: 1.029,
    });

    // 異なる地域・時期の組み合わせ1: 大阪府・2024年7月の土地評価額補正
    const result_osaka_july = calculateRegionTimeCorrectionFactor({
      prefectureCode: "27",
      municipalityCode: "130",
      assessmentDate: "2024-07-10",
      itemType: "land_valuation",
      baseValue: 5000000,
    });

    expect(result_osaka_july).toEqual({
      correctionFactor: 0.98,
      correctedValue: 4900000,
      regionAdjustment: 0.96,
      seasonalAdjustment: 1.021,
    });

    // 異なる地域・時期の組み合わせ2: 福岡県・2024年10月の施工単価補正
    const result_fukuoka_oct = calculateRegionTimeCorrectionFactor({
      prefectureCode: "40",
      municipalityCode: "130",
      assessmentDate: "2024-10-20",
      itemType: "construction_unit_price",
      baseValue: 8000000,
    });

    expect(result_fukuoka_oct).toEqual({
      correctionFactor: 0.94,
      correctedValue: 7520000,
      regionAdjustment: 0.93,
      seasonalAdjustment: 1.011,
    });

    // ハッピーパス: 標準値との一致確認 - 東京都1月の建物評価額
    expect(result_tokyo_jan.correctionFactor).toBe(1.05);

    // ハッピーパス: 地域調整係数が標準値と一致
    expect(result_tokyo_jan.regionAdjustment).toBe(1.02);

    // ハッピーパス: 季節調整係数が標準値と一致
    expect(result_tokyo_jan.seasonalAdjustment).toBe(1.029);

    // ハッピーパス: 補正後の査定値が正確に計算されている
    expect(result_tokyo_jan.correctedValue).toBe(10500000);

    // ハッピーパス: 大阪府7月の補正係数が標準値と一致
    expect(result_osaka_july.correctionFactor).toBe(0.98);

    // ハッピーパス: 大阪府の地域調整係数が標準値と一致
    expect(result_osaka_july.regionAdjustment).toBe(0.96);

    // ハッピーパス: 大阪府7月の季節調整係数が標準値と一致
    expect(result_osaka_july.seasonalAdjustment).toBe(1.021);

    // ハッピーパス: 大阪府の補正後査定値が正確に計算されている
    expect(result_osaka_july.correctedValue).toBe(4900000);

    // ハッピーパス: 福岡県10月の補正係数が標準値と一致
    expect(result_fukuoka_oct.correctionFactor).toBe(0.94);

    // ハッピーパス: 福岡県の地域調整係数が標準値と一致
    expect(result_fukuoka_oct.regionAdjustment).toBe(0.93);

    // ハッピーパス: 福岡県10月の季節調整係数が標準値と一致
    expect(result_fukuoka_oct.seasonalAdjustment).toBe(1.011);

    // ハッピーパス: 福岡県の補正後査定値が正確に計算されている
    expect(result_fukuoka_oct.correctedValue).toBe(7520000);

    // エラーテスト: 無効な都道府県コードが指定された場合
    expect(() =>
      calculateRegionTimeCorrectionFactor({
        prefectureCode: "99",
        municipalityCode: "100",
        assessmentDate: "2024-01-15",
        itemType: "building_valuation",
        baseValue: 10000000,
      })
    ).toThrow(/都道府県コード/);

    // エラーテスト: 無効な市区町村コードが指定された場合
    expect(() =>
      calculateRegionTimeCorrectionFactor({
        prefectureCode: "13",
        municipalityCode: "999",
        assessmentDate: "2024-01-15",
        itemType: "building_valuation",
        baseValue: 10000000,
      })
    ).toThrow(/市区町村コード/);

    // エラーテスト: 無効な査定日付が指定された場合
    expect(() =>
      calculateRegionTimeCorrectionFactor({
        prefectureCode: "13",
        municipalityCode: "100",
        assessmentDate: "2024-13-45",
        itemType: "building_valuation",
        baseValue: 10000000,
      })
    ).toThrow(/査定日付/);

    // エラーテスト: 無効な査定項目タイプが指定された場合
    expect(() =>
      calculateRegionTimeCorrectionFactor({
        prefectureCode: "13",
        municipalityCode: "100",
        assessmentDate: "2024-01-15",
        itemType: "invalid_type",
        baseValue: 10000000,
      })
    ).toThrow(/査定項目/);

    // エラーテスト: 基準値が負の値の場合
    expect(() =>
      calculateRegionTimeCorrectionFactor({
        prefectureCode: "13",
        municipalityCode: "100",
        assessmentDate: "2024-01-15",
        itemType: "building_valuation",
        baseValue: -1000000,
      })
    ).toThrow(/基準値/);

    // エラーテスト: 基準値がゼロの場合
    expect(() =>
      calculateRegionTimeCorrectionFactor({
        prefectureCode: "13",
        municipalityCode: "100",
        assessmentDate: "2024-01-15",
        itemType: "building_valuation",
        baseValue: 0,
      })
    ).toThrow(/基準値/);
  });
});