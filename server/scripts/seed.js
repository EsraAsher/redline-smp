import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Collection from '../models/Collection.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Collection.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing collections and products');

    // Create collections
    const ranksCol = await Collection.create({
      name: 'Ranks',
      slug: 'ranks',
      description: 'Server ranks with exclusive perks and abilities',
      order: 1,
    });

    const cratesCol = await Collection.create({
      name: 'Crates',
      slug: 'crates',
      description: 'Mystery crates with rare loot and rewards',
      order: 2,
    });

    const coinsCol = await Collection.create({
      name: 'Coins',
      slug: 'coins',
      description: 'In-game server currency packs',
      order: 3,
    });

    console.log('Collections created');

    // Create products
    await Product.insertMany([
      // Ranks
      {
        title: 'VIP',
        price: 9.99,
        image: 'https://i.postimg.cc/DfCQs1bh/Gemini-Generated-Image-hqpt7ohqpt7ohqpt.png',
        features: ['Custom Chat Color', 'Access to /fly in Hub', 'Priority Queue', '1x Seasonal Key'],
        collection: ranksCol._id,
        isFeatured: true,
        order: 1,
      },
      {
        title: 'MVP',
        price: 19.99,
        image: 'https://i.postimg.cc/vTpch8sK/Gemini-Generated-Image-5npcqe5npcqe5npc.png',
        features: ['All VIP Perks', 'Access to /feed', 'Nickname Command', '3x Seasonal Keys', 'MVP Tag'],
        collection: ranksCol._id,
        isFeatured: true,
        order: 2,
      },
      {
        title: 'LEGEND',
        price: 49.99,
        image: 'https://i.postimg.cc/RZPqpT40/Gemini-Generated-Image-6riu7k6riu7k6riu.png',
        features: ['All MVP Perks', 'Access to /fly everywhere', 'Custom Particle Trails', '10x Seasonal Keys', 'Legend Tag', 'Private Discord Channel'],
        collection: ranksCol._id,
        isFeatured: true,
        order: 3,
      },
      // Crates
      {
        title: 'Basic Crate',
        price: 1.99,
        image: 'https://i.postimg.cc/zGbJ6z3Q/basic-crate.png',
        features: ['Common Loot', 'Server Currency', 'xp Bottles'],
        collection: cratesCol._id,
        isFeatured: true,
        order: 1,
      },
      {
        title: 'Rare Crate',
        price: 4.99,
        image: 'https://i.postimg.cc/xd2W5nm7/rare-crate-png-no-bg.png',
        features: ['Rare Items', 'Spawner Chance', 'Armor Sets'],
        collection: cratesCol._id,
        isFeatured: true,
        order: 2,
      },
      {
        title: 'Mythic Crate',
        price: 9.99,
        image: 'https://i.postimg.cc/vBm22BZT/mythic-crate-png-nobg.png',
        features: ['God Gear', 'Dragon Egg Chance', 'Exclusive Cosmetics'],
        collection: cratesCol._id,
        isFeatured: true,
        order: 3,
      },
      // Coins
      {
        title: 'Handful of Coins',
        price: 4.99,
        image: 'https://i.postimg.cc/Znbfv51v/Gemini-Generated-Image-m6vfhrm6vfhrm6vf.png',
        features: ['500 Server Coins'],
        collection: coinsCol._id,
        isFeatured: true,
        order: 1,
      },
      {
        title: 'Bag of Coins',
        price: 9.99,
        image: 'https://i.postimg.cc/Wpyrk3RW/Gemini-Generated-Image-upxyxqupxyxqupxy.png',
        features: ['1200 Server Coins', '+20% Bonus'],
        collection: coinsCol._id,
        isFeatured: true,
        order: 2,
      },
      {
        title: 'Chest of Coins',
        price: 24.99,
        image: 'https://i.postimg.cc/9Fq9thCZ/Gemini-Generated-Image-23o9oh23o9oh23o9.png',
        features: ['3500 Server Coins', '+50% Bonus'],
        collection: coinsCol._id,
        isFeatured: true,
        order: 3,
      },
    ]);

    console.log('Products seeded');

    // Create default admin if not exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      await Admin.create({
        username: 'admin',
        password: 'RedLine@Admin2026',
        role: 'superadmin',
      });
      console.log('Default admin created (username: admin, password: RedLine@Admin2026)');
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
