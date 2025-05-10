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
  if (!(await knex.schema.hasTable("users"))) {
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

    await knex.schema.createTable("users", (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.string("email").notNullable().unique();
      t.string("password").notNullable();
      t.string("name").nullable();
      t.string("reset_token").nullable();
      t.timestamp("reset_token_expiry").nullable();
      t.timestamps(true, true, true); // Creates created_at and updated_at columns
    });

    // Create the trigger for auto-updating the updated_at column
    await createOnUpdateTrigger(knex, "users");
  }

  // Add indexes for frequently queried columns
  await knex.schema.alterTable("users", (t) => {
    t.index("email");
    t.index("reset_token");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (await knex.schema.hasTable("users")) {
    await knex.schema.dropTable("users");
    await dropOnUpdateTrigger(knex, "users");
  }
};
