import { z } from "zod";
import { emailRule, phoneRule, requiredString } from "./shared.rules";

// Reusable URL validator
const flexibleUrl = z.string()
  .trim()
  .transform((val) => {
    if (val && !/^https?:\/\//i.test(val)) return `https://${val}`;
    return val;
  })
  .pipe(z.string().url("Invalid website URL").or(z.literal("")));

export const organizationSchema = z.object({
  // Existing Fields
  name: z.string().optional(),
  country_id: requiredString("Country"),
  website: flexibleUrl,
  description: z.string().max(1000).optional(),
  organisation_type_id: requiredString("Organization Type"),
  location: requiredString("Location Name"),
  address: requiredString("Primary Address"),
  time_zone_id: requiredString("Time Zone"),
  contact_person: requiredString("Contact Person"),
  phone_number: phoneRule,
  email: emailRule,
  
  // LOGO VALIDATION
  // We validate these as custom objects since they come from state, not standard inputs
  logo_file: z.any()
    .refine((file) => file instanceof File, "Vertical logo is required")
    .refine((file) => file?.size <= 2000000, "Max file size is 2MB"),
    
  horizontal_logo_file: z.any()
    .refine((file) => file instanceof File, "Horizontal logo is required")
    .refine((file) => file?.size <= 2000000, "Max file size is 2MB"),

  // Bank Info
  account_holder_name: requiredString("Account Holder Name"),
  bank_name: requiredString("Bank Name"),
  account_number: z.string().min(8, "Invalid account number"),
  branch_address: requiredString("Branch Address"),
  city: requiredString("City"),
  state_province: requiredString("State/Province"),
  postal_code: requiredString("Postal Code"),
  swift_ifsc_code: requiredString("IFSC/SWIFT Code"),
});