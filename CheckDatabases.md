# Testando os Bancos de Dados

Guia para verificar se todos os serviços estão funcionando corretamente após rodar o `docker compose up`.

## Pré-requisitos

```bash
# Sobe todos os serviços em background
docker compose up -d

# Acompanha os logs (aguarde todos ficarem healthy)
docker compose ps
```

Aguarde até que todos os containers estejam com status `healthy` antes de prosseguir. O Cassandra pode levar até **60 segundos** para inicializar.

---

## PostgreSQL

### Via pgAdmin (GUI)

Acesse `http://localhost:5050` no browser.

O servidor **Marketplace** já está pré-configurado — basta expandir na barra lateral e navegar pelas tabelas em `marketplace → Schemas → public → Tables`.

Para rodar uma query, clique com o botão direito em qualquer tabela e selecione **Query Tool**.

### Via terminal

```bash
# Acessa o psql dentro do container
docker exec -it marketplace_postgres psql -U admin -d marketplace

# Lista as tabelas criadas
\dt

# Verifica os ENUMs
\dT

# Confere os índices
\di

# Verifica um usuário de seed (se existir)
SELECT id, name, email, role, balance FROM users;

# Sai do psql
\q
```

### Teste manual rápido

```sql
-- Insere um usuário de teste
INSERT INTO users (name, email, password_hash, role)
VALUES ('Teste', 'teste@email.com', 'hash_qualquer', 'client');

-- Verifica o saldo inicial
SELECT name, balance FROM users WHERE email = 'teste@email.com';
-- esperado: balance = 1000.00

-- Remove o usuário de teste
DELETE FROM users WHERE email = 'teste@email.com';
```

---

## MongoDB

### Via Mongo Express (GUI)

Acesse `http://localhost:8081` no browser.

Você verá o banco **marketplace** listado. As collections aparecem assim que o backend fizer o primeiro insert via Mongoose. Antes disso, o banco estará vazio — isso é esperado.

### Via terminal

```bash
# Acessa o mongosh dentro do container
docker exec -it marketplace_mongo mongosh -u admin -p admin123 --authenticationDatabase admin marketplace

# Lista as collections (vazio antes do backend rodar)
show collections

# Insere um produto de teste
db.products.insertOne({
  seller_id: "uuid-qualquer",
  title: "Produto Teste",
  description: "Descrição do produto",
  price: Decimal128("99.90"),
  stock: 10,
  category: "eletronicos",
  images: [],
  attributes: { marca: "Teste", voltagem: "bivolt" },
  is_active: true,
  created_at: new Date()
})

# Lista os produtos
db.products.find().pretty()

# Remove o produto de teste
db.products.deleteMany({ title: "Produto Teste" })

# Sai do mongosh
exit
```

---

## Redis

### Via RedisInsight (GUI)

Acesse `http://localhost:5540` no browser.

Na primeira vez, adicione a conexão manualmente:
- **Host:** `localhost`
- **Port:** `6379`

Após conectar, você visualiza todas as chaves, tipos e TTLs em tempo real.

### Via terminal

```bash
# Acessa o redis-cli dentro do container
docker exec -it marketplace_redis redis-cli

# Verifica se está respondendo
PING
# esperado: PONG

# Simula um carrinho de compras
HSET cart:usuario-123 produto-abc 2 produto-xyz 1

# Lê o carrinho
HGETALL cart:usuario-123

# Simula cache de busca
SETEX search:tenis:page:1 300 '{"results": [], "total": 0}'

# Lê o cache
GET search:tenis:page:1

# Verifica o TTL restante (em segundos)
TTL search:tenis:page:1

# Lista todas as chaves ativas
KEYS *

# Remove as chaves de teste
DEL cart:usuario-123
DEL search:tenis:page:1

# Sai do redis-cli
EXIT
```

---

## Cassandra

### Via Cassandra Web (GUI)

Acesse `http://localhost:3001` no browser.

Você pode navegar pelo keyspace `marketplace` e visualizar as tabelas e dados inseridos.

### Via terminal

```bash
# Acessa o cqlsh dentro do container
docker exec -it marketplace_cassandra cqlsh

# Seleciona o keyspace
USE marketplace;

# Lista as tabelas
DESCRIBE TABLES;

# Insere um evento de visualização de produto
INSERT INTO product_views (user_id, viewed_at, view_id, product_id, product_name, price)
VALUES (
  uuid(),
  toTimestamp(now()),
  uuid(),
  '507f1f77bcf86cd799439011',
  'Produto Exemplo',
  99.90
);

# Busca o último produto visto (substitua pelo UUID gerado acima)
SELECT * FROM product_views WHERE user_id = <uuid-gerado> LIMIT 1;

# Insere um login de teste
INSERT INTO login_history (user_id, logged_at, login_id, ip_address, device)
VALUES (uuid(), toTimestamp(now()), uuid(), '192.168.1.1', 'Chrome/Linux');

# Sai do cqlsh
EXIT
```

> **Atenção:** o Cassandra exige que o keyspace e as tabelas existam antes de inserir dados. O `init.cql` é executado automaticamente na primeira subida do container.

---

## MinIO

### Via Console web (GUI)

Acesse `http://localhost:9001` no browser.

- **Usuário:** `minioadmin`
- **Senha:** `minioadmin123`

Os três buckets já estarão criados automaticamente pelo `minio-init`:
- `marketplace-products`
- `marketplace-avatars`
- `marketplace-static`

### Via terminal

```bash
# Acessa o mc (MinIO Client) dentro do container minio
docker exec -it marketplace_minio mc alias set local http://localhost:9000 minioadmin minioadmin123

# Lista os buckets
docker exec -it marketplace_minio mc ls local

# Verifica se os buckets têm acesso público
docker exec -it marketplace_minio mc anonymous get local/marketplace-products

# Faz upload de um arquivo de teste
echo "teste" > /tmp/teste.txt
docker cp /tmp/teste.txt marketplace_minio:/tmp/teste.txt
docker exec -it marketplace_minio mc cp /tmp/teste.txt local/marketplace-products/teste.txt

# Confirma o upload
docker exec -it marketplace_minio mc ls local/marketplace-products

# Acessa a URL pública do arquivo
# http://localhost:9000/marketplace-products/teste.txt

# Remove o arquivo de teste
docker exec -it marketplace_minio mc rm local/marketplace-products/teste.txt
```

---

## Verificação geral

```bash
# Status de todos os containers
docker compose ps

# Logs de um serviço específico
docker compose logs postgres
docker compose logs mongo
docker compose logs redis
docker compose logs cassandra
docker compose logs minio

# Reinicia um serviço com problema
docker compose restart cassandra

# Para tudo sem apagar os dados
docker compose down

# Para tudo E apaga todos os volumes (reset completo)
docker compose down -v
```

---

## Mapa de portas

| Serviço          | Porta  | Tipo        |
|------------------|--------|-------------|
| Frontend         | `3000` | Aplicação   |
| Backend API      | `4000` | Aplicação   |
| PostgreSQL       | `5432` | Banco       |
| MongoDB          | `27017`| Banco       |
| Redis            | `6379` | Banco       |
| Cassandra        | `9042` | Banco       |
| MinIO API (S3)   | `9000` | Storage     |
| pgAdmin          | `5050` | GUI         |
| Mongo Express    | `8081` | GUI         |
| RedisInsight     | `5540` | GUI         |
| Cassandra Web    | `3001` | GUI         |
| MinIO Console    | `9001` | GUI         |
