# Data pipeline

MVP dùng deterministic static fixtures trong `public/data`. Cách làm này giúp GitHub Pages hoạt động không cần backend, tránh phụ thuộc vào API public có thể bị rate limit, CORS hoặc thay đổi không báo trước.

## Cấu trúc dữ liệu

| File | Nội dung |
|---|---|
| `public/data/stocks.json` | Metadata mã cổ phiếu, sàn, ngành, VN30/default watchlist. |
| `public/data/prices/{symbol}.json` | Lịch sử OHLCV hằng ngày cho từng symbol. |
| `public/data/fundamentals/{symbol}.json` | Chỉ số cơ bản: P/E, P/B, ROE, tăng trưởng, nợ/vốn chủ. |
| `public/data/data-health.json` | Timestamp, nguồn, trạng thái, danh sách symbol và dữ liệu thiếu. |
| `public/data/organization/*` | Agent metadata, run events, token ledger và tool call ledger. |

## Validation

Lệnh bắt buộc:

```bash
npm run data:validate
```

`scripts/validate-data.mjs` kiểm tra:

- Stock metadata có symbol, tên, sàn hợp lệ (`HOSE`, `HNX`, `UPCOM`) và có flags boolean.
- Mỗi symbol có file price và fundamentals riêng.
- Price bars có date dạng `YYYY-MM-DD`, OHLCV là số, `high >= low`, `volume >= 0`.
- Fundamentals đúng symbol, có `updatedAt`, các chỉ số là số hoặc `null`.
- `data-health.json` đồng bộ với danh sách symbol và chỉ dùng source/status hợp lệ.
- Organization fixtures có agent, event, token usage, tool call hợp lệ và không chứa chuỗi giống secret.

## Generated data check

Lệnh:

```bash
npm run data:generate
```

Trong MVP, `scripts/generate-static-data.mjs` copy `public/data` sang `dist-data-check`, sau đó validate thư mục này bằng `--data-root`. `dist-data-check` là artifact sinh ra để kiểm tra dữ liệu, được ignore khỏi git.

Khi có adapter ETL thật trong tương lai, adapter nên ghi ra cùng hợp đồng JSON rồi chạy lại validation. Không được thay UI để đọc trực tiếp endpoint live nếu chưa có review kiến trúc và bảo mật.

## Daily ETL workflow

`.github/workflows/daily-etl.yml` chạy theo lịch thứ Hai đến thứ Sáu lúc 17:30 Asia/Ho_Chi_Minh và có `workflow_dispatch`. Workflow cài dependencies, chạy `npm run data:generate`, rồi chạy `npm run data:validate`.

Tên workflow là Daily ETL, nhưng MVP hiện tại chỉ sinh artifact từ fixture đã validate. Không có cam kết rằng workflow đang lấy giá thị trường live.

## Manual browser refresh

Nút manual refresh trong browser là best-effort:

- Không có API key, backend hoặc endpoint live trong MVP.
- Tạo snapshot sanitize trong `localStorage` với source `manual-browser-refresh`.
- Giữ dashboard tiếp tục dùng static JSON nếu refresh không khả dụng.
- Dữ liệu manual chỉ nằm cục bộ trong browser và không được commit vào repo.
