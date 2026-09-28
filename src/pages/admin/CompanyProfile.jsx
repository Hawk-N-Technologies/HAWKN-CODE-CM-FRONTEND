import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import RichTextEditor from "../../components/common/RichTextEditor";
import { showToast } from "../../components/common/Toast";
import { required, EMAIL_PATTERN } from "../../utils/validators";
import axios from "axios";

const DEFAULT_VALUES = {
  officialName: "Hawk'N Technologies",
  officialEmail: "hello@hawkn.dev",

  vision:
    "To build innovative technology solutions that help businesses grow, operate efficiently, and create meaningful digital experiences.",

  mission:
    "Our mission is to deliver reliable, scalable, and user-focused technology solutions while maintaining quality, transparency, and long-term relationships with our clients.",

  blog: `
   
  `,
};

function CompanyProfile() {
  const [isSaving, setIsSaving] = useState(false);
  const getProfile = async () => {
    try {
      const res = await axios.get("/api/company/profile", {
        withCredentials: true,
      });
      if (res.status == 200) {
        const data = res.data.data;

        reset({
          officialName: data.officialCompanyName,
          officialEmail: data.officialEmail,
          vision: data.vision,
          mission: data.mission,
          blog: data.blogContent,
          uuid: data.uuid,
        });
        console.log(res.data.data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    getProfile();
  }, []);

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
      const payload = {
        officialCompanyName: values.officialName,
        officialEmail: values.officialEmail,
        vision: values.vision,
        mission: values.mission,
        blogContent: values.blog,
      };

      await axios.put(`/api/company/profile/${values.uuid}`, payload, {
        withCredentials: true,
      });

      reset(values);

      showToast.success("Company profile updated.");
    } catch (error) {
      console.error(error);
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
