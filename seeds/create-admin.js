require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const phone    = '03001234567'
  const password = 'admin123'
  const name     = 'Admin'

  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where:  { phone },
    update: { role: 'admin', password: hash, name },
    create: { name, phone, password: hash, role: 'admin' },
  })

  console.log('\n✅ Admin account ready!')
  console.log('   Phone    : ' + phone)
  console.log('   Password : ' + password)
  console.log('   URL      : http://localhost:5173/admin/login\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
