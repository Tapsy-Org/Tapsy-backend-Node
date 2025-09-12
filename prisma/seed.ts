import { PrismaClient, CategoryAudience, NotificationType, NotificationStatus, SupportStatus, BillingCycle, SubscriptionStatus, PaymentMethod, UserType, Status, VerificationMethod, LocationType, ReviewRating, OnboardingStep } from '@prisma/client';
import { faker } from '@faker-js/faker';

// Node.js globals for seeding
declare const process: {
  argv: string[];
  exit: (code: number) => never;
};

const prisma = new PrismaClient();

// Sample categories for different audiences
const businessCategories = [
  'Restaurants & Food',
  'Healthcare & Medical',
  'Beauty & Wellness',
  'Automotive Services',
  'Home & Garden',
  'Professional Services',
  'Retail & Shopping',
  'Entertainment',
  'Education & Training',
  'Technology & IT'
];

const individualCategories = [
  'Fitness & Health',
  'Travel & Adventure',
  'Food & Cooking',
  'Art & Creativity',
  'Music & Entertainment',
  'Sports & Recreation',
  'Fashion & Style',
  'Photography',
  'Gaming & Technology',
  'Lifestyle & Wellness'
];

const bothCategories = [
  'Events & Celebrations',
  'Community & Social',
  'Environment & Sustainability',
  'Charity & Volunteering',
  'Hobbies & Interests',
  'Learning & Development',
  'Health & Wellness',
  'Entertainment & Media',
  'Technology & Innovation',
  'Business & Entrepreneurship'
];

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  // Delete in reverse order of dependencies
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.reviewFeedback.deleteMany();
  await prisma.review.deleteMany();
  await prisma.businessVideo.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.recentSearch.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.userCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.setting.deleteMany();
  
  console.log('✅ Database cleared successfully');
}

async function seedCategories() {
  console.log('🌱 Seeding categories...');
  
  const allCategories = [
    ...businessCategories.map(name => ({ name, audience: CategoryAudience.BUSINESS })),
    ...individualCategories.map(name => ({ name, audience: CategoryAudience.INDIVIDUAL })),
    ...bothCategories.map(name => ({ name, audience: CategoryAudience.BOTH }))
  ];

  for (let i = 0; i < allCategories.length; i++) {
    const category = allCategories[i];
    const slug = faker.helpers.slugify(category.name).toLowerCase();
    
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name: category.name,
        slug,
        audience: category.audience,
        status: faker.helpers.arrayElement([Status.ACTIVE, Status.ACTIVE, Status.ACTIVE, Status.INACTIVE]) as any,
        sort_order: i + 1,
        icon: faker.helpers.arrayElement([faker.image.urlLoremFlickr({ category: 'icon' }), null]) as any
      } as any
    });
  }
  
  console.log(`✅ Created ${allCategories.length} categories`);
  return prisma.category.findMany(); // Return all categories for assignment
}

async function seedBusinessUsers() {
  console.log('🏢 Seeding business users...');
  
  const businessUsers: any[] = [];
  
  for (let i = 0; i < 5; i++) {
    try {
      const businessUser = await prisma.user.create({
        data: {
          user_type: UserType.BUSINESS,
          mobile_number: `+1${faker.string.numeric(10)}`,
          email: faker.internet.email(),
          username: faker.company.name(),
          name: faker.company.name(),
          status: faker.helpers.arrayElement([Status.ACTIVE, Status.ACTIVE, Status.ACTIVE, Status.PENDING]) as any, // Mostly active
          last_login: faker.date.recent({ days: 30 }),
          firebase_token: faker.string.uuid(),
          otp_verified: true,
          verification_method: faker.helpers.arrayElement([VerificationMethod.MOBILE, VerificationMethod.EMAIL]),
          website: faker.internet.url(),
          about: faker.company.catchPhrase(),
          logo_url: faker.image.urlLoremFlickr({ category: 'business' }),
          video_url: faker.helpers.arrayElement([faker.image.urlLoremFlickr({ category: 'video' }), null]),
          rating_sum: faker.number.int({ min: 0, max: 500 }),
          review_count: faker.number.int({ min: 0, max: 100 })
        }
      });
      
      businessUsers.push(businessUser);
    } catch (error) {
      console.log(`Skipping business user creation: ${error}`);
    }
  }
  
  console.log(`✅ Created ${businessUsers.length} business users`);
  return businessUsers;
}

async function seedIndividualUsers() {
  console.log('👤 Seeding individual users...');
  
  const individualUsers: any[] = [];
  
  for (let i = 0; i < 5; i++) {
    try {
      const individualUser = await prisma.user.create({
        data: {
          user_type: UserType.INDIVIDUAL,
          mobile_number: `+1${faker.string.numeric(10)}`,
          username: faker.internet.username(),
          name: faker.person.fullName(),
          status: faker.helpers.arrayElement([Status.ACTIVE, Status.ACTIVE, Status.ACTIVE, Status.PENDING]) as any, // Mostly active
          last_login: faker.date.recent({ days: 30 }),
          firebase_token: faker.string.uuid(),
          otp_verified: true,
          verification_method: faker.helpers.arrayElement([VerificationMethod.MOBILE, VerificationMethod.EMAIL]),
          about: faker.person.bio(),
          onboarding_step: faker.helpers.arrayElement([OnboardingStep.REGISTERED, OnboardingStep.CATEGORY, OnboardingStep.LOCATION, OnboardingStep.COMPLETED])
        }
      });
      
      individualUsers.push(individualUser);
    } catch (error) {
      console.log(`⚠️ Skipping individual user creation: ${error}`);
    }
  }
  
  console.log(`✅ Created ${individualUsers.length} individual users`);
  return individualUsers;
}

async function seedAdminUsers() {
  console.log('👑 Seeding admin users...');
  
  const adminUsers: any[] = [];
  
  for (let i = 0; i < 2; i++) {
    try {
      const adminUser = await prisma.user.create({
        data: {
          user_type: UserType.ADMIN,
          mobile_number: `+1${faker.string.numeric(10)}`,
          email: faker.internet.email(),
          username: `admin_${faker.internet.username()}`,
          name: faker.person.fullName(),
          status: Status.ACTIVE as any,
          last_login: faker.date.recent({ days: 7 }),
          firebase_token: faker.string.uuid(),
          otp_verified: true,
          verification_method: faker.helpers.arrayElement([VerificationMethod.MOBILE, VerificationMethod.EMAIL]),
          password: faker.internet.password(), // Admin users have passwords
          about: 'System Administrator'
        }
      });
      
      adminUsers.push(adminUser);
    } catch (error) {
      console.log(`⚠️ Skipping admin user creation: ${error}`);
    }
  }
  
  console.log(`✅ Created ${adminUsers.length} admin users`);
  return adminUsers;
}

async function assignCategoriesToUsers(businessUsers: any[], individualUsers: any[], categories: any[]) {
  for (const businessUser of businessUsers) {
    const businessCategories = categories.filter(cat => 
      cat.audience === CategoryAudience.BUSINESS || cat.audience === CategoryAudience.BOTH
    );
    
    const selectedCategories = faker.helpers.arrayElements(
      businessCategories, 
      faker.number.int({ min: 1, max: 2 })
    );
    
    for (const category of selectedCategories) {
      try {
        await prisma.userCategory.create({
          data: {
            userId: businessUser.id,
            categoryId: category.id,
            categoriesName: [category.name],
            subcategories: faker.helpers.arrayElements([
              'Premium', 'Standard', 'Basic', 'Enterprise'
            ], faker.number.int({ min: 1, max: 3 })),
            user_type: UserType.BUSINESS
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping user category creation for business ${businessUser.id}: ${error}`);
      }
    }
  }
  
  // Assign categories to individual users
  for (const individualUser of individualUsers) {
    const individualCategories = categories.filter(cat => 
      cat.audience === CategoryAudience.INDIVIDUAL || cat.audience === CategoryAudience.BOTH
    );
    
    const selectedCategories = faker.helpers.arrayElements(
      individualCategories, 
      faker.number.int({ min: 1, max: 2 })
    );
    
    for (const category of selectedCategories) {
      try {
        await prisma.userCategory.create({
          data: {
            userId: individualUser.id,
            categoryId: category.id,
            categoriesName: [category.name],
            subcategories: faker.helpers.arrayElements([
              'Beginner', 'Intermediate', 'Advanced', 'Expert'
            ], faker.number.int({ min: 1, max: 2 })),
            user_type: UserType.INDIVIDUAL
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping user category creation for individual ${individualUser.id}: ${error}`);
      }
    }
  }
  
  console.log('✅ User categories assigned successfully');
}

async function seedLocations(users: any[]) {
  console.log('📍 Seeding user locations...');
  
  for (const user of users) {
    const locationCount = faker.number.int({ min: 1, max: 2 });
    
    for (let i = 0; i < locationCount; i++) {
      try {
        await prisma.location.create({
          data: {
            userId: user.id,
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude(),
            location: faker.location.streetAddress(),
            address: faker.location.streetAddress(),
            zip_code: faker.location.zipCode(),
            city: faker.location.city(),
            state: faker.location.state(),
            country: faker.location.country(),
            location_type: faker.helpers.arrayElement([LocationType.HOME, LocationType.WORK, LocationType.OTHER])
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping location creation for user ${user.id}: ${error}`);
      }
    }
  }
  
  console.log('✅ User locations created successfully');
}

async function seedReviews(users: any[]) {
  console.log('⭐ Seeding reviews...');
  
  const businessUsers = users.filter(user => user.user_type === UserType.BUSINESS);
  const individualUsers = users.filter(user => user.user_type === UserType.INDIVIDUAL);
  const allReviews: any[] = [];
  
  if (businessUsers.length === 0 || individualUsers.length === 0) {
    console.log('⚠️ Skipping reviews - need both business and individual users');
    return allReviews;
  }
  
  // Individual users review businesses
  for (const businessUser of businessUsers) {
    const reviewCount = faker.number.int({ min: 2, max: 5 });
    
    for (let i = 0; i < reviewCount; i++) {
      const reviewer = faker.helpers.arrayElement(individualUsers);
      
      try {
        const review = await prisma.review.create({
          data: {
            userId: reviewer.id, // This is the user who CREATED the review
            rating: faker.helpers.arrayElement([ReviewRating.ONE, ReviewRating.TWO, ReviewRating.THREE, ReviewRating.FOUR, ReviewRating.FIVE]),
            badges: faker.helpers.arrayElement(['Verified', 'Top Reviewer', 'Helpful', null]),
            caption: faker.lorem.sentence(),
            hashtags: faker.helpers.arrayElements([
              '#amazing', '#greatservice', '#recommended', '#quality', '#professional'
            ], faker.number.int({ min: 1, max: 3 })),
            title: faker.lorem.words(3),
            video_url: faker.helpers.arrayElement([faker.image.urlLoremFlickr({ category: 'video' }), null]),
            businessId: businessUser.id, // This is the business being reviewed
            views: faker.number.int({ min: 0, max: 1000 }),
            status: faker.helpers.arrayElement([Status.ACTIVE, Status.ACTIVE, Status.ACTIVE, Status.INACTIVE]) as any as any
          }
        });
        allReviews.push(review);
      } catch (error) {
        console.log(`⚠️ Skipping review creation: ${error}`);
      }
    }
  }
  
  console.log(`✅ Created ${allReviews.length} reviews successfully`);
  return allReviews;
}

async function seedReviewFeedback(reviews: any[]) {
  console.log('💬 Seeding review feedback...');
  
  let feedbackCount = 0;
  
  for (const review of reviews) {
    // Only create feedback for some reviews
    if (faker.datatype.boolean({ probability: 0.3 })) {
      try {
        await prisma.reviewFeedback.create({
          data: {
            reviewId: review.id,
            feedback: faker.lorem.paragraph(),
            is_resolved: faker.datatype.boolean()
          }
        });
        feedbackCount++;
      } catch (error) {
        console.log(`⚠️ Skipping review feedback creation: ${error}`);
      }
    }
  }
  
  console.log(`✅ Created ${feedbackCount} review feedback entries`);
}

async function seedFollows(users: any[]) {
  console.log('👥 Seeding follows...');
  
  const individualUsers = users.filter(user => user.user_type === UserType.INDIVIDUAL);
  const businessUsers = users.filter(user => user.user_type === UserType.BUSINESS);
  let totalFollows = 0;
  const followData: { followerId: string; followingUserId: string }[] = [];
  
  // Pre-generate all potential follows for individual users following other individuals
  for (const user of individualUsers) {
    const followCount = faker.number.int({ min: 0, max: 3 });
    const availableUsers = individualUsers.filter(u => u.id !== user.id);
    
    if (availableUsers.length === 0) continue;
    
    const usersToFollow = faker.helpers.arrayElements(
      availableUsers, 
      Math.min(followCount, availableUsers.length)
    );
    
    for (const userToFollow of usersToFollow) {
      followData.push({
        followerId: user.id,
        followingUserId: userToFollow.id
      });
    }
  }
  
  // Pre-generate all potential follows for individual users following businesses
  for (const user of individualUsers) {
    const businessFollowCount = faker.number.int({ min: 0, max: 3 });
    const availableBusinesses = businessUsers.filter(b => b.id !== user.id);
    
    if (availableBusinesses.length === 0) continue;
    
    const businessesToFollow = faker.helpers.arrayElements(
      availableBusinesses, 
      Math.min(businessFollowCount, availableBusinesses.length)
    );
    
    for (const business of businessesToFollow) {
      followData.push({
        followerId: user.id,
        followingUserId: business.id
      });
    }
  }
  
  // Create follows in batches, handling unique constraint violations
  for (const follow of followData) {
    try {
      await prisma.follow.create({
        data: follow
      });
      totalFollows++;
    } catch (error) {
      // Skip if follow already exists (due to unique constraint)
      // This is expected behavior, so we don't log it as an error
    }
  }
  
  console.log(`✅ Created ${totalFollows} follows successfully`);
}

async function seedPlans() {
  console.log('💳 Seeding subscription plans...');
  
  const plansData = [
    {
      name: 'Basic',
      price: 999, // $9.99 in cents
      billingCycle: BillingCycle.MONTHLY,
      features: ['Basic listing', 'Up to 5 reviews', 'Standard support'],
      limits: ['5 reviews per month', 'Basic analytics'],
      status: Status.ACTIVE as any,
      sort_order: 1,
      stripe_price_id: 'price_basic_monthly',
      is_popular: false,
      trial_days: 7
    },
    {
      name: 'Professional',
      price: 1999, // $19.99 in cents
      billingCycle: BillingCycle.MONTHLY,
      features: ['Enhanced listing', 'Unlimited reviews', 'Priority support', 'Advanced analytics'],
      limits: ['Unlimited reviews', 'Advanced analytics', 'Priority support'],
      status: Status.ACTIVE as any,
      sort_order: 2,
      stripe_price_id: 'price_professional_monthly',
      is_popular: true,
      trial_days: 14
    },
    {
      name: 'Enterprise',
      price: 4999, // $49.99 in cents
      billingCycle: BillingCycle.MONTHLY,
      features: ['Premium listing', 'Unlimited everything', '24/7 support', 'Custom integrations'],
      limits: ['Unlimited everything', 'Custom integrations', '24/7 support'],
      status: Status.ACTIVE as any,
      sort_order: 3,
      stripe_price_id: 'price_enterprise_monthly',
      is_popular: false,
      trial_days: 30
    }
  ];

  const createdPlans: any[] = [];
  for (const plan of plansData) {
    try {
      const createdPlan = await prisma.plan.create({
        data: plan
      });
      createdPlans.push(createdPlan);
    } catch (error) {
      console.log(`⚠️ Skipping plan creation: ${error}`);
    }
  }
  
  console.log(`✅ Created ${createdPlans.length} subscription plans`);
  return createdPlans;
}

async function seedSubscriptions(businessUsers: any[], plans: any[]) {
  console.log('📋 Seeding subscriptions...');
  
  for (const businessUser of businessUsers) {
    const plan = faker.helpers.arrayElement(plans);
    const startDate = faker.date.recent({ days: 30 });
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    
    try {
      await prisma.subscription.create({
        data: {
          businessId: businessUser.id,
          planId: plan.id,
          status: faker.helpers.arrayElement([SubscriptionStatus.ACTIVE, SubscriptionStatus.ACTIVE, SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.PAST_DUE]),
          starts_at: startDate,
          ends_at: endDate,
          trial_ends_at: plan.trial_days > 0 ? new Date(startDate.getTime() + plan.trial_days * 24 * 60 * 60 * 1000) : null,
          cancelled_at: faker.helpers.arrayElement([null, null, null, faker.date.recent({ days: 10 })]),
          payment_method: faker.helpers.arrayElement([PaymentMethod.STRIPE, PaymentMethod.RAZORPAY, PaymentMethod.CARD])
        }
      });
    } catch (error) {
      console.log(`⚠️ Skipping subscription creation for business ${businessUser.id}: ${error}`);
    }
  }
  
  console.log('✅ Subscriptions created successfully');
}

async function seedLikes(users: any[], reviews: any[]) {
  console.log('❤️ Seeding likes...');
  
  let totalLikes = 0;
  const likeData: { userId: string; reviewId: string }[] = [];
  
  // Pre-generate all potential likes
  for (const review of reviews) {
    const likeCount = faker.number.int({ min: 0, max: 5 });
    const availableUsers = users.filter(u => u.id !== review.userId);
    
    if (availableUsers.length === 0) continue;
    
    // Randomly select users to like this review
    const usersToLike = faker.helpers.arrayElements(
      availableUsers,
      Math.min(likeCount, availableUsers.length)
    );
    
    for (const user of usersToLike) {
      likeData.push({
        userId: user.id,
        reviewId: review.id
      });
    }
  }
  
  // Create likes in batches, handling unique constraint violations
  for (const like of likeData) {
    try {
      await prisma.like.create({
        data: like
      });
      totalLikes++;
    } catch (error) {
      // Skip if like already exists (due to unique constraint)
      // This is expected behavior, so we don't log it as an error
    }
  }
  
  console.log(`✅ Created ${totalLikes} likes successfully`);
}

async function seedComments(users: any[], reviews: any[]) {
  console.log('💬 Seeding comments...');
  
  const allComments: any[] = [];
  
  // Create top-level comments
  for (const review of reviews) {
    const commentCount = faker.number.int({ min: 0, max: 3 });
    const availableUsers = users.filter(u => u.id !== review.userId);
    
    if (availableUsers.length === 0) continue;
    
    const usersToComment = faker.helpers.arrayElements(
      availableUsers,
      Math.min(commentCount, availableUsers.length)
    );
    
    for (const user of usersToComment) {
      try {
        const comment = await prisma.comment.create({
          data: {
            reviewId: review.id,
            userId: user.id,
            comment: faker.lorem.sentence(),
            parent_comment_id: null
          }
        });
        allComments.push(comment);
      } catch (error) {
        console.log(`⚠️ Skipping comment creation: ${error}`);
      }
    }
  }
  
  // Create replies to comments
  for (const comment of allComments) {
    const replyCount = faker.number.int({ min: 0, max: 2 });
    const availableUsers = users.filter(u => u.id !== comment.userId);
    
    if (availableUsers.length === 0) continue;
    
    const usersToReply = faker.helpers.arrayElements(
      availableUsers,
      Math.min(replyCount, availableUsers.length)
    );
    
    for (const user of usersToReply) {
      try {
        await prisma.comment.create({
          data: {
            reviewId: comment.reviewId,
            userId: user.id,
            comment: faker.lorem.sentence(),
            parent_comment_id: comment.id
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping reply creation: ${error}`);
      }
    }
  }
  
  console.log('✅ Comments and replies created successfully');
}

async function seedMessages(users: any[]) {
  console.log('💌 Seeding messages...');
  
  const individualUsers = users.filter(user => user.user_type === UserType.INDIVIDUAL);
  const businessUsers = users.filter(user => user.user_type === UserType.BUSINESS);
  
  // Individual to individual messages
  for (const user of individualUsers) {
    const messageCount = faker.number.int({ min: 0, max: 3 });
    const availableUsers = individualUsers.filter(u => u.id !== user.id);
    
    if (availableUsers.length === 0) continue;
    
    const usersToMessage = faker.helpers.arrayElements(
      availableUsers,
      Math.min(messageCount, availableUsers.length)
    );
    
    for (const recipient of usersToMessage) {
      try {
        await prisma.message.create({
          data: {
            senderId: user.id,
            receiverId: recipient.id,
            sender_type: UserType.INDIVIDUAL,
            text: faker.lorem.sentence(),
            is_read: faker.datatype.boolean()
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping message creation: ${error}`);
      }
    }
  }
  
  // Individual to business messages
  for (const user of individualUsers) {
    const messageCount = faker.number.int({ min: 0, max: 2 });
    const availableBusinesses = businessUsers;
    
    if (availableBusinesses.length === 0) continue;
    
    const businessesToMessage = faker.helpers.arrayElements(
      availableBusinesses,
      Math.min(messageCount, availableBusinesses.length)
    );
    
    for (const business of businessesToMessage) {
      try {
        await prisma.message.create({
          data: {
            senderId: user.id,
            receiverId: business.id,
            sender_type: UserType.INDIVIDUAL,
            text: faker.lorem.sentence(),
            is_read: faker.datatype.boolean()
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping message creation: ${error}`);
      }
    }
  }
  
  console.log('✅ Messages created successfully');
}

async function seedBusinessVideos(businessUsers: any[]) {
  console.log('🎥 Seeding business videos...');
  
  for (const business of businessUsers) {
    const videoCount = faker.number.int({ min: 0, max: 2 });
    
    for (let i = 0; i < videoCount; i++) {
      try {
        await prisma.businessVideo.create({
          data: {
            businessId: business.id,
            title: faker.lorem.words(3),
            caption: faker.lorem.sentence(),
            hashtags: faker.helpers.arrayElements([
              '#business', '#professional', '#quality', '#service', '#expert'
            ], faker.number.int({ min: 1, max: 3 })),
            video_url: faker.image.urlLoremFlickr({ category: 'video' })
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping business video creation: ${error}`);
      }
    }
  }
  
  console.log('✅ Business videos created successfully');
}

async function seedNotifications(users: any[]) {
  console.log('🔔 Seeding notifications...');
  
  for (const user of users) {
    const notificationCount = faker.number.int({ min: 2, max: 5 });
    
    for (let i = 0; i < notificationCount; i++) {
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            senderId: faker.helpers.arrayElement([null, faker.helpers.arrayElement(users).id]),
            type: faker.helpers.arrayElement([NotificationType.SYSTEM, NotificationType.LIKE, NotificationType.COMMENT, NotificationType.FOLLOW, NotificationType.MESSAGE, NotificationType.MENTION]),
            referenceId: faker.helpers.arrayElement([null, faker.string.uuid()]),
            title: faker.lorem.words(3),
            content: faker.lorem.sentence(),
            image_url: faker.helpers.arrayElement([faker.image.urlLoremFlickr({ category: 'notification' }), null]),
            status: faker.helpers.arrayElement([NotificationStatus.ACTIVE, NotificationStatus.ARCHIVED]),
            is_read: faker.datatype.boolean()
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping notification creation: ${error}`);
      }
    }
  }
  
  console.log('✅ Notifications created successfully');
}

async function seedSupportTickets(users: any[]) {
  console.log('🎫 Seeding support tickets...');
  
  for (const user of users) {
    const ticketCount = faker.number.int({ min: 0, max: 1 });
    
    for (let i = 0; i < ticketCount; i++) {
      try {
        await prisma.supportTicket.create({
          data: {
            userId: user.id,
            user_type: user.user_type,
            title: faker.lorem.words(4),
            email: user.email || faker.internet.email(),
            description: faker.lorem.paragraph(),
            status: faker.helpers.arrayElement([SupportStatus.OPEN, SupportStatus.IN_PROGRESS, SupportStatus.RESOLVED, SupportStatus.CLOSED])
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping support ticket creation: ${error}`);
      }
    }
  }
  
  console.log('✅ Support tickets created successfully');
}

async function seedRecentSearches(users: any[]) {
  console.log('🔍 Seeding recent searches...');
  
  for (const user of users) {
    const searchCount = faker.number.int({ min: 2, max: 5 });
    
    for (let i = 0; i < searchCount; i++) {
      try {
        await prisma.recentSearch.create({
          data: {
            userId: user.id,
            status: faker.helpers.arrayElement([Status.ACTIVE, Status.INACTIVE]) as any,
            searchText: faker.helpers.arrayElement([
              'restaurants near me',
              'best coffee shops',
              'hair salons',
              'gym membership',
              'car repair',
              'dentist',
              'photography services',
              'event planning',
              'home cleaning',
              'pet grooming'
            ])
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping recent search creation: ${error}`);
      }
    }
  }
  
  console.log('✅ Recent searches created successfully');
}

async function seedSettings() {
  console.log('⚙️ Seeding settings...');
  
  const settingsData = [
    { key: 'app_name', value: 'Tapsy' },
    { key: 'app_version', value: '1.0.0' },
    { key: 'max_file_size', value: '10485760' }, // 10MB in bytes
    { key: 'allowed_file_types', value: 'jpg,jpeg,png,mp4,mov' },
    { key: 'max_reviews_per_user', value: '100' },
    { key: 'max_follows_per_user', value: '1000' },
    { key: 'notification_retention_days', value: '30' },
    { key: 'search_history_retention_days', value: '90' }
  ];

  for (const setting of settingsData) {
    try {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      });
    } catch (error) {
      console.log(`⚠️ Skipping setting creation: ${error}`);
    }
  }
  
  console.log('✅ Settings created successfully');
}

async function seedQRCodes() {
  console.log('📱 Seeding QR codes...');
  
  const qrCodes = [
    { name: 'App Store Download', image_url: faker.image.urlLoremFlickr({ category: 'qr' }) },
    { name: 'Google Play Download', image_url: faker.image.urlLoremFlickr({ category: 'qr' }) },
    { name: 'Website Link', image_url: faker.image.urlLoremFlickr({ category: 'qr' }) },
    { name: 'Contact Info', image_url: faker.image.urlLoremFlickr({ category: 'qr' }) }
  ];

  for (const qrCode of qrCodes) {
    try {
      await prisma.qRCode.create({
        data: {
          name: qrCode.name,
          image_url: qrCode.image_url,
          status: faker.helpers.arrayElement([Status.ACTIVE, Status.ACTIVE, Status.ACTIVE, Status.INACTIVE]) as any
        }
      });
    } catch (error) {
      console.log(`⚠️ Skipping QR code creation: ${error}`);
    }
  }
  
  console.log('✅ QR codes created successfully');
}

async function main() {
  try {
    console.log('Starting seeding process...');
    
    await clearDatabase();
    
    const categories = await seedCategories();
    
    const businessUsers = await seedBusinessUsers();
    const individualUsers = await seedIndividualUsers();
    const adminUsers = await seedAdminUsers();
    const allUsers = [...businessUsers, ...individualUsers, ...adminUsers];
    
    // Seed plans first (needed for subscriptions)
    const plans = await seedPlans();
    
    // Assign categories to users
    await assignCategoriesToUsers(businessUsers, individualUsers, categories);
    
    // Seed locations
    await seedLocations(allUsers);
    
    // Seed reviews (returns reviews for likes and comments)
    const reviews = await seedReviews(allUsers);
    
    // Seed review feedback
    await seedReviewFeedback(reviews);
    
    // Seed follows
    await seedFollows(allUsers);
    
    // Seed subscriptions (business users only)
    await seedSubscriptions(businessUsers, plans);
    
    // Seed likes for reviews
    await seedLikes(allUsers, reviews);
    
    // Seed comments and replies for reviews
    await seedComments(allUsers, reviews);
    
    // Seed messages between users
    await seedMessages(allUsers);
    
    // Seed business videos
    await seedBusinessVideos(businessUsers);
    
    // Seed notifications
    await seedNotifications(allUsers);
    
    // Seed support tickets
    await seedSupportTickets(allUsers);
    
    // Seed recent searches
    await seedRecentSearches(allUsers);
    
    // Seed settings
    await seedSettings();
    
    // Seed QR codes
    await seedQRCodes();
    
    console.log('All seeding completed successfully!');
    console.log(`Summary:`);
    console.log(`   - Categories: ${await prisma.category.count()}`);
    console.log(`   - Business Users: ${businessUsers.length}`);
    console.log(`   - Individual Users: ${individualUsers.length}`);
    console.log(`   - Admin Users: ${adminUsers.length}`);
    console.log(`   - User Categories: ${await prisma.userCategory.count()}`);
    console.log(`   - Locations: ${await prisma.location.count()}`);
    console.log(`   - Reviews: ${await prisma.review.count()}`);
    console.log(`   - Review Feedback: ${await prisma.reviewFeedback.count()}`);
    console.log(`   - Follows: ${await prisma.follow.count()}`);
    console.log(`   - Plans: ${await prisma.plan.count()}`);
    console.log(`   - Subscriptions: ${await prisma.subscription.count()}`);
    console.log(`   - Likes: ${await prisma.like.count()}`);
    console.log(`   - Comments: ${await prisma.comment.count()}`);
    console.log(`   - Messages: ${await prisma.message.count()}`);
    console.log(`   - Business Videos: ${await prisma.businessVideo.count()}`);
    console.log(`   - Notifications: ${await prisma.notification.count()}`);
    console.log(`   - Support Tickets: ${await prisma.supportTicket.count()}`);
    console.log(`   - Recent Searches: ${await prisma.recentSearch.count()}`);
    console.log(`   - Settings: ${await prisma.setting.count()}`);
    console.log(`   - QR Codes: ${await prisma.qRCode.count()}`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function if this file is executed directly
main()
  .then(() => {
    console.log('🎯 Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  });

export default main;