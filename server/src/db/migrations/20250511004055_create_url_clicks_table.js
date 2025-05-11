/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const {
    createOnUpdateTrigger,
    createUpdateAtTriggerFunction,
  } = require("../util/db-util");

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

  // Create the url_clicks table
  if (!(await knex.schema.hasTable("url_clicks"))) {
    await knex.schema.createTable("url_clicks", (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.uuid("shortened_url_id").notNullable();
      t.timestamp("clicked_at").defaultTo(knex.fn.now()).notNullable();
      t.string("user_agent").nullable();
      t.string("ip_address").nullable();
      t.timestamps(true, true, true); // Creates created_at and updated_at columns

      // Add foreign key reference to shortened_urls table
      t.foreign("shortened_url_id")
        .references("id")
        .inTable("shortened_urls")
        .onDelete("CASCADE");
    });

    // Create the trigger for auto-updating the updated_at column
    await createOnUpdateTrigger(knex, "url_clicks");
  }

  // Add indexes for frequently queried columns
  await knex.schema.alterTable("url_clicks", (t) => {
    t.index("shortened_url_id");
    t.index("clicked_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const { dropOnUpdateTrigger } = require("../util/db-util");

  if (await knex.schema.hasTable("url_clicks")) {
    await knex.schema.dropTable("url_clicks");
    await dropOnUpdateTrigger(knex, "url_clicks");
  }
};
