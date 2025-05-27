import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Xóa dữ liệu cũ
  await prisma.tbl_quiz_answers.deleteMany();
  await prisma.tbl_quiz_attempts.deleteMany();
  await prisma.tbl_answers.deleteMany();
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
      instructorName: instructorUser.fullName,
      bio: 'Experienced instructor with 10 years of teaching',
      profilePicture: '',
      experience: '10 years of teaching experience',
      average_rating: 4.5,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const informationTechCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'INFORMATION_TECHNOLOGY',
    },
  });

  const marketingCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'Marketing',
      description: 'Các khóa học về marketing, quảng cáo',
    },
  });

  // Thêm các danh mục còn lại
  const financeCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'FINANCE',
      description: 'Finance related courses',
    },
  });

  const businessCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'BUSSINESS',
      description: 'Business related courses',
    },
  });

  const designCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'DESIGN',
      // name: 'Design',
      description: 'Design related courses',
    },
  });

  const lifestyleCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'LIFESTYLE',
    },
  });

  const personalDevCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'PERSONAL_DEVELOPMENT',
    },
  });

  const healthCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'HEALTH',
    },
  });

  const musicCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'MUSIC',
    },
  });

  const languageCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'LANGUAGE',
    },
  });

  const scienceCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'SCIENCE',
    },
  });

  const mathCategory = await prisma.tbl_categories.create({
    data: {
      categoryId: uuidv4(),
      name: 'MATH',
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
      categoryId: informationTechCategory.categoryId,
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
      price: 1000000,
      thumbnail:
        'https://plus.unsplash.com/premium_vector-1734528979745-eaa10d557eed?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: true,
      isRecommended: false,
      categoryId: informationTechCategory.categoryId,
    },
    {
      title: 'Digital Marketing Fundamentals',
      description: 'Learn the basics of digital marketing',
      overview:
        'Comprehensive introduction to SEO, SEM, social media marketing, and content strategy',
      durationTime: 1800, // 30 hours
      price: 500000,
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
      price: 2000000,
      thumbnail:
        'https://cdn.hashnode.com/res/hashnode/image/upload/v1681468530991/3ff30cea-325d-412e-8c2d-7e091df05b68.png?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp',
      isBestSeller: true,
      isRecommended: true,
      categoryId: informationTechCategory.categoryId,
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
      price: 150000,
      thumbnail:
        'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: informationTechCategory.categoryId,
    },
    {
      title: 'Phát triển ứng dụng Web với NodeJS và Express',
      description: 'Xây dựng REST API và ứng dụng Back-end hoàn chỉnh',
      overview:
        'Học cách phát triển ứng dụng server-side với NodeJS, Express và MongoDB',
      durationTime: 3600, // 60 hours
      price: 500000,
      thumbnail:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: informationTechCategory.categoryId,
    },
    {
      title: 'Content Marketing chuyên nghiệp',
      description: 'Chiến lược xây dựng nội dung thu hút khách hàng',
      overview:
        'Học cách tạo chiến lược content marketing hiệu quả và đo lường thành công',
      durationTime: 2400, // 40 hours
      price: 3000000,
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
      price: 1500000,
      thumbnail:
        'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: designCategory.categoryId,
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
      price: 2000000,
      thumbnail:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: informationTechCategory.categoryId,
    },
    {
      title: 'Python cho người mới bắt đầu',
      description: 'Học Python từ cơ bản đến nâng cao',
      overview:
        'Học cách sử dụng thư viện pandas, numpy, matplotlib và seaborn cho phân tích dữ liệu',
      durationTime: 3300, // 55 hours
      price: 2000000,
      thumbnail:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: informationTechCategory.categoryId,
    },
    {
      title: 'Digital Advertising và Facebook Ads',
      description: 'Chiến lược quảng cáo trên nền tảng Meta hiệu quả',
      overview:
        'Học cách tạo và tối ưu hóa chiến dịch quảng cáo trên Facebook, Instagram và Audience Network',
      durationTime: 1800, // 30 hours
      price: 1000000,
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
      price: 2000000,
      thumbnail:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: informationTechCategory.categoryId,
    },
    {
      title: 'DevOps và CI/CD Pipeline',
      description: 'Xây dựng quy trình phát triển và triển khai liên tục',
      overview:
        'Học cách sử dụng Docker, Kubernetes, Jenkins và các công cụ DevOps khác',
      durationTime: 3600, // 60 hours
      price: 1000000,
      thumbnail:
        'https://images.unsplash.com/photo-1633412802994-5c058f151b66?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: informationTechCategory.categoryId,
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

  // Thêm khóa học cho các danh mục mới sau đoạn code của bestSellerCourses

  // Danh sách khóa học cho các danh mục mới
  const additionalCategoryCoursesData = [
    // Finance courses
    {
      title: 'Đầu tư chứng khoán cơ bản',
      description: 'Các nguyên tắc cơ bản của đầu tư chứng khoán',
      overview:
        'Khóa học giúp bạn hiểu cách phân tích và đầu tư vào thị trường chứng khoán',
      durationTime: 2400, // 40 hours
      price: 89.99,
      thumbnail:
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: financeCategory.categoryId,
    },
    {
      title: 'Quản lý tài chính cá nhân',
      description: 'Lập kế hoạch tài chính và đầu tư thông minh',
      overview:
        'Học cách quản lý ngân sách, tiết kiệm và lập kế hoạch tài chính dài hạn',
      durationTime: 1800, // 30 hours
      price: 69.99,
      thumbnail:
        'https://plus.unsplash.com/premium_photo-1688821130079-6194699d26e1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: false,
      isRecommended: true,
      categoryId: financeCategory.categoryId,
    },

    // Business courses
    {
      title: 'Khởi nghiệp kinh doanh',
      description: 'Từ ý tưởng đến mô hình kinh doanh thành công',
      overview:
        'Khóa học cung cấp các bước xây dựng doanh nghiệp từ khâu ý tưởng đến vận hành',
      durationTime: 3600, // 60 hours
      price: 99.99,
      thumbnail:
        'https://plus.unsplash.com/premium_vector-1710425435145-7f4f0b49edcf?q=80&w=2210&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: true,
      isRecommended: false,
      categoryId: businessCategory.categoryId,
    },
    {
      title: 'Quản trị doanh nghiệp hiện đại',
      description: 'Chiến lược và kỹ năng lãnh đạo doanh nghiệp',
      overview:
        'Học cách xây dựng chiến lược, quản lý nhân sự và phát triển doanh nghiệp bền vững',
      durationTime: 3000, // 50 hours
      price: 109.99,
      thumbnail:
        'https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: businessCategory.categoryId,
    },

    // Design courses
    {
      title: 'Thiết kế đồ họa với Adobe Creative Suite',
      description: 'Học Photoshop, Illustrator và InDesign chuyên nghiệp',
      overview:
        'Khóa học giúp bạn làm chủ các công cụ thiết kế đồ họa hàng đầu của Adobe',
      durationTime: 4200, // 70 hours
      price: 119.99,
      thumbnail:
        'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: designCategory.categoryId,
    },
    {
      title: 'Thiết kế 3D với Blender',
      description: 'Học cách tạo mô hình 3D và animation',
      overview:
        'Từ cơ bản đến nâng cao về modeling, texturing, lighting và animation trong Blender',
      durationTime: 3600, // 60 hours
      price: 89.99,
      thumbnail:
        'https://images.unsplash.com/photo-1663255107091-d450616908b3?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: false,
      isRecommended: true,
      categoryId: designCategory.categoryId,
    },

    // Lifestyle courses
    {
      title: 'Nghệ thuật nấu ăn cơ bản',
      description: 'Học nấu các món ăn từ nhiều nền ẩm thực',
      overview:
        'Khóa học giúp bạn nắm vững các kỹ thuật nấu ăn cơ bản và áp dụng vào nhiều món ăn',
      durationTime: 2400, // 40 hours
      price: 59.99,
      thumbnail:
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: lifestyleCategory.categoryId,
    },
    {
      title: 'Trang trí nội thất và thiết kế không gian sống',
      description: 'Biến không gian sống thành nơi đẹp và tiện nghi',
      overview:
        'Học cách phối màu, bố trí nội thất và trang trí nhà cửa theo nhiều phong cách',
      durationTime: 1800, // 30 hours
      price: 69.99,
      thumbnail:
        'https://images.unsplash.com/photo-1615529162924-f8605388461d?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: lifestyleCategory.categoryId,
    },

    // Personal Development courses
    {
      title: 'Kỹ năng giao tiếp hiệu quả',
      description: 'Phát triển khả năng giao tiếp trong công việc và cuộc sống',
      overview:
        'Khóa học giúp bạn cải thiện kỹ năng giao tiếp, thuyết trình và đàm phán',
      durationTime: 1500, // 25 hours
      price: 49.99,
      thumbnail:
        'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: personalDevCategory.categoryId,
    },
    {
      title: 'Quản lý thời gian và năng suất cá nhân',
      description: 'Tối ưu hóa thời gian và nâng cao hiệu suất làm việc',
      overview:
        'Học các phương pháp quản lý thời gian, tổ chức công việc và tăng năng suất',
      durationTime: 1200, // 20 hours
      price: 39.99,
      thumbnail:
        'https://plus.unsplash.com/premium_photo-1663126649902-da96ec858a02?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: false,
      isRecommended: true,
      categoryId: personalDevCategory.categoryId,
    },

    // Health courses
    {
      title: 'Yoga cho sức khỏe và tinh thần',
      description: 'Các bài tập yoga từ cơ bản đến nâng cao',
      overview:
        'Khóa học hướng dẫn các tư thế, bài tập thở và thiền định trong yoga',
      durationTime: 1800, // 30 hours
      price: 49.99,
      thumbnail:
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2020&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: healthCategory.categoryId,
    },
    {
      title: 'Dinh dưỡng và chế độ ăn uống lành mạnh',
      description: 'Hiểu về dinh dưỡng và xây dựng thói quen ăn uống khoa học',
      overview:
        'Học về các nhóm dưỡng chất, cách xây dựng thực đơn cân bằng và chế biến thực phẩm lành mạnh',
      durationTime: 2100, // 35 hours
      price: 59.99,
      thumbnail:
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: healthCategory.categoryId,
    },

    // Music courses
    {
      title: 'Học đàn guitar cho người mới bắt đầu',
      description: 'Từ cơ bản đến có thể chơi được các bài hát đơn giản',
      overview:
        'Khóa học hướng dẫn các kỹ thuật cơ bản, hợp âm và cách chơi nhiều thể loại nhạc trên guitar',
      durationTime: 2400, // 40 hours
      price: 69.99,
      thumbnail:
        'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: true,
      isRecommended: false,
      categoryId: musicCategory.categoryId,
    },
    {
      title: 'Sản xuất âm nhạc với FL Studio',
      description: 'Học cách sáng tác và sản xuất nhạc trên máy tính',
      overview:
        'Khóa học giúp bạn làm chủ phần mềm FL Studio để tạo beat, mix và master các bản nhạc',
      durationTime: 3600, // 60 hours
      price: 89.99,
      thumbnail:
        'https://plus.unsplash.com/premium_photo-1683140707316-42df87760f3f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: false,
      isRecommended: true,
      categoryId: musicCategory.categoryId,
    },

    // Language courses
    {
      title: 'Tiếng Anh giao tiếp cho người mới bắt đầu',
      description: 'Phát triển kỹ năng giao tiếp tiếng Anh cơ bản',
      overview:
        'Khóa học giúp bạn xây dựng nền tảng ngữ pháp, từ vựng và phát âm tiếng Anh',
      durationTime: 3000, // 50 hours
      price: 79.99,
      thumbnail:
        'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: true,
      isRecommended: false,
      categoryId: languageCategory.categoryId,
    },
    {
      title: 'Tiếng Nhật cho người mới học',
      description: 'Học tiếng Nhật từ con số 0',
      overview:
        'Khóa học dạy bảng chữ cái, ngữ pháp cơ bản và giao tiếp tiếng Nhật hàng ngày',
      durationTime: 3600, // 60 hours
      price: 89.99,
      thumbnail:
        'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: languageCategory.categoryId,
    },

    // Science courses
    {
      title: 'Khoa học dữ liệu cho người mới bắt đầu',
      description: 'Nhập môn về thống kê, phân tích dữ liệu và mô hình dự đoán',
      overview:
        'Khóa học giới thiệu các nguyên lý và công cụ cơ bản trong khoa học dữ liệu',
      durationTime: 3600, // 60 hours
      price: 99.99,
      thumbnail:
        'https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isBestSeller: true,
      isRecommended: false,
      categoryId: scienceCategory.categoryId,
    },
    {
      title: 'Vật lý lượng tử cho người không chuyên',
      description: 'Hiểu về các nguyên lý cơ bản của vật lý lượng tử',
      overview:
        'Khóa học giải thích các khái niệm phức tạp của vật lý lượng tử bằng ngôn ngữ đơn giản',
      durationTime: 2400, // 40 hours
      price: 79.99,
      thumbnail:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      isBestSeller: false,
      isRecommended: true,
      categoryId: scienceCategory.categoryId,
    },

    // Math courses
    {
      title: 'Toán cao cấp cho đại học',
      description: 'Giải tích, đại số tuyến tính và phương trình vi phân',
      overview:
        'Khóa học cung cấp nền tảng toán học cần thiết cho sinh viên đại học',
      durationTime: 4200, // 70 hours
      price: 89.99,
      thumbnail:
        'https://plus.unsplash.com/premium_photo-1724800663657-3e57bf4f622c?q=80&w=1926&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
