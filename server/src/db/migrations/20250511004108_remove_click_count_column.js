/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // First, drop the index on click_count if it exists
  const indexExists = await knex.raw(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE indexname = 'shortened_urls_click_count_index'
    );
  `);

  if (indexExists?.rows?.[0]?.exists) {
    await knex.schema.alterTable("shortened_urls", (table) => {
      table.dropIndex("click_count");
    });
  }

  // Then remove the click_count column
  return knex.schema.alterTable("shortened_urls", (table) => {
    table.dropColumn("click_count");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // Add back the click_count column
  return knex.schema.alterTable("shortened_urls", (table) => {
    table.integer("click_count").defaultTo(0).notNullable();
    table.index("click_count");
  });
};
