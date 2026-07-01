import { generateInvoiceCreationProcedure } from '../../src/logic/it-1-2-1';

describe('請求書作成標準手順書生成機能', () => {
  // SCEN-1075
  test('契約情報・成果物・請求明細から請求書作成に必要な全ステップが抽出される', () => {
    const contract_info = {
      contract_id: 'CTR-20240115-001',
      contract_date: '2024-01-15',
      contract_amount: 500000,
      payment_terms: '月末払い',
      payment_due_days: 30,
      discount_rate: 0.1,
    };

    const deliverables = [
      {
        deliverable_id: 'DEL-001',
        deliverable_name: '営業データ分析レポート',
        delivery_date: '2024-01-31',
        inspection_status: '検収完了',
      },
      {
        deliverable_id: 'DEL-002',
        deliverable_name: 'ダッシュボード実装',
        delivery_date: '2024-02-10',
        inspection_status: '検収完了',
      },
    ];

    const invoice_details = [
      {
        detail_id: 'INV-DET-001',
        item_name: 'コンサルティング費用',
        quantity: 1,
        unit_price: 300000,
        tax_rate: 0.1,
      },
      {
        detail_id: 'INV-DET-002',
        item_name: 'システム実装費用',
        quantity: 1,
        unit_price: 200000,
        tax_rate: 0.1,
      },
    ];

    const result = generateInvoiceCreationProcedure({
      contract_info,
      deliverables,
      invoice_details,
    });

    // ステップ数の確認: 契約情報1 + 成果物2 + 請求明細2 = 5ステップ（基本）+ 金額計算ステップ = 6ステップ以上
    expect(result.steps.length).toBeGreaterThanOrEqual(6);

    // 契約情報に基づくステップが含まれていることを確認
    const contract_steps = result.steps.filter(
      (step) => step.category === 'contract'
    );
    expect(contract_steps.length).toBeGreaterThan(0);
    expect(contract_steps.some((s) => s.description.includes('契約内容'))).toBe(
      true
    );
    expect(contract_steps.some((s) => s.description.includes('支払い条件'))).toBe(
      true
    );

    // 成果物に基づくステップが含まれていることを確認
    const deliverable_steps = result.steps.filter(
      (step) => step.category === 'deliverable'
    );
    expect(deliverable_steps.length).toBe(2);
    expect(
      deliverable_steps.some((s) => s.description.includes('納品物の確認'))
    ).toBe(true);
    expect(
      deliverable_steps.some((s) => s.description.includes('検収状況'))
    ).toBe(true);
    expect(
      deliverable_steps.some((s) => s.description.includes('納品日'))
    ).toBe(true);

    // 請求明細に基づくステップが含まれていることを確認
    const invoice_detail_steps = result.steps.filter(
      (step) => step.category === 'invoice_detail'
    );
    expect(invoice_detail_steps.length).toBe(2);
    expect(
      invoice_detail_steps.some((s) => s.description.includes('品目'))
    ).toBe(true);
    expect(
      invoice_detail_steps.some((s) => s.description.includes('数量'))
    ).toBe(true);
    expect(
      invoice_detail_steps.some((s) => s.description.includes('単価'))
    ).toBe(true);
    expect(
      invoice_detail_steps.some((s) => s.description.includes('税金計算'))
    ).toBe(true);

    // 金額計算ステップの確認
    const calculation_steps = result.steps.filter(
      (step) => step.category === 'calculation'
    );
    expect(calculation_steps.length).toBeGreaterThan(0);
    expect(
      calculation_steps.some((s) => s.description.includes('合計金額'))
    ).toBe(true);

    // 論理的順序の確認: contract → deliverable → invoice_detail → calculation
    const category_order = result.steps.map((step) => step.category);
    const contract_first_index = category_order.indexOf('contract');
    const deliverable_first_index = category_order.indexOf('deliverable');
    const invoice_detail_first_index = category_order.indexOf('invoice_detail');
    const calculation_first_index = category_order.indexOf('calculation');

    expect(contract_first_index).toBeLessThan(deliverable_first_index);
    expect(deliverable_first_index).toBeLessThan(invoice_detail_first_index);
    expect(invoice_detail_first_index).toBeLessThan(calculation_first_index);

    // 各ステップにシーケンス番号と詳細説明があることを確認
    result.steps.forEach((step) => {
      expect(step.sequence).toBeGreaterThan(0);
      expect(step.description).toBeTruthy();
      expect(step.category).toBeTruthy();
    });

    // 生成された手順書の構造確認
    expect(result.procedure_name).toBe('請求書作成標準手順書');
    expect(result.contract_id).toBe(contract_info.contract_id);
    expect(result.total_amount).toBe(500000);
    expect(result.discounted_amount).toBe(450000); // 500000 * (1 - 0.1)
    expect(result.steps[0].sequence).toBe(1);
    expect(result.steps[result.steps.length - 1].sequence).toBe(
      result.steps.length
    );

    // 請求明細から合計金額を計算: (300000 + 200000) * 1.1 = 550000
    const subtotal = invoice_details.reduce(
      (sum, detail) => sum + detail.unit_price * detail.quantity,
      0
    );
    const tax_amount = subtotal * 0.1;
    const invoice_total = subtotal + tax_amount;

    expect(result.invoice_subtotal).toBe(500000);
    expect(result.invoice_tax).toBe(50000);
    expect(result.invoice_total).toBe(550000);
  });
});