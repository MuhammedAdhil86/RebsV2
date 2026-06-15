import { z } from "zod";
import { emailRule, phoneRule, requiredString } from "./shared.rules";

const flexibleUrl = z.string()
  .trim()
  .transform((val) => {
    if (val && !/^https?:\/\//i.test(val)) return `https://${val}`;
    return val;
  })
  .pipe(z.string().url("Invalid website URL").or(z.literal("")));

export const organizationSchema = z.object({
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
  
  // Make them completely optional here so missing form values don't trigger errors
  logo_file: z.any().optional(),
  horizontal_logo_file: z.any().optional(),

  account_holder_name: requiredString("Account Holder Name"),
  bank_name: requiredString("Bank Name"),
  account_number: z.string().min(8, "Invalid account number"),
  branch_address: requiredString("Branch Address"),
  city: requiredString("City"),
  state_province: requiredString("State/Province"),
  postal_code: requiredString("Postal Code"),
  swift_ifsc_code: requiredString("IFSC/SWIFT Code"),
})
.superRefine((data, ctx) => {
  const MAX_FILE_SIZE = 2000000;

  // ONLY validate size if an actual File object is being uploaded
  if (data.logo_file instanceof File && data.logo_file.size > MAX_FILE_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Max file size is 2MB",
      path: ["logo_file"],
    });
  }

  if (data.horizontal_logo_file instanceof File && data.horizontal_logo_file.size > MAX_FILE_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Max file size is 2MB",
      path: ["horizontal_logo_file"],
    });
  }
});