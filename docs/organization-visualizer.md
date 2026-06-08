# Organization Runtime Visualizer

Organization Runtime Visualizer là workspace replay trace tĩnh của delivery team AI. Nó đọc JSON trong `public/data/organization`, không cần backend và không kết nối live event stream trong MVP.

## Nguồn dữ liệu

| File | Vai trò |
|---|---|
| `organization/agents.json` | Agent metadata: role, responsibility, status, ownership, review authority. |
| `organization/runs/demo-run.json` | Timeline sự kiện theo phase cho run demo. |
| `organization/token-usage/demo-run.json` | Ledger token đã validate theo event, agent, task và phase. |
| `organization/tool-calls/demo-run.json` | Ledger tool call đã sanitize và validate. |

## Workflow phases

Phase hợp lệ:

```text
Sales -> discovery -> architecture -> implementation -> review -> QA -> release
```

UI hiển thị workflow map, bảng agent, timeline sự kiện, trạng thái review, token/tool summary và ghi chú trace đã sanitize. Trong MVP, summary hiển thị được tổng hợp từ `runs/demo-run.json`; các file `token-usage` và `tool-calls` là ledger telemetry riêng để validation và mở rộng UI sau này. `demo-run` hiện tại là fixture để minh họa delivery flow từ sales intake đến review gate.

## Agent metadata

Mỗi agent có:

- `agentId`: định danh ổn định.
- `role`: tên vai trò hiển thị.
- `responsibility`: phạm vi trách nhiệm.
- `status`: `idle`, `working`, `reviewing`, `blocked`, `approved`.
- `ownership`: file scope hoặc artifact scope.
- `reviewAuthority`: gate mà agent có quyền review.

## Token telemetry quality

Telemetry phải nói rõ chất lượng:

| Giá trị | Ý nghĩa |
|---|---|
| `actual` | Số liệu được ghi trực tiếp từ trace đã sanitize. |
| `estimated` | Số liệu được ước tính hoặc không phủ đủ mọi event. |
| `unavailable` | Runtime không có token, duration hoặc trace chi tiết. |

Visualizer tổng hợp token theo agent từ event có `tokenUsage`. Nếu agent không có đủ telemetry, UI phải hiển thị đúng chất lượng thay vì giả lập độ chính xác.

## Tool calls và secret redaction

Tool call ledger lưu các định danh bắt buộc (`eventId`, `runId`, `agentId`, `role`), cùng `toolName`, `purpose`, `status`, `durationMs`, `summary` đã sanitize và `sanitized: true`. Validation từ chối chuỗi giống secret như token GitHub, OpenAI key, `api_key`, `password` hoặc `secret`.

MVP không lưu raw prompt, raw tool output, API key, secret, endpoint nội bộ hoặc thông tin đăng nhập. Nếu sau này thêm live trace ingestion, cần giữ cùng schema và redaction gate trước khi ghi JSON.
