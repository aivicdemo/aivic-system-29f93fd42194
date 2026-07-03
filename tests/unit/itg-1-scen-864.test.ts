import { generateContractChangeValidationReports } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-864: 複数の契約変更が同時に進行する場合に各レポートが正確に区分・生成される', () => {
    // 準備: テストデータとして異なる契約ID、変更種別を持つ3件の契約変更リクエストを生成
    const contractChangeRequests = [
      {
        contractId: 'A001',
        changeType: 'プラン変更',
        changeDetail: 'スタンダードプランからプレミアムプランへ変更',
        changedAt: new Date('2024-06-15T09:30:00Z'),
        previousValue: 'スタンダードプラン',
        newValue: 'プレミアムプラン',
        appliedDate: new Date('2024-07-01T00:00:00Z'),
      },
      {
        contractId: 'A002',
        changeType: '数量変更',
        changeDetail: 'ユーザー数を50から80へ変更',
        changedAt: new Date('2024-06-15T10:15:00Z'),
        previousValue: '50',
        newValue: '80',
        appliedDate: new Date('2024-07-01T00:00:00Z'),
      },
      {
        contractId: 'A003',
        changeType: '価格改定',
        changeDetail: '年間契約料金を1000万円から1200万円へ改定',
        changedAt: new Date('2024-06-15T11:45:00Z'),
        previousValue: '10000000',
        newValue: '12000000',
        appliedDate: new Date('2024-07-01T00:00:00Z'),
      },
    ];

    // 実行: 3件のリクエストを同時にシステムに投入し契約変更検証レポート自動生成機能を実行
    const generatedReports = generateContractChangeValidationReports(contractChangeRequests);

    // 検証1: 生成されたレポートの件数が3件であることを確認
    expect(generatedReports.length).toBe(3);

    // 検証2: 各レポートが対応する契約IDで正確に区分されているか確認
    expect(generatedReports[0].contractId).toBe('A001');
    expect(generatedReports[1].contractId).toBe('A002');
    expect(generatedReports[2].contractId).toBe('A003');

    // 検証3: 各レポートに含まれる変更内容が投入したリクエストと一致しているか検証
    expect(generatedReports[0].changeType).toBe('プラン変更');
    expect(generatedReports[0].changeDetail).toBe('スタンダードプランからプレミアムプランへ変更');
    expect(generatedReports[0].previousValue).toBe('スタンダードプラン');
    expect(generatedReports[0].newValue).toBe('プレミアムプラン');

    expect(generatedReports[1].changeType).toBe('数量変更');
    expect(generatedReports[1].changeDetail).toBe('ユーザー数を50から80へ変更');
    expect(generatedReports[1].previousValue).toBe('50');
    expect(generatedReports[1].newValue).toBe('80');

    expect(generatedReports[2].changeType).toBe('価格改定');
    expect(generatedReports[2].changeDetail).toBe('年間契約料金を1000万円から1200万円へ改定');
    expect(generatedReports[2].previousValue).toBe('10000000');
    expect(generatedReports[2].newValue).toBe('12000000');

    // 検証4: 各レポートのタイムスタンプが生成順序と矛盾していないか確認
    const report1Time = new Date(generatedReports[0].generatedAt).getTime();
    const report2Time = new Date(generatedReports[1].generatedAt).getTime();
    const report3Time = new Date(generatedReports[2].generatedAt).getTime();
    expect(report1Time <= report2Time).toBe(true);
    expect(report2Time <= report3Time).toBe(true);

    // 検証5: レポート間でデータの重複や漏落がないか検証
    const contractIds = new Set(generatedReports.map((r) => r.contractId));
    expect(contractIds.size).toBe(3); // 重複なし
    expect(contractIds.has('A001')).toBe(true);
    expect(contractIds.has('A002')).toBe(true);
    expect(contractIds.has('A003')).toBe(true);

    // 検証6: レポートの整合性チェック（スキーマ、必須フィールド）を実行
    generatedReports.forEach((report) => {
      expect(report).toHaveProperty('contractId');
      expect(report).toHaveProperty('changeType');
      expect(report).toHaveProperty('changeDetail');
      expect(report).toHaveProperty('previousValue');
      expect(report).toHaveProperty('newValue');
      expect(report).toHaveProperty('appliedDate');
      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('reportId');

      // 必須フィールドが空でないことを確認
      expect(report.contractId).toBeTruthy();
      expect(report.changeType).toBeTruthy();
      expect(report.changeDetail).toBeTruthy();
      expect(report.reportId).toBeTruthy();
      expect(report.generatedAt).toBeTruthy();

      // 型チェック
      expect(typeof report.contractId).toBe('string');
      expect(typeof report.changeType).toBe('string');
      expect(typeof report.changeDetail).toBe('string');
      expect(typeof report.reportId).toBe('string');
    });

    // 検証7: 各レポートが独立した reportId を保有していることを確認（重複なし）
    const reportIds = new Set(generatedReports.map((r) => r.reportId));
    expect(reportIds.size).toBe(3);

    // 検証8: 適用日が正確に反映されているか確認
    expect(new Date(generatedReports[0].appliedDate).toISOString()).toBe('2024-07-01T00:00:00.000Z');
    expect(new Date(generatedReports[1].appliedDate).toISOString()).toBe('2024-07-01T00:00:00.000Z');
    expect(new Date(generatedReports[2].appliedDate).toISOString()).toBe('2024-07-01T00:00:00.000Z');

    // 検証9: 変更前後の値が正確に区分されているか確認
    const reportA001 = generatedReports.find((r) => r.contractId === 'A001');
    expect(reportA001?.previousValue).not.toBe(reportA001?.newValue);

    const reportA002 = generatedReports.find((r) => r.contractId === 'A002');
    expect(reportA002?.previousValue).not.toBe(reportA002?.newValue);

    const reportA003 = generatedReports.find((r) => r.contractId === 'A003');
    expect(reportA003?.previousValue).not.toBe(reportA003?.newValue);
  });
});