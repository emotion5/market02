import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";

// 관리자 계정 생성/승격 스크립트.
//   npm run make-admin <email> [password]
// 기존 계정이면 role=ADMIN(+status=ACTIVE)으로 승격, 없으면 새로 생성한다.

const email = process.argv[2];
const password = process.argv[3] ?? "pass1234";

if (!email) {
  console.error("사용법: npm run make-admin <email> [password]");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN", status: "ACTIVE" },
    });
    console.log(`기존 계정을 ADMIN으로 승격: ${email}`);
  } else {
    const passwordHash = await hash(password);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
        type: "PERSONAL",
        status: "ACTIVE",
      },
    });
    console.log(`ADMIN 계정 생성: ${email} (비밀번호: ${password})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
