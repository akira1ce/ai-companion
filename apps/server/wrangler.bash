# 删除向量存储
yarn wrangler vectorize delete ai-companion-memories --cwd apps/server
# 创建向量存储
yarn wrangler vectorize create ai-companion-memories --dimensions 768 --metric cosine --cwd apps/server
# 创建向量存储索引
yarn wrangler vectorize create-metadata-index ai-companion-memories --propertyName sessionId --type string --cwd apps/server
# 执行 D1 数据库迁移
yarn wrangler d1 execute ai-companion-db --local --file=./src/sql/schema.sql
yarn wrangler d1 execute ai-companion-db --file=./src/sql/schema.sql