require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

function slugify(name) {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') + '-' + Date.now()
}

// ── Categories ────────────────────────────────────────────────────────────────
const categories = [
  { slug:'majalis',    name:'Majalis',           nameUrdu:'مجالس',        description:'Elegant floor seating and majalis sets',                          sortOrder:1,  gradient:'from-purple-700 to-purple-900', lightColor:'bg-purple-50', textColor:'text-purple-700', borderColor:'border-purple-200', icon:'Sofa' },
  { slug:'curtains',   name:'Curtains',           nameUrdu:'پردے',         description:'Premium velvet, embroidered & catalog curtain sets',               sortOrder:2,  gradient:'from-rose-700 to-rose-900',    lightColor:'bg-rose-50',   textColor:'text-rose-700',   borderColor:'border-rose-200',   icon:'Wind' },
  { slug:'qaleen',     name:'Qaleen',             nameUrdu:'قالین',        description:'Irani, Handmade, Turkish & Pakistani rugs',                       sortOrder:3,  types:['Irani','Handmade','Turkish','Pakistani'], gradient:'from-teal-700 to-teal-900',   lightColor:'bg-teal-50',   textColor:'text-teal-700',   borderColor:'border-teal-200',   icon:'Grip' },
  { slug:'carpets',    name:'Carpets',            nameUrdu:'کارپٹ',        description:'Wall-to-wall carpets and area rugs',                              sortOrder:4,  gradient:'from-amber-700 to-amber-900',  lightColor:'bg-amber-50',  textColor:'text-amber-700',  borderColor:'border-amber-200',  icon:'LayoutGrid' },
  { slug:'mattresses', name:'Foam & Mattresses',  nameUrdu:'فوم / میٹریس', description:'Normal foam, Takya, Balakh and spring mattresses',               sortOrder:5,  types:['Normal Foam','Takya','Balakh'],   gradient:'from-sky-700 to-sky-900',     lightColor:'bg-sky-50',    textColor:'text-sky-700',    borderColor:'border-sky-200',    icon:'Layers' },
  { slug:'children',   name:"Children's Room",    nameUrdu:'بچوں کا کمرہ', description:'Kids bedding, carpets, curtains and furniture sets',             sortOrder:6,  gradient:'from-pink-600 to-pink-800',    lightColor:'bg-pink-50',   textColor:'text-pink-700',   borderColor:'border-pink-200',   icon:'BedDouble' },
  { slug:'meditation', name:'Rukn-e-Sukoon',      nameUrdu:'ركن السكون',   nameSubtitle:'Meditation Room', description:'A dedicated space for peace and focus.', sortOrder:7, gradient:'from-violet-700 to-violet-900', lightColor:'bg-violet-50', textColor:'text-violet-700', borderColor:'border-violet-200', icon:'Sofa' },
  { slug:'bedsheets',  name:'Bedsheets',          nameUrdu:'بیڈ شیٹ',     description:'Cotton, satin and printed bedsheet sets',                        sortOrder:8,  gradient:'from-indigo-700 to-indigo-900',lightColor:'bg-indigo-50', textColor:'text-indigo-700', borderColor:'border-indigo-200', icon:'BedDouble' },
  { slug:'blankets',   name:'Blankets & Duvets',  nameUrdu:'کمبل / لحاف', description:'Warm winter blankets, duvets and quilts',                        sortOrder:9,  gradient:'from-orange-700 to-orange-900',lightColor:'bg-orange-50', textColor:'text-orange-700', borderColor:'border-orange-200', icon:'Wind' },
  { slug:'janamaz',    name:'Janamaz',            nameUrdu:'جانماز',       description:'Velvet, embroidered & Turkish prayer mats',                      sortOrder:10, types:['Velvet','Embroidered','Turkish','Kashmiri'], gradient:'from-emerald-700 to-emerald-900', lightColor:'bg-emerald-50', textColor:'text-emerald-700', borderColor:'border-emerald-200', icon:'Heart' },
  { slug:'soffa',      name:'Soffa',              nameUrdu:'صوفہ',         description:'L-shape, corner & classic sofa sets for living rooms',           sortOrder:11, types:['L-Shape','3 Seater','5 Seater','Corner Sofa'], gradient:'from-stone-600 to-stone-800', lightColor:'bg-stone-50', textColor:'text-stone-700', borderColor:'border-stone-200', icon:'Sofa' },
]

// ── Products ──────────────────────────────────────────────────────────────────
const products = [
  { name:'Royal Blue & Gold Grand Majalis', nameUrdu:'رائل بلیو گولڈ مجلس', categorySlug:'majalis', alsoIn:['curtains'], price:145000, originalPrice:175000, sizes:['7 Seater','9 Seater','11 Seater','Full Room Custom'], features:['Premium velvet upholstery','Gold arabesque embroidery','Complete room setup','Matching curtains','Custom color & size'], badge:'Premium', badgeColor:'gold', rating:4.9, reviewCount:56, featured:true, gradient:'from-purple-700 to-purple-900', colors:[{name:'Royal Blue & Gold',hex:'#1a237e'},{name:'Navy & Gold',hex:'#0d1b5e'},{name:'Black & Gold',hex:'#1a1a2e'}] },
  { name:'Emerald Green Velvet Majalis', nameUrdu:'ایمرلڈ گرین ویلوٹ مجلس', categorySlug:'majalis', alsoIn:['curtains'], price:120000, originalPrice:145000, sizes:['7 Seater','9 Seater','11 Seater','Full Room Custom'], features:['Emerald velvet fabric','Gold rope trim','Matching curtains','Room setup available','Custom sizes'], badge:'New Arrival', badgeColor:'brand', rating:4.8, reviewCount:34, featured:true, gradient:'from-green-700 to-green-900', colors:[{name:'Emerald Green',hex:'#1b5e20'},{name:'Forest Green',hex:'#2e7d32'}] },
  { name:'Beige & Gold Classic Majalis', nameUrdu:'بیج گولڈ کلاسک مجلس', categorySlug:'majalis', price:95000, originalPrice:120000, sizes:['7 Seater','9 Seater','Full Room'], features:['Damask fabric','Gold border detail','Deep-seated comfort','Classic design','Custom sizes'], rating:4.7, reviewCount:28, featured:false, gradient:'from-yellow-700 to-yellow-900', colors:[{name:'Beige & Gold',hex:'#c8973a'}] },
  { name:'Navy & Gold Royal Majalis Set', nameUrdu:'نیوی گولڈ رائل مجلس سیٹ', categorySlug:'majalis', alsoIn:['curtains'], price:160000, originalPrice:195000, sizes:['9 Seater','11 Seater','Full Room Custom'], features:['Navy velvet upholstery','Matching curtains & pelmet','Arabesque embroidery','Full room package','Premium quality'], badge:'Best Seller', badgeColor:'gold', rating:4.9, reviewCount:72, featured:true, gradient:'from-blue-900 to-blue-950', colors:[{name:'Navy & Gold',hex:'#0d1b5e'},{name:'Royal Blue',hex:'#1a237e'}] },
  { name:'Maroon Velvet Majalis', nameUrdu:'میرون ویلوٹ مجلس', categorySlug:'majalis', price:88000, originalPrice:110000, sizes:['7 Seater','9 Seater','Full Room'], features:['Deep maroon velvet','Silver embroidery','Regal design','Custom sizes','Anti-slip base'], rating:4.6, reviewCount:19, featured:false, gradient:'from-rose-800 to-rose-950', colors:[{name:'Deep Maroon',hex:'#880e4f'},{name:'Wine Red',hex:'#6a1b4d'}] },
  { name:'Gold Arabesque Grand Majalis', nameUrdu:'گولڈ اریبسک گرینڈ مجلس', categorySlug:'majalis', price:195000, originalPrice:240000, sizes:['11 Seater','Full Hall Custom'], features:['Grand arabesque design','Full hall size','Matching backdrop','Gold velvet','White glove service'], badge:'Premium', badgeColor:'gold', rating:5.0, reviewCount:11, featured:true, gradient:'from-yellow-800 to-amber-900', colors:[{name:'Gold & Cream',hex:'#c8973a'}] },
  { name:'Teal & Silver Majalis', nameUrdu:'ٹیل سلور مجلس', categorySlug:'majalis', price:105000, originalPrice:130000, sizes:['7 Seater','9 Seater'], features:['Contemporary teal','Silver accents','Modern design','Custom sizes','Comfortable cushions'], badge:'Trending', badgeColor:'brand', rating:4.7, reviewCount:23, featured:false, gradient:'from-teal-700 to-teal-900', colors:[{name:'Teal & Silver',hex:'#00695c'}] },
  { name:'Burgundy Classic Majalis', nameUrdu:'برگنڈی کلاسک مجلس', categorySlug:'majalis', price:78000, originalPrice:98000, sizes:['7 Seater','9 Seater'], features:['Classic burgundy','Affordable quality','Medium room size','Comfortable foam','Easy to clean'], badge:'Value', badgeColor:'brand', rating:4.5, reviewCount:42, featured:false, gradient:'from-purple-800 to-purple-950', colors:[{name:'Burgundy',hex:'#6a1b4d'},{name:'Maroon',hex:'#880e4f'}] },
  { name:'Cream & Beige Luxury Majalis', nameUrdu:'کریم بیج لگژری مجلس', categorySlug:'majalis', alsoIn:['curtains'], price:135000, originalPrice:165000, sizes:['7 Seater','9 Seater','Full Room'], features:['Luxury cream fabric','Matching cream curtains','Bright room aesthetic','Custom sizes','Premium finish'], badge:'Luxury', badgeColor:'gold', rating:4.8, reviewCount:16, featured:false, gradient:'from-yellow-600 to-amber-700', colors:[{name:'Cream & Beige',hex:'#f5f0dc'},{name:'Ivory & Gold',hex:'#c8973a'}] },
  { name:'Black & Gold Majalis', nameUrdu:'بلیک گولڈ مجلس', categorySlug:'majalis', price:150000, originalPrice:185000, sizes:['7 Seater','9 Seater','11 Seater'], features:['Black velvet upholstery','Heavy gold embroidery','Bold statement design','Custom sizes','Premium velvet'], badge:'Exclusive', badgeColor:'gold', rating:4.9, reviewCount:9, featured:true, gradient:'from-gray-900 to-black', colors:[{name:'Black & Gold',hex:'#1a1a2e'}] },

  { name:'Navy Diamond Geometric Carpet', nameUrdu:'نیوی ڈائمنڈ قالین', categorySlug:'carpets', price:28000, originalPrice:35000, sizes:['5×8 ft','6×9 ft','8×12 ft','Wall to Wall Custom'], features:['Dense pile','Geometric diamond pattern','Stain resistant','Custom sizes','Machine washable'], badge:'Best Seller', badgeColor:'gold', rating:4.7, reviewCount:88, featured:true, gradient:'from-blue-800 to-blue-950', colors:[{name:'Navy & White',hex:'#1a237e'}] },
  { name:'Orange Floral Room Carpet', nameUrdu:'اورنج فلورل کارپٹ', categorySlug:'carpets', price:22000, originalPrice:28000, sizes:['5×8 ft','6×9 ft','8×10 ft','Custom'], features:['Vibrant orange','Floral diamond motif','Anti-slip backing','Durable','Easy to clean'], badge:'Vibrant', badgeColor:'brand', rating:4.5, reviewCount:64, featured:false, gradient:'from-orange-700 to-orange-900', colors:[{name:'Orange & Brown',hex:'#e65100'}] },
  { name:'Blue Patchwork Majalis Carpet', nameUrdu:'بلیو پیچ ورک مجلس قالین', categorySlug:'carpets', price:32000, originalPrice:42000, sizes:['5×8 ft','6×9 ft','8×12 ft'], features:['Rich patchwork design','Navy blue palette','Thick dense pile','Medallion motifs','Premium quality'], badge:'Unique Design', badgeColor:'gold', rating:4.6, reviewCount:41, featured:false, gradient:'from-blue-700 to-blue-900', colors:[{name:'Navy Blue Patchwork',hex:'#1a237e'}] },

  { name:'French Floral Grey Qaleen', nameUrdu:'فرنچ فلورل گرے قالین', categorySlug:'qaleen', type:'Irani', price:45000, originalPrice:58000, sizes:['5×7 ft','6×9 ft','8×10 ft','9×12 ft'], features:['French floral design','Soft grey base','Green center medallion','Paisley border','Premium pile'], badge:'Imported', badgeColor:'gold', rating:4.8, reviewCount:36, featured:true, gradient:'from-teal-700 to-teal-900', colors:[{name:'Grey & Green Floral',hex:'#78909c'}] },
  { name:'Afghan Tribal Dark Qaleen', nameUrdu:'افغانی قبائلی قالین', categorySlug:'qaleen', type:'Handmade', price:38000, originalPrice:48000, sizes:['4×6 ft','6×9 ft','8×10 ft'], features:['Traditional Afghan design','Geometric tribal motifs','Deep rich colors','Durable wool blend','Unique character'], badge:'Handcrafted', badgeColor:'brand', rating:4.7, reviewCount:29, featured:false, gradient:'from-purple-800 to-purple-950', colors:[{name:'Dark Burgundy & Blue',hex:'#4a148c'}] },

  { name:'Blue Patchwork Fabric Roll', nameUrdu:'بلیو پیچ ورک فیبرک', categorySlug:'bedsheets', price:1800, originalPrice:2400, sizes:['3m','5m','10m','Full Roll'], minQty:3, features:['Silk-feel finish','Geometric patchwork','Multiple colours','Majalis & bedding use','Min 3 meters'], badge:'Per Meter', badgeColor:'brand', rating:4.4, reviewCount:95, featured:false, gradient:'from-indigo-700 to-indigo-900', colors:[{name:'Blue & Gold Patchwork',hex:'#1a237e'},{name:'Multicolor',hex:'#7b1fa2'}] },
  { name:'Multicolor Jacquard Fabric', nameUrdu:'ملٹی کلر جیکارڈ فیبرک', categorySlug:'bedsheets', price:2200, originalPrice:2800, sizes:['Per Meter','5m','10m'], features:['Jacquard woven','Rich texture','Geometric + floral','Multi-purpose','Color-fast'], badge:'Premium', badgeColor:'gold', rating:4.5, reviewCount:67, featured:false, gradient:'from-indigo-700 to-indigo-900', colors:[{name:'Blue & Gold Jacquard',hex:'#283593'},{name:'Multicolor',hex:'#880e4f'}] },

  { name:'Navy Gold Floral Velvet Curtains', nameUrdu:'نیوی گولڈ فلورل ویلوٹ پردے', categorySlug:'curtains', price:18000, originalPrice:24000, sizes:['8 ft (Pair)','9 ft (Pair)','10 ft (Pair)','Custom'], features:['Premium velvet','Gold arabesque embroidery','Includes pelmet','Custom lengths','Lining included'], badge:'Best Seller', badgeColor:'gold', rating:4.8, reviewCount:43, featured:true, gradient:'from-blue-900 to-blue-950', colors:[{name:'Navy & Gold Floral',hex:'#0d1b5e'}] },
  { name:'Navy Velvet Curtain', nameUrdu:'نیوی ویلوٹ پردہ', categorySlug:'curtains', price:14000, originalPrice:18000, sizes:['7 ft (Pair)','8 ft (Pair)','9 ft (Pair)','Custom'], features:['Pure velvet fabric','Rich deep navy','Custom sizes','Multiple colours','Eyelet or pencil pleat'], badge:'Premium Fabric', badgeColor:'brand', rating:4.7, reviewCount:28, featured:false, gradient:'from-blue-900 to-blue-950', colors:[{name:'Deep Navy',hex:'#0a1929'},{name:'Navy & Gold',hex:'#0d1b5e'}] },
  { name:'Embroidered Majalis Backdrop Curtains', nameUrdu:'ایمبرائیڈرڈ مجلس بیک ڈراپ پردے', categorySlug:'curtains', price:32000, originalPrice:42000, sizes:['Small Wall (8×10 ft)','Medium Wall (10×12 ft)','Full Wall Custom'], features:['Ceiling-to-floor panels','Heavy gold embroidery','Matching side curtains','Custom wall size','Installation available'], badge:'Premium', badgeColor:'gold', rating:4.9, reviewCount:17, featured:true, gradient:'from-blue-900 to-blue-950', colors:[{name:'Navy & Gold Arabesque',hex:'#0d1b5e'}] },

  { name:'Royal Velvet Janamaz', nameUrdu:'رائل ویلوٹ جانماز', categorySlug:'janamaz', type:'Velvet', price:1800, originalPrice:2400, sizes:['Standard (60×110 cm)','Large (70×120 cm)'], features:['Premium velvet pile','Golden arabesque border','Anti-slip backing','Multiple colours','Travel size available'], badge:'New', badgeColor:'brand', rating:4.9, reviewCount:0, featured:false, gradient:'from-emerald-700 to-emerald-900', colors:[{name:'Green',hex:'#1b5e20'},{name:'Maroon',hex:'#880e4f'},{name:'Navy Blue',hex:'#0d1b5e'}] },
  { name:'Turkish Embroidered Janamaz', nameUrdu:'ترکی ایمبرائیڈرڈ جانماز', categorySlug:'janamaz', type:'Turkish', price:2500, originalPrice:3200, sizes:['Standard (60×110 cm)','Large (70×120 cm)','Kids (50×90 cm)'], features:['Turkish embroidery','Foam padded','Mihrab design','Rich colour palette','Great gift'], badge:'Imported', badgeColor:'gold', rating:4.8, reviewCount:0, featured:false, gradient:'from-emerald-700 to-emerald-900', colors:[{name:'Teal & Gold',hex:'#00695c'},{name:'Burgundy & Gold',hex:'#6a1b4d'}] },
  { name:'Kashmiri Janamaz Set', nameUrdu:'کشمیری جانماز سیٹ', categorySlug:'janamaz', type:'Kashmiri', price:4500, originalPrice:6000, sizes:['Standard Set','Premium Gift Box'], features:['Kashmiri floral pattern','Tasbeeh pouch included','Matching Quran cover','Gift box packaging','Premium fabric'], badge:'Premium', badgeColor:'gold', rating:4.9, reviewCount:0, featured:true, gradient:'from-emerald-700 to-emerald-900', colors:[{name:'Cream & Gold',hex:'#f5f0dc'},{name:'Green & Gold',hex:'#1b5e20'}] },

  { name:'Classic 5-Seater Sofa Set', nameUrdu:'کلاسک 5 سیٹر صوفہ سیٹ', categorySlug:'soffa', type:'5 Seater', price:85000, originalPrice:110000, sizes:['3+1+1 Set','3+2 Set','Full 5-Seater'], features:['Carved wooden frame','High-density foam','Velvet or fabric upholstery','Custom colour','Home delivery'], badge:'New', badgeColor:'brand', rating:4.7, reviewCount:0, featured:false, gradient:'from-stone-600 to-stone-800', colors:[{name:'Beige',hex:'#d4c5a9'},{name:'Grey',hex:'#78909c'},{name:'Maroon',hex:'#880e4f'}] },
  { name:'L-Shape Corner Sofa', nameUrdu:'ایل شیپ کارنر صوفہ', categorySlug:'soffa', type:'L-Shape', price:120000, originalPrice:155000, sizes:['Small (260×160 cm)','Medium (300×180 cm)','Large Custom'], features:['L-shape corner design','Deep wide seating','Custom dimensions','Multiple fabric options','Chaise included'], badge:'Popular', badgeColor:'gold', rating:4.8, reviewCount:0, featured:true, gradient:'from-stone-600 to-stone-800', colors:[{name:'Light Grey',hex:'#b0bec5'},{name:'Dark Grey',hex:'#455a64'},{name:'Cream',hex:'#f5f0dc'}] },
  { name:'Royal Carved Sofa Set', nameUrdu:'رائل کارود صوفہ سیٹ', categorySlug:'soffa', type:'5 Seater', price:165000, originalPrice:210000, sizes:['3+1+1 Set','3+2+1 Set','Full Custom'], features:['Gold-finish carved frame','Premium velvet upholstery','Formal drawing room style','Matching table available','Custom colour & fabric'], badge:'Premium', badgeColor:'gold', rating:4.9, reviewCount:0, featured:false, gradient:'from-stone-600 to-stone-800', colors:[{name:'Royal Blue & Gold',hex:'#1a237e'},{name:'Maroon & Gold',hex:'#880e4f'},{name:'Cream & Gold',hex:'#c8973a'}] },
]

async function seed() {
  console.log('Clearing tables...')
  await prisma.statusHistory.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.catalogItem.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  console.log('Seeding categories...')
  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }
  console.log(`  ✓ ${categories.length} categories`)

  console.log('Seeding products...')
  for (const p of products) {
    await prisma.product.create({
      data: { ...p, slug: slugify(p.name), gallery: [], colors: p.colors ?? [] }
    })
    await new Promise(r => setTimeout(r, 5)) // keep slugs unique via timestamp
  }
  console.log(`  ✓ ${products.length} products`)

  console.log('Ensuring SiteConfig...')
  await prisma.siteConfig.upsert({ where: { key: 'main' }, create: { key: 'main' }, update: {} })

  console.log('Creating admin user...')
  const hash = await bcrypt.hash('Shalmani@1987', 10)
  await prisma.user.upsert({
    where:  { phone: '03119523856' },
    create: { name: 'Izhar Shalmani', phone: '03119523856', password: hash, role: 'admin' },
    update: { name: 'Izhar Shalmani', password: hash, role: 'admin' },
  })
  console.log('  ✓ Admin: Izhar Shalmani | phone: 03119523856 | password: Shalmani@1987')

  console.log('\n✅ Seed complete!')
}

seed()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
