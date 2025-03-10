import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.tbl_users.create({
    data: {
      userId: uuidv4(),
      email: 'admin@mentora.com',
      password: await bcrypt.hash('123456789', 10),
      firstName: 'Admin',
      lastName: 'Mentora',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const instructorUser = await prisma.tbl_users.create({
    data: {
      userId: uuidv4(),
      email: 'instructor@mentora.com',
      password: await bcrypt.hash('123456789', 10),
      firstName: 'John',
      lastName: 'Doe',
      role: 'INSTRUCTOR',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const studentUser = await prisma.tbl_users.create({
    data: {
      userId: uuidv4(),
      email: 'student@mentora.com',
      password: await bcrypt.hash('123456789', 10),
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'STUDENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const instructor = await prisma.tbl_instructors.create({
    data: {
      instructorId: uuidv4(),
      userId: instructorUser.userId,
      bio: 'Experienced instructor with 10 years of teaching',
      profilePicture: '',
      experience: '10 years of teaching experience',
      average_rating: 4.5,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const itCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      categoryType: 'INFORMATION_TECHNOLOGY',
    },
  });

  const marketingCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      categoryType: 'MARKETING',
    },
  });

  const course1 = await prisma.tbl_courses.create({
    data: {
      courseId: uuidv4(),
      instructorId: instructor.instructorId,
      title: 'Complete Web Development Bootcamp',
      description: 'Learn web development from scratch',
      overview: 'Comprehensive course covering HTML, CSS, JavaScript',
      durationTime: 4800, // 80 hours in minutes
      price: 99.99,
      approved: 'APPROVED',
      rating: 4.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const module1 = await prisma.tbl_modules.create({
    data: {
      moduleId: uuidv4(),
      courseId: course1.courseId,
      title: 'HTML Fundamentals',
      orderIndex: 1,
      description: 'Learn HTML basics',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.tbl_lessons.create({
    data: {
      lessonId: uuidv4(),
      moduleId: module1.moduleId,
      title: 'Introduction to HTML',
      contentType: 'VIDEO',
      contentUrl: 'https://youtu.be/ok-plXXHlWw?si=RSHNUBrFWFRTqoBd',
      duration: 30,
      orderIndex: 1,
      description: 'Basic HTML concepts',
      isFree: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const voucher = await prisma.tbl_vouchers.create({
    data: {
      voucherId: uuidv4(),
      code: 'WELCOME2025',
      description: 'Welcome discount for new users',
      scope: 'ALL_COURSES',
      discountType: 'Percentage',
      discountValue: 20,
      maxDiscount: 50,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      maxUsage: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.tbl_course_categories.create({
    data: {
      courseCategoryId: uuidv4(),
      categoryId: itCategory.categoryId,
      courseId: course1.courseId,
    },
  });

  const cart = await prisma.tbl_cart.create({
    data: {
      cartId: uuidv4(),
      userId: studentUser.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.tbl_cart_items.create({
    data: {
      cartItemId: uuidv4(),
      courseId: course1.courseId,
      cartId: cart.cartId,
      price: 99.99,
      discount: 0,
      finalPrice: 99.99,
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
