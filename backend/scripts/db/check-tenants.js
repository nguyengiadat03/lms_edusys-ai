const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTenants() {
  try {
    console.log('🔍 Checking tenants in database...');
    
    // Check if tenants table exists and has data
    const tenantCount = await prisma.tenants.count();
    console.log(`📊 Total tenants in database: ${tenantCount}`);
    
    if (tenantCount === 0) {
      console.log('\n⚠️  No tenants found. Creating a test tenant...');
      
      // Create a test tenant
      const testTenant = await prisma.tenants.create({
        data: {
          code: 'edusys-demo',
          name: 'EduSys Demo School',
          domain: 'demo.edusys.ai',
          is_active: true,
          settings: {},
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      console.log('✅ Test tenant created:');
      console.log(`   Code: edusys-demo`);
      console.log(`   Name: EduSys Demo School`);
      console.log(`   ID: ${testTenant.id}`);
    } else {
      // Show existing tenants
      const tenants = await prisma.tenants.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          domain: true,
          is_active: true,
          created_at: true
        },
        take: 5
      });
      
      console.log('\n🏢 Existing tenants:');
      tenants.forEach(tenant => {
        console.log(`   - ${tenant.code}: ${tenant.name} (${tenant.domain}) - Active: ${tenant.is_active}`);
      });
    }
    
    // Check user-tenant relationship
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        tenant_id: true,
        full_name: true
      },
      take: 3
    });
    
    console.log('\n👤 User-Tenant relationships:');
    for (const user of users) {
      const tenant = await prisma.tenants.findUnique({
        where: { id: user.tenant_id },
        select: { code: true, name: true }
      });
      
      console.log(`   - ${user.email} → Tenant: ${tenant ? tenant.code : 'NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tenants:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run check
if (require.main === module) {
  checkTenants()
    .then(() => {
      console.log('\n✅ Tenant check completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Tenant check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkTenants };