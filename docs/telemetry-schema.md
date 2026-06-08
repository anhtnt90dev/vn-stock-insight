# Telemetry schema

Telemetry schema áp dụng cho organization trace trong `public/data/organization`. Tất cả file phải pass `npm run data:validate` trước khi merge hoặc deploy.

## Agent profile

`agents.json` là mảng object:

| Field | Kiểu | Ghi chú |
|---|---|---|
| `agentId` | string | Định danh duy nhất. |
| `role` | string | Tên vai trò hiển thị. |
| `responsibility` | string | Trách nhiệm ngắn gọn. |
| `status` | enum | `idle`, `working`, `reviewing`, `blocked`, `approved`. |
| `ownership` | string[] | File scope, artifact scope hoặc capability scope. |
| `reviewAuthority` | string[] | Các gate agent có quyền review. |

## Organization event

`runs/{runId}.json` là mảng event:

| Field | Bắt buộc | Ghi chú |
|---|---|---|
| `eventId` | Có | Duy nhất trong run. |
| `runId` | Có | MVP hiện validate `demo-run`. |
| `timestamp` | Có | ISO timestamp, ví dụ `2026-06-08T09:00:00+07:00`. |
| `phase` | Có | `Sales`, `discovery`, `architecture`, `implementation`, `review`, `QA`, `release`. |
| `agentId` | Có | Phải tồn tại trong `agents.json`. |
| `role` | Có | Role tại thời điểm event. |
| `eventType` | Có | `message`, `handoff`, `decision`, `tool_call`, `artifact`, `review`, `approval`, `ci_check`, `token_usage`. |
| `summary` | Có | Tóm tắt đã sanitize, không chứa secret. |
| `status` | Có | `pending`, `running`, `passed`, `failed`, `blocked`, `approved`, `rejected`. |
| `telemetryQuality` | Có | `actual`, `estimated`, `unavailable`. |
| `fromAgentId`, `toAgentId` | Không | Dùng cho handoff. |
| `artifactRefs` | Không | Danh sách file, PR, commit, workflow run hoặc artifact liên quan. |
| `toolName` | Không | Bắt buộc nếu cần hiển thị tool call trên timeline. |
| `durationMs` | Không | Số không âm. |
| `tokenUsage` | Không | Object `{ prompt, completion, total }`, `total = prompt + completion`. |

## Token usage ledger

`token-usage/{runId}.json` là mảng entry tham chiếu event đã có:

| Field | Ghi chú |
|---|---|
| `eventId` | Phải tồn tại trong run events. |
| `runId`, `agentId`, `role`, `phase` | Phải đồng bộ với run và agent metadata. |
| `task` | Mô tả tác vụ. |
| `prompt`, `completion`, `total` | Số không âm, `total = prompt + completion`. |
| `telemetryQuality` | `actual`, `estimated`, `unavailable`. |
| `sanitized` | Bắt buộc `true`. |

## Tool call ledger

`tool-calls/{runId}.json` là mảng entry:

| Field | Ghi chú |
|---|---|
| `eventId` | Định danh tool call duy nhất. |
| `runId`, `agentId`, `role` | Phải hợp lệ. |
| `toolName` | Tên lệnh/tool, không chứa secret. |
| `purpose` | Lý do gọi tool. |
| `status` | Cùng enum status với organization event. |
| `durationMs` | Số không âm. |
| `summary` | Kết quả tóm tắt đã redact. |
| `sanitized` | Bắt buộc `true`. |

## Redaction rules

Validation quét để ngăn các chuỗi giống secret như `gho_`, `ghp_`, `sk-`, `api_key`, `password`, `secret`. Đây là guardrail MVP, không thay thế secret scanning đầy đủ trong CI của doanh nghiệp.
