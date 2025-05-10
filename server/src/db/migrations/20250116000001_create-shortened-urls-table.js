/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const {
  createOnUpdateTrigger,
  dropOnUpdateTrigger,
  createUpdateAtTriggerFunction,
  dropUpdatedAtTriggerFunction,
} = require("../util/db-util");

exports.up = async function (knex) {
  // Create the update timestamp function if it doesn't exist
  if (!(await knex.schema.hasTable("shortened_urls"))) {
    // Check if the function exists before creating it
    const functionExists = await knex.raw(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'on_update_timestamp'
      );
    `);

    if (!functionExists?.rows?.[0]?.exists) {
      await createUpdateAtTriggerFunction(knex);
    }

    await knex.schema.createTable("shortened_urls", (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.string("original_url").notNullable();
      t.string("short_code").notNullable().unique();
      t.uuid("user_id").nullable(); // Optional user ID for future user login feature
      t.integer("click_count").defaultTo(0).notNullable();
      t.timestamps(true, true, true); // Creates created_at and updated_at columns
    });

    // Create the trigger for auto-updating the updated_at column
    await createOnUpdateTrigger(knex, "shortened_urls");
  }

  // Add indexes for frequently queried columns
  await knex.schema.alterTable("shortened_urls", (t) => {
    t.index("short_code");
    t.index("user_id");
    t.index("click_count");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (await knex.schema.hasTable("shortened_urls")) {
    await knex.schema.dropTable("shortened_urls");
    await dropOnUpdateTrigger(knex, "shortened_urls");
  }
};
