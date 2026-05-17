import type { OpenAPIV3 } from 'openapi-types';

export const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Marketplace API',
    version: '1.0.0',
    description: 'Backend marketplace multi-database — PostgreSQL, MongoDB, Redis, Cassandra, MinIO',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Desenvolvimento' }],

  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id:         { type: 'string', format: 'uuid' },
          name:       { type: 'string' },
          email:      { type: 'string', format: 'email' },
          role:       { type: 'string', enum: ['client', 'admin'] },
          balance:    { type: 'number', example: 1000.00 },
        },
      },
      Product: {
        type: 'object',
        properties: {
          _id:         { type: 'string' },
          seller_id:   { type: 'string', format: 'uuid' },
          seller_name: { type: 'string' },
          title:       { type: 'string' },
          description: { type: 'string' },
          price:       { type: 'number' },
          stock:       { type: 'integer' },
          category:    { type: 'string' },
          images:      { type: 'array', items: { type: 'string', format: 'uri' } },
          attributes:  { type: 'object' },
          is_active:   { type: 'boolean' },
          created_at:  { type: 'string', format: 'date-time' },
          updated_at:  { type: 'string', format: 'date-time' },
        },
      },
      Review: {
        type: 'object',
        properties: {
          _id:        { type: 'string' },
          product_id: { type: 'string' },
          user_id:    { type: 'string', format: 'uuid' },
          rating:     { type: 'integer', minimum: 1, maximum: 5 },
          comment:    { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          productId:   { type: 'string' },
          quantity:    { type: 'integer' },
          title:       { type: 'string' },
          price:       { type: 'number' },
          seller_name: { type: 'string' },
          images:      { type: 'array', items: { type: 'string' } },
          stock:       { type: 'integer' },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          id:           { type: 'string', format: 'uuid' },
          product_id:   { type: 'string' },
          product_name: { type: 'string' },
          quantity:     { type: 'integer' },
          unit_price:   { type: 'number' },
          subtotal:     { type: 'number' },
          seller_id:    { type: 'string', format: 'uuid' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id:         { type: 'string', format: 'uuid' },
          client_id:  { type: 'string', format: 'uuid' },
          total:      { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
          items:      { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },

  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Health check de todos os bancos',
        responses: {
          '200': {
            description: 'Status de cada conexão',
            content: {
              'application/json': {
                example: {
                  status: 'ok',
                  databases: {
                    postgres: 'connected', mongo: 'connected',
                    redis: 'connected', cassandra: 'connected', minio: 'connected',
                  },
                },
              },
            },
          },
        },
      },
    },

    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Criar conta',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name:     { type: 'string', example: 'João Silva' },
                  email:    { type: 'string', format: 'email', example: 'joao@email.com' },
                  password: { type: 'string', minLength: 6, example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuário criado',
            content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } },
          },
          '500': { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email', example: 'joao@email.com' },
                  password: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login bem-sucedido',
            content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } },
          },
          '401': { description: 'Credenciais inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Usuário inativo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/products': {
      get: {
        tags: ['Produtos'],
        summary: 'Listar produtos com filtros e cache Redis',
        parameters: [
          { name: 'search',   in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',    in: 'query', schema: { type: 'integer', default: 12 } },
          { name: 'order',    in: 'query', schema: { type: 'string', enum: ['time', 'price', 'rating'], default: 'time' } },
        ],
        responses: {
          '200': {
            description: 'Lista paginada de produtos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products:   { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                    total:      { type: 'integer' },
                    page:       { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Produtos'],
        summary: 'Criar produto com upload de imagens (MinIO)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['userId', 'title', 'description', 'price', 'stock', 'category'],
                properties: {
                  userId:      { type: 'string', format: 'uuid' },
                  title:       { type: 'string' },
                  description: { type: 'string' },
                  price:       { type: 'number' },
                  stock:       { type: 'integer' },
                  category:    { type: 'string' },
                  attributes:  { type: 'string', description: 'JSON string com atributos extras' },
                  images:      { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Produto criado', content: { 'application/json': { schema: { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' } } } } } },
          '404': { description: 'Usuário não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/products/{id}': {
      get: {
        tags: ['Produtos'],
        summary: 'Buscar produto por ID (registra view no Cassandra se userId informado)',
        parameters: [
          { name: 'id',     in: 'path',  required: true, schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Produto e suas reviews',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    product: { $ref: '#/components/schemas/Product' },
                    reviews: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
                  },
                },
              },
            },
          },
          '404': { description: 'Produto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Produtos'],
        summary: 'Atualizar produto (opcionalmente troca imagens no MinIO)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId:      { type: 'string', format: 'uuid' },
                  title:       { type: 'string' },
                  description: { type: 'string' },
                  price:       { type: 'number' },
                  stock:       { type: 'integer' },
                  category:    { type: 'string' },
                  attributes:  { type: 'string' },
                  images:      { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Produto atualizado', content: { 'application/json': { schema: { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' } } } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Produto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Produtos'],
        summary: 'Desativar produto (soft delete)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['userId'], properties: { userId: { type: 'string', format: 'uuid' } } } } },
        },
        responses: {
          '200': { description: 'Produto removido', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },


    '/cart/{userId}': {
      get: {
        tags: ['Carrinho'],
        summary: 'Buscar carrinho do usuário (Redis + dados do MongoDB)',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Itens do carrinho', content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } } } } } } },
        },
      },
      delete: {
        tags: ['Carrinho'],
        summary: 'Limpar carrinho inteiro',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Carrinho limpo', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
        },
      },
    },

    '/cart/{userId}/items': {
      post: {
        tags: ['Carrinho'],
        summary: 'Adicionar item ao carrinho',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'string' },
                  quantity:  { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Item adicionado', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          '400': { description: 'Estoque insuficiente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Produto não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/cart/{userId}/items/{productId}': {
      put: {
        tags: ['Carrinho'],
        summary: 'Atualizar quantidade de um item',
        parameters: [
          { name: 'userId',    in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['quantity'], properties: { quantity: { type: 'integer', minimum: 1 } } } } },
        },
        responses: {
          '200': { description: 'Quantidade atualizada', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
        },
      },
      delete: {
        tags: ['Carrinho'],
        summary: 'Remover item do carrinho',
        parameters: [
          { name: 'userId',    in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Item removido', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
        },
      },
    },

    '/orders/checkout': {
      post: {
        tags: ['Pedidos'],
        summary: 'Finalizar compra — transação atômica multi-banco',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['userId'], properties: { userId: { type: 'string', format: 'uuid' } } } } },
        },
        responses: {
          '201': { description: 'Compra realizada', content: { 'application/json': { schema: { type: 'object', properties: { order: { $ref: '#/components/schemas/Order' }, message: { type: 'string' } } } } } },
          '400': { description: 'Carrinho vazio ou estoque insuficiente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Saldo insuficiente ou erro na transação', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/orders/{userId}': {
      get: {
        tags: ['Pedidos'],
        summary: 'Listar pedidos do usuário',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Lista de pedidos', content: { 'application/json': { schema: { type: 'object', properties: { orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } } } },
        },
      },
    },

    '/products/{id}/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'Listar reviews de um produto',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Lista de reviews', content: { 'application/json': { schema: { type: 'object', properties: { reviews: { type: 'array', items: { $ref: '#/components/schemas/Review' } } } } } } },
        },
      },
      post: {
        tags: ['Reviews'],
        summary: 'Criar review para um produto',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'rating', 'comment'],
                properties: {
                  userId:  { type: 'string', format: 'uuid' },
                  rating:  { type: 'integer', minimum: 1, maximum: 5 },
                  comment: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Review criada', content: { 'application/json': { schema: { type: 'object', properties: { review: { $ref: '#/components/schemas/Review' } } } } } },
        },
      },
    },

    '/users/{userId}/profile': {
      get: {
        tags: ['Usuários'],
        summary: 'Buscar perfil do usuário (PostgreSQL + Cassandra)',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Perfil do usuário com histórico Cassandra',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user:      { $ref: '#/components/schemas/User' },
                    cassandra: {
                      type: 'object',
                      properties: {
                        last_login:    { type: 'object', nullable: true },
                        last_view:     { type: 'object', nullable: true },
                        last_purchase: { type: 'object', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': { description: 'Usuário não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Usuários'],
        summary: 'Atualizar perfil do usuário',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name:  { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Perfil atualizado', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          '400': { description: 'Nenhum campo informado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Usuário não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/admin/stats/postgres': {
      get: {
        tags: ['Admin'],
        summary: 'Estatísticas PostgreSQL (admin)',
        parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Stats de usuários e pedidos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users:  { type: 'object', properties: { total: { type: 'integer' }, active: { type: 'integer' } } },
                    orders: { type: 'object', properties: { total: { type: 'integer' }, total_revenue: { type: 'number' }, products_sold: { type: 'integer' } } },
                  },
                },
              },
            },
          },
          '401': { description: 'userId obrigatório', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Acesso restrito a administradores', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/admin/stats/mongo': {
      get: {
        tags: ['Admin'],
        summary: 'Estatísticas MongoDB (admin)',
        parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Stats de produtos e reviews',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: { type: 'object', properties: { total: { type: 'integer' }, active: { type: 'integer' }, per_category: { type: 'object' } } },
                    reviews:  { type: 'object', properties: { total: { type: 'integer' }, avg_rating: { type: 'number', nullable: true } } },
                  },
                },
              },
            },
          },
          '403': { description: 'Acesso restrito a administradores', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/admin/stats/redis': {
      get: {
        tags: ['Admin'],
        summary: 'Estatísticas Redis (admin)',
        parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Stats de conexões e chaves',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    connected_clients: { type: 'integer' },
                    used_memory_human: { type: 'string' },
                    keys: { type: 'object', properties: { cart: { type: 'integer' }, search: { type: 'integer' } } },
                  },
                },
              },
            },
          },
          '403': { description: 'Acesso restrito a administradores', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/admin/stats/cassandra': {
      get: {
        tags: ['Admin'],
        summary: 'Estatísticas Cassandra (admin)',
        parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Contagem de eventos por tabela',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_logins:    { type: 'integer' },
                    total_views:     { type: 'integer' },
                    total_purchases: { type: 'integer' },
                  },
                },
              },
            },
          },
          '403': { description: 'Acesso restrito a administradores', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/users/{userId}/balance': {
      patch: {
        tags: ['Usuários'],
        summary: 'Adicionar saldo ao usuário',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number', minimum: 0.01, example: 100.00 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Saldo adicionado',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } },
          },
          '400': { description: 'Valor inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Usuário não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/users/{userId}/avatar': {
      post: {
        tags: ['Usuários'],
        summary: 'Upload de avatar do usuário (MinIO)',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Avatar enviado',
            content: { 'application/json': { schema: { type: 'object', properties: { avatar_url: { type: 'string', format: 'uri' } } } } },
          },
          '400': { description: 'Nenhuma imagem enviada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

  },
};
