## 📋 Pull Request Checklist

### Description
<!-- What does this PR do? Why is this change needed? -->

### Type of Change
- [ ] 🚀 `feat` — New feature
- [ ] 🐛 `fix` — Bug fix
- [ ] ♻️ `refactor` — Code refactor (no behaviour change)
- [ ] 🧪 `test` — Adding/updating tests
- [ ] 📚 `docs` — Documentation only
- [ ] 🔧 `chore` — Build/config/dependency changes
- [ ] ⚡ `perf` — Performance improvement
- [ ] 🔒 `security` — Security fix

### Related Issue
Closes #<!-- issue number -->

---

### Code Quality Checklist
- [ ] TypeScript: `npm run type-check` passes with zero errors
- [ ] Lint: `npm run lint` passes with zero warnings
- [ ] Tests: All existing unit tests still pass
- [ ] New tests added for new business logic (if applicable)

### Architecture Checklist
- [ ] Services do NOT import `pg`, `redis`, `amqplib` directly (must go via `stores/`)
- [ ] Any vector search query has `WHERE shop_id = ?` filter (multi-tenant isolation)
- [ ] Any new endpoint has Rate Limit middleware applied
- [ ] Sensitive data (API keys, passwords) NOT hardcoded — using `config/index.ts`

### Flash Sale / High Concurrency (if applicable)
- [ ] Redis operations are atomic (Lua script or pipeline)
- [ ] Idempotency key checked for checkout flows
- [ ] Compensation logic added if stock is decremented

### AI Changes (if applicable)
- [ ] System prompt is immutable (not modifiable by user input)
- [ ] Guardrail middleware applied on AI endpoints
- [ ] `shop_id` isolation enforced in all knowledge queries

---

### Screenshots / Demo
<!-- Add screenshots, recordings, or curl examples if UI or API changes -->

### Notes for Reviewer
<!-- Anything specific the reviewer should focus on? -->
