# Scoring và recommendation

MVP dùng scoring rule-based, 50% cơ bản và 50% kỹ thuật. Kết quả giúp sắp xếp và giải thích watchlist, không phải khuyến nghị đầu tư cá nhân hóa.

## Điểm cơ bản

`scoreFundamentals` bắt đầu từ 50 điểm. Tín hiệu tốt cộng điểm; tín hiệu xấu trừ 60% số điểm của rule; giá trị `null` tạo data warning.

| Tín hiệu | Ngưỡng tốt | Điểm |
|---|---:|---:|
| P/E | `0 < pe <= 22` | 10 |
| P/B | `0 < pb <= 3.5` | 8 |
| ROE | `roe >= 0.15` | 14 |
| EPS growth | `epsGrowth >= 0.08` | 10 |
| Revenue growth | `revenueGrowth >= 0.06` | 8 |
| Debt to equity | `debtToEquity <= 1.2` | 8 |

## Điểm kỹ thuật

`scoreTechnical` cũng bắt đầu từ 50 điểm và dùng giá đóng cửa mới nhất.

| Tín hiệu | Ngưỡng tốt | Điểm |
|---|---:|---:|
| SMA20 | `latestClose >= sma20` | 10 |
| SMA50 | `latestClose >= sma50` | 10 |
| SMA200 | `latestClose >= sma200` | 8 |
| RSI14 | `45 <= rsi14 <= 70` | 10 |
| Volume ratio 20 | `volumeRatio20 >= 1` | 8 |
| Volatility 20 | `volatility20 <= 0.035` | 7 |
| Drawdown 60 | `drawdown60 >= -0.12` | 7 |

## Điểm tổng hợp và nhãn

```text
totalScore = fundamentalScore * 0.5 + technicalScore * 0.5
```

Nhãn mềm:

| Điểm tổng | Soft label |
|---:|---|
| `>= 80` | Rất tiềm năng |
| `>= 65` | Theo dõi |
| `>= 50` | Trung lập |
| `< 50` | Rủi ro cao |

Action label:

| Điều kiện | Action |
|---|---|
| `score >= 80` và `confidence >= 0.7` | `Buy` |
| `score >= 65` và `confidence >= 0.55` | `Buy` |
| `score >= 65` và confidence thấp hơn | `Hold` |
| `score >= 50` | `Hold` |
| `< 50` | `Sell/Avoid` |

Confidence bắt đầu từ `0.95`, trừ `0.08` cho mỗi data warning, clamp trong khoảng `0.4..0.95`.

## Nguyên tắc giải thích

Mỗi recommendation lưu:

- `reasons`: lý do tổng hợp, hiện tại là trọng số 50/50.
- `positiveSignals`: tín hiệu đạt ngưỡng.
- `negativeSignals`: tín hiệu không đạt ngưỡng.
- `risks`: rủi ro từ tín hiệu xấu hoặc rủi ro thị trường/data latency mặc định.
- `dataWarnings`: chỉ số thiếu.

## Disclaimer đầu tư

Thông tin trong app chỉ phục vụ demo MVP và nghiên cứu kỹ thuật. Dữ liệu hiện tại là fixture tĩnh đã validate, không phải dữ liệu thị trường live. Người dùng cần tự kiểm chứng với nguồn dữ liệu chính thức và tự chịu trách nhiệm với mọi quyết định đầu tư.
