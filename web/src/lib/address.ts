// Mailing-address helpers for the user's own return address (Profile).
//
// The API stores the address as six loose columns and enforces all-or-nothing: the moment
// any field is set, line 1, city, postal code and country are all required
// (`HasReturnAddress::REQUIRED_ADDRESS_FIELDS`).
import { COUNTRY_OPTIONS, type CountryCode } from '@/lib/phone';

export type { CountryCode };

/**
 * ISO 3166-1 alpha-2 options for the country select. Reused from the phone helpers: that
 * list is already the full ISO country set with display names and flags, and the extra
 * calling code is simply ignored here.
 */
export const COUNTRY_CODE_OPTIONS = COUNTRY_OPTIONS;

// Where the rate card is cheapest and most of our users are.
export const DEFAULT_COUNTRY_CODE: CountryCode = 'US';

/** The address as the dialog edits it — strings only, never null. */
export type AddressDraft = {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: CountryCode;
};

export type AddressErrors = Partial<Record<keyof AddressDraft, string>>;

/** The address as the API returns it (`ReturnAddress`). */
export type ApiAddress = {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string | null;
};

export function emptyAddressDraft(): AddressDraft {
  return {
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    countryCode: DEFAULT_COUNTRY_CODE,
  };
}

export function addressDraftFrom(address: ApiAddress): AddressDraft {
  return {
    line1: address.addressLine1 ?? '',
    line2: address.addressLine2 ?? '',
    city: address.city ?? '',
    region: address.region ?? '',
    postalCode: address.postalCode ?? '',
    countryCode: (address.countryCode as CountryCode | null) ?? DEFAULT_COUNTRY_CODE,
  };
}
