/**
 * FEIMarket Database Populator Script
 * 
 * This script runs in Node.js (v18+) and populates the database by making HTTP requests
 * to the FEIMarket backend API. It creates 5 test users, adds balance to them,
 * registers 30 university-themed products with high-resolution realistic image uploads,
 * posts reviews from different users, and performs purchases.
 * 
 * Usage: node populate.js
 */

const API_BASE = 'http://localhost:4000';

// 1x1 transparent PNG buffer as fallback in case of network issues
const MOCK_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const mockImageBuffer = Buffer.from(MOCK_IMAGE_BASE64, 'base64');

const USERS = [
  { name: 'Ana Silva', email: 'ana.silva@fei.edu.br', password: 'password123' },
  { name: 'Bruno Santos', email: 'bruno.santos@fei.edu.br', password: 'password123' },
  { name: 'Carlos Oliveira', email: 'carlos.oliveira@fei.edu.br', password: 'password123' },
  { name: 'Daniela Souza', email: 'daniela.souza@fei.edu.br', password: 'password123' },
  { name: 'Eduardo Lima', email: 'eduardo.lima@fei.edu.br', password: 'password123' },
];

const PRODUCTS_TEMPLATE = [
  // Category: Livros (6 products)
  { 
    title: 'Cálculo 1 - James Stewart (8ª Edição)', 
    description: 'Livro essencial para engenharias. Ótimo estado de conservação, sem rasuras.', 
    price: 120, 
    category: 'Livros', 
    stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Introdução aos Algoritmos - Cormen', 
    description: 'Bíblia da ciência da computação. Edição capa dura, poucas marcas de uso.', 
    price: 180, 
    category: 'Livros', 
    stock: 2,
    imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Física Universitária Vol 1 - Sears & Zemansky', 
    description: 'Volume 1 contendo mecânica clássica. Perfeito para Física I.', 
    price: 110, 
    category: 'Livros', 
    stock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Álgebra Linear e Suas Aplicações - Gilbert Strang', 
    description: 'Excelente livro conceitual de álgebra linear com exemplos práticos.', 
    price: 95, 
    category: 'Livros', 
    stock: 2,
    imageUrl: 'https://images.unsplash.com/photo-1453733190148-c44698c265f8?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Química Geral - Raymond Chang', 
    description: 'Livro de química geral usado no ciclo básico da FEI.', 
    price: 85, 
    category: 'Livros', 
    stock: 1,
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Engenharia de Software - Ian Sommerville', 
    description: '9ª edição, ideal para estudantes de engenharia e ciência da computação.', 
    price: 140, 
    category: 'Livros', 
    stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=600&q=80'
  },

  // Category: Eletrônicos (6 products)
  { 
    title: 'Calculadora Científica Casio fx-991LAX', 
    description: 'Calculadora científica recomendada para provas. Menu em português, solar.', 
    price: 150, 
    category: 'Eletrônicos', 
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1610824244888-2a365b91d2b1?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Calculadora HP 50g Gráfica', 
    description: 'Em perfeito estado. Acompanha capa protetora de couro e cartão SD de 2GB.', 
    price: 350, 
    category: 'Eletrônicos', 
    stock: 1,
    imageUrl: 'https://images.unsplash.com/photo-1518133680790-3985ecea3ecf?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Arduino Uno R3 com Cabo USB', 
    description: 'Placa original para projetos de robótica e eletrônica digital.', 
    price: 75, 
    category: 'Eletrônicos', 
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1608564697071-ddf911d81370?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Kit Prático de Prototipagem Breadboard e Jumpers', 
    description: 'Breadboard de 830 pontos com 65 jumpers macho-macho prontos para uso.', 
    price: 45, 
    category: 'Eletrônicos', 
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Multímetro Digital Portátil Minipa ET-1002', 
    description: 'Mede tensão, corrente e resistência. Ideal para laboratórios de circuitos.', 
    price: 90, 
    category: 'Eletrônicos', 
    stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1581092334651-ddf1a896d1d0?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Teclado Mecânico Redragon Kumara Switch Blue', 
    description: 'Layout ABNT2, iluminação vermelha, excelente resposta tátil.', 
    price: 210, 
    category: 'Eletrônicos', 
    stock: 2,
    imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80'
  },

  // Category: Material Acadêmico (6 products)
  { 
    title: 'Jaleco de Algodão Branco Manga Longa', 
    description: 'Tamanho G. Uso obrigatório nos laboratórios de química e física.', 
    price: 65, 
    category: 'Material Acadêmico', 
    stock: 6,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Estojo Estilo Prancheta de Desenho A3', 
    description: 'Perfeito para aulas de desenho técnico da engenharia básica.', 
    price: 130, 
    category: 'Material Acadêmico', 
    stock: 2,
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Par de Réguas Desenho Técnico 45 e 60 Graus Trident', 
    description: 'Acrílico cristal de alta precisão. Sem imperfeições nas bordas.', 
    price: 40, 
    category: 'Material Acadêmico', 
    stock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Kit Canetas Técnicas Nanquim Descartáveis Sakura (3 unidades)', 
    description: 'Espessuras 0.2, 0.4 e 0.8mm para desenho arquitetônico e projetos.', 
    price: 55, 
    category: 'Material Acadêmico', 
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Caderno Universitário FEI 10 Matérias Espiral', 
    description: 'Capa dura personalizada com o brasão da FEI. 200 folhas pautadas.', 
    price: 30, 
    category: 'Material Acadêmico', 
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Compasso Profissional de Precisão com Alongador', 
    description: 'Ideal para geometria descritiva e desenho técnico.', 
    price: 80, 
    category: 'Material Acadêmico', 
    stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  },

  // Category: Serviços (6 products)
  { 
    title: 'Aulas de Reforço de Cálculo I e II', 
    description: 'Aulas individuais online ou presenciais na FEI. Foco na resolução de provas antigas e exercícios de cálculo.', 
    price: 50, 
    category: 'Serviços', 
    stock: 99,
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Aulas de Programação em C e C++', 
    description: 'Apoio especializado para as disciplinas de Algoritmos I e II da FEI. Didática simplificada.', 
    price: 60, 
    category: 'Serviços', 
    stock: 99,
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Impressão 3D de Protótipos PLA/ABS (por hora)', 
    description: 'Envie seu arquivo STL de projetos integradores ou TCC e farei a impressão em alta resolução.', 
    price: 25, 
    category: 'Serviços', 
    stock: 99,
    imageUrl: 'https://images.unsplash.com/photo-1615840287214-7fe58a8f668f?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Tradução Acadêmica de Artigos Português-Inglês', 
    description: 'Tradução técnica realizada por aluno fluente com experiência internacional e termos de engenharia.', 
    price: 80, 
    category: 'Serviços', 
    stock: 99,
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Formatação de TCC nas normas ABNT', 
    description: 'Deixe as regras chatas de lado. Formato seu trabalho completo com citações, referências e paginação ágil.', 
    price: 150, 
    category: 'Serviços', 
    stock: 99,
    imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Instalação e Configuração de Matlab, Solidworks e AutoCAD', 
    description: 'Ajudo a instalar e configurar softwares licenciados pela faculdade no seu notebook pessoal sem complicações.', 
    price: 40, 
    category: 'Serviços', 
    stock: 99,
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'
  },

  // Category: Vestuário (6 products)
  { 
    title: 'Moletom Oficial FEI Azul Marinho G', 
    description: 'Moletom com capuz e estampa bordada oficial. Super quente e confortável.', 
    price: 160, 
    category: 'Vestuário', 
    stock: 2,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Camiseta Oficial FEI Engenharia Preta M', 
    description: 'Camiseta 100% algodão com silk de alta durabilidade para o cotidiano no campus.', 
    price: 45, 
    category: 'Vestuário', 
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Boné da Atlética FEI Aba Curva', 
    description: 'Aba curva com fecho regulável e logo bordado em alta definição.', 
    price: 50, 
    category: 'Vestuário', 
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Corta Vento FEI Universitário Impermeável M', 
    description: 'Ideal para dias chuvosos e ventosos no campus. Ótimo tecido com zíper tratorado.', 
    price: 130, 
    category: 'Vestuário', 
    stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Meião FEI da Atlética Esportivo', 
    description: 'Meias atoalhadas reforçadas com as cores oficiais da faculdade. Unissex.', 
    price: 25, 
    category: 'Vestuário', 
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&w=600&q=80'
  },
  { 
    title: 'Sacola Esportiva Mochilinha FEI', 
    description: 'Perfeita para levar calçados e roupas de treino no campus ou ginásio.', 
    price: 35, 
    category: 'Vestuário', 
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
  },
];

const REVIEWS_POOL = [
  { rating: 5, comment: 'Excelente produto! Condição idêntica à descrição e vendedor muito pontual.' },
  { rating: 5, comment: 'Muito prestativo e produto funcionando 100%. Recomendo fortemente!' },
  { rating: 4, comment: 'Tudo certo, o produto atendeu minhas expectativas perfeitamente.' },
  { rating: 4, comment: 'Bom produto, apenas demorou um pouco para respondermos no campus.' },
  { rating: 3, comment: 'O produto está ok, porém tinha mais marcas de uso do que o demonstrado.' },
  { rating: 5, comment: 'Perfeito! Negociação super rápida no pátio do bloco B.' },
  { rating: 4, comment: 'Preço justo e qualidade conforme o anunciado.' },
];

async function apiRequest(path, method = 'GET', body = null, isMultipart = false) {
  const options = {
    method,
    headers: {},
  };

  if (body) {
    if (isMultipart) {
      options.body = body;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Request to ${path} failed with status ${res.status}: ${errText}`);
  }

  return res.json();
}

async function main() {
  console.log('🚀 Iniciando script de população do banco de dados FEIMarket com imagens reais...\n');

  try {
    // Step 1: Create Users
    console.log('👥 [Passo 1/5] Cadastrando usuários no banco de dados...');
    const createdUsers = [];
    for (const u of USERS) {
      try {
        const res = await apiRequest('/auth/register', 'POST', u);
        const user = res.user;
        console.log(`   ✅ Usuário cadastrado: ${user.name} (${user.email}) - ID: ${user.id}`);
        createdUsers.push(user);
      } catch (err) {
        if (err.message.includes('409') || err.message.includes('Registro já existe') || err.message.includes('email') || err.message.includes('já cadastrado') || err.message.includes('unique constraint')) {
          console.log(`   ⚠️ Email ${u.email} já cadastrado. Tentando login para recuperar o ID...`);
          const loginRes = await apiRequest('/auth/login', 'POST', { email: u.email, password: u.password });
          console.log(`   ✅ Login efetuado: ${loginRes.user.name} - ID: ${loginRes.user.id}`);
          createdUsers.push(loginRes.user);
        } else {
          throw err;
        }
      }
    }
    console.log(`   🌟 Total de ${createdUsers.length} usuários prontos.\n`);

    // Step 2: Add Balance to Users
    console.log('💰 [Passo 2/5] Adicionando saldo (R$ 10.000,00) para cada usuário...');
    for (const user of createdUsers) {
      const res = await apiRequest(`/users/${user.id}/add-balance`, 'POST', { amount: 10000 });
      console.log(`   💵 Saldo adicionado para ${user.name}. Novo Saldo: R$ ${parseFloat(res.user.balance).toFixed(2)}`);
    }
    console.log('   🌟 Saldo atualizado com sucesso.\n');

    // Step 3: Create 30 Products (6 products per user)
    console.log('📦 [Passo 3/5] Cadastrando 30 produtos universitários com IMAGENS REAIS...');
    const createdProducts = [];
    
    for (let i = 0; i < PRODUCTS_TEMPLATE.length; i++) {
      const template = PRODUCTS_TEMPLATE[i];
      const seller = createdUsers[i % createdUsers.length];
      
      // Fetch realistic image from Unsplash or fallback to memory PNG
      let imageBuffer = mockImageBuffer;
      let contentType = 'image/png';
      let filename = `produto-${i + 1}.png`;

      if (template.imageUrl) {
        try {
          console.log(`   🌐 Baixando imagem real para "${template.title}"...`);
          const imgRes = await fetch(template.imageUrl);
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
            contentType = imgRes.headers.get('content-type') || 'image/jpeg';
            const ext = contentType.split('/')[1] || 'jpg';
            filename = `produto-${i + 1}.${ext}`;
          } else {
            console.log(`      ⚠️ Status de download inválido: ${imgRes.status}, usando imagem padrão.`);
          }
        } catch (err) {
          console.log(`      ⚠️ Falha ao baixar imagem, usando imagem de fallback padrão: ${err.message}`);
        }
      }

      // Construct FormData
      const formData = new FormData();
      formData.append('userId', seller.id);
      formData.append('title', template.title);
      formData.append('description', template.description);
      formData.append('price', String(template.price));
      formData.append('stock', String(template.stock));
      formData.append('category', template.category);
      formData.append('attributes', JSON.stringify({ 
        'Condição': template.stock > 3 ? 'Novo' : 'Seminovoso', 
        'Campus': 'São Bernardo do Campo',
        'FEI': 'Sim'
      }));

      // Attach dynamic real image blob
      const blob = new Blob([imageBuffer], { type: contentType });
      formData.append('images', blob, filename);

      try {
        const res = await apiRequest('/products', 'POST', formData, true);
        const product = res.product;
        console.log(`   🎒 [${product.category}] Produto cadastrado: "${product.title}" por ${seller.name} - Imagem: ${filename}`);
        createdProducts.push(product);
      } catch (err) {
        console.error(`   ❌ Falha ao cadastrar produto "${template.title}":`, err.message);
      }
    }
    console.log(`   🌟 Total de ${createdProducts.length} produtos cadastrados com imagens reais.\n`);

    // Step 4: Perform Purchases
    console.log('🛒 [Passo 4/5] Simulando compras de produtos entre os usuários...');
    for (let i = 0; i < 8; i++) {
      const buyer = createdUsers[i % createdUsers.length];
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      
      if (buyer.id === product.seller_id) {
        continue; 
      }

      try {
        console.log(`   🛍️ ${buyer.name} está comprando "${product.title}"...`);
        await apiRequest(`/cart/${buyer.id}/items`, 'POST', { productId: product._id, quantity: 1 });
        const checkoutRes = await apiRequest('/orders/checkout', 'POST', { userId: buyer.id });
        console.log(`      ✅ Compra concluída com sucesso! Total pago: R$ ${checkoutRes.order.total}.`);
      } catch (err) {
        console.log(`      ❌ Falha ao concluir compra para ${buyer.name}: ${err.message}`);
      }
    }
    console.log('   🌟 Compras concluídas.\n');

    // Step 5: Post Reviews
    console.log('⭐ [Passo 5/5] Adicionando avaliações nos produtos por diferentes usuários...');
    for (const product of createdProducts) {
      const potentialReviewers = createdUsers.filter(u => u.id !== product.seller_id);
      const reviewers = potentialReviewers.sort(() => 0.5 - Math.random()).slice(0, 2);
      
      for (const reviewer of reviewers) {
        const reviewData = REVIEWS_POOL[Math.floor(Math.random() * REVIEWS_POOL.length)];
        
        try {
          await apiRequest(`/products/${product._id}/reviews`, 'POST', {
            userId: reviewer.id,
            rating: reviewData.rating,
            comment: reviewData.comment
          });
          console.log(`   💬 ${reviewer.name} avaliou "${product.title}" com ${reviewData.rating} estrelas: "${reviewData.comment}"`);
        } catch (err) {
          console.log(`   💬 Ignorado: ${reviewer.name} tentando avaliar "${product.title}": ${err.message}`);
        }
      }
    }
    console.log('   🌟 Avaliações cadastradas com sucesso.\n');

    console.log('🎉 POPULAÇÃO DE BANCO DE DADOS COM IMAGENS REAIS CONCLUÍDA COM SUCESSO! 🎉');
    console.log('   Abra a plataforma FEIMarket no seu navegador e contemple a riqueza estética dos produtos!');

  } catch (err) {
    console.error('💥 Erro fatal durante a população do banco de dados:', err);
    process.exit(1);
  }
}

main();
