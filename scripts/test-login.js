#!/usr/bin/env node

/**
 * Test login API with database users
 */

const testUsers = [
  { username: "admin.hr", password: "test123", role: "HR Executive" },
  { username: "charlie.williams", password: "test123", role: "Project Manager" },
  { username: "alice.smith", password: "test123", role: "Employee" },
  { username: "bob.johnson", password: "test123", role: "Employee" },
];

async function testLogin() {
  console.log("🧪 Testing Login API\n");
  console.log("=" .repeat(60));

  for (const user of testUsers) {
    try {
      console.log(`\n📝 Testing: ${user.username} (${user.role})`);
      
      const response = await fetch("http://localhost:3000/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ldap_username: user.username,
          password: user.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ SUCCESS - Token received`);
        console.log(`   User: ${data.data.user.full_name}`);
        console.log(`   Role: ${data.data.user.employee_role}`);
        console.log(`   Email: ${data.data.user.email}`);
      } else {
        console.log(`❌ FAILED - ${data.message || response.statusText}`);
        console.log(`   Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✨ Test Complete!\n");
}

// Run tests
testLogin().catch(console.error);
