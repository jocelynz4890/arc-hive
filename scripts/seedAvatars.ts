import { getDb } from "@utils/database.ts";
import { ObjectId } from "npm:mongodb";

const PREFIX = "Rewarding.";

interface AvatarDefinition {
  _id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  statAffinity: {
    stat: "HP" | "Stamina" | "Strength" | "Agility" | "Intelligence";
    value: number;
  }[];
}

const avatarDefinitions: AvatarDefinition[] = [
  // --- COMMON ---
  {
    _id: new ObjectId().toString(),
    name: "Voltaris",
    rarity: "common",
    statAffinity: [
      { stat: "Intelligence", value: 4 },
      { stat: "Strength", value: 2 },
    ],
  },
  {
    _id: new ObjectId().toString(),
    name: "Vulpyx",
    rarity: "common",
    statAffinity: [
      { stat: "Strength", value: 1 },
      { stat: "Agility", value: 1 },
    ],
  },

  // --- RARE ---
  {
    _id: new ObjectId().toString(),
    name: "Kael",
    rarity: "rare",
    statAffinity: [
      { stat: "Strength", value: 6 },
      { stat: "HP", value: 6 },
    ],
  },
  {
    _id: new ObjectId().toString(),
    name: "Juniper",
    rarity: "rare",
    statAffinity: [
      { stat: "Agility", value: 8 },
      { stat: "Intelligence", value: 7 },
    ],
  },

  // --- EPIC ---
  {
    _id: new ObjectId().toString(),
    name: "Thalassa",
    rarity: "epic",
    statAffinity: [
      { stat: "Agility", value: 10 },
      { stat: "Strength", value: 10 },
      { stat: "HP", value: 10 },
      { stat: "Stamina", value: 10 },
      { stat: "Intelligence", value: 10 },
    ],
  },
  {
    _id: new ObjectId().toString(),
    name: "Yuki",
    rarity: "epic",
    statAffinity: [
      { stat: "Agility", value: 15 },
      { stat: "Strength", value: 15 },
      { stat: "HP", value: 15 },
      { stat: "Stamina", value: 15 },
      { stat: "Intelligence", value: 15 },
    ],
  },

  // --- LEGENDARY ---
  {
    _id: new ObjectId().toString(),
    name: "Apollo",
    rarity: "legendary",
    statAffinity: [
      { stat: "Strength", value: 20 },
      { stat: "HP", value: 30 },
      { stat: "Intelligence", value: 15 },
    ],
  },
  {
    _id: new ObjectId().toString(),
    name: "Aphrodite",
    rarity: "legendary",
    statAffinity: [
      { stat: "HP", value: 20 },
      { stat: "Agility", value: 15 },
      { stat: "Stamina", value: 30 },
    ],
  },
  {
    _id: new ObjectId().toString(),
    name: "Athena",
    rarity: "legendary",
    statAffinity: [
      { stat: "Agility", value: 15 },
      { stat: "Intelligence", value: 30 },
      { stat: "Strength", value: 20 },
    ],
  },
];

async function main() {
  const [db, client] = await getDb();
  const collection = db.collection(PREFIX + "avatarDefinitions");

  try {
    // Check if avatars already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing avatar definitions.`);
      console.log("To reseed, please clear the collection first.");
      return;
    }

    // Insert avatar definitions
    const result = await collection.insertMany(avatarDefinitions);
    console.log(`✅ Successfully seeded ${result.insertedCount} avatar definitions:`);
    
    for (const avatar of avatarDefinitions) {
      console.log(`  - ${avatar.name} (${avatar.rarity})`);
    }
  } catch (error) {
    console.error("Error seeding avatars:", error);
    throw error;
  } finally {
    await client.close();
  }
}

main();

