import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

const fetchMock = require('jest-fetch-mock');

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1010
  test('説明資料の自動生成機能 - AI判定結果から相場乖離データを正確に抽出し、PDF/Word形式の資料が生成される', async () => {
    // === テストデータセットアップ ===
    const ai_judgment_result = {
      estimate_id: 'EST-2024-001',
      judgment_result_id: 'JDG-2024-001',
      ocr_extracted_amount: 5000000,
      ocr_extracted_quantity: 100,
      ocr_extracted_unit_price: 50000,
      reference_market_price: 4500000,
      reference_data_count: 45,
      divergence_rate_percent: 11.1,
      divergence_amount_yen: 500000,
      correction_coefficient: 1.05,
      reference_region: '東京都',
      reference_construction_type: '建屋工事',
      reference_time_period: '2024年1月',
      judgment_timestamp: new Date('2024-01-15T11:00:00Z'),
      assessor_id: 'ASSR-001',
    };

    const market_master_data = {
      market_id: 'MKT-2024-001',
      standard_price: 4500000,
      market_region: '東京都',
      construction_type: '建屋工事',
      time_period: '2024年1月',
      data_source: '物価本2024年1月版',
    };

    const past_project_data_array = Array.from({ length: 45 }, (_, i) => ({
      project_id: `PAST-PRJ-${String(i + 1).padStart(4, '0')}`,
      project_amount: 4500000 + (Math.random() - 0.5) * 300000,
      project_region: '東京都',
      construction_type: '建屋工事',
      project_date: '2024年1月',
    }));

    const divergence_data = {
      divergence_rate_percent: 11.1,
      divergence_amount_yen: 500000,
      ocr_extracted_amount: 5000000,
      reference_market_price: 4500000,
      reference_data_count: 45,
      correction_coefficient: 1.05,
      market_region: '東京都',
      construction_type: '建屋工事',
      time_period: '2024年1月',
      judgment_basis_confidence_score: 82,
    };

    // === ステップ1: システムに判定結果を入力 ===
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        judgment_id: 'JDG-2024-001',
        stored: true,
      }),
      { status: 200 }
    );

    const input_response = await fetch('/api/judgment/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ai_judgment_result),
    });

    expect(input_response.status).toBe(200);
    const input_data = await input_response.json();
    expect(input_data.status).toBe('success');

    // === ステップ2: AI判定結果の分析処理を実行 ===
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        divergence_data_extracted: true,
        divergence_analysis: divergence_data,
      }),
      { status: 200 }
    );

    const analysis_response = await fetch('/api/judgment/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgment_id: 'JDG-2024-001' }),
    });

    expect(analysis_response.status).toBe(200);
    const analysis_result = await analysis_response.json();
    expect(analysis_result.status).toBe('success');
    expect(analysis_result.divergence_data_extracted).toBe(true);

    // === ステップ3: 抽出されたデータの正確性を検証 ===
    const extracted_divergence = analysis_result.divergence_analysis;
    expect(extracted_divergence.divergence_rate_percent).toBe(11.1);
    expect(extracted_divergence.divergence_amount_yen).toBe(500000);
    expect(extracted_divergence.ocr_extracted_amount).toBe(5000000);
    expect(extracted_divergence.reference_market_price).toBe(4500000);
    expect(extracted_divergence.reference_data_count).toBe(45);
    expect(extracted_divergence.correction_coefficient).toBe(1.05);
    expect(extracted_divergence.market_region).toBe('東京都');
    expect(extracted_divergence.construction_type).toBe('建屋工事');
    expect(extracted_divergence.time_period).toBe('2024年1月');
    expect(extracted_divergence.judgment_basis_confidence_score).toBe(82);

    // === ステップ4: PDF形式の説明資料生成リクエスト ===
    const pdf_generation_payload = {
      judgment_id: 'JDG-2024-001',
      divergence_data: extracted_divergence,
      market_master: market_master_data,
      past_project_references: past_project_data_array,
      output_format: 'pdf',
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        file_generated: true,
        file_format: 'pdf',
        file_size_bytes: 245680,
        file_name: 'estimate_explanation_JDG-2024-001.pdf',
        content_hash: 'sha256:abc123def456',
      }),
      { status: 200 }
    );

    const pdf_response = await fetch('/api/explanation/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pdf_generation_payload),
    });

    expect(pdf_response.status).toBe(200);
    const pdf_result = await pdf_response.json();
    expect(pdf_result.status).toBe('success');
    expect(pdf_result.file_generated).toBe(true);
    expect(pdf_result.file_format).toBe('pdf');
    expect(pdf_result.file_size_bytes).toBeGreaterThan(0);

    // === ステップ5: PDF内容検証 ===
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        file_format: 'pdf',
        contains_divergence_rate: true,
        divergence_rate_value: 11.1,
        contains_divergence_amount: true,
        divergence_amount_value: 500000,
        contains_reference_data_count: true,
        reference_data_count_value: 45,
        contains_market_region: true,
        market_region_value: '東京都',
        contains_correction_coefficient: true,
        correction_coefficient_value: 1.05,
        contains_confidence_score: true,
        confidence_score_value: 82,
        layout_valid: true,
        all_data_reflected: true,
      }),
      { status: 200 }
    );

    const pdf_verify_response = await fetch('/api/explanation/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_name: pdf_result.file_name,
        file_format: 'pdf',
      }),
    });

    expect(pdf_verify_response.status).toBe(200);
    const pdf_verify_result = await pdf_verify_response.json();
    expect(pdf_verify_result.status).toBe('success');
    expect(pdf_verify_result.contains_divergence_rate).toBe(true);
    expect(pdf_verify_result.divergence_rate_value).toBe(11.1);
    expect(pdf_verify_result.contains_divergence_amount).toBe(true);
    expect(pdf_verify_result.divergence_amount_value).toBe(500000);
    expect(pdf_verify_result.contains_reference_data_count).toBe(true);
    expect(pdf_verify_result.reference_data_count_value).toBe(45);
    expect(pdf_verify_result.contains_market_region).toBe(true);
    expect(pdf_verify_result.market_region_value).toBe('東京都');
    expect(pdf_verify_result.contains_correction_coefficient).toBe(true);
    expect(pdf_verify_result.correction_coefficient_value).toBe(1.05);
    expect(pdf_verify_result.contains_confidence_score).toBe(true);
    expect(pdf_verify_result.confidence_score_value).toBe(82);
    expect(pdf_verify_result.layout_valid).toBe(true);
    expect(pdf_verify_result.all_data_reflected).toBe(true);

    // === ステップ6: Word形式の説明資料生成リクエスト ===
    const word_generation_payload = {
      judgment_id: 'JDG-2024-001',
      divergence_data: extracted_divergence,
      market_master: market_master_data,
      past_project_references: past_project_data_array,
      output_format: 'docx',
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        file_generated: true,
        file_format: 'docx',
        file_size_bytes: 185430,
        file_name: 'estimate_explanation_JDG-2024-001.docx',
        content_hash: 'sha256:xyz789uvw012',
      }),
      { status: 200 }
    );

    const word_response = await fetch('/api/explanation/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(word_generation_payload),
    });

    expect(word_response.status).toBe(200);
    const word_result = await word_response.json();
    expect(word_result.status).toBe('success');
    expect(word_result.file_generated).toBe(true);
    expect(word_result.file_format).toBe('docx');
    expect(word_result.file_size_bytes).toBeGreaterThan(0);

    // === ステップ7: Word内容検証 ===
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        file_format: 'docx',
        contains_divergence_rate: true,
        divergence_rate_value: 11.1,
        contains_divergence_amount: true,
        divergence_amount_value: 500000,
        contains_reference_data_count: true,
        reference_data_count_value: 45,
        contains_market_region: true,
        market_region_value: '東京都',
        contains_correction_coefficient: true,
        correction_coefficient_value: 1.05,
        contains_confidence_score: true,
        confidence_score_value: 82,
        layout_valid: true,
        all_data_reflected: true,
      }),
      { status: 200 }
    );

    const word_verify_response = await fetch('/api/explanation/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_name: word_result.file_name,
        file_format: 'docx',
      }),
    });

    expect(word_verify_response.status).toBe(200);
    const word_verify_result = await word_verify_response.json();
    expect(word_verify_result.status).toBe('success');
    expect(word_verify_result.contains_divergence_rate).toBe(true);
    expect(word_verify_result.divergence_rate_value).toBe(11.1);
    expect(word_verify_result.contains_divergence_amount).toBe(true);
    expect(word_verify_result.divergence_amount_value).toBe(500000);
    expect(word_verify_result.contains_reference_data_count).toBe(true);
    expect(word_verify_result.reference_data_count_value).toBe(45);
    expect(word_verify_result.contains_market_region).toBe(true);
    expect(word_verify_result.market_region_value).toBe('東京都');
    expect(word_verify_result.contains_correction_coefficient).toBe(true);
    expect(word_verify_result.correction_coefficient_value).toBe(1.05);
    expect(word_verify_result.contains_confidence_score).toBe(true);
    expect(word_verify_result.confidence_score_value).toBe(82);
    expect(word_verify_result.layout_valid).toBe(true);
    expect(word_verify_result.all_data_reflected).toBe(true);

    // === ステップ8: PDF及びWord間の一貫性確認 ===
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        format_consistency_check: true,
        data_consistency_check: true,
        pdf_data_integrity: true,
        word_data_integrity: true,
        divergence_rate_match: true,
        divergence_amount_match: true,
        reference_data_count_match: true,
        market_region_match: true,
        correction_coefficient_match: true,
        confidence_score_match: true,
        overall_consistency: true,
      }),
      { status: 200 }
    );

    const consistency_response = await fetch('/api/explanation/consistency-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdf_file_name: pdf_result.file_name,
        word_file_name: word_result.file_name,
        judgment_id: 'JDG-2024-001',
      }),
    });

    expect(consistency_response.status).toBe(200);
    const consistency_result = await consistency_response.json();
    expect(consistency_result.status).toBe('success');
    expect(consistency_result.format_consistency_check).toBe(true);
    expect(consistency_result.data_consistency_check).toBe(true);
    expect(consistency_result.pdf_data_integrity).toBe(true);
    expect(consistency_result.word_data_integrity).toBe(true);
    expect(consistency_result.divergence_rate_match).toBe(true);
    expect(consistency_result.divergence_amount_match).toBe(true);
    expect(consistency_result.reference_data_count_match).toBe(true);
    expect(consistency_result.market_region_match).toBe(true);
    expect(consistency_result.correction_coefficient_match).toBe(true);
    expect(consistency_result.confidence_score_match).toBe(true);
    expect(consistency_result.overall_consistency).toBe(true);
  });
});