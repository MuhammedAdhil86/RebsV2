import React, { useEffect, useState, useRef } from "react";
import { FiUpload } from "react-icons/fi";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

/* ===== COMPONENTS & HELPERS ===== */
import GlowButton from "../helpers/glowbutton";
import { organizationSchema } from "../../validation/companydata.schema";

/* ===== API SERVICES ===== */
import {
  updateCompanyDetails,
  OrganizationType,
  getCountryName,
  getCompanyPreview,
} from "../../service/companyService";
import { fetchTimeZone } from "../../service/eventservice";
import { getGeolocation } from "../../utils/geolocation";

const AddBasicInformation = () => {
  const [countries, setCountries] = useState([]);
  const [orgTypes, setOrgTypes] = useState([]);
  const [timeZones, setTimeZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  // Preview URLs for UI display only
  const [logoPreview, setLogoPreview] = useState("");
  const [horizontalLogoPreview, setHorizontalLogoPreview] = useState("");

  const logoInputRef = useRef(null);
  const horizontalLogoInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(organizationSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [previewRes, countryRes, orgRes, tzRes] = await Promise.all([
          getCompanyPreview(),
          getCountryName(),
          OrganizationType(),
          fetchTimeZone(),
        ]);

        const company = previewRes?.data?.data?.company || previewRes?.company;
        setCountries(countryRes || []);
        setOrgTypes(orgRes || []);
        setTimeZones(tzRes || []);

        if (company) {
          reset({
            name: company.name || "",
            country_id: String(company.country_id || ""),
            website: company.website || "",
            description: company.description || "",
            organisation_type_id: String(company.organisation_type_id || ""),
            location: company.location || "",
            address: company.address || "",
            time_zone_id: String(company.time_zone_id || ""),
            contact_person: company.contact_person || "",
            phone_number: company.phone_number || "",
            email: company.email || "",
            latitude: company.latitude || "",
            longitude: company.longitude || "",
            account_holder_name: company.account_holder_name || "",
            bank_name: company.bank_name || "",
            account_number: company.account_number || "",
            branch_address: company.branch_address_kyc || "",
            city: company.city || "",
            state_province: company.state_province || "",
            postal_code: company.postal_code || "",
            swift_ifsc_code: company.swift_ifsc_code || "",
          });
          if (company.logo) setLogoPreview(company.logo);
          if (company.horizontal_logo)
            setHorizontalLogoPreview(company.horizontal_logo);
        }
      } catch (err) {
        toast.error("Failed to load company profile");
      }
    };
    loadData();
  }, [reset]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    if (type === "vertical") {
      setLogoPreview(localUrl);
      setValue("logo_file", file, { shouldValidate: true });
    } else {
      setHorizontalLogoPreview(localUrl);
      setValue("horizontal_logo_file", file, { shouldValidate: true });
    }
    toast.success("Image selected");
    setShowUploadOptions(false);
  };

  const handleGetLocation = async () => {
    try {
      const coords = await getGeolocation();
      setValue("latitude", String(coords.latitude));
      setValue("longitude", String(coords.longitude));
      toast.success("Location updated");
    } catch (err) {
      toast.error("Could not fetch location");
    }
  };

  const onFormSubmit = async (values) => {
    setLoading(true);
    const savingToast = toast.loading("Saving updates...");

    const data = new FormData();

    // Append text fields from validated Zod object
    Object.keys(values).forEach((key) => {
      if (key !== "logo_file" && key !== "horizontal_logo_file") {
        data.append(key, values[key] ?? "");
      }
    });

    // Append Image Files exactly as required by backend keys
    data.append("image", values.logo_file);
    data.append("horizontal_image", values.horizontal_logo_file);

    try {
      const response = await updateCompanyDetails(data);
      toast.success(response?.message || "All details updated!", {
        id: savingToast,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed", {
        id: savingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        {/* LOGO SECTION */}
        <div className="border border-gray-200 rounded-lg p-4 mb-2 bg-[#fafafa]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Company Logos
                </h3>
                <p className="text-[10px] text-gray-500">
                  Update your brand visibility.
                </p>
              </div>
              <div className="flex gap-4">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    className="h-12 w-12 object-contain bg-white border rounded p-1"
                    alt="V"
                  />
                )}
                {horizontalLogoPreview && (
                  <img
                    src={horizontalLogoPreview}
                    className="h-12 w-28 object-contain bg-white border rounded p-1"
                    alt="H"
                  />
                )}
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUploadOptions(!showUploadOptions)}
                className="flex items-center gap-2 bg-black text-white text-sm px-3 py-1.5 rounded-md"
              >
                <FiUpload /> Upload Image
              </button>
              {showUploadOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl z-20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current.click()}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b"
                  >
                    Vertical Logo
                  </button>
                  <button
                    type="button"
                    onClick={() => horizontalLogoInputRef.current.click()}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
                  >
                    Horizontal Logo
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={logoInputRef}
                onChange={(e) => handleFileChange(e, "vertical")}
                className="hidden"
                accept="image/*"
              />
              <input
                type="file"
                ref={horizontalLogoInputRef}
                onChange={(e) => handleFileChange(e, "horizontal")}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>
        </div>

        {/* LOGO ERRORS */}
        <div className="mb-6">
          {errors.logo_file && (
            <p className="text-red-500 text-[10px]">
              • {errors.logo_file.message}
            </p>
          )}
          {errors.horizontal_logo_file && (
            <p className="text-red-500 text-[10px]">
              • {errors.horizontal_logo_file.message}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <Field
              label="Name"
              {...register("name")}
              readOnly
              isLight
              error={errors.name}
            />

            <div className="relative">
              <label className="block text-sm text-gray-700 mb-1">
                Country*
              </label>
              <select
                {...register("country_id")}
                className={`w-full border rounded-md px-3 py-2 text-sm bg-white outline-none ${errors.country_id ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select</option>
                {countries.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.country_id && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.country_id.message}
                </p>
              )}
            </div>

            <Field
              label="Website"
              {...register("website")}
              error={errors.website}
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="h-[125px]">
              <label className="block text-sm text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                className={`w-full h-[95px] border rounded-md px-3 py-2 text-sm resize-none outline-none ${errors.description ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.description && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex flex-col justify-between h-[125px]">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Organization Type
                </label>
                <select
                  {...register("organisation_type_id")}
                  className={`w-full border rounded-md px-3 py-2 text-sm bg-white outline-none ${errors.organisation_type_id ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select</option>
                  {orgTypes.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.name}
                    </option>
                  ))}
                </select>
                {errors.organisation_type_id && (
                  <p className="text-red-500 text-[10px] mt-1">
                    {errors.organisation_type_id.message}
                  </p>
                )}
              </div>
              <Field
                label="Primary Address"
                {...register("address")}
                error={errors.address}
              />
            </div>

            <div className="flex flex-col justify-between h-[125px]">
              <Field
                label="Location Name"
                {...register("location")}
                error={errors.location}
              />
              <div className="flex items-end">
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">
                    Time Zone
                  </label>
                  <select
                    {...register("time_zone_id")}
                    className={`w-full border rounded-md px-3 py-2 text-sm bg-white outline-none ${errors.time_zone_id ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select</option>
                    {timeZones.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="ml-2 w-9 h-9 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                >
                  <Icon icon="solar:gps-bold" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Field
              label="Latitude"
              {...register("latitude")}
              error={errors.latitude}
            />
            <Field
              label="Longitude"
              {...register("longitude")}
              error={errors.longitude}
            />
            <Field
              label="Contact Person"
              {...register("contact_person")}
              error={errors.contact_person}
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Field
              label="Contact Number"
              {...register("phone_number")}
              error={errors.phone_number}
            />
            <Field
              label="Contact Email*"
              type="email"
              {...register("email")}
              error={errors.email}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm !mt-12">
            <div className="flex items-center gap-2 mb-6 border-b pb-3 text-emerald-600 font-bold uppercase text-[11px] tracking-widest">
              <Icon icon="solar:bank-bold-duotone" className="text-xl" /> Bank
              Information
            </div>
            <div className="grid grid-cols-3 gap-6">
              <Field
                label="Account Holder"
                {...register("account_holder_name")}
                error={errors.account_holder_name}
              />
              <Field
                label="Bank Name"
                {...register("bank_name")}
                error={errors.bank_name}
              />
              <Field
                label="Account Number"
                {...register("account_number")}
                error={errors.account_number}
              />
              <Field
                label="Branch Address"
                {...register("branch_address")}
                error={errors.branch_address}
              />
              <Field label="City" {...register("city")} error={errors.city} />
              <Field
                label="State / Province"
                {...register("state_province")}
                error={errors.state_province}
              />
              <Field
                label="Postal Code"
                {...register("postal_code")}
                error={errors.postal_code}
              />
              <Field
                label="IFSC / SWIFT Code"
                {...register("swift_ifsc_code")}
                error={errors.swift_ifsc_code}
              />
            </div>
            <div className="flex justify-end pt-10">
              <GlowButton type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save All Changes"}
              </GlowButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = React.forwardRef(({ label, isLight, error, ...props }, ref) => (
  <div className="w-full">
    <label className="block text-sm text-gray-700 mb-1">{label}</label>
    <input
      ref={ref}
      {...props}
      className={`w-full border rounded-md px-3 py-2 text-sm outline-none transition focus:ring-1 focus:ring-black ${
        error ? "border-red-500" : "border-gray-300"
      } ${isLight ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white"}`}
    />
    {error && <p className="text-red-500 text-[10px] mt-1">{error.message}</p>}
  </div>
));

export default AddBasicInformation;
