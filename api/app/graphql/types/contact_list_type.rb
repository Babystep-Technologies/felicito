# typed: true

module Types
  class ContactListType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false

    # So a list row can show its size without asking for `contacts` at all.
    field :contacts_count, Integer, null: false

    field :contacts, [ Types::ContactType ], null: false

    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    # Alphabetical, matching Queries::MyContacts — a list is something the user
    # scans by name.
    def contacts
      object.contacts.order(:name)
    end
  end
end
