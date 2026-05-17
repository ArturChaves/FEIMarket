# Documentação Técnica — Marketplace Multi-Banco

## Sumário

1. [Tema e Motivação](#1-tema-e-motivação)
2. [Integrantes](#2-integrantes)
3. [Bancos de Dados Utilizados](#3-bancos-de-dados-utilizados)
4. [Linguagem, Pacotes e Ambiente](#4-linguagem-pacotes-e-ambiente)
5. [Teorema CAP](#5-teorema-cap)
6. [Divisão dos Dados](#6-divisão-dos-dados)
7. [ORM](#7-orm)
8. [Modelagem do Banco Relacional](#8-modelagem-do-banco-relacional)

---

## 1. Tema e Motivação

**Tema:** Marketplace multi-banco — uma plataforma de comércio eletrônico onde vendedores cadastram produtos, compradores montam carrinhos e realizam compras com transações financeiras entre contas.

**Por que este tema foi escolhido:**
O marketplace é um domínio rico o suficiente para justificar o uso de cinco tecnologias de armazenamento distintas de forma orgânica e não forçada. Cada aspecto do negócio tem características de acesso radicalmente diferentes — dados transacionais de alta integridade, documentos flexíveis, cache de alta velocidade, séries temporais de eventos e armazenamento de arquivos binários — tornando-o um caso de uso ideal para demonstrar as vantagens e trade-offs de cada banco.

**Outros temas considerados:**
- Sistema de reservas de hotel (descartado por ter estrutura mais uniforme, menos motivação para múltiplos bancos)
- Rede social (descartado por exigir grafo, que não era um dos bancos no escopo)
- RPG Idle (camada multiplayer muito complexa para um projeto academico)

---

## 2. Integrantes

- > Artur Chaves Paiva       RA: 22.223.023-7
- > Arthur Leal Mussio       RA: 22.223.017-9
- > Giovanni Antonio Moreira RA: 22.223.010-4
- > Felipe Brum Pereira      RA: 22.123.112-9

---

## 3. Bancos de Dados Utilizados

O projeto utiliza cinco tecnologias de armazenamento, cada uma selecionada para o tipo de dado que gerencia com mais eficiência.

### PostgreSQL 16
**Dados armazenados:**
- `users` — id, name, email, password_hash, role, balance, avatar_url, is_active, created_at, updated_at
- `orders` — id, client_id, total, created_at
- `order_items` — id, order_id, seller_id, product_id, product_name, quantity, unit_price, subtotal
- `transactions` — id, client_id, seller_id, order_item_id, amount, created_at

**Motivo da escolha:** Os dados financeiros exigem garantias ACID completas. O saldo do comprador é debitado e o saldo de cada vendedor é creditado dentro de uma única transação. Se qualquer etapa falhar (ex: insuficiência de saldo, erro de rede), toda a operação é revertida com `ROLLBACK`. Nenhum banco não-relacional oferece esse nível de atomicidade entre múltiplos registros com a mesma maturidade e simplicidade do PostgreSQL.

### MongoDB 7
**Dados armazenados:**
- `products` — seller_id, seller_name, title, description, price, stock, category, images (array), attributes (objeto livre), is_active, created_at, updated_at
- `reviews` — product_id, user_id, rating, comment, created_at

**Motivo da escolha:** Produtos em um marketplace têm atributos altamente heterogêneos. Um eletrônico tem voltagem e garantia; um livro tem ISBN e número de páginas; uma roupa tem tamanho e material. O campo `attributes` do tipo `Mixed` permite armazenar qualquer estrutura sem alterações de schema. Além disso, o MongoDB possui índice de texto nativo (`$text`) utilizado para a busca de produtos por título e descrição, e suporte a agregações complexas como a ordenação por média de avaliações via `$lookup` + `$avg`.

### Redis 7
**Dados armazenados:**
- `cart:{userId}` — Hash com `productId → quantity` para cada item do carrinho
- `search:{filtros}` — String JSON com resultado paginado de buscas (TTL de 5 minutos)

**Motivo da escolha:** O carrinho de compras é um dos dados mais acessados e mais voláteis do sistema. Armazená-lo em Redis permite leitura e escrita em sub-milissegundo, sem overhead de parsing ou joins. O cache de busca evita repetir queries MongoDB para combinações de filtros idênticas, com invalidação automática ao criar, atualizar ou deletar produtos.

### Apache Cassandra 4.1
**Dados armazenados:**
- `marketplace.login_history` — user_id, logged_at, login_id, ip_address, device
- `marketplace.product_views` — user_id, viewed_at, view_id, product_id, product_name, price
- `marketplace.purchase_history` — user_id, purchased_at, purchase_id, order_id, product_id, product_name, quantity, total

**Motivo da escolha:** Eventos de comportamento do usuário (logins, visualizações, compras) são inseridos com alta frequência e consultados sempre pelo `user_id` ordenados por tempo. O modelo de dados do Cassandra é otimizado exatamente para esse padrão: a chave de partição (`user_id`) garante que todos os eventos de um usuário ficam no mesmo nó, e as chaves de clustering (`logged_at DESC, login_id DESC`) ordenam os registros cronologicamente sem precisar de `ORDER BY` na query. Writes são extremamente baratos — Cassandra é otimizado para append-only, o padrão exato de logs de atividade.

### MinIO (S3-compatible)
**Dados armazenados:**
- Bucket `marketplace-products` — imagens de produtos (JPEG, PNG, WebP)
- Bucket `marketplace-avatars` — avatares de usuários

**Motivo da escolha:** Imagens não devem ser armazenadas em bancos de dados relacionais (aumenta o tamanho do banco, degrada performance) nem em NoSQL de documentos. O MinIO oferece uma API compatível com AWS S3, permite servir arquivos diretamente via URL pública, e pode ser hospedado localmente via Docker. Cada imagem é referenciada por URL pública no MongoDB, mantendo os dados e os binários separados.

---

## 4. Linguagem, Pacotes e Ambiente

**Linguagem:** TypeScript (Node.js 20)

**Motivo:** TypeScript adiciona tipagem estática ao JavaScript, eliminando uma classe inteira de erros em runtime — especialmente importante em um projeto com múltiplos bancos e formatos de dados distintos. O modo `strict` com `noImplicitAny`, `strictNullChecks` e `noUncheckedIndexedAccess` está habilitado, forçando o tratamento explícito de valores possivelmente nulos vindos dos bancos.

**Framework web:** Express 4 — maduro, minimalista, com ecossistema consolidado para APIs REST.

**Pacotes principais:**

| Pacote | Versão | Função |
|--------|--------|--------|
| `express` | ^4.19.2 | Framework HTTP |
| `pg`      | ^8.12.0 | Driver PostgreSQL (raw SQL) |
| `mongoose`| ^8.4.1 | ODM MongoDB |
| `ioredis` | ^5.3.2 | Cliente Redis |
| `cassandra-driver` | ^4.7.2 | Driver Cassandra |
| `minio`   | ^8.0.1 | Cliente MinIO/S3 |
| `bcryptjs` | ^3.0.3 | Hash de senhas |
| `zod` | ^3.23.8 | Validação de entrada |
| `multer` | ^1.4.5-lts.1 | Upload de arquivos (memoryStorage) |
| `swagger-ui-express` | ^5.0.1 | Documentação interativa |
| `dotenv` | ^16.4.5 | Variáveis de ambiente |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing |
| `tsx` | ^4.16.2 | Execução TypeScript em dev (watch mode) |
| `typescript` | ^5.5.3 | Compilador TypeScript |

**Ambiente de desenvolvimento:** Docker Compose. Todos os bancos, ferramentas de administração e a aplicação rodam em containers isolados na rede `marketplace_net`. O código-fonte é montado como volume (`./Backend:/app`) com `tsx watch` para hot reload. Isso garante paridade entre os ambientes de todos os integrantes e elimina dependências locais de instalação.

---

## 5. Teorema CAP

O teorema CAP afirma que um sistema distribuído pode garantir no máximo dois dos três atributos: **Consistência** (C), **Disponibilidade** (A) e **Tolerância a Partições** (P).

### PostgreSQL — CP
Quando indisponível (nó primário cai, rede particionada), o sistema **para de aceitar escritas e pode rejeitar leituras**. Em configuração single-node (como neste projeto), toda a autenticação, checkout e histórico de pedidos ficam inacessíveis. Em produção com replicação, o failover leva alguns segundos/minutos, período em que o banco fica indisponível. PostgreSQL prioriza consistência: nunca retorna dados potencialmente desatualizados.

**Impacto no projeto:** Login, checkout e consulta de pedidos indisponíveis. As demais operações (busca de produtos, carrinho) continuam funcionando nos outros bancos.

### MongoDB — CP (padrão)
Com write concern `majority` (padrão), escritas só são confirmadas após a maioria dos nós replicar. Se o primário cair, o replica set elege um novo primário em ~10 segundos; durante esse período, escritas são rejeitadas. Leituras podem continuar em secundários com consistência eventual.

**Impacto no projeto:** Criação e atualização de produtos indisponíveis. Listagem de produtos pode continuar via cache Redis por até 5 minutos.

### Redis — CP (single node) / AP (cluster)
Na configuração single-node deste projeto, Redis é CP: se cair, o servidor rejeita todas as operações. Não há replicação automática. Em Redis Cluster, torna-se AP com consistência eventual entre slots.

**Impacto no projeto:** Carrinho de compras e cache de busca indisponíveis. O checkout deixaria de funcionar (depende do carrinho Redis). A listagem de produtos voltaria diretamente ao MongoDB sem cache.

### Cassandra — AP
Cassandra foi projetado para disponibilidade máxima. Com `replication_factor=1` (configuração deste projeto), se o único nó cair, os dados ficam inacessíveis. Com RF≥3 e `consistency level = ONE`, o sistema continua operando mesmo com nós em falha, mas pode retornar dados levemente desatualizados.

**Impacto no projeto:** O registro de logins, visualizações e compras em Cassandra está envolvido em `try/catch` individual no serviço — se Cassandra estiver fora, o perfil do usuário ainda é retornado com os campos de atividade como `null`, sem derrubar o endpoint. O checkout pode ser impactado no registro do `purchase_history`, mas a transação financeira no PostgreSQL já terá sido concluída.

### MinIO — AP
MinIO em modo single-node não oferece redundância. Se cair, uploads e downloads de imagens falham. Os dados de produtos e usuários no MongoDB/PostgreSQL permanecem íntegros.

**Impacto no projeto:** Upload de imagens de produtos e avatares indisponível. Produtos já cadastrados perdem as URLs de imagem se o bucket estiver inacessível.

---

## 6. Divisão dos Dados

A divisão foi guiada pela natureza de cada tipo de dado e pelo padrão de acesso predominante:

| Critério | Banco escolhido | Justificativa |
|----------|----------------|---------------|
| **Integridade transacional** (dinheiro, pedidos) | PostgreSQL | ACID é inegociável para movimentação financeira |
| **Schema flexível** (produtos com atributos variáveis) | MongoDB | Diferentes categorias têm atributos incompatíveis entre si |
| **Alta velocidade de leitura/escrita** (carrinho, cache) | Redis | Estrutura in-memory, latência <1ms, TTL nativo |
| **Eventos imutáveis com ordenação temporal** (logins, views) | Cassandra | Optimizado para write-heavy append-only com partition key por usuário |
| **Arquivos binários** (imagens) | MinIO | Separação de binários do banco de dados; URL pública direta |

A decisão central foi manter **consistência financeira no PostgreSQL** e **flexibilidade de catálogo no MongoDB**, usando Redis e Cassandra para dados que toleram eventual consistency em troca de performance.

---

## 7. ORM

**PostgreSQL:** optamos por **não utilizar ORM**. Todas as queries são escritas em SQL puro com o driver `pg`. Essa decisão foi tomada para que as consultas ao banco de dados sejam explícitas e visíveis no repositório, sem abstrações escondendo o que está sendo executado. O padrão Repository encapsula todas as queries em métodos tipados em TypeScript. Consideramos utilizar ORM, porém como o escopo era pequeno e não havia possibilidade de termos migrations que geralmente ocorrem com a evolução do sftware, optamos por seguir sem ORM, porém claramente para um projeto de maior escopo seria interessante o
uso.

**MongoDB:** utiliza **Mongoose** como ODM (Object Document Mapper). Mongoose não é estritamente um ORM (não há "relações" no sentido relacional), mas cumpre papel similar: define schemas com validação, índices e tipagem TypeScript. Foi escolhido por ser o ODM mais maduro do ecossistema Node.js/MongoDB.

**Redis e Cassandra:** drivers nativos (`ioredis` e `cassandra-driver`) sem camada de abstração adicional.

---

## 8. Modelagem do Banco Relacional

O PostgreSQL armazena os dados transacionais do sistema. Abaixo estão as quatro tabelas que compõem o modelo relacional, com seus tipos, constraints e relacionamentos:

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'client',
  balance       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES users(id),
  total      NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id),
  seller_id    UUID NOT NULL REFERENCES users(id),
  product_id   TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity     INT NOT NULL,
  unit_price   NUMERIC(10, 2) NOT NULL,
  subtotal     NUMERIC(10, 2) NOT NULL
);

CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES users(id),
  seller_id     UUID NOT NULL REFERENCES users(id),
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  amount        NUMERIC(10, 2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

O `product_id` em `order_items` é armazenado como `TEXT` (em vez de FK para o MongoDB) porque produtos são gerenciados no MongoDB. O `product_name` é desnormalizado para preservar o histórico — mesmo que o produto seja removido do catálogo, o pedido mantém o registro do que foi comprado.

---

## Arquitetura Resumida

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cliente (Frontend)                        │
└─────────────────────────┬───────────────────────────────────────┘
                           │ HTTP REST
┌─────────────────────────▼───────────────────────────────────────┐
│              Backend Node.js + Express + TypeScript              │
│         Controllers → Services → Repositories                    │
└───┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
PostgreSQL  MongoDB    Redis     Cassandra   MinIO
(usuários   (produtos  (carrinho  (eventos   (imagens)
 pedidos    reviews)   cache)    de usuário)
 finanças)
```

## Endpoints Disponíveis

| Método | Rota | Banco(s) |
|--------|------|---------|
| GET | `/health` | Todos |
| POST | `/auth/register` | PostgreSQL + Cassandra |
| POST | `/auth/login` | PostgreSQL + Cassandra |
| GET | `/products` | Redis (cache) → MongoDB |
| POST | `/products` | PostgreSQL + MongoDB + MinIO + Redis |
| GET | `/products/:id` | MongoDB + Cassandra |
| PUT | `/products/:id` | MongoDB + MinIO + Redis |
| DELETE | `/products/:id` | MongoDB + MinIO + Redis |
| GET | `/products/:id/reviews` | MongoDB |
| POST | `/products/:id/reviews` | MongoDB |
| GET | `/cart/:userId` | Redis + MongoDB |
| POST | `/cart/:userId/items` | MongoDB + Redis |
| PUT | `/cart/:userId/items/:productId` | MongoDB + Redis |
| DELETE | `/cart/:userId/items/:productId` | Redis |
| DELETE | `/cart/:userId` | Redis |
| POST | `/orders/checkout` | Redis + MongoDB + PostgreSQL + Cassandra |
| GET | `/orders/:userId` | PostgreSQL |
| GET | `/users/:userId/profile` | PostgreSQL + Cassandra |
| PUT | `/users/:userId/profile` | PostgreSQL |
| PATCH | `/users/:userId/balance` | PostgreSQL |
| POST | `/users/:userId/avatar` | PostgreSQL + MinIO |
| GET | `/admin/stats/postgres` | PostgreSQL |
| GET | `/admin/stats/mongo` | MongoDB |
| GET | `/admin/stats/redis` | Redis |
| GET | `/admin/stats/cassandra` | Cassandra |

## Ferramentas de Observabilidade

| Ferramenta | URL | Banco |
|-----------|-----|-------|
| Swagger UI | http://localhost:4000/api-docs | API |
| pgAdmin | http://localhost:5050 | PostgreSQL |
| Mongo Express | http://localhost:8081 | MongoDB |
| RedisInsight | http://localhost:5540 | Redis |
| Cassandra Web | http://localhost:3001 | Cassandra |
| MinIO Console | http://localhost:9001 | MinIO |

---

## Como Executar o Projeto

### Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução
- Git para clonar o repositório
- ~6 GB de RAM disponível
- ~4 GB de espaço em disco para as imagens Docker
- Portas livres: `3000`, `4000`, `5432`, `5050`, `8081`, `9000`, `9001`, `9042`, `3001`, `6379`, `5540`

### Passos

**1. Clonar o repositório**
```bash
git clone <url-do-repositorio>
cd <pasta-do-projeto>
```

**2. Subir todos os containers**
```bash
docker compose up
```

O comando sobe em paralelo: PostgreSQL, MongoDB, Redis, Cassandra, MinIO, o backend Node.js e todas as ferramentas de administração. Na primeira execução, o Docker baixa as imagens (~3–5 minutos dependendo da conexão).

**3. Aguardar a inicialização**

O backend imprime `Server running on port 4000` quando estiver pronto. O Cassandra é o banco mais lento para inicializar (~60 segundos); o backend aguarda automaticamente via healthcheck no Docker Compose. Os buckets do MinIO (`marketplace-products`, `marketplace-avatars`) são criados e configurados como públicos automaticamente pelo serviço `minio-init` na primeira execução.

**4. Acessar a API**

A documentação interativa com todos os endpoints está disponível em:
```
http://localhost:4000/api-docs
```

### Parar o ambiente

```bash
# Para os containers sem remover os dados
docker compose stop

# Para e remove containers + volumes (apaga todos os dados)
docker compose down -v
```

### Variáveis de ambiente

O arquivo `.env` na raiz do projeto (ou as variáveis já definidas no `docker-compose.yml`) configuram as conexões entre serviços. Para desenvolvimento local, nenhuma alteração é necessária — todos os valores padrão apontam para os containers da rede `marketplace_net`.
