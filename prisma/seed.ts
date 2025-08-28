import { PrismaClient, UserType, Status, VerificationMethod, CategoryAudience } from '@prisma/client';
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
  await prisma.review.deleteMany();
  await prisma.userCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  
  console.log('✅ Database cleared successfully');
}

async function seedCategories() {
  console.log('🌱 Seeding categories...');
  
  const allCategories = [
    ...businessCategories.map(name => ({ name, audience: 'BUSINESS' as CategoryAudience })),
    ...individualCategories.map(name => ({ name, audience: 'INDIVIDUAL' as CategoryAudience })),
    ...bothCategories.map(name => ({ name, audience: 'BOTH' as CategoryAudience }))
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
        status: true,
        sort_order: i + 1
      }
    });
  }
  
  console.log(`✅ Created ${allCategories.length} categories`);
  return prisma.category.findMany(); // Return all categories for assignment
}

async function seedBusinessUsers() {
  console.log('🏢 Seeding business users...');
  
  const businessUsers: any[] = [];
  
  for (let i = 0; i < 25; i++) {
    try {
      const businessUser = await prisma.user.create({
        data: {
          user_type: 'BUSINESS',
          mobile_number: faker.phone.number(),
          email: faker.internet.email(),
          username: faker.company.name(),
          device_id: faker.string.uuid(),
          status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING']), // Mostly active
          last_login: faker.date.recent({ days: 30 }),
          firebase_token: faker.string.uuid(),
          otp_verified: true,
          verification_method: faker.helpers.arrayElement(['MOBILE', 'EMAIL']),
          address: faker.location.streetAddress(),
          zip_code: faker.location.zipCode(),
          website: faker.internet.url(),
          about: faker.company.catchPhrase(),
          logo_url: faker.image.urlLoremFlickr({ category: 'business' }),
          video_url: faker.helpers.arrayElement([faker.image.urlLoremFlickr({ category: 'video' }), null])
        }
      });
      
      businessUsers.push(businessUser);
    } catch (error) {
      console.log(`⚠️ Skipping business user creation: ${error}`);
    }
  }
  
  console.log(`✅ Created ${businessUsers.length} business users`);
  return businessUsers;
}

async function seedIndividualUsers() {
  console.log('👤 Seeding individual users...');
  
  const individualUsers: any[] = [];
  
  for (let i = 0; i < 50; i++) {
    try {
      const individualUser = await prisma.user.create({
        data: {
          user_type: 'INDIVIDUAL',
          mobile_number: faker.phone.number(),
          email: faker.internet.email(),
          username: faker.internet.username(),
          device_id: faker.string.uuid(),
          status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING']), // Mostly active
          last_login: faker.date.recent({ days: 30 }),
          firebase_token: faker.string.uuid(),
          otp_verified: true,
          verification_method: faker.helpers.arrayElement(['MOBILE', 'EMAIL']),
          address: faker.location.streetAddress(),
          zip_code: faker.location.zipCode(),
          about: faker.person.bio(),
          video_url: faker.helpers.arrayElement([faker.image.urlLoremFlickr({ category: 'video' }), null])
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

async function assignCategoriesToUsers(businessUsers: any[], individualUsers: any[], categories: any[]) {
  console.log('🏷️ Seeding user categories...');
  
  // Assign categories to business users
  for (const businessUser of businessUsers) {
    const businessCategories = categories.filter(cat => 
      cat.audience === 'BUSINESS' || cat.audience === 'BOTH'
    );
    
    const selectedCategories = faker.helpers.arrayElements(
      businessCategories, 
      faker.number.int({ min: 1, max: 4 })
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
            user_type: 'BUSINESS'
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
      cat.audience === 'INDIVIDUAL' || cat.audience === 'BOTH'
    );
    
    const selectedCategories = faker.helpers.arrayElements(
      individualCategories, 
      faker.number.int({ min: 1, max: 3 })
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
            user_type: 'INDIVIDUAL'
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
    const locationCount = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < locationCount; i++) {
      try {
        await prisma.location.create({
          data: {
            userId: user.id,
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude(),
            location: faker.location.streetAddress(),
            location_type: faker.helpers.arrayElement(['HOME', 'WORK', 'OTHER'])
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
  
  const businessUsers = users.filter(user => user.user_type === 'BUSINESS');
  const individualUsers = users.filter(user => user.user_type === 'INDIVIDUAL');
  
  if (businessUsers.length === 0 || individualUsers.length === 0) {
    console.log('⚠️ Skipping reviews - need both business and individual users');
    return;
  }
  
  // Individual users review businesses
  for (const businessUser of businessUsers) {
    const reviewCount = faker.number.int({ min: 3, max: 15 });
    
    for (let i = 0; i < reviewCount; i++) {
      const reviewer = faker.helpers.arrayElement(individualUsers);
      
      try {
        await prisma.review.create({
          data: {
            userId: reviewer.id, // This is the user who CREATED the review
            rating: faker.helpers.arrayElement(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']),
            badges: faker.helpers.arrayElement(['Verified', 'Top Reviewer', 'Helpful', null]),
            caption: faker.lorem.sentence(),
            hashtags: faker.helpers.arrayElements([
              '#amazing', '#greatservice', '#recommended', '#quality', '#professional'
            ], faker.number.int({ min: 1, max: 3 })),
            title: faker.lorem.words(3),
            video_url: faker.helpers.arrayElement([faker.image.urlLoremFlickr({ category: 'video' }), null]),
            businessId: businessUser.id, // This is the business being reviewed
            views: faker.number.int({ min: 0, max: 1000 })
          }
        });
      } catch (error) {
        console.log(`⚠️ Skipping review creation: ${error}`);
      }
    }
  }
  
  console.log('✅ Reviews created successfully');
}

async function seedFollows(users: any[]) {
  console.log('👥 Seeding follows...');
  
  const individualUsers = users.filter(user => user.user_type === 'INDIVIDUAL');
  const businessUsers = users.filter(user => user.user_type === 'BUSINESS');
  
  // Individual users follow other individual users
  for (const user of individualUsers) {
    const followCount = faker.number.int({ min: 0, max: 8 });
    const availableUsers = individualUsers.filter(u => u.id !== user.id);
    
    if (availableUsers.length === 0) continue;
    
    const usersToFollow = faker.helpers.arrayElements(
      availableUsers, 
      Math.min(followCount, availableUsers.length)
    );
    
    for (const userToFollow of usersToFollow) {
      try {
        await prisma.follow.create({
          data: {
            followerId: user.id,
            followingUserId: userToFollow.id,
            followType: 'INDIVIDUAL'
          }
        });
      } catch (error) {
        // Skip if follow already exists (due to unique constraint)
        console.log(`⚠️ Skipping duplicate follow: ${user.id} -> ${userToFollow.id}`);
      }
    }
  }
  
  // Individual users follow businesses
  for (const user of individualUsers) {
    const businessFollowCount = faker.number.int({ min: 0, max: 5 });
    const availableBusinesses = businessUsers.filter(b => b.id !== user.id);
    
    if (availableBusinesses.length === 0) continue;
    
    const businessesToFollow = faker.helpers.arrayElements(
      availableBusinesses, 
      Math.min(businessFollowCount, availableBusinesses.length)
    );
    
    for (const business of businessesToFollow) {
      try {
        await prisma.follow.create({
          data: {
            followerId: user.id,
            followingUserId: business.id,
            followType: 'BUSINESS'
          }
        });
      } catch (error) {
        // Skip if follow already exists (due to unique constraint)
        console.log(`⚠️ Skipping duplicate follow: ${user.id} -> ${business.id}`);
      }
    }
  }
  
  console.log('✅ Follows created successfully');
}

async function main() {
  try {
    console.log('🌱 Starting seeding process...');
    
    await clearDatabase();
    
    const categories = await seedCategories();
    
    const businessUsers = await seedBusinessUsers();
    const individualUsers = await seedIndividualUsers();
    const allUsers = [...businessUsers, ...individualUsers];
    
    // Assign categories to users
    await assignCategoriesToUsers(businessUsers, individualUsers, categories);
    
    // Seed locations
    await seedLocations(allUsers);
    
    // Seed reviews
    await seedReviews(allUsers);
    
    // Seed follows
    await seedFollows(allUsers);
    
    console.log('🎯 All seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${await prisma.category.count()}`);
    console.log(`   - Business Users: ${businessUsers.length}`);
    console.log(`   - Individual Users: ${individualUsers.length}`);
    console.log(`   - User Categories: ${await prisma.userCategory.count()}`);
    console.log(`   - Locations: ${await prisma.location.count()}`);
    console.log(`   - Reviews: ${await prisma.review.count()}`);
    console.log(`   - Follows: ${await prisma.follow.count()}`);
    
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
