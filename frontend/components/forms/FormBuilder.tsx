// components/forms/FormBuilder.tsx
"use client";

import {
  Controller,
  useForm,
  SubmitHandler,
  FieldValues,
  Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodTypeAny } from "zod";
import { useEffect, useState, useMemo } from "react";
import {
  Save,
  X,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
  Calendar,
  MapPin,
  Link as LinkIcon,
  User,
  Type,
  FileText,
  Check,
  AlertCircle,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "file"
  | "richtext"
  | "link";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  hidden?: boolean;
  description?: string;
  className?: string;
  helperText?: string;
}

interface FormBuilderProps<T extends FieldValues = FieldValues> {
  fields: FormField[];
  onSubmit: (data: T) => Promise<void> | void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  schema?: ZodTypeAny;
  defaultValues?: Partial<T>;
  layout?: "vertical" | "horizontal" | "grid";
  title?: string;
  description?: string;
}

export function FormBuilder<T extends FieldValues = FieldValues>({
  fields,
  onSubmit,
  onCancel,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
  schema,
  defaultValues,
  layout = "vertical",
  title,
  description,
}: FormBuilderProps<T>) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    getValues,
    watch,
  } = useForm<T>({
    resolver: schema ? zodResolver(schema as any) : undefined,
    defaultValues: defaultValues as any,
  });

  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

  // Watch file fields to track changes
  const mainImageValue = watch("mainImage" as Path<T>);
  const videoValue = watch("video" as Path<T>);

  // Type guard to check if value is a File
  const isFile = (value: unknown): value is File => {
    return value instanceof File;
  };

  // Check which files are selected
  const imageSelected = useMemo(() => isFile(mainImageValue), [mainImageValue]);
  const videoSelected = useMemo(() => isFile(videoValue), [videoValue]);

  useEffect(() => {
    if (defaultValues) {
      const previews: Record<string, string> = {};
      Object.entries(defaultValues).forEach(([key, value]) => {
        if (
          typeof value === "string" &&
          (key.includes("Image") || key.includes("video"))
        ) {
          previews[key] = value;
        }
      });
      setFilePreviews(previews);
    }
  }, [defaultValues]);

  const submitHandler: SubmitHandler<T> = async (data) => {
    await onSubmit(data);
    reset();
    setFilePreviews({});
  };

  const getFieldIcon = (field: FormField) => {
    switch (field.name) {
      case "title":
        return <Type className="h-4 w-4 text-gray-400" />;
      case "description":
        return <FileText className="h-4 w-4 text-gray-400" />;
      case "mainImage":
        return <ImageIcon className="h-4 w-4 text-gray-400" />;
      case "video":
        return <VideoIcon className="h-4 w-4 text-gray-400" />;
      case "profileName":
        return <User className="h-4 w-4 text-gray-400" />;
      case "eventDate":
        return <Calendar className="h-4 w-4 text-gray-400" />;
      case "location":
        return <MapPin className="h-4 w-4 text-gray-400" />;
      case "link":
        return <LinkIcon className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const renderField = (field: FormField) => {
    if (field.hidden) return null;

    const error = errors[field.name as Path<T>];
    const Icon = getFieldIcon(field);

    const fieldContainerClass = cn(
      "mb-6",
      layout === "grid" && "col-span-1",
      field.className,
    );

    switch (field.type) {
      case "checkbox":
        return (
          <div className={fieldContainerClass}>
            <Controller
              name={field.name as Path<T>}
              control={control}
              defaultValue={false as any}
              render={({ field: controllerField }) => (
                <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={!!controllerField.value}
                      onChange={(e) =>
                        controllerField.onChange(e.target.checked)
                      }
                      disabled={loading}
                      className={cn(
                        "h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors",
                        error && "border-red-300 focus:ring-red-500",
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="font-medium text-gray-900 text-sm">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {field.description && (
                      <p className="text-gray-600 text-sm mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                  {controllerField.value && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )}
            />
            {error && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {String(error.message)}
              </div>
            )}
          </div>
        );

      case "file": {
        const isVideo = field.name.toLowerCase().includes("video");
        const isDisabled =
          loading ||
          (field.name === "mainImage" && videoSelected) ||
          (field.name === "video" && imageSelected);

        return (
          <div className={fieldContainerClass}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: controllerField }) => {
                const hasFile = isFile(controllerField.value);
                const otherFieldSelected = isDisabled && !hasFile;

                return (
                  <>
                    <div
                      className={cn(
                        "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all duration-200 relative",
                        error
                          ? "border-red-300 bg-red-50"
                          : isDisabled && !hasFile
                            ? "border-gray-200 bg-gray-100"
                            : "border-gray-300 hover:border-indigo-400 bg-white hover:bg-indigo-50",
                        isDisabled && !hasFile && "cursor-not-allowed",
                      )}
                    >
                      {otherFieldSelected && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                          <div className="text-center p-4">
                            <Ban className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-700">
                              {isVideo
                                ? "Cannot upload video when an image is selected"
                                : "Cannot upload image when a video is selected"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Remove the {isVideo ? "image" : "video"} first
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 text-center">
                        {isVideo ? (
                          <div
                            className={cn(
                              "mx-auto h-16 w-16 flex items-center justify-center rounded-full transition-colors",
                              isDisabled && !hasFile
                                ? "bg-gray-200"
                                : "bg-purple-100",
                            )}
                          >
                            <VideoIcon
                              className={cn(
                                "h-8 w-8 transition-colors",
                                isDisabled && !hasFile
                                  ? "text-gray-400"
                                  : "text-purple-600",
                              )}
                            />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "mx-auto h-16 w-16 flex items-center justify-center rounded-full transition-colors",
                              isDisabled && !hasFile
                                ? "bg-gray-200"
                                : "bg-blue-100",
                            )}
                          >
                            <ImageIcon
                              className={cn(
                                "h-8 w-8 transition-colors",
                                isDisabled && !hasFile
                                  ? "text-gray-400"
                                  : "text-blue-600",
                              )}
                            />
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-center justify-center text-sm">
                          <label
                            htmlFor={field.name}
                            className={cn(
                              "relative cursor-pointer rounded-lg font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 px-4 py-2",
                              isDisabled && !hasFile
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-indigo-600 hover:text-indigo-500",
                            )}
                          >
                            <span className="flex items-center">
                              <Upload
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isDisabled && !hasFile && "text-gray-400",
                                )}
                              />
                              {hasFile ? "Change file" : "Choose file"}
                            </span>
                            <input
                              id={field.name}
                              type="file"
                              accept={isVideo ? "video/*" : "image/*"}
                              disabled={isDisabled}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  controllerField.onChange(file);
                                  setFilePreviews((prev) => ({
                                    ...prev,
                                    [field.name]: URL.createObjectURL(file),
                                  }));
                                }
                              }}
                              className="sr-only"
                            />
                          </label>
                          <p
                            className={cn(
                              "mt-2 sm:mt-0 sm:ml-4",
                              isDisabled && !hasFile
                                ? "text-gray-400"
                                : "text-gray-500",
                            )}
                          >
                            or drag and drop
                          </p>
                        </div>
                        <p
                          className={cn(
                            "text-xs",
                            isDisabled && !hasFile
                              ? "text-gray-400"
                              : "text-gray-500",
                          )}
                        >
                          {isVideo
                            ? "MP4, MOV, AVI up to 100MB"
                            : "PNG, JPG, GIF up to 10MB"}
                        </p>
                      </div>
                    </div>

                    {hasFile && (
                      <div className="mt-3 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          {isVideo ? (
                            <VideoIcon className="h-5 w-5 text-green-600 mr-2" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-green-600 mr-2" />
                          )}
                          <span className="text-sm font-medium text-green-800">
                            {(controllerField.value as File).name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-green-600">
                            {(
                              (controllerField.value as File).size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              controllerField.onChange(undefined);
                              setFilePreviews((prev) => {
                                const newPreviews = { ...prev };
                                delete newPreviews[field.name];
                                return newPreviews;
                              });
                            }}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    {filePreviews[field.name] && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Preview:
                        </p>
                        {isVideo ? (
                          <div className="relative rounded-lg overflow-hidden bg-black">
                            <video
                              src={filePreviews[field.name]}
                              controls
                              className="w-full max-w-md h-auto"
                            />
                          </div>
                        ) : (
                          <div className="relative rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={filePreviews[field.name]}
                              alt="Preview"
                              className="w-full max-w-md h-auto object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              }}
            />
            {field.description && (
              <p className="mt-2 text-sm text-gray-600">{field.description}</p>
            )}
            {error && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {String(error.message)}
              </div>
            )}
          </div>
        );
      }

      case "textarea":
        return (
          <div className={fieldContainerClass}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              {Icon && (
                <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                  {Icon}
                </div>
              )}
              <Controller
                name={field.name as Path<T>}
                control={control}
                render={({ field: controllerField }) => (
                  <textarea
                    {...controllerField}
                    placeholder={field.placeholder}
                    disabled={loading}
                    rows={6}
                    className={cn(
                      "block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors",
                      Icon ? "pl-10 pt-3" : "pl-4 pt-3",
                      "pr-4 pb-3",
                      error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
                        : "bg-white",
                    )}
                  />
                )}
              />
            </div>
            {field.description && (
              <p className="mt-2 text-sm text-gray-600">{field.description}</p>
            )}
            {error && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {String(error.message)}
              </div>
            )}
          </div>
        );

      case "date":
        return (
          <div className={fieldContainerClass}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <Controller
                name={field.name as Path<T>}
                control={control}
                render={({ field: controllerField }) => (
                  <input
                    {...controllerField}
                    type="date"
                    value={controllerField.value ?? ""}
                    placeholder={field.placeholder}
                    disabled={loading}
                    className={cn(
                      "block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors",
                      "pr-4 py-3",
                      error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
                        : "bg-white",
                    )}
                    onChange={(e) => {
                      // Ensure value is always a valid YYYY-MM-DD string
                      const val = e.target.value;
                      controllerField.onChange(val || undefined); // allow clearing if needed
                    }}
                  />
                )}
              />
            </div>
            {field.description && (
              <p className="mt-2 text-sm text-gray-600">{field.description}</p>
            )}
            {error && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {String(error.message)}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className={fieldContainerClass}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {Icon}
                </div>
              )}
              <Controller
                name={field.name as Path<T>}
                control={control}
                render={({ field: controllerField }) => (
                  <input
                    {...controllerField}
                    value={controllerField.value ?? ""}
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled={loading}
                    className={cn(
                      "block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors",
                      Icon ? "pl-10" : "pl-4",
                      "pr-4 py-3",
                      error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
                        : "bg-white",
                    )}
                  />
                )}
              />
            </div>
            {field.description && (
              <p className="mt-2 text-sm text-gray-600">{field.description}</p>
            )}
            {error && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {String(error.message)}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
      {(title || description) && (
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          )}
          {description && (
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(submitHandler)}>
        <div
          className={cn(
            "px-8 py-8",
            layout === "grid" && "grid grid-cols-1 md:grid-cols-2 gap-8",
          )}
        >
          {fields.map((field) => (
            <div
              key={field.name}
              className={cn(layout === "grid" && "col-span-1")}
            >
              {renderField(field)}
            </div>
          ))}
        </div>

        <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-end items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
              >
                <X className="inline w-4 h-4 mr-2" />
                {cancelText}
              </button>
            )}
            <button
              type="submit"
              disabled={loading || (!isDirty && Object.keys(errors).length > 0)}
              className={cn(
                "w-full sm:w-auto px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md inline-flex items-center justify-center",
                loading && "cursor-wait",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  <span className="font-semibold">Processing...</span>
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-4 w-4" />
                  <span className="font-semibold">{submitText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
