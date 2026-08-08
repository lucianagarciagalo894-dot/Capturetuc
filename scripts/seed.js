// Script de carga de datos de ejemplo.
// Uso: npm run seed
// Inserta 15 álbumes de muestra en MongoDB para poder probar catálogo,
// filtros, orden y paginación sin cargar todo a mano desde el panel admin.

const mongoose = require('mongoose');
const config = require('../src/config/env');
const { connectMongo } = require('../src/config/db');
const Product = require('../src/models/Product');

const sampleProducts = [
  {
    title: 'Álbum Clásico Boda',
    description: 'Álbum clásico ideal para casamientos, tapa dura forrada en tela.',
    code: 'ALB001',
    price: 22000,
    stock: 12,
    category: 'Fotolibros Cuadrados',
    thumbnails: [],
    features: { size: '30x30 cm', cover: 'Tapa dura', pages: 30, extraPageCost: 800 }
  },
  {
    title: 'Álbum Premium Cuero',
    description: 'Álbum premium con tapa de cuero genuino y hojas gruesas.',
    code: 'ALB002',
    price: 35000,
    stock: 8,
    category: 'Fotolibros Cuadrados',
    thumbnails: [],
    features: { size: '30x30 cm', cover: 'Cuero', pages: 40, extraPageCost: 1200 }
  },
  {
    title: 'Álbum Viaje Mochilero',
    description: 'Álbum compacto para armar con las fotos de tu último viaje.',
    code: 'ALB003',
    price: 15000,
    stock: 20,
    category: 'Fotolibros Apaisados',
    thumbnails: [],
    features: { size: '20x20 cm', cover: 'Tapa blanda', pages: 20 }
  },
  {
    title: 'Álbum Premium Familia',
    description: 'Álbum premium de gran formato para las fotos familiares.',
    code: 'ALB004',
    price: 41000,
    stock: 5,
    category: 'Fotolibros Cuadrados',
    thumbnails: [],
    features: { size: '35x35 cm', cover: 'Tapa dura', pages: 50, extraPageCost: 1000 }
  },
  {
    title: 'Álbum Clásico Bebé',
    description: 'Álbum clásico pensado para el primer año del bebé.',
    code: 'ALB005',
    price: 18000,
    stock: 15,
    category: 'Fotolibros Verticales',
    thumbnails: [],
    features: { size: '20x25 cm', cover: 'Tapa dura', pages: 25 }
  },
  {
    title: 'Álbum Viaje Panorámico',
    description: 'Formato apaisado, ideal para paisajes de tus viajes.',
    code: 'ALB006',
    price: 19500,
    stock: 10,
    category: 'Fotolibros Apaisados',
    thumbnails: [],
    features: { size: '30x20 cm', cover: 'Tapa blanda', pages: 30 }
  },
  {
    title: 'Álbum Premium Boda Deluxe',
    description: 'La versión más lujosa de nuestro álbum de bodas.',
    code: 'ALB007',
    price: 52000,
    stock: 4,
    category: 'Fotolibros Cuadrados',
    thumbnails: [],
    features: { size: '35x35 cm', cover: 'Cuero', pages: 60, extraPageCost: 1200 }
  },
  {
    title: 'Álbum Clásico Egresados',
    description: 'Álbum pensado para el evento de egresados del colegio.',
    code: 'ALB008',
    price: 21000,
    stock: 18,
    category: 'Fotolibros Verticales',
    thumbnails: [],
    features: { size: '20x25 cm', cover: 'Tapa dura', pages: 30 }
  },
  {
    title: 'Álbum Viaje Mini',
    description: 'Formato bolsillo, para llevar tus recuerdos a todos lados.',
    code: 'ALB009',
    price: 9000,
    stock: 25,
    category: 'Fotolibros Cuadrados',
    thumbnails: [],
    features: { size: '15x15 cm', cover: 'Tapa blanda', pages: 15 }
  },
  {
    title: 'Álbum Premium Aniversario',
    description: 'Ideal para celebrar aniversarios con estilo.',
    code: 'ALB010',
    price: 38000,
    stock: 7,
    category: 'Fotolibros Cuadrados',
    thumbnails: [],
    features: { size: '30x30 cm', cover: 'Tela', pages: 45, extraPageCost: 1000 }
  },
  {
    title: 'Álbum Clásico Cumpleaños',
    description: 'Un clásico para guardar los recuerdos de cumpleaños.',
    code: 'ALB011',
    price: 16500,
    stock: 22,
    category: 'Fotolibros Verticales',
    thumbnails: [],
    features: { size: '20x25 cm', cover: 'Tapa dura', pages: 20 }
  },
  {
    title: 'Álbum Viaje Aventura',
    description: 'Resistente y compacto, para viajes de aventura.',
    code: 'ALB012',
    price: 17000,
    stock: 14,
    category: 'Fotolibros Apaisados',
    thumbnails: [],
    features: { size: '25x20 cm', cover: 'Tapa blanda', pages: 25 }
  },
  {
    title: 'Álbum Premium Graduación',
    description: 'Álbum premium para celebrar la graduación universitaria.',
    code: 'ALB013',
    price: 33000,
    stock: 9,
    category: 'Fotolibros Cuadrados',
    thumbnails: [],
    features: { size: '30x30 cm', cover: 'Tapa dura', pages: 40, extraPageCost: 900 }
  },
  {
    title: 'Álbum Clásico Mascotas',
    description: 'Para los amantes de sus mascotas, con hojas resistentes.',
    code: 'ALB014',
    price: 14000,
    stock: 30,
    category: 'Fotolibros Verticales',
    thumbnails: [],
    features: { size: '20x25 cm', cover: 'Tapa blanda', pages: 20 }
  },
  {
    title: 'Álbum Viaje Descontinuado',
    description: 'Edición anterior, ya sin stock disponible.',
    code: 'ALB015',
    price: 12000,
    stock: 0,
    status: false,
    category: 'Fotolibros Apaisados',
    thumbnails: [],
    features: { size: '20x15 cm', cover: 'Tapa blanda', pages: 15 }
  }
];

async function seed() {
  if (config.persistence !== 'mongo') {
    console.log('[Seed] PERSISTENCE no es "mongo". Este script solo carga datos en MongoDB.');
    process.exit(0);
  }

  await connectMongo();

  await Product.deleteMany({});
  await Product.insertMany(sampleProducts);

  console.log(`[Seed] Se insertaron ${sampleProducts.length} álbumes de ejemplo.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error('[Seed] Error al cargar los datos de ejemplo:', error.message);
  process.exit(1);
});
