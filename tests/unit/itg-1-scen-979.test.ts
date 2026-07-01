import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateInvoiceFromSalesData } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-979: [normal] 請求書自動検証機能 - 検証済み営業データから生成された請求書が形式・内容基準を満たす
  it('検証済み営業データから生成された請求書が形式・内容基準を満たす', () => {
    // テストデータ: 検証済みの営業データ
    const validated_sales_data = {
      customer_id: 'CUST-001',
      customer_name: '株式会社テスト',
      customer_address: '東京都渋谷区1-2-3',
      invoice_date: '2024-01-15',
      delivery_date: '2024-01-31',
      line_items: [
        {
          item_id: 'ITEM-001',
          item_name: 'サービスA',
          quantity: 2,
          unit_price: 50000,
          tax_rate: 0.1,
        },
        {
          item_id: 'ITEM-002',
          item_name: 'サービスB',
          quantity: 1,
          unit_price: 30000,
          tax_rate: 0.1,
        },
      ],
    };

    // 請求書自動生成機能を実行
    const generated_invoice = generateInvoiceFromSalesData(validated_sales_data);

    // 検証1: ファイル形式が正しい（PDF）
    expect(generated_invoice.file_format).toBe('PDF');

    // 検証2: すべての必須項目が含まれている
    expect(generated_invoice.invoice_number).toBeDefined();
    expect(generated_invoice.invoice_number).toMatch(/^INV-\d{8}-\d{4}$/);
    expect(generated_invoice.invoice_date).toBe('2024-01-15');
    expect(generated_invoice.delivery_date).toBe('2024-01-31');
    expect(generated_invoice.customer_name).toBe('株式会社テスト');
    expect(generated_invoice.customer_address).toBe('東京都渋谷区1-2-3');
    expect(generated_invoice.line_items).toHaveLength(2);

    // 検証3: 金額計算が正確であることを検証
    // サービスA: 50000 * 2 * 1.1 = 110000
    // サービスB: 30000 * 1 * 1.1 = 33000
    // 小計: (50000 * 2) + (30000 * 1) = 130000
    // 税額: 130000 * 0.1 = 13000
    // 合計: 130000 + 13000 = 143000
    expect(generated_invoice.subtotal).toBe(130000);
    expect(generated_invoice.tax_amount).toBe(13000);
    expect(generated_invoice.total_amount).toBe(143000);

    // 検証4: 請求書に記載された顧客情報が営業データと一致
    expect(generated_invoice.customer_name).toBe(validated_sales_data.customer_name);
    expect(generated_invoice.customer_address).toBe(
      validated_sales_data.customer_address
    );
    expect(generated_invoice.line_items[0].item_name).toBe(
      validated_sales_data.line_items[0].item_name
    );
    expect(generated_invoice.line_items[0].quantity).toBe(
      validated_sales_data.line_items[0].quantity
    );
    expect(generated_invoice.line_items[0].unit_price).toBe(
      validated_sales_data.line_items[0].unit_price
    );

    // 検証5: レイアウトとフォーマットが基準に準拠
    expect(generated_invoice.layout_version).toBe('1.0');
    expect(generated_invoice.template_name).toBe('standard_invoice');
    expect(generated_invoice.page_count).toBe(1);

    // 検証6: 生成された請求書が正常にシステムに保存されている
    expect(generated_invoice.saved_to_database).toBe(true);
    expect(generated_invoice.database_id).toBeDefined();
    expect(generated_invoice.database_id).toMatch(/^DB-\d+$/);
    expect(generated_invoice.created_at).toBeDefined();
    expect(new Date(generated_invoice.created_at).getTime()).toBeLessThanOrEqual(
      Date.now()
    );

    // 検証7: ステータスが「生成済み」になっている
    expect(generated_invoice.status).toBe('generated');
  });
});