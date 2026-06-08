# Release process

Release của VN Stock Insight đi theo luồng `feature/* -> dev -> main`. Không deploy trực tiếp từ feature branch hoặc `dev`; GitHub Pages chỉ deploy từ `main`.

## Quality gates

Trước khi mở hoặc merge PR, chạy:

```bash
npm run lint
npm run typecheck
npm test
npm run data:validate
npm run build
```

CI trong `.github/workflows/ci.yml` chạy cùng bộ gate cho PR vào `dev`/`main` và push lên `dev`, `main`, `feature/**`.

## PR review gates

PR `feature/* -> dev`:

- Author self-check hoàn tất.
- Tech Lead Agent review.
- Domain reviewer review theo file scope: Data Engineer cho data/ETL, Quant cho scoring, Frontend cho UI, DevOps cho workflow/deploy.
- Architect review nếu thay đổi kiến trúc, data contract, deploy strategy, scoring model structure hoặc chuyển khỏi static GitHub Pages.

PR `dev -> main`:

- Tất cả quality gates pass.
- Tech Lead, Architect, QA và DevOps sign-off.
- Release note ngắn gọn, risk note và post-deploy smoke checklist.
- Dữ liệu trong `public/data` và organization telemetry pass validation.

## Daily ETL và data artifact

Daily ETL workflow chạy `npm run data:generate` và `npm run data:validate`. Hiện tại generator tạo `dist-data-check` từ fixture tĩnh để kiểm tra hợp đồng dữ liệu. `dist-data-check` không commit và không phải nguồn dữ liệu production.

Nếu sau này adapter ETL lấy dữ liệu thật, release gate vẫn phải validate output JSON và cập nhật `data-health.json` để nói rõ source, timestamp, missing data và status.

## GitHub Pages deployment

`.github/workflows/pages.yml` chạy khi push vào `main` hoặc manual dispatch trên `main`:

1. Cài dependencies.
2. Chạy `npm run data:validate`.
3. Build với `GITHUB_PAGES=true npm run build`.
4. Upload `dist` làm Pages artifact.
5. Deploy bằng GitHub Pages environment.

Post-deploy smoke check:

- Trang tải được trên Pages URL.
- Dashboard hiển thị dữ liệu static và timestamp/data health.
- Recommendation labels và disclaimer hiển thị đúng.
- Organization Visualizer tải `demo-run` và không hiển thị secret.
- Manual refresh không làm mất dashboard khi không có live endpoint.

## Nguyên tắc release

- Không merge khi có quality gate fail.
- Không deploy khi data validation fail.
- Không tuyên bố dữ liệu live nếu source là `static-fixture`.
- Không đưa secret vào frontend, JSON fixture, trace hoặc workflow log.
- Mọi thay đổi release cần có bằng chứng verification trong PR.
