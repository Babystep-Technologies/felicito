class RemoveMailingAddressFromContacts < ActiveRecord::Migration[8.1]
  # Contacts no longer carry a mailing address. The user's own return address
  # (users.return_address_*) is unaffected. Column types are given so the
  # migration stays reversible.
  def change
    remove_column :contacts, :address_line1, :string
    remove_column :contacts, :address_line2, :string
    remove_column :contacts, :city, :string
    remove_column :contacts, :region, :string
    remove_column :contacts, :postal_code, :string
    remove_column :contacts, :country_code, :string
  end
end
