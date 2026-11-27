import React from 'react';
import { Bell, Pencil, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPhoneForDisplay } from '@/lib/phone';
import { formatDate, reminderLeadLabel } from '../format';
import type { Contact, Occasion } from '../types';

type ContactRowProps = {
  contact: Contact;
  selected: boolean;
  onToggleSelected: (contactId: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onAddOccasion: (contactId: string) => void;
  onEditOccasion: (contactId: string, occasion: Occasion) => void;
  onDeleteOccasion: (occasion: Occasion) => void;
};

const ContactRow: React.FC<ContactRowProps> = ({
  contact,
  selected,
  onToggleSelected,
  onEdit,
  onDelete,
  onAddOccasion,
  onEditOccasion,
  onDeleteOccasion,
}) => {
  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <input
          type="checkbox"
          className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer accent-pink-600"
          checked={selected}
          onChange={() => onToggleSelected(contact.id)}
          aria-label={`Select ${contact.name}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold text-gray-900">{contact.name}</p>
          </div>
          <p className="text-sm text-gray-500">
            {[contact.relationship, contact.email, formatPhoneForDisplay(contact.phone)]
              .filter(Boolean)
              .join(' · ') || 'No details'}
          </p>
          {contact.contactLists.length > 0 && (
            <p className="mt-1.5 flex flex-wrap gap-1">
              {contact.contactLists.map(list => (
                <Badge key={list.id} variant="outline" className="text-gray-600">
                  {list.name}
                </Badge>
              ))}
            </p>
          )}
          {contact.notes && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{contact.notes}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Edit ${contact.name}`}
            onClick={() => onEdit(contact)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Delete ${contact.name}`}
            onClick={() => onDelete(contact)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3">
        {contact.occasions.length === 0 ? (
          <p className="text-sm text-gray-400">No occasions yet.</p>
        ) : (
          <ul className="space-y-2">
            {contact.occasions.map(occasion => (
              <li key={occasion.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 text-gray-700">
                  <span className="font-medium">{occasion.kind}</span>{' '}
                  <span className="text-gray-500">
                    — {formatDate(occasion.occursOn)}
                    {occasion.recurring && ' (yearly)'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Bell className="h-3 w-3 shrink-0" />
                    {occasion.reminderLeadDays === null
                      ? 'No reminder'
                      : `Reminder ${reminderLeadLabel(occasion.reminderLeadDays)}`}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${occasion.kind} occasion`}
                    onClick={() => onEditOccasion(contact.id, occasion)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${occasion.kind} occasion`}
                    onClick={() => onDeleteOccasion(occasion)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="mt-2 text-pink-600 hover:text-pink-700"
          onClick={() => onAddOccasion(contact.id)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add occasion
        </Button>
      </div>
    </li>
  );
};

export default ContactRow;
