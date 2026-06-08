# VN Stock Insight

VN Stock Insight là dashboard React/Vite tĩnh cho GitHub Pages, hiển thị phân tích cổ phiếu Việt Nam từ JSON fixture đã validate. MVP hiện tại dùng dữ liệu deterministic trong `public/data`; không có backend runtime, không nhúng API key và không tuyên bố có dữ liệu thị trường live.

## Chức năng MVP

- Dashboard tiếng Việt cho watchlist mặc định và symbol cục bộ trong browser.
- Scoring rule-based kết hợp 50% cơ bản và 50% kỹ thuật.
- Recommendation labels: `Buy`, `Hold`, `Sell/Avoid` kèm nhãn mềm và lý do.
- Organization Runtime Visualizer replay trace tĩnh của delivery team AI.
- Data validation, CI quality gates, Daily ETL artifact check và GitHub Pages deploy từ `main`.

## Chạy local

```bash
npm ci
npm run dev
```

Lệnh kiểm tra:

```bash
npm run lint
npm run typecheck
npm test
npm run data:validate
npm run build
```

## Scripts

| Lệnh | Mục đích |
|---|---|
| `npm run dev` | Chạy Vite dev server trên `127.0.0.1`. |
| `npm run build` | Typecheck và build production vào `dist`. |
| `npm test` | Chạy Vitest. |
| `npm run data:validate` | Validate stock fixtures và organization telemetry. |
| `npm run data:generate` | Tạo `dist-data-check` từ `public/data` và validate artifact. |

## Tài liệu

- [Kiến trúc](docs/architecture.md)
- [Data pipeline](docs/data-pipeline.md)
- [Scoring](docs/scoring.md)
- [Tổ chức công ty phần mềm AI](docs/ai-organization.md)
- [Organization Runtime Visualizer](docs/organization-visualizer.md)
- [Telemetry schema](docs/telemetry-schema.md)
- [Release process](docs/release-process.md)

## Deployment

GitHub Pages deploy từ `main` qua `.github/workflows/pages.yml`. Workflow validate data, build với `GITHUB_PAGES=true npm run build`, upload `dist` và deploy Pages artifact.

Daily ETL trong MVP chạy validation trên fixture tĩnh và artifact `dist-data-check`. Adapter dữ liệu thật trong tương lai có thể thay cách sinh JSON, nhưng phải giữ hợp đồng dữ liệu và pass validation.

## Disclaimer

Thông tin trong app chỉ phục vụ demo MVP và nghiên cứu kỹ thuật. Đây không phải tư vấn đầu tư. Người dùng cần tự kiểm chứng dữ liệu với nguồn chính thức trước khi ra quyết định tài chính.
