# typed: true

module Types
  class ContactType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: true
    field :relationship, String, null: true
    field :phone, String, null: true
    field :notes, String, null: true

    field :occasions, [ Types::OccasionType ], null: false
    # The lists this contact is on, so the contacts page can show membership
    # inline instead of cross-referencing myContactLists client-side.
    field :contact_lists, [ Types::ContactListType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def contact_lists
      object.contact_lists.order(:name)
    end
  end
end
