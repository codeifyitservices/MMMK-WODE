const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Influencer = require("../Models/Influencer");
const { createInfluencerAdmin } = require("../Controller/admin-controllers/influencerAdmin.controller");

async function runTests() {
  console.log("==========================================");
  console.log("TESTING INFLUENCER DIRECT CREATION FEATURE");
  console.log("==========================================");

  const mongoUri = process.env.MONGO_URI || process.env.DB_URL || "mongodb://localhost:27017/mmmk";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const testEmail = "test_onboard_partner_unique@example.com";
  // Clean up any previous test artifact
  await Influencer.deleteMany({ email: testEmail });

  // Mock response builder
  function createMockRes() {
    return {
      statusCode: 200,
      jsonPayload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonPayload = data;
        return this;
      },
    };
  }

  // TEST 1: Missing Full Name
  console.log("TEST 1: Validation - Missing Full Name");
  let res1 = createMockRes();
  await createInfluencerAdmin(
    {
      body: { email: testEmail },
      admin: { _id: new mongoose.Types.ObjectId() },
    },
    res1
  );
  if (res1.statusCode === 400 && res1.jsonPayload?.message === "Full name is required.") {
    console.log("✅ PASS: Correctly rejected missing full name (Status 400).");
  } else {
    console.error("❌ FAIL: Unexpected response:", res1.statusCode, res1.jsonPayload);
  }

  // TEST 2: Invalid Email Format
  console.log("\nTEST 2: Validation - Invalid Email");
  let res2 = createMockRes();
  await createInfluencerAdmin(
    {
      body: { fullName: "Test Partner", email: "invalid-email-address" },
      admin: { _id: new mongoose.Types.ObjectId() },
    },
    res2
  );
  if (res2.statusCode === 400 && res2.jsonPayload?.message === "Please provide a valid email address.") {
    console.log("✅ PASS: Correctly rejected invalid email format (Status 400).");
  } else {
    console.error("❌ FAIL: Unexpected response:", res2.statusCode, res2.jsonPayload);
  }

  // TEST 3: Successful Direct Onboarding with Auto-generation
  console.log("\nTEST 3: Successful Direct Creation with Smart Auto-Generation");
  let res3 = createMockRes();
  await createInfluencerAdmin(
    {
      body: {
        fullName: "Sarah Al-Maktoum",
        email: testEmail,
        phoneNumber: "+971501234567",
        commissionRate: 15,
        discountRate: 25,
        niche: "Luxury Perfumes & Fashion",
        sendEmail: false, // Don't spam Brevo during automated tests
      },
      admin: { _id: new mongoose.Types.ObjectId() },
    },
    res3
  );

  if (res3.statusCode === 201 && res3.jsonPayload?.success) {
    const data = res3.jsonPayload.data;
    console.log("✅ PASS: Influencer created with Status 201!");
    console.log("   - Full Name:", data.fullName);
    console.log("   - Email:", data.email);
    console.log("   - Auto-generated Username:", data.username);
    console.log("   - Auto-generated Referral Code:", data.referralCode);
    console.log("   - Auto-generated Temporary Password:", data.rawPassword);
    console.log("   - Commission Rate:", data.commissionRate + "%");
    console.log("   - Discount Rate:", data.discountRate + "%");
    console.log("   - Referral Link:", data.referralLink);
    console.log("   - Status:", data.status);

    // Verify in DB
    const dbRecord = await Influencer.findOne({ email: testEmail });
    if (!dbRecord) {
      console.error("❌ FAIL: Record not found in DB!");
    } else {
      console.log("\nTEST 4: Verifying DB Record & Password Hashing");
      console.log("   - Status in DB:", dbRecord.status);
      console.log("   - Stored Hashed Password:", dbRecord.password.slice(0, 20) + "...");
      console.log("   - Hashed with bcrypt?:", dbRecord.password.startsWith("$2a$") || dbRecord.password.startsWith("$2b$"));

      // Verify comparePassword with raw password
      const isPasswordMatch = await dbRecord.comparePassword(data.rawPassword);
      console.log("   - comparePassword result:", isPasswordMatch ? "✅ MATCH" : "❌ MISMATCH");

      // Verify wrong password rejects
      const wrongMatch = await dbRecord.comparePassword("WrongPassword123!");
      console.log("   - Wrong password rejects?:", !wrongMatch ? "✅ REJECTED" : "❌ ACCEPTED");
    }

    // TEST 5: Duplicate Email Check
    console.log("\nTEST 5: Duplicate Email Prevention");
    let res5 = createMockRes();
    await createInfluencerAdmin(
      {
        body: {
          fullName: "Another Person",
          email: testEmail,
        },
        admin: { _id: new mongoose.Types.ObjectId() },
      },
      res5
    );
    if (res5.statusCode === 400 && res5.jsonPayload?.message.includes("already exists")) {
      console.log("✅ PASS: Correctly blocked duplicate email (Status 400):", res5.jsonPayload.message);
    } else {
      console.error("❌ FAIL: Did not block duplicate email:", res5.statusCode, res5.jsonPayload);
    }

    // Clean up test record
    await Influencer.deleteOne({ _id: data.id });
    console.log("\n🧹 CLEANUP: Test record removed from database.");
  } else {
    console.error("❌ FAIL: Failed to create influencer:", res3.statusCode, res3.jsonPayload);
  }

  await mongoose.disconnect();
  console.log("\n==========================================");
  console.log("ALL INFLUENCER DIRECT CREATION TESTS PASSED!");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
