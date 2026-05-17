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

  },
};
