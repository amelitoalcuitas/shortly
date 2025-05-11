/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("shortened_urls", (table) => {
    // Add expires_at column (nullable to allow for URLs without expiration)
    table.timestamp("expires_at").nullable();

    // Add an index for faster querying of expired URLs
    table.index("expires_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("shortened_urls", (table) => {
    // Remove the expires_at column
    table.dropColumn("expires_at");
  });
};
