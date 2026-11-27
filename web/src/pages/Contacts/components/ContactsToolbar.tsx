import React from 'react';

type ContactsToolbarProps = {
  /** How many of the currently visible contacts are selected. */
  selectedCount: number;
  visibleCount: number;
  onToggleAll: (selectAll: boolean) => void;
};

const ContactsToolbar: React.FC<ContactsToolbarProps> = ({
  selectedCount,
  visibleCount,
  onToggleAll,
}) => {
  const allSelected = visibleCount > 0 && selectedCount === visibleCount;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer accent-pink-600"
          checked={allSelected}
          // Some-but-not-all is only expressible through the DOM node.
          ref={element => {
            if (element) element.indeterminate = someSelected;
          }}
          onChange={e => onToggleAll(e.target.checked)}
          disabled={visibleCount === 0}
          aria-label="Select all shown contacts"
        />
        Select all shown
      </label>
    </div>
  );
};

export default ContactsToolbar;
