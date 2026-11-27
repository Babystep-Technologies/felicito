# frozen_string_literal: true

# The Slack integration is removed. Its tables go with it, including the stored workspace installs
# and Slack-to-Felicito account links.
class DropSlackTables < ActiveRecord::Migration[8.1]
  def up
    drop_table :slack_user_connections
    drop_table :slack_installations
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Slack installs and account links can't be restored"
  end
end
