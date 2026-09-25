import { useState } from "react";
import { useForm } from "react-hook-form";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import RichTextEditor from "../../components/common/RichTextEditor";
import { showToast } from "../../components/common/Toast";
import { required, EMAIL_PATTERN } from "../../utils/validators";

const DEFAULT_VALUES = {
  officialName: "Hawk'N Technologies",
  officialEmail: "hello@hawkn.dev",

  vision:
    "To build innovative technology solutions that help businesses grow, operate efficiently, and create meaningful digital experiences.",

  mission:
    "Our mission is to deliver reliable, scalable, and user-focused technology solutions while maintaining quality, transparency, and long-term relationships with our clients.",

  blog: `
    <h2>What People Should Know About Us</h2>
    <p>
      Hawk'N Technologies is a technology company focused on building
      modern digital solutions for businesses and organizations. We combine
      technology, creativity, and business understanding to deliver solutions
      that solve real-world problems.
    </p>

    <h2>Why Customers Should Care About Us</h2>
    <p>
      We focus on understanding our customers' needs before building a
      solution. Our goal is to provide reliable, scalable, and easy-to-use
      products that create long-term value for our customers.
    </p>

    <h2>Culture &amp; Values</h2>
    <p>
      Our culture is built around innovation, integrity, teamwork, continuous
      learning, and customer success.
    </p>

    <ul>
      <li>Innovation and continuous improvement</li>
      <li>Integrity and transparency</li>
      <li>Teamwork and collaboration</li>
      <li>Customer-focused thinking</li>
      <li>Quality and accountability</li>
    </ul>

    <h2>Company Story</h2>
    <p>
      Hawk'N Technologies was created with the vision of helping businesses
      use technology more effectively. From our early projects to our
      growing range of digital solutions, we continue to focus on creating
      meaningful technology experiences for our customers.
    </p>
  `,
};

function CompanyProfile() {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const blog = watch("blog");

  const onSubmit = async (values) => {
    setIsSaving(true);

    try {
      // TODO: Replace with real API call.
      await new Promise((resolve) => setTimeout(resolve, 600));

      reset(values);

      showToast.success("Company profile updated.");
    } catch {
      showToast.error("Couldn't save the company profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cm-text">Company Profile</h1>

        <p className="mt-1 text-sm text-cm-text-muted">
          This information represents the company internally and externally.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
      >
        {/* Company Identity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Official Company Name"
            required
            error={errors.officialName?.message}
            {...register("officialName", {
              required: required("Company name"),
            })}
          />

          <Input
            label="Official Email"
            type="email"
            required
            error={errors.officialEmail?.message}
            {...register("officialEmail", {
              required: required("Official email"),
              pattern: EMAIL_PATTERN,
            })}
          />
        </div>

        {/* Vision */}
        <Input
          label="Vision"
          multiline
          rows={3}
          placeholder="Where the company is headed…"
          helperText="Shown to employees and, in a limited form, to clients."
          error={errors.vision?.message}
          {...register("vision")}
        />

        {/* Mission */}
        <Input
          label="Mission"
          multiline
          rows={3}
          placeholder="How the company gets there…"
          error={errors.mission?.message}
          {...register("mission")}
        />

        {/* Blog - Everything after Mission */}
        <RichTextEditor
          label="Blog"
          value={blog}
          onChange={(content) =>
            setValue("blog", content, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          error={errors.blog?.message}
        />

        {/* Save */}
        <div className="flex items-center justify-end gap-3 border-t border-cm-border pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isSaving}
            onClick={() => reset(DEFAULT_VALUES)}
          >
            Reset
          </Button>

          <Button type="submit" loading={isSaving} disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CompanyProfile;
