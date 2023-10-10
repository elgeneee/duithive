/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextPage } from "next";
import { getSession, useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { SkeletonList } from "@/components/ui/skeletonList";
import { useState, useRef, useMemo, useEffect } from "react";
import {
  Check,
  ChevronsUpDown,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Plus,
  CalendarIcon,
  UploadCloud,
} from "lucide-react";
import { icons, categories } from "@/store/category";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import ScaleLoader from "react-spinners/ScaleLoader";
import { env } from "@/env.mjs";
import { useToast } from "@/components/ui/use-toast";
import debounce from "lodash/debounce";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// import groupBy from "lodash/groupBy";
// import map from "lodash/map";
// import moment from "moment";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import { set } from "lodash";
// dayjs.extend(relativeTime);

const createExpenseSchema = z.object({
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
  date: z.date(),
  category: z.object({
    id: z.number(),
    value: z.string(),
    label: z.string(),
    iconId: z.number(),
  }),
  imgUrl: z.string().optional(),
});

const editExpenseSchema = z.object({
  id: z.string(),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
  date: z.date(),
  category: z.object({
    id: z.number(),
    value: z.string(),
    label: z.string(),
    iconId: z.number(),
  }),
});

const Expense: NextPage = () => {
  const { data: session } = useSession();
  const { toast } = useToast();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting: isCreatingExpense },
    setValue,
  } = useForm<z.infer<typeof createExpenseSchema>>({
    // @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const {
    handleSubmit: editHandleSubmit,
    formState: { errors: editErrors },
    setValue: editSetValue,
    reset: editReset,
  } = useForm<z.infer<typeof editExpenseSchema>>({
    resolver: zodResolver(editExpenseSchema),
  });

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  // const [groupedExpenses, setGroupedExpenses] = useState<unknown[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [editDate, setEditDate] = useState<Date | undefined>(new Date());
  const [iconId, setIconId] = useState<number>(8);
  const [editIconId, setEditIconId] = useState<number>(8);
  const [open, setOpen] = useState<boolean>(false);
  const [openCategory, setOpenCategory] = useState<boolean>(false);
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [editCategoryValue, setEditCategoryValue] = useState<string>("");
  const [dispValue, setDispValue] = useState<string>("");
  const [editDispValue, setEditDispValue] = useState<string>("");
  const inputDescriptionRef = useRef<HTMLInputElement>(null);
  const inputAmountRef = useRef<HTMLInputElement>(null);

  //drag-and-drop image
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [isMindeeLoading, setMindeeLoading] = useState<boolean>(false);

  const [fileSizeTooBig, setFileSizeTooBig] = useState<boolean>(false);
  const [fileIsNotImage, setFileIsNotImage] = useState<boolean>(false);

  const ctx = api.useContext();

  //infiniteQuery
  const searchParams = useSearchParams();
  const selectedSize = searchParams.get("page_size");
  const [page, setPage] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  //search function
  const [search, setSearch] = useState<string>("");

  const { data: userCurrency } = api.user.getUserCurrency.useQuery({
    email: session?.user?.email as string,
  });

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(0);
    setSearch(e.target.value);
  };

  const debouncedHandleInputChange = useMemo(
    () => debounce(handleSearchInput, 200),
    []
  );

  // stop debouncing (if any pending) when the component unmounts
  useEffect(() => {
    return () => {
      debouncedHandleInputChange.cancel();
    };
  }, [debouncedHandleInputChange]);

  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    refetch: refetchSearch,
  } = api.expense.search.useQuery({
    searchInput: search,
    limit: selectedSize ? parseInt(selectedSize) : 10,
  });

  useEffect(() => {
    refetchSearch;
  }, [search, refetchSearch]);

  const {
    data: expenses,
    isLoading: isLoadingExpenses,
    fetchNextPage,
  } = api.expense.getPaginated.useInfiniteQuery(
    {
      limit: selectedSize ? parseInt(selectedSize) : 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
    }
  );

  const handleFetchNextPage = async () => {
    await fetchNextPage();
    setPage((prev) => prev + 1);
  };

  const handleFetchPreviousPage = () => {
    setPage((prev) => prev - 1);
  };

  const { mutate: deleteExpense } = api.expense.deleteExpense.useMutation({
    onSuccess: () => {
      void ctx.expense.getPaginated.invalidate();
      toast({
        variant: "success",
        status: "success",
        title: "Expense deleted successfully!",
      });
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;

      if (errorMessage && errorMessage[0]) {
        toast({
          variant: "error",
          status: "error",
          title: errorMessage[0] || "An error occurred",
        });
      } else {
        toast({
          variant: "error",
          status: "error",
          title: e.message || "An error occurred",
        });
      }
    },
  });

  const { mutate: createExpense } = api.expense.create.useMutation({
    onSuccess: () => {
      reset();
      setCategoryValue("");
      setDate(new Date());
      setDispValue("");
      setIconId(1);
      setDialogOpen(false);
      setReceiptImage(null);
      setImageName("");
      void ctx.expense.getPaginated.invalidate();
      toast({
        variant: "success",
        status: "success",
        title: "Expense created successfully!",
      });
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;

      if (errorMessage && errorMessage[0]) {
        toast({
          variant: "error",
          status: "error",
          title: errorMessage[0] || "An error occurred",
        });
      } else {
        toast({
          variant: "error",
          status: "error",
          title: e.message || "An error occurred",
        });
      }
    },
  });

  const delay = (ms: number | undefined) =>
    new Promise((res) => setTimeout(res, ms));

  const { mutate: editExpense, isLoading: isEditLoading } =
    api.expense.editExpense.useMutation({
      onSuccess: () => {
        editReset;
        setEditDialogOpen(false);
        setEditDate(new Date());
        setEditIconId(8);
        setEditCategoryValue("");
        setEditDispValue("");
        void ctx.expense.getPaginated.invalidate();
        toast({
          variant: "success",
          status: "success",
          title: "Success!",
        });
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;

        if (errorMessage && errorMessage[0]) {
          toast({
            variant: "error",
            status: "error",
            title: errorMessage[0] || "An error occurred",
          });
        } else {
          toast({
            variant: "error",
            status: "error",
            title: e.message || "An error occurred",
          });
        }
      },
    });

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setFileSizeTooBig(false);
    setFileIsNotImage(false);
    setReceiptImage(null);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    const validImageType = ["image/jpeg", "image/png"];
    if (file) {
      if (file.size / 1024 / 1024 > 5) {
        setFileSizeTooBig(true);
        setReceiptImage(null);
        setImageName("");
      } else if (!validImageType.includes(file.type)) {
        setFileIsNotImage(true);
        setReceiptImage(null);
        setImageName("");
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          setReceiptImage(file);
          setImageName(e.target?.result as string);

          //start Mindee
          setMindeeLoading(true);
          const descriptionElement = document.getElementById(
            "input-description"
          ) as HTMLInputElement;
          const amountElement = document.getElementById(
            "input-amount"
          ) as HTMLInputElement;

          const resp = await handleMindee(file);
          if (resp.api_request.status === "success") {
            descriptionElement.value =
              resp.document.inference.prediction.supplier_name.value || "";
            amountElement.value =
              resp.document.inference.prediction.total_amount.value || "";

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            setDate(new Date(resp.document.inference.prediction.date.value));

            setValue(
              "description",
              (resp.document.inference.prediction.supplier_name
                .value as string) || ""
            );
            setValue(
              "amount",
              resp.document.inference.prediction.total_amount.value as number
            );
            setValue(
              "date",
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              new Date(resp.document.inference.prediction.date.value)
            );

            setMindeeLoading(false);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const deleteImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setReceiptImage(null);
    setImageName("");
  };

  const onChangeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSizeTooBig(false);
    setFileIsNotImage(false);
    setReceiptImage(null);
    const validImageType = ["image/jpeg", "image/png"];
    const file = e.currentTarget.files && e.currentTarget.files[0];
    if (file) {
      if (file.size / 1024 / 1024 > 5) {
        setFileSizeTooBig(true);
        setReceiptImage(null);
        setImageName("");
      } else if (!validImageType.includes(file.type)) {
        setFileIsNotImage(true);
        setReceiptImage(null);
        setImageName("");
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          setReceiptImage(file);
          setImageName(e.target?.result as string);

          //start Mindee
          setMindeeLoading(true);
          const descriptionElement = document.getElementById(
            "input-description"
          ) as HTMLInputElement;
          const amountElement = document.getElementById(
            "input-amount"
          ) as HTMLInputElement;

          const resp = await handleMindee(file);
          if (resp.api_request.status === "success") {
            descriptionElement.value =
              resp.document.inference.prediction.supplier_name.value || "";
            amountElement.value =
              resp.document.inference.prediction.total_amount.value || "";

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            setDate(new Date(resp.document.inference.prediction.date.value));

            setValue(
              "description",
              (resp.document.inference.prediction.supplier_name
                .value as string) || ""
            );
            setValue(
              "amount",
              resp.document.inference.prediction.total_amount.value as number
            );
            setValue(
              "date",
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              new Date(resp.document.inference.prediction.date.value)
            );

            setMindeeLoading(false);
          }
        };

        reader.readAsDataURL(file);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDispValue(e.target.value);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditDispValue(e.target.value);
  };

  const onSubmit = async (data: z.infer<typeof createExpenseSchema>) => {
    let imageUrl: string | null = null;
    if (receiptImage) {
      try {
        const formData = new FormData();
        formData.append("file", receiptImage);
        formData.append("upload_preset", "oxd8flh9");
        formData.append(
          "folder",
          `duithive/users/${session?.user?.email as string}/expense`
        );
        const cloudinaryUpload = await fetch(
          "https://api.cloudinary.com/v1_1/dlidl2li4/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const cloudinaryResponse = await cloudinaryUpload.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        imageUrl = cloudinaryResponse.secure_url;
      } catch (err) {
        console.log(err);
      }
    } else {
      await delay(500);
    }
    createExpense({ ...data, imgUrl: imageUrl });
  };

  const onEditSubmit = (data: z.infer<typeof editExpenseSchema>) => {
    editExpense(data);
  };

  const handleDelete = (id: string) => {
    deleteExpense({ id: id });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMindee = (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const data = new FormData();
      data.append("document", file, file.name);

      const xhr = new XMLHttpRequest();

      xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const responseData = JSON.parse(this.responseText);
          resolve(responseData); // Resolve the Promise with the response data
          // JSON parsing error
        }
      });

      xhr.open(
        "POST",
        "https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict"
      );
      xhr.setRequestHeader("Authorization", `Token ${env.NEXT_PUBLIC_MINDEE}`);
      xhr.send(data);
    });
  };

  const toShow = searchResults?.expenses
    ? searchResults.expenses
    : expenses?.pages[page]?.expenses;

  const nextCursor = expenses?.pages[page]?.nextCursor;

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Expense</h1>
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="text-left text-athens-gray-300 ">{formattedDate}</p>
          <div className="flex w-full flex-col items-center space-x-0 space-y-2 sm:w-auto sm:flex-row sm:space-x-2 sm:space-y-0">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <Button
                className="mt-10 w-full sm:mt-0 sm:w-72"
                onClick={() => setDialogOpen(true)}
              >
                <Plus size={15} />
                <span className="ml-3">Add Expense</span>
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Expense</DialogTitle>
                </DialogHeader>
                <form
                  className="mt-10 space-y-3"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onSubmit={handleSubmit(onSubmit)}
                >
                  {/* drag-and-drop */}
                  <label className="text-sm">Receipt / Bill</label>

                  <div className="z-[9999] animate-in fade-in slide-in-from-left-8 duration-700">
                    <label
                      htmlFor="image-upload"
                      className={cn(
                        "group relative mx-auto flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition duration-100 hover:border-athens-gray-300",
                        dragActive ? "border-[#e2e8f0]/50" : "border-[#e2e8f0]"
                      )}
                    >
                      {receiptImage && (
                        <button
                          type="button"
                          onClick={deleteImage}
                          disabled={isCreatingExpense}
                          className={cn(
                            "absolute right-3 top-3 z-[110] rounded-md bg-black p-1 transition",
                            isCreatingExpense
                              ? " bg-black/50"
                              : "bg-black/50 hover:bg-black/60"
                          )}
                        >
                          <Trash2 color={"#ffffff"} size={18} />
                        </button>
                      )}
                      {isMindeeLoading && (
                        <div className="absolute right-1/2 top-1/2 z-[500] translate-x-1/2 text-xs text-white">
                          <span>Analyzing</span>
                          <div className="text-center">
                            <ScaleLoader
                              color="white"
                              loading={isMindeeLoading}
                              height={10}
                            />
                          </div>
                        </div>
                      )}
                      {fileSizeTooBig && (
                        <p className="z-[500] text-xs text-red-500">
                          File size too big (less than 5MB)
                        </p>
                      )}
                      {fileIsNotImage && (
                        <p className="z-[500] text-xs text-red-500">
                          File is not an image
                        </p>
                      )}
                      <div
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                          "absolute aspect-video h-full w-full rounded-md object-cover",
                          isMindeeLoading
                            ? "z-[400] bg-black bg-opacity-70"
                            : "z-40 bg-white"
                        )}
                      />
                      <div
                        className={cn(
                          "absolute z-50 flex flex-col items-center justify-center text-center text-xs font-medium transition-all duration-100",
                          dragActive ? "text-gray-500/70" : "text-gray-400",
                          (fileSizeTooBig || fileIsNotImage || receiptImage) &&
                            "hidden"
                        )}
                      >
                        <UploadCloud
                          className={cn(
                            "mb-2 text-athens-gray-900 transition duration-100 group-hover:scale-110",
                            dragActive && "scale-110"
                          )}
                        />
                        <p className="font-semibold">
                          <span className="font-semibold text-athens-gray-900">
                            Click to upload
                          </span>{" "}
                          or drag & drop
                        </p>
                        <p>SVG, PNG or JPG</p>
                        <p>Accept image files only (Max at 5MB)</p>
                      </div>
                      {receiptImage && (
                        //eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageName}
                          alt="Preview"
                          className="z-[200] aspect-video h-full rounded-lg object-contain"
                        />
                      )}
                    </label>
                    <div className="z-30 mt-1 flex rounded-md shadow-lg">
                      <input
                        id="image-upload"
                        name="image"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={onChangeImage}
                      />
                    </div>
                  </div>
                  {/* drag-and-drop */}

                  <div>
                    <label className="text-sm">Description</label>
                    <Input
                      id="input-description"
                      className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                      disabled={isMindeeLoading}
                      {...register("description", { required: true })}
                    />
                    <div className="h-3">
                      {errors.description && (
                        <span className="text-xxs text-red-500">
                          {errors.description.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1/3">
                      <label className="text-sm">Amount</label>
                      <Input
                        id="input-amount"
                        disabled={isMindeeLoading}
                        className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                        {...register("amount", {
                          required: true,
                          valueAsNumber: true,
                        })}
                        type="number"
                        step="0.01"
                      />
                      <div className="h-3">
                        {errors.amount && (
                          <span className="text-xxs text-red-500">
                            {errors.amount.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-2/3">
                      <p className="mb-2 text-sm">Category</p>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1"
                          >
                            {categoryValue
                              ? categories.find(
                                  (category) => category.label === categoryValue
                                )?.value || categoryValue
                              : "Select category"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search category..."
                              onChangeCapture={handleInputChange}
                            />
                            <CommandEmpty>
                              <div className="flex flex-col">
                                <Tabs
                                  defaultValue="text"
                                  className="w-full text-center"
                                >
                                  <TabsList>
                                    <TabsTrigger value="text">Text</TabsTrigger>
                                    <TabsTrigger value="icon">Icon</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="text">
                                    <Input
                                      className="h-7 text-xs "
                                      value={dispValue}
                                      disabled
                                    />
                                  </TabsContent>
                                  <TabsContent value="icon">
                                    <div className="flex justify-center">
                                      <div className="grid grid-cols-5 gap-2">
                                        {icons.map(
                                          (icon, index) =>
                                            index > 6 && (
                                              <div
                                                key={icon.id}
                                                className={cn(
                                                  "rounded-sm p-2 hover:cursor-pointer",
                                                  icon.id === iconId
                                                    ? "bg-violet-500 text-primary-foreground"
                                                    : "hover:bg-muted "
                                                )}
                                                onClick={() => {
                                                  setIconId(icon.id);
                                                }}
                                              >
                                                {icon.icon}
                                              </div>
                                            )
                                        )}
                                      </div>
                                    </div>
                                  </TabsContent>
                                </Tabs>

                                <button
                                  onClick={() => {
                                    setCategoryValue(dispValue);
                                    setValue("category", {
                                      id: categories.length + 1,
                                      value: dispValue,
                                      label: dispValue,
                                      iconId: iconId,
                                    });
                                    categories.push({
                                      id: categories.length + 1,
                                      value: dispValue,
                                      label: dispValue,
                                      iconId: iconId,
                                    });
                                    setOpen(false);
                                  }}
                                  className="mt-2 inline w-full items-center justify-center rounded-md bg-violet-500 py-2 text-xs font-medium text-white"
                                >
                                  Create &quot;{dispValue}&quot;
                                </button>
                              </div>
                            </CommandEmpty>

                            {/* default cats */}
                            <CommandGroup>
                              {categories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  onSelect={(selectedCategory) => {
                                    setCategoryValue(
                                      selectedCategory === categoryValue
                                        ? ""
                                        : selectedCategory
                                    );
                                    setValue("category", {
                                      id: category.id,
                                      value: category.value,
                                      label: selectedCategory,
                                      iconId: category.iconId,
                                    });
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      categoryValue === category.label
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {icons[category?.iconId - 1]?.icon}
                                  <span className="ml-3">{category.value}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <div className="h-3">
                        {errors.category && (
                          <span className="text-xxs text-red-500">
                            {errors.category.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <p className="mb-2 text-sm">Date</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="input-date"
                            disabled={isMindeeLoading}
                            variant={"outline"}
                            className={cn(
                              "w-[240px] justify-start text-left font-normal focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? (
                              format(date, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(data) => {
                              setDate(data);
                              setValue("date", data as Date);
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <div className="h-3">
                        {errors.date && (
                          <span className="text-xxs text-red-500">
                            {errors.date.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isCreatingExpense}
                    className="w-full"
                  >
                    {isCreatingExpense ? (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        color="#803FE8"
                      />
                    ) : (
                      <span>Create</span>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger>
                <div className="flex h-10 w-32 items-center justify-center rounded-md border border-athens-gray-200 bg-white text-muted-foreground/70">
                  {selectedSize || 10} / page
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <Link
                  href={`?page_size=10`}
                  onClick={() => setDropdownOpen(false)}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  10
                </Link>
                <Link
                  href={`?page_size=20`}
                  onClick={() => setDropdownOpen(false)}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  20
                </Link>
                <Link
                  href={`?page_size=50`}
                  onClick={() => setDropdownOpen(false)}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  50
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            <Input
              className="items-center border border-athens-gray-200 bg-white  bg-[url('/search.png')] bg-left bg-no-repeat pl-11"
              onChange={debouncedHandleInputChange}
              placeholder="Search..."
            />
          </div>
        </div>

        <div className="mt-10 space-y-5">
          {isLoadingExpenses || isLoadingSearchResults ? (
            <SkeletonList className="h-[60px]" />
          ) : (
            <>
              {toShow && toShow?.length > 0 ? (
                <>
                  {toShow?.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between space-x-3 rounded-md bg-white p-3"
                    >
                      <div className="rounded-md bg-violet-400/30 p-3 text-violet-600">
                        {
                          icons.find(
                            (icon) => icon.id === expense.category?.iconId
                          )?.icon
                        }
                      </div>
                      <div className="flex flex-1 justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            {expense.description}
                          </p>
                          <p className="text-sm font-normal text-[#A0A5AF]">
                            {expense.category?.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {userCurrency?.symbol}
                            {parseFloat(expense.amount.toString()).toFixed(2)}
                          </p>
                          <p className="text-sm font-normal text-[#A0A5AF]">
                            {expense.transactionDate.getDate() < 10
                              ? `0${expense.transactionDate.getDate()}`
                              : expense.transactionDate.getDate()}
                            /
                            {expense.transactionDate.getMonth() < 10
                              ? `0${expense.transactionDate.getMonth() + 1}`
                              : expense.transactionDate.getMonth()}
                            /{expense.transactionDate.getFullYear()}
                          </p>
                        </div>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghostSecondary"
                            className="h-8 w-8 rounded-md p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open popover</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="flex w-36 flex-col p-2"
                        >
                          <p className="px-2 text-sm font-medium text-foreground">
                            Edit/Delete
                          </p>
                          <Separator className="my-2" />
                          <Dialog
                            open={editDialogOpen}
                            onOpenChange={setEditDialogOpen}
                          >
                            <button
                              onClick={() => {
                                setEditDate(expense.transactionDate);
                                if (inputDescriptionRef.current) {
                                  inputDescriptionRef.current.defaultValue =
                                    expense.description;
                                }
                                if (inputAmountRef.current) {
                                  inputAmountRef.current.defaultValue =
                                    expense.amount.toString();
                                }
                                editSetValue("id", expense.id);
                                setEditCategoryValue(
                                  expense.category?.name || ""
                                );
                                editSetValue(
                                  "description",
                                  expense.description
                                );
                                editSetValue(
                                  "amount",
                                  parseFloat(expense.amount.toString())
                                );
                                editSetValue("date", expense.transactionDate);
                                editSetValue("category", {
                                  id: categories.length + 1,
                                  value: expense.category?.name ?? "",
                                  label: expense.category?.name ?? "",
                                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                  iconId: expense.category!.iconId,
                                });
                                setEditDialogOpen(true);
                              }}
                              className="flex w-full items-center justify-start space-x-2 rounded-md px-3 py-1 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <Edit className="h-4 w-4" />
                              <p className="text-sm">Edit</p>
                            </button>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Expense</DialogTitle>
                              </DialogHeader>
                              <form
                                className="mt-10 space-y-3"
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onSubmit={editHandleSubmit(onEditSubmit)}
                              >
                                <div className="z-[9999] animate-in fade-in slide-in-from-left-8 duration-700">
                                  <label
                                    htmlFor="image-upload"
                                    className={cn(
                                      "group relative mx-auto flex h-32 w-full flex-col items-center justify-center rounded-lg border border-[#e2e8f0]  transition duration-100"
                                    )}
                                  >
                                    <div className="absolute z-40 aspect-video h-full w-full rounded-md bg-white object-cover"></div>
                                    <div
                                      className={cn(
                                        "absolute z-50 flex flex-col items-center justify-center text-center text-xs font-medium transition-all duration-100",
                                        expense.imgUrl && "hidden"
                                      )}
                                    >
                                      <p className="font-light italic text-[#A0A5AF]">
                                        No image available
                                      </p>
                                    </div>
                                    {expense.imgUrl && (
                                      //eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={expense.imgUrl}
                                        alt="Preview"
                                        className="z-[200] aspect-video h-full rounded-lg object-contain"
                                      />
                                    )}
                                  </label>
                                </div>
                                <div>
                                  <label className="text-sm">Description</label>
                                  <Input
                                    className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                                    placeholder="Enter description"
                                    defaultValue={expense.description}
                                    onChange={(e) => {
                                      editSetValue(
                                        "description",
                                        e.target.value
                                      );
                                    }}
                                    ref={inputDescriptionRef}
                                  />

                                  <div className="h-3">
                                    {editErrors.description && (
                                      <span className="text-xxs text-red-500">
                                        {editErrors.description.message}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-1/3">
                                    <label className="text-sm">Amount</label>
                                    <Input
                                      className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                                      placeholder="Enter amount"
                                      defaultValue={parseFloat(
                                        expense.amount.toString()
                                      )}
                                      onChange={(e) => {
                                        editSetValue(
                                          "amount",
                                          parseFloat(e.target.value)
                                        );
                                      }}
                                      type="number"
                                      step="0.01"
                                      ref={inputAmountRef}
                                    />
                                    <div className="h-3">
                                      {editErrors.amount && (
                                        <span className="text-xxs text-red-500">
                                          {editErrors.amount.message}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="w-2/3">
                                    <p className="mb-2 text-sm">Category</p>
                                    <Popover
                                      open={openCategory}
                                      onOpenChange={setOpenCategory}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={openCategory}
                                          className="w-full justify-between"
                                        >
                                          {editCategoryValue
                                            ? categories.find(
                                                (category) =>
                                                  category.label ===
                                                  editCategoryValue
                                              )?.value || editCategoryValue
                                            : "Select category"}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-full p-0">
                                        <Command>
                                          <CommandInput
                                            placeholder="Search category..."
                                            onChangeCapture={
                                              handleEditInputChange
                                            }
                                          />
                                          <CommandEmpty>
                                            <div className="flex flex-col">
                                              <Tabs
                                                defaultValue="text"
                                                className="w-full text-center"
                                              >
                                                <TabsList>
                                                  <TabsTrigger value="text">
                                                    Text
                                                  </TabsTrigger>
                                                  <TabsTrigger value="icon">
                                                    Icon
                                                  </TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="text">
                                                  <Input
                                                    className="h-7 text-xs "
                                                    value={editDispValue}
                                                    disabled
                                                  />
                                                </TabsContent>
                                                <TabsContent value="icon">
                                                  <div className="flex justify-center">
                                                    <div className="grid grid-cols-5 gap-2">
                                                      {icons.map(
                                                        (icon, index) =>
                                                          index > 6 && (
                                                            <div
                                                              key={icon.id}
                                                              className={cn(
                                                                "rounded-sm p-2 hover:cursor-pointer",
                                                                icon.id ===
                                                                  editIconId
                                                                  ? "bg-violet-500 text-primary-foreground"
                                                                  : "hover:bg-muted "
                                                              )}
                                                              onClick={() => {
                                                                setEditIconId(
                                                                  icon.id
                                                                );
                                                              }}
                                                            >
                                                              {icon.icon}
                                                            </div>
                                                          )
                                                      )}
                                                    </div>
                                                  </div>
                                                </TabsContent>
                                              </Tabs>

                                              <button
                                                onClick={() => {
                                                  setEditCategoryValue(
                                                    editDispValue
                                                  );
                                                  editSetValue("category", {
                                                    id: categories.length + 1,
                                                    value: editDispValue,
                                                    label: editDispValue,
                                                    iconId: editIconId,
                                                  });
                                                  categories.push({
                                                    id: categories.length + 1,
                                                    value: editDispValue,
                                                    label: editDispValue,
                                                    iconId: editIconId,
                                                  });
                                                  setOpenCategory(false);
                                                }}
                                                className="mt-2 inline w-full items-center justify-center rounded-md bg-violet-500 py-2 text-xs font-medium text-white"
                                              >
                                                Create &quot;{editDispValue}
                                                &quot;
                                              </button>
                                            </div>
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {categories.map((category) => (
                                              <CommandItem
                                                key={category.id}
                                                onSelect={() => {
                                                  setEditCategoryValue(
                                                    category.value ===
                                                      editCategoryValue
                                                      ? ""
                                                      : category.value
                                                  );
                                                  editSetValue("category", {
                                                    id: category.id,
                                                    value: category.value,
                                                    label: category.value,
                                                    iconId: category.iconId,
                                                  });
                                                  setOpenCategory(false);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    editCategoryValue ===
                                                      category.value
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                                  )}
                                                />
                                                {
                                                  icons[category?.iconId - 1]
                                                    ?.icon
                                                }
                                                <span className="ml-3">
                                                  {category.value}
                                                </span>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                    <div className="h-3">
                                      {editErrors.category && (
                                        <span className="text-xxs text-red-500">
                                          {editErrors.category.message}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex flex-col">
                                    <p className="mb-2 text-sm">Date</p>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-[240px] justify-start text-left font-normal",
                                            !editDate && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {editDate ? (
                                            format(editDate, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          mode="single"
                                          selected={editDate}
                                          onSelect={(data) => {
                                            setEditDate(data);
                                            editSetValue("date", data as Date);
                                          }}
                                          initialFocus
                                          disabled={(date) =>
                                            date > new Date() ||
                                            date < new Date("1900-01-01")
                                          }
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <div className="h-3">
                                      {editErrors.date && (
                                        <span className="text-xxs text-red-500">
                                          {editErrors.date.message}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  type="submit"
                                  disabled={isEditLoading}
                                  className="w-full"
                                >
                                  {isEditLoading ? (
                                    <Loader2
                                      className="mr-2 h-4 w-4 animate-spin"
                                      color="#803FE8"
                                    />
                                  ) : (
                                    <span>Save</span>
                                  )}
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Dialog
                            open={deleteDialogOpen}
                            onOpenChange={setDeleteDialogOpen}
                          >
                            <DialogTrigger>
                              <button className="flex w-full items-center justify-start space-x-2 rounded-md px-3 py-1 text-red-400 transition-colors hover:bg-accent hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                                <p className="text-sm">Delete</p>
                              </button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Are you absolutely sure?
                                </DialogTitle>
                                <DialogDescription>
                                  This action cannot be undone. This will
                                  permanently remove your expense record from
                                  the system.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="flex justify-center">
                                <Button
                                  variant={"secondary"}
                                  onClick={() => setDeleteDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant={"destructive"}
                                  onClick={() => handleDelete(expense.id)}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </>
              ) : (
                <div className="relative items-center justify-center align-middle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/upload.png"
                    className="mx-auto my-auto flex h-56  items-center sm:h-96"
                    alt="image-upload"
                  />
                  <p className="text-center text-sm italic text-athens-gray-300/75">
                    No expenses yet
                  </p>
                </div>
              )}
            </>
          )}
          <div className="flex justify-end">
            <div className="flex border border-athens-gray-100 shadow-sm">
              <Button
                className="h-10 w-10 rounded-r-none p-1"
                disabled={page <= 0 || searchResults?.expenses !== undefined}
                variant="pagination"
                onClick={handleFetchPreviousPage}
              >
                <ChevronLeft size={20} />
              </Button>
              <div className="flex h-10 w-10 items-center justify-center border-x border-athens-gray-100 bg-white p-1">
                {page + 1}
              </div>
              <Button
                className="h-10 w-10 rounded-l-none p-1"
                variant="pagination"
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={handleFetchNextPage}
                disabled={!nextCursor || searchResults?.expenses !== undefined}
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default Expense;
