import { classifyOcrReadingError } from '../../src/logic/it-6-3-1';

describe('OCR読取誤り判定機能', () => {
  test('SCEN-1396: OCR読取誤りが3つの分類（OCR精度不足、見積書品質、フォーマット例外）に正確に判定される', () => {
    // OCR精度不足: 歪んだ画像
    const ocrInsufficientDistortedResult = classifyOcrReadingError({
      errorType: 'image_distortion',
      readValue: 'ァイヱ',
      expectedValue: 'コイ',
      readConfidence: 0.52,
      imageQuality: 'low_resolution',
      classificationIndicators: {
        isImageDistorted: true,
        isLowResolution: true,
        hasLightingIssue: false,
        hasMissingFields: false,
        hasUnclearHandwriting: false,
        hasLayoutDeviation: false,
        isDocumentDamaged: false,
      },
    });
    expect(ocrInsufficientDistortedResult.classification).toBe('OCR精度不足');
    expect(ocrInsufficientDistortedResult.errorCode).toBe('OCR_001');
    expect(ocrInsufficientDistortedResult.message).toMatch(/歪み|低解像度/);

    // OCR精度不足: 照明不良
    const ocrInsufficientLightingResult = classifyOcrReadingError({
      errorType: 'lighting_issue',
      readValue: 'lllllll',
      expectedValue: '1111111',
      readConfidence: 0.48,
      imageQuality: 'poor_lighting',
      classificationIndicators: {
        isImageDistorted: false,
        isLowResolution: false,
        hasLightingIssue: true,
        hasMissingFields: false,
        hasUnclearHandwriting: false,
        hasLayoutDeviation: false,
        isDocumentDamaged: false,
      },
    });
    expect(ocrInsufficientLightingResult.classification).toBe('OCR精度不足');
    expect(ocrInsufficientLightingResult.errorCode).toBe('OCR_002');
    expect(ocrInsufficientLightingResult.message).toMatch(/照明/);

    // 見積書品質: 記入漏れ
    const documentQualityMissingResult = classifyOcrReadingError({
      errorType: 'missing_field',
      readValue: '',
      expectedValue: '100000',
      readConfidence: 0.0,
      imageQuality: 'normal',
      classificationIndicators: {
        isImageDistorted: false,
        isLowResolution: false,
        hasLightingIssue: false,
        hasMissingFields: true,
        hasUnclearHandwriting: false,
        hasLayoutDeviation: false,
        isDocumentDamaged: false,
      },
    });
    expect(documentQualityMissingResult.classification).toBe('見積書品質');
    expect(documentQualityMissingResult.errorCode).toBe('DOC_001');
    expect(documentQualityMissingResult.message).toMatch(/記入漏れ|必須項目/);

    // 見積書品質: 不鮮明な記入
    const documentQualityUnclearResult = classifyOcrReadingError({
      errorType: 'unclear_handwriting',
      readValue: '999xxx',
      expectedValue: '99999',
      readConfidence: 0.45,
      imageQuality: 'normal',
      classificationIndicators: {
        isImageDistorted: false,
        isLowResolution: false,
        hasLightingIssue: false,
        hasMissingFields: false,
        hasUnclearHandwriting: true,
        hasLayoutDeviation: false,
        isDocumentDamaged: false,
      },
    });
    expect(documentQualityUnclearResult.classification).toBe('見積書品質');
    expect(documentQualityUnclearResult.errorCode).toBe('DOC_002');
    expect(documentQualityUnclearResult.message).toMatch(/不鮮明|手書き/);

    // フォーマット例外: 想定外のレイアウト
    const formatExceptionLayoutResult = classifyOcrReadingError({
      errorType: 'layout_deviation',
      readValue: 'データ構造が異なる',
      expectedValue: '構造化データ',
      readConfidence: 0.30,
      imageQuality: 'normal',
      classificationIndicators: {
        isImageDistorted: false,
        isLowResolution: false,
        hasLightingIssue: false,
        hasMissingFields: false,
        hasUnclearHandwriting: false,
        hasLayoutDeviation: true,
        isDocumentDamaged: false,
      },
    });
    expect(formatExceptionLayoutResult.classification).toBe('フォーマット例外');
    expect(formatExceptionLayoutResult.errorCode).toBe('FMT_001');
    expect(formatExceptionLayoutResult.message).toMatch(/レイアウト|想定外/);

    // フォーマット例外: 破損
    const formatExceptionDamagedResult = classifyOcrReadingError({
      errorType: 'document_damaged',
      readValue: 'xxxxx',
      expectedValue: '50000',
      readConfidence: 0.15,
      imageQuality: 'damaged',
      classificationIndicators: {
        isImageDistorted: false,
        isLowResolution: false,
        hasLightingIssue: false,
        hasMissingFields: false,
        hasUnclearHandwriting: false,
        hasLayoutDeviation: false,
        isDocumentDamaged: true,
      },
    });
    expect(formatExceptionDamagedResult.classification).toBe('フォーマット例外');
    expect(formatExceptionDamagedResult.errorCode).toBe('FMT_002');
    expect(formatExceptionDamagedResult.message).toMatch(/破損|読取不可/);

    // 複合的誤り要因: OCR精度不足 + 見積書品質（優先度: OCR精度不足が高）
    const compositeOcrPriorityResult = classifyOcrReadingError({
      errorType: 'composite_ocr_document',
      readValue: 'ァイ',
      expectedValue: 'コイ',
      readConfidence: 0.50,
      imageQuality: 'low_resolution',
      classificationIndicators: {
        isImageDistorted: true,
        isLowResolution: true,
        hasLightingIssue: false,
        hasMissingFields: true,
        hasUnclearHandwriting: false,
        hasLayoutDeviation: false,
        isDocumentDamaged: false,
      },
    });
    expect(compositeOcrPriorityResult.classification).toBe('OCR精度不足');
    expect(compositeOcrPriorityResult.errorCode).toMatch(/^OCR_/);
    expect(compositeOcrPriorityResult.priority).toBe(1);

    // 複合的誤り要因: 見積書品質 + フォーマット例外（優先度: 見積書品質が高）
    const compositeDocFormatResult = classifyOcrReadingError({
      errorType: 'composite_document_format',
      readValue: '',
      expectedValue: '数値',
      readConfidence: 0.20,
      imageQuality: 'normal',
      classificationIndicators: {
        isImageDistorted: false,
        isLowResolution: false,
        hasLightingIssue: false,
        hasMissingFields: true,
        hasUnclearHandwriting: false,
        hasLayoutDeviation: true,
        isDocumentDamaged: false,
      },
    });
    expect(compositeDocFormatResult.classification).toBe('見積書品質');
    expect(compositeDocFormatResult.errorCode).toMatch(/^DOC_/);
    expect(compositeDocFormatResult.priority).toBe(2);

    // 複合的誤り要因: 3つすべて（優先度順: OCR精度不足 > 見積書品質 > フォーマット例外）
    const compositeAllThreeResult = classifyOcrReadingError({
      errorType: 'composite_all_three',
      readValue: 'ァ',
      expectedValue: 'コ',
      readConfidence: 0.40,
      imageQuality: 'low_resolution',
      classificationIndicators: {
        isImageDistorted: true,
        isLowResolution: true,
        hasLightingIssue: true,
        hasMissingFields: true,
        hasUnclearHandwriting: true,
        hasLayoutDeviation: true,
        isDocumentDamaged: true,
      },
    });
    expect(compositeAllThreeResult.classification).toBe('OCR精度不足');
    expect(compositeAllThreeResult.errorCode).toMatch(/^OCR_/);
    expect(compositeAllThreeResult.priority).toBe(1);
    expect(compositeAllThreeResult.detectedIndicators).toContain('OCR精度不足');

    // エラーコードとメッセージの整合性確認
    expect(ocrInsufficientDistortedResult.errorCode).toBe('OCR_001');
    expect(ocrInsufficientDistortedResult.message).toBeDefined();
    expect(typeof ocrInsufficientDistortedResult.message).toBe('string');
    expect(ocrInsufficientDistortedResult.message.length).toBeGreaterThan(0);

    expect(documentQualityMissingResult.errorCode).toBe('DOC_001');
    expect(documentQualityMissingResult.message).toBeDefined();
    expect(typeof documentQualityMissingResult.message).toBe('string');

    expect(formatExceptionLayoutResult.errorCode).toBe('FMT_001');
    expect(formatExceptionLayoutResult.message).toBeDefined();
    expect(typeof formatExceptionLayoutResult.message).toBe('string');

    // 優先度順序の確認（OCR精度不足=1 > 見積書品質=2 > フォーマット例外=3）
    expect(ocrInsufficientDistortedResult.priority).toBe(1);
    expect(documentQualityMissingResult.priority).toBe(2);
    expect(formatExceptionLayoutResult.priority).toBe(3);

    // 各分類の信頼度スコア検証（0-100）
    expect(ocrInsufficientDistortedResult.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(ocrInsufficientDistortedResult.confidenceScore).toBeLessThanOrEqual(100);
    expect(documentQualityMissingResult.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(documentQualityMissingResult.confidenceScore).toBeLessThanOrEqual(100);
    expect(formatExceptionLayoutResult.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(formatExceptionLayoutResult.confidenceScore).toBeLessThanOrEqual(100);

    // detectedIndicators が配列で、複合誤りの場合は複数値を含む
    expect(Array.isArray(compositeAllThreeResult.detectedIndicators)).toBe(true);
    expect(compositeAllThreeResult.detectedIndicators.length).toBeGreaterThan(1);
    expect(compositeAllThreeResult.detectedIndicators).toContain('OCR精度不足');
  });
});