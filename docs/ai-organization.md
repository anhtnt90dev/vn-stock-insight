# Tổ chức công ty phần mềm AI

VN Stock Insight mô phỏng một delivery team AI có vai trò rõ ràng, artifact rõ ràng và review gate theo branch. Mục tiêu là minh bạch hóa đường đi từ yêu cầu khách hàng đến release, không thay thế governance của con người.

## Vai trò

| Role | Trách nhiệm chính | Review authority |
|---|---|---|
| Sales Agent | Tiếp nhận nhu cầu, scope, acceptance criteria, proposal và báo giá. | Customer approval gate, scope change. |
| Architect Agent | Kiến trúc static-first, data flow, security posture, technical decision. | Thay đổi kiến trúc, data contract, deploy strategy, `dev -> main`. |
| Tech Lead Agent | Chia nhỏ implementation, tích hợp, chất lượng code. | PR `feature/* -> dev`, implementation handoff. |
| Data Engineer Agent | Static data, ETL script, validation và data health. | Thay đổi `public/data`, `scripts`, data contract. |
| Quant Analyst Agent | Rule scoring, chỉ báo, recommendation rationale. | Thay đổi scoring và recommendation. |
| Frontend Engineer Agent | Dashboard và organization visualizer. | UI, accessibility, interaction. |
| QA Engineer Agent | Regression, quality gates, release readiness. | QA sign-off. |
| DevOps Engineer Agent | CI/CD, GitHub Pages, branch policy, release operations. | Workflow, deployment, release sign-off. |

## Sales, proposal và báo giá

Giai đoạn đầu vào gồm:

1. Sales Agent thu thập mục tiêu, người dùng, phạm vi, constraint và acceptance criteria.
2. Architect và Tech Lead đánh giá cách triển khai, rủi ro và effort.
3. Sales Agent tổng hợp proposal/quotation, bao gồm scope, timeline, assumption và change-control rule.
4. Customer approval gate đồng ý scope trước khi delivery vào branch `feature/*`.

Với MVP này, proposal/estimate được lưu ở spec và trace demo, không phải hợp đồng thương mại thật.

## Governance PR và branch

Branch flow:

```text
feature/* -> dev -> main -> GitHub Pages
```

Quy tắc:

- Mọi thay đổi bắt đầu trên `feature/*`.
- PR vào `dev` cần quality gates và Tech Lead review; domain reviewer tham gia theo file scope.
- PR ảnh hưởng kiến trúc, data contract, scoring model hoặc deploy strategy cần Architect review.
- PR `dev -> main` là release PR, cần Tech Lead, Architect, QA và DevOps sign-off.
- GitHub Pages chỉ deploy từ `main`.
- Direct push vào `dev` và `main` nên bị chặn khi branch protection khả dụng.

## Artifact governance

Nguồn bằng chứng release gồm spec, plan, docs, test evidence, workflow run, data validation output và organization trace JSON. Organization visualizer chỉ hiển thị tóm tắt đã sanitize, không hiển thị secret hoặc nội dung hội thoại nhạy cảm.
