import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Xóa dữ liệu cũ
  await prisma.tbl_quiz_answers.deleteMany();
  await prisma.tbl_quiz_attempts.deleteMany();
  await prisma.tbl_questions.deleteMany();
  await prisma.tbl_quizzes.deleteMany();
  await prisma.tbl_lecture_progress.deleteMany();
  await prisma.tbl_lectures.deleteMany();
  await prisma.tbl_curriculum_progress.deleteMany();
  await prisma.tbl_curricula.deleteMany();
  await prisma.tbl_modules.deleteMany();
  await prisma.tbl_course_target_audience.deleteMany();
  await prisma.tbl_course_requirements.deleteMany();
  await prisma.tbl_course_learning_objectives.deleteMany();
  await prisma.tbl_voucher_usage_history.deleteMany();
  await prisma.tbl_voucher_courses.deleteMany();
  await prisma.tbl_vouchers.deleteMany();
  await prisma.tbl_order_details.deleteMany();
  await prisma.tbl_payment.deleteMany();
  await prisma.tbl_cart_items.deleteMany();
  await prisma.tbl_cart.deleteMany();
  await prisma.tbl_course_categories.deleteMany();
  await prisma.tbl_course_enrollments.deleteMany();
  await prisma.tbl_course_reviews.deleteMany();
  await prisma.tbl_favorites.deleteMany();
  await prisma.tbl_courses.deleteMany();
  await prisma.tbl_instructors.deleteMany();
  await prisma.tbl_categories.deleteMany();
  await prisma.tbl_users.deleteMany();

  const adminUser = await prisma.tbl_users.create({
    data: {
      userId: uuidv4(),
      email: 'admin@mentora.com',
      password: await bcrypt.hash('123456789', 10),
      fullName: 'Admin Mentora',
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
      fullName: 'John Doe',
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
      fullName: 'Jane Smith',
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
      thumbnail:
        'https://plus.unsplash.com/premium_vector-1734159656195-8b0f4d6a6b73?q=80&w=2416&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: true,
      isRecommended: true,
    },
  });

  // Thêm 3 review cho course1
  await prisma.tbl_course_reviews.createMany({
    data: [
      {
        reviewId: uuidv4(),
        courseId: course1.courseId,
        userId: studentUser.userId,
        rating: 5,
        comment:
          'Khóa học rất hay và bổ ích! Giảng viên giảng dạy rất chi tiết và dễ hiểu. Tôi đã học được rất nhiều kiến thức mới.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        reviewId: uuidv4(),
        courseId: course1.courseId,
        userId: adminUser.userId,
        rating: 4,
        comment:
          'Nội dung khóa học khá tốt, phù hợp cho người mới bắt đầu. Tuy nhiên, có một số phần có thể cải thiện thêm.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        reviewId: uuidv4(),
        courseId: course1.courseId,
        userId: instructorUser.userId,
        rating: 4.5,
        comment:
          'Khóa học có cấu trúc rõ ràng, bài giảng được thiết kế logic. Giảng viên có kinh nghiệm và nhiệt tình trong giảng dạy.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
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

  const curriculum1 = await prisma.tbl_curricula.create({
    data: {
      curriculumId: uuidv4(),
      moduleId: module1.moduleId,
      title: 'Introduction to HTML',
      orderIndex: 1,
      type: 'LECTURE',
      description: 'Basic HTML concepts',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.tbl_lectures.create({
    data: {
      lectureId: uuidv4(),
      curriculumId: curriculum1.curriculumId,
      title: 'Introduction to HTML',
      description: 'Basic HTML concepts',
      videoUrl: 'https://youtu.be/ok-plXXHlWw?si=RSHNUBrFWFRTqoBd',
      duration: 30,
      isFree: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const module2 = await prisma.tbl_modules.create({
    data: {
      moduleId: uuidv4(),
      courseId: course1.courseId,
      title: 'CSS Fundamentals',
      orderIndex: 2,
      description: 'Learn CSS basics',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const curriculum2 = await prisma.tbl_curricula.create({
    data: {
      curriculumId: uuidv4(),
      moduleId: module2.moduleId,
      title: 'Introduction to CSS',
      orderIndex: 1,
      type: 'LECTURE',
      description: 'Basic CSS concepts',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.tbl_lectures.create({
    data: {
      lectureId: uuidv4(),
      curriculumId: curriculum2.curriculumId,
      title: 'Introduction to CSS',
      description: 'Basic CSS concepts',
      videoUrl: 'https://youtu.be/OEV8gMkCHXQ',
      duration: 35,
      isFree: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const module3 = await prisma.tbl_modules.create({
    data: {
      moduleId: uuidv4(),
      courseId: course1.courseId,
      title: 'JavaScript Basics',
      orderIndex: 3,
      description: 'Learn JavaScript fundamentals',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const curriculum3 = await prisma.tbl_curricula.create({
    data: {
      curriculumId: uuidv4(),
      moduleId: module3.moduleId,
      title: 'Introduction to JavaScript',
      orderIndex: 1,
      type: 'LECTURE',
      description: 'Basic JavaScript concepts',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.tbl_lectures.create({
    data: {
      lectureId: uuidv4(),
      curriculumId: curriculum3.curriculumId,
      title: 'Introduction to JavaScript',
      description: 'Basic JavaScript concepts',
      videoUrl: 'https://youtu.be/W6NZfCO5SIk',
      duration: 40,
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

  await prisma.tbl_course_learning_objectives.createMany({
    data: [
      {
        objectiveId: uuidv4(),
        courseId: course1.courseId,
        description: 'Understand the basics of HTML, CSS, and JavaScript',
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        objectiveId: uuidv4(),
        courseId: course1.courseId,
        description: 'Build responsive and modern web applications',
        orderIndex: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        objectiveId: uuidv4(),
        courseId: course1.courseId,
        description:
          'Develop skills to work with front-end and back-end technologies',
        orderIndex: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  await prisma.tbl_course_requirements.createMany({
    data: [
      {
        requirementId: uuidv4(),
        courseId: course1.courseId,
        description: 'Basic understanding of how to use a computer',
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        requirementId: uuidv4(),
        courseId: course1.courseId,
        description: 'A stable internet connection',
        orderIndex: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        requirementId: uuidv4(),
        courseId: course1.courseId,
        description: 'No prior programming knowledge required',
        orderIndex: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  await prisma.tbl_course_target_audience.createMany({
    data: [
      {
        audienceId: uuidv4(),
        courseId: course1.courseId,
        description: 'Beginners who want to learn web development',
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        audienceId: uuidv4(),
        courseId: course1.courseId,
        description: 'Aspiring front-end or full-stack developers',
        orderIndex: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        audienceId: uuidv4(),
        courseId: course1.courseId,
        description: 'Entrepreneurs who want to build their own websites',
        orderIndex: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  // Tạo thêm một số khóa học để demo
  const additionalCourses = [
    {
      title: 'JavaScript Masterclass',
      description: 'Advanced JavaScript concepts and patterns',
      overview:
        'Deep dive into JavaScript, covering advanced topics like closures, prototypes, and async programming',
      durationTime: 3000, // 50 hours
      price: 89.99,
      thumbnail:
        'https://plus.unsplash.com/premium_vector-1734528979745-eaa10d557eed?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: true,
      isRecommended: false,
      categoryId: itCategory.categoryId,
    },
    {
      title: 'Digital Marketing Fundamentals',
      description: 'Learn the basics of digital marketing',
      overview:
        'Comprehensive introduction to SEO, SEM, social media marketing, and content strategy',
      durationTime: 1800, // 30 hours
      price: 69.99,
      thumbnail:
        'https://plus.unsplash.com/premium_vector-1730731379517-dd0bc0f201cf?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: false,
      isRecommended: true,
      categoryId: marketingCategory.categoryId,
    },
    {
      title: 'Mobile App Development with React Native',
      description: 'Build cross-platform mobile apps',
      overview:
        'Learn to develop iOS and Android apps using a single codebase with React Native',
      durationTime: 3600, // 60 hours
      price: 109.99,
      thumbnail:
        'https://cdn.hashnode.com/res/hashnode/image/upload/v1681468530991/3ff30cea-325d-412e-8c2d-7e091df05b68.png?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp',
      isBestSeller: true,
      isRecommended: true,
      categoryId: itCategory.categoryId,
    },
  ];

  // Tạo các khóa học và liên kết danh mục
  for (const courseData of additionalCourses) {
    const { categoryId, ...courseInfo } = courseData;
    const course = await prisma.tbl_courses.create({
      data: {
        courseId: uuidv4(),
        instructorId: instructor.instructorId,
        ...courseInfo,
        approved: 'APPROVED',
        rating: 4.0 + Math.random(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.tbl_course_categories.create({
      data: {
        courseCategoryId: uuidv4(),
        categoryId: categoryId,
        courseId: course.courseId,
      },
    });
  }

  // Tạo thêm khóa học có isRecommended: true
  const recommendedCourses = [
    {
      title: 'Data Science và Machine Learning cơ bản',
      description: 'Nhập môn về Data Science, thống kê và Machine Learning',
      overview:
        'Khóa học giúp bạn xây dựng nền tảng vững chắc về Data Science và AI',
      durationTime: 4200, // 70 hours
      price: 129.99,
      thumbnail:
        'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: itCategory.categoryId,
    },
    {
      title: 'Phát triển ứng dụng Web với NodeJS và Express',
      description: 'Xây dựng REST API và ứng dụng Back-end hoàn chỉnh',
      overview:
        'Học cách phát triển ứng dụng server-side với NodeJS, Express và MongoDB',
      durationTime: 3600, // 60 hours
      price: 89.99,
      thumbnail:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: itCategory.categoryId,
    },
    {
      title: 'Content Marketing chuyên nghiệp',
      description: 'Chiến lược xây dựng nội dung thu hút khách hàng',
      overview:
        'Học cách tạo chiến lược content marketing hiệu quả và đo lường thành công',
      durationTime: 2400, // 40 hours
      price: 79.99,
      thumbnail:
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: marketingCategory.categoryId,
    },
    {
      title: 'UI/UX Design: Từ cơ bản đến nâng cao',
      description: 'Thiết kế giao diện người dùng trực quan và thân thiện',
      overview:
        'Khóa học giúp bạn nắm vững các nguyên tắc thiết kế UI/UX và công cụ Figma',
      durationTime: 3000, // 50 hours
      price: 99.99,
      thumbnail:
        'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: itCategory.categoryId,
    },
  ];

  // Tạo thêm khóa học có isBestSeller: true
  const bestSellerCourses = [
    {
      title: 'Python cho Data Analysis và Visualization',
      description: 'Phân tích và trực quan hóa dữ liệu với Python',
      overview:
        'Học cách sử dụng thư viện pandas, numpy, matplotlib và seaborn cho phân tích dữ liệu',
      durationTime: 3300, // 55 hours
      price: 109.99,
      thumbnail:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: itCategory.categoryId,
    },
    {
      title: 'Digital Advertising và Facebook Ads',
      description: 'Chiến lược quảng cáo trên nền tảng Meta hiệu quả',
      overview:
        'Học cách tạo và tối ưu hóa chiến dịch quảng cáo trên Facebook, Instagram và Audience Network',
      durationTime: 1800, // 30 hours
      price: 69.99,
      thumbnail:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: marketingCategory.categoryId,
    },
    {
      title: 'Phát triển Game với Unity 3D',
      description: 'Xây dựng game 3D từ ý tưởng đến sản phẩm hoàn chỉnh',
      overview:
        'Khóa học giúp bạn làm chủ Unity 3D và phát triển game cross-platform',
      durationTime: 4500, // 75 hours
      price: 129.99,
      thumbnail:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: itCategory.categoryId,
    },
    {
      title: 'DevOps và CI/CD Pipeline',
      description: 'Xây dựng quy trình phát triển và triển khai liên tục',
      overview:
        'Học cách sử dụng Docker, Kubernetes, Jenkins và các công cụ DevOps khác',
      durationTime: 3600, // 60 hours
      price: 119.99,
      thumbnail:
        'https://images.unsplash.com/photo-1633412802994-5c058f151b66?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: itCategory.categoryId,
    },
  ];

  // Tạo các khóa học được đề xuất
  for (const courseData of recommendedCourses) {
    const { categoryId, ...courseInfo } = courseData;
    const course = await prisma.tbl_courses.create({
      data: {
        courseId: uuidv4(),
        instructorId: instructor.instructorId,
        ...courseInfo,
        approved: 'APPROVED',
        rating: 4.0 + Math.random(), // Random rating từ 4.0 đến 5.0
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.tbl_course_categories.create({
      data: {
        courseCategoryId: uuidv4(),
        categoryId: categoryId,
        courseId: course.courseId,
      },
    });
  }

  // Tạo các khóa học bán chạy nhất
  for (const courseData of bestSellerCourses) {
    const { categoryId, ...courseInfo } = courseData;
    const course = await prisma.tbl_courses.create({
      data: {
        courseId: uuidv4(),
        instructorId: instructor.instructorId,
        ...courseInfo,
        approved: 'APPROVED',
        rating: 4.2 + Math.random() * 0.8, // Random rating từ 4.2 đến 5.0
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.tbl_course_categories.create({
      data: {
        courseCategoryId: uuidv4(),
        categoryId: categoryId,
        courseId: course.courseId,
      },
    });
  }

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
