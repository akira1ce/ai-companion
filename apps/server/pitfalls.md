## Cloudflare Vectorize 踩坑记录

### 向量检索返回 0 条

**可能原因一：metadata filter 失效**

Vectorize 的 filter 需要提前声明 metadata index，否则静默返回空。必须在插入向量前执行：

```bash
yarn wrangler vectorize create-metadata-index ai-companion-memories \
  --property-name sessionId \
  --type string \
  --cwd apps/server
```

> 注意：已有向量不会自动生效，需重新 upsert。

**可能原因二：metadata 未返回**

`query()` 默认不返回 metadata，`content` 会全为空字符串。查询时需加 `returnMetadata: "all"`：

```typescript
await this.deps.vectorize.query(vector, { topK: k, returnMetadata: "all" });
```

---

### D1 记忆检索不到

**可能原因：type 与实际写入不符**

检查写入器实际产生的 type，与 SQL 查询条件是否一致。例如写入器只产生 `event` 和 `keyword`，但查询条件写的是：

```sql
WHERE type IN ('fact', 'profile')
```

改为实际写入的类型即可：

```sql
WHERE type IN ('fact', 'profile', 'event', 'keyword')
```
