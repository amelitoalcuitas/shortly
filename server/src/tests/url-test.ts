import { createShortenedUrl, getShortenedUrlByCode, generateShortCode, getShortenedUrlsByUser } from "../models/shortened-url";

async function testUrlShortening() {
  try {
    console.log("Testing URL shortening functionality...");

    // Test short code generation
    const shortCode = generateShortCode();
    console.log(`Generated short code: ${shortCode}`);

    // Test URL creation
    const testUrl = "https://example.com/test-url";
    console.log(`Creating shortened URL for: ${testUrl}`);

    const shortenedUrl = await createShortenedUrl({
      original_url: testUrl,
    });

    console.log("Created shortened URL:", shortenedUrl);

    // Test URL retrieval
    const retrievedUrl = await getShortenedUrlByCode(shortenedUrl.short_code);
    console.log("Retrieved URL by code:", retrievedUrl);

    // Test URL creation with user ID
    const testUrlWithUser = "https://example.com/user-test-url";
    const testUserId = "12345678-1234-1234-1234-123456789012"; // Example UUID
    console.log(`Creating shortened URL with user ID for: ${testUrlWithUser}`);

    const shortenedUrlWithUser = await createShortenedUrl({
      original_url: testUrlWithUser,
      user_id: testUserId,
    });

    console.log("Created shortened URL with user ID:", shortenedUrlWithUser);

    // Test getting URLs by user ID
    const userUrls = await getShortenedUrlsByUser(testUserId);
    console.log(`Retrieved ${userUrls.length} URLs for user:`, userUrls);

    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testUrlShortening();
