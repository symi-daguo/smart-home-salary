# 备份恢复演练（生产必须做）

> 目标：证明“备份可用”，而不仅仅是“有备份文件”。强烈建议每月至少演练一次。

## 1. Postgres 恢复（从 pg_dump custom 格式）

### 1.1 准备：停止 API/Web（避免写入）

```bash
docker compose -f infra/docker-compose.yml stop api web
```

### 1.2 将 dump 拷贝进容器

假设 dump 文件为 `backups/pg/salary_20260311T000000Z.dump`：

```bash
docker cp backups/pg/salary_20260311T000000Z.dump salary_postgres:/tmp/restore.dump
```

### 1.3 清空并恢复（示例：重建 public schema）

```bash
docker exec -it salary_postgres psql -U postgres -d salary -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -it salary_postgres pg_restore -U postgres -d salary --clean --if-exists /tmp/restore.dump
docker exec -it salary_postgres rm -f /tmp/restore.dump
```

> 如果你是多库/多 schema 结构，请按实际调整策略；生产建议用“新库恢复→切换”的蓝绿策略。

### 1.4 启动 API/Web 并做抽样核对

```bash
docker compose -f infra/docker-compose.yml up -d api web
```

抽样核对建议：
- 登录 Web，检查岗位/员工/项目/订单/安装记录是否存在
- 运行一次工资结算（只读/写入动作都可以验证 DB 是否健康）

## 2. MinIO 恢复（对象文件）

### 2.1 恢复思路

MinIO 数据需要与 Postgres 中记录的 URL/objectKey 对应，否则会出现“记录在但附件打不开”。建议恢复策略为：
- 先恢复 Postgres
- 再恢复 MinIO bucket 的对象文件

### 2.2 使用 mc mirror 回灌

假设备份目录为 `backups/minio/salary-uploads/`：

```bash
docker run --rm \
  --network "container:salary_minio" \
  -e "MC_HOST_local=http://minioadmin:minioadmin@127.0.0.1:9000" \
  -v "$PWD/backups/minio:/backup" \
  minio/mc:RELEASE.2025-01-17T23-25-50Z \
  mirror --overwrite "/backup/salary-uploads" "local/salary-uploads"
```

完成后从 Web 随机打开几条包含 `paymentProofUrls/photoUrls` 的记录，验证 URL 可访问。

