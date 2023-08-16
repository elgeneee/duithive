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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useState, useRef } from "react";
import {
  Check,
  ChevronsUpDown,
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
import { type RouterOutputs } from "@/utils/api";

// import groupBy from "lodash/groupBy";
// import map from "lodash/map";
// import moment from "moment";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import { set } from "lodash";
// dayjs.extend(relativeTime);
type Expense = RouterOutputs["expense"]["getAll"];

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

const getFilteredExpense = (query: string, expenses: Expense) => {
  if (!query) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return expenses;
  }

  if (expenses) {
    return expenses.filter((expense: { description: string }) =>
      expense.description.toLowerCase().includes(query.toLowerCase())
    );
  }
};

const Expense: NextPage = () => {
  const { data: session } = useSession();

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
  const [query, setQuery] = useState<string>("");

  //drag-and-drop image
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string>("");

  const [fileSizeTooBig, setFileSizeTooBig] = useState<boolean>(false);
  const [fileIsNotImage, setFileIsNotImage] = useState<boolean>(false);

  const ctx = api.useContext();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const { data: expenses, isLoading } = api.expense.getAll.useQuery();

  const { data: userCurrency } = api.user.getUserCurrency.useQuery({
    email: session?.user?.email as string,
  });

  // moment.updateLocale("en", {
  //   calendar: {
  //     lastDay: "[Yesterday]",
  //     sameDay: "[Today]",
  //     nextDay: "[Tomorrow]",
  //     lastWeek: "[Last] dddd",
  //     nextWeek: "[Next] dddd",
  //     sameElse: "L",
  //   },
  // });

  const { mutate: deleteExpense } = api.expense.deleteExpense.useMutation({
    onSuccess: () => {
      void ctx.expense.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;

      if (errorMessage && errorMessage[0]) {
        // toast.error(errorMessage[0]);
      } else {
        // toast.error("Failed to create! Please try again later.");
      }
    },
  });
  const { data: expenses } = api.expense.getAll.useQuery();

  // const testSeparate = () => {
  //   const expenseGroupedData = map(
  //     groupBy(expenses, (expense) =>
  //       expense.transactionDate?.toLocaleDateString()
  //     ),
  //     (expenses, date) => ({ date, expenses })
  //   );

  //   const currDate = new Date("2023-02-01");
  //   const yesterday = moment(currDate);
  //   const currentDate = moment(new Date("2023-03-01")); // Reference date

  // };

  // useEffect(() => {
  //   const expenseGroupedData = map(
  //     groupBy(expenses, (expense) =>
  //       expense.transactionDate?.toLocaleDateString()
  //     ),
  //     (expenses, date) => ({ date, expenses })
  //   );
  //     console.log(expenseGroupedData);
  //   setGroupedExpenses(expenseGroupedData);

  //   console.log('I am triggered')
  // },[expenses]);

  const { mutate: createExpense } = api.expense.create.useMutation({
    onSuccess: () => {
      reset();
      setCategoryValue("");
      setDispValue("");
      setIconId(1);
      setDialogOpen(false);
      setReceiptImage(null);
      setImageName("");
      void ctx.expense.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;

      if (errorMessage && errorMessage[0]) {
        // toast.error(errorMessage[0]);
      } else {
        // toast.error("Failed to create! Please try again later.");
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
        setEditIconId(8);
        setEditCategoryValue("");
        setEditDispValue("");
        void ctx.expense.getAll.invalidate();
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;

        if (errorMessage && errorMessage[0]) {
          // toast.error(errorMessage[0]);
        } else {
          // toast.error("Failed to create! Please try again later.");
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
        reader.onload = (e) => {
          setReceiptImage(file);
          setImageName(e.target?.result as string);
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
        reader.onload = (e) => {
          setReceiptImage(file);
          setImageName(e.target?.result as string);
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

  const filteredExpenses = getFilteredExpense(query, expenses);

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Expense</h1>
        <div className="flex items-center justify-between">
          <p className="text-athens-gray-300">{formattedDate}</p>
          <div className="flex items-center space-x-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <Button className="w-64" onClick={() => setDialogOpen(true)}>
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
                        "group relative mx-auto flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed  transition duration-100 hover:border-athens-gray-300",
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
                        className="absolute z-40 aspect-video h-full w-full rounded-md bg-white object-cover"
                      ></div>
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
                      className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
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
                            variant={"outline"}
                            className={cn(
                              "w-[240px] justify-start text-left font-normal focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1",
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
            <Input
              className="items-center border border-athens-gray-200 bg-white  bg-[url('/search.png')] bg-left bg-no-repeat pl-11"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
            />
          </div>
        </div>
        <div className="mt-10 space-y-5">
          {filteredExpenses?.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between space-x-3 rounded-md bg-white p-3"
            >
              <div className="rounded-md bg-violet-400/30 p-3 text-violet-600">
                {
                  icons.find((icon) => icon.id === expense.category?.iconId)
                    ?.icon
                }
              </div>
              <div className="flex flex-1 justify-between">
                <div>
                  <p className="text-sm font-semibold">{expense.description}</p>
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
                <PopoverContent className="flex w-36 flex-col p-2">
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
                        setEditCategoryValue(expense.category?.name || "");
                        editSetValue("description", expense.description);
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
                              editSetValue("description", e.target.value);
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
                                          category.label === editCategoryValue
                                      )?.value || editCategoryValue
                                    : "Select category"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput
                                    placeholder="Search category..."
                                    onChangeCapture={handleEditInputChange}
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
                                                        icon.id === editIconId
                                                          ? "bg-violet-500 text-primary-foreground"
                                                          : "hover:bg-muted "
                                                      )}
                                                      onClick={() => {
                                                        setEditIconId(icon.id);
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
                                          setEditCategoryValue(editDispValue);
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
                                        Create &quot;{editDispValue}&quot;
                                      </button>
                                    </div>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {categories.map((category) => (
                                      <CommandItem
                                        key={category.id}
                                        onSelect={() => {
                                          setEditCategoryValue(
                                            category.value === editCategoryValue
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
                                            editCategoryValue === category.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {icons[category?.iconId - 1]?.icon}
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
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently
                          remove your expense record from the system.
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
