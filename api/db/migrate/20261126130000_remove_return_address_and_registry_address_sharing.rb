class RemoveReturnAddressAndRegistryAddressSharing < ActiveRecord::Migration[8.1]
  # Felicito no longer collects a user's mailing address, so registries can no
  # longer offer to share it with guests who claim a gift. Column types and the
  # default are given so the migration stays reversible.
  def change
    remove_column :users, :return_address_line1, :string
    remove_column :users, :return_address_line2, :string
    remove_column :users, :return_address_city, :string
    remove_column :users, :return_address_region, :string
    remove_column :users, :return_address_postal_code, :string
    remove_column :users, :return_address_country_code, :string
    remove_column :wish_lists, :share_address, :boolean, default: false, null: false
  end
end
