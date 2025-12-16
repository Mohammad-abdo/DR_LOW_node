import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔧 Fixing gender field in database...");

    try {
        // Get all users
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                nameAr: true,
                nameEn: true,
                gender: true,
            },
        });

        console.log(`📊 Found ${allUsers.length} total users`);

        let fixedCount = 0;
        let skippedCount = 0;

        // Fix each user with invalid gender
        for (const user of allUsers) {
            try {
                // If gender is not MALE or FEMALE, set it to null
                if (user.gender !== 'MALE' && user.gender !== 'FEMALE') {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { gender: null },
                    });
                    console.log(`✅ Fixed user: ${user.email} (${user.nameAr || user.nameEn})`);
                    fixedCount++;
                } else {
                    skippedCount++;
                }
            } catch (error) {
                console.error(`❌ Error fixing user ${user.email}:`, error.message);
            }
        }

        console.log(`\n✅ Gender field fix completed!`);
        console.log(`   - Fixed: ${fixedCount} users`);
        console.log(`   - Skipped (already valid): ${skippedCount} users`);
    } catch (error) {
        console.error("❌ Error:", error.message);
        // If there's an error reading users (due to invalid gender), try raw SQL
        console.log("\n🔄 Trying alternative method with raw SQL...");
        
        try {
            await prisma.$executeRaw`
                UPDATE users 
                SET gender = NULL 
                WHERE gender IS NULL OR gender = '' OR gender NOT IN ('MALE', 'FEMALE')
            `;
            console.log("✅ Fixed using raw SQL");
        } catch (sqlError) {
            console.error("❌ SQL fix also failed:", sqlError.message);
        }
    }
}

main()
    .catch((e) => {
        console.error("❌ Error fixing gender:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

